import { useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { callLocalAI, buildHotelAdvisorPrompt } from '../services/aiService'
import { HOTELS_DB } from '../data/hotelsData'

// Re-export so existing importers (JournalNotebook) don't break
export { HOTELS_DB }


export default function AIHotelPanel({ moods, tier, duration, autoLoad = true }) {
  const { selectedHotel, setSelectedHotel, awardXP } = useVibe()
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(autoLoad)
  const [filterQuery, setFilterQuery] = useState('')
  const [filterResult, setFilterResult] = useState(null)
  const [filterLoading, setFilterLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)

  // Declare before the effect that calls it to avoid temporal dead zone
  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    const { system, user } = buildHotelAdvisorPrompt(moods, tier, duration, HOTELS_DB)
    const raw = await callLocalAI(system, user, '', {
      cacheKey: `hotels:${JSON.stringify(moods)}:${tier}:${duration}`,
      maxTokens: 200,
    })

    let parsed = null
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      console.warn('[AIHotelPanel] Could not parse AI hotel JSON:', parseErr.message)
    }

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      // Fallback: score by matching moods and tier
      const scored = HOTELS_DB.map(h => ({
        ...h,
        score: (Array.isArray(moods) ? moods : []).filter(m => h.moodFit.includes(m)).length
          + (h.tierFit.includes(tier) ? 2 : 0),
      })).sort((a, b) => b.score - a.score)
      setRecommendations(scored.slice(0, 3).map(h => ({ name: h.name, reason: `Matches your ${moods?.[0] || 'travel'} vibe and ${tier} budget.` })))
    } else {
      setRecommendations(parsed.slice(0, 3))
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moods, tier, duration])

  useEffect(() => {
    if (autoLoad) {
      queueMicrotask(() => {
        loadRecommendations()
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const playCampStampSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15) // D6
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (audioErr) {
      console.warn('[AIHotelPanel] Audio playback failed:', audioErr.message)
    }
  }

  const handleFilter = async () => {
    if (!filterQuery.trim()) return
    setFilterLoading(true)
    const hotelList = HOTELS_DB.map((h, i) => `${i+1}. ${h.name} (${h.neighborhood}): ${h.desc}`).join('\n')
    
    try {
      const result = await callLocalAI(
        `You are a Bahrain hotel concierge. Based on the traveler's request, recommend the BEST hotel from the list in this exact format: "HOTEL: [name] | REASON: [1 sentence]"`,
        `Traveler says: "${filterQuery}"\n\nHotels:\n${hotelList}`,
        `HOTEL: The Merchant House | REASON: Highly recommended for food lovers and travelers seeking Bab Al Bahrain heritage.`,
        { useCache: false, maxTokens: 80 }
      )
      
      setFilterResult(result)

      // Automatically search for the hotel name in result and scroll to it
      const match = result.match(/HOTEL:\s*([^|]+)/i)
      if (match) {
        const matchedName = match[1].trim()
        const matchedHotel = HOTELS_DB.find(h => 
          h.name.toLowerCase().includes(matchedName.toLowerCase()) || 
          matchedName.toLowerCase().includes(h.name.toLowerCase())
        )
        if (matchedHotel) {
          setExpandedId(matchedHotel.id)
          setHighlightedId(matchedHotel.id)
          
          setTimeout(() => {
            const el = document.getElementById(`hotel-card-${matchedHotel.id}`)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 150)
          
          setTimeout(() => {
            setHighlightedId(null)
          }, 3500)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFilterLoading(false)
    }
  }

  const getHotelData = (name) =>
    HOTELS_DB.find(h => h.name.toLowerCase().includes(name?.toLowerCase()?.slice(0, 12))) || null

  const displayHotels = loading ? [] : (recommendations || [])

  return (
    <div className="space-y-4">

      {/* ── Selected Hotel – Prominent Base Camp Banner ── */}
      {selectedHotel && (
        <div style={{
          background: 'linear-gradient(135deg, #D11A38 0%, #8A0A22 100%)',
          borderRadius: '16px',
          padding: '16px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 8px 24px rgba(209,26,56,0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {selectedHotel.image ? (
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              border: '2px double #D4AF37',
              padding: '2px',
              background: 'rgba(255,255,255,0.1)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <img 
                src={selectedHotel.image} 
                alt={selectedHotel.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>
          ) : (
            <div style={{ fontSize: '30px', flexShrink: 0 }}>{selectedHotel.emoji}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>Your Base Camp ✓</span>
            <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '16px', fontWeight: 700, margin: '2px 0 4px', color: '#fff' }}>
              {selectedHotel.name}
            </h4>
            <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', opacity: 0.8, margin: 0 }}>
              {selectedHotel.neighborhood} &middot; {selectedHotel.cost}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
            <a
              href={selectedHotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '999px',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff', fontSize: '10px', fontWeight: 700, textDecoration: 'none',
                whiteSpace: 'nowrap', letterSpacing: '0.04em',
              }}
            >
              📱 Book Now
            </a>
            <button
              onClick={() => setSelectedHotel(null)}
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: '10px', cursor: 'pointer', padding: '0', textAlign: 'center',
              }}
            >
              Change hotel
            </button>
          </div>
        </div>
      )}

      {/* ── Concierge Desk Search ── */}
      <div style={{
        padding: '16px', borderRadius: '16px',
        background: 'radial-gradient(circle at 100% 0%, #FFFDF9 0%, #FAF6EE 100%)',
        border: '1.5px solid rgba(139,90,43,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>👳‍♂️</div>
          <div>
            <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '13px', fontWeight: 700, color: '#2A2321', margin: 0, lineHeight: 1.2 }}>Concierge Desk</h4>
            <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '10px', color: 'rgba(92,84,81,0.7)', margin: 0 }}>Jafar · Chief Travel Advisor</p>
          </div>
        </div>
        <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '12px', fontStyle: 'italic', color: '#5C5451', marginBottom: '12px', lineHeight: 1.55 }}>
          "Describe your perfect stay—beachfront calm, heritage walls, or Souq proximity—and I shall find your base camp."
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder='e.g. "beachfront sunset" or "near Manama Souq"...'
            style={{
              flex: 1, padding: '9px 14px', borderRadius: '12px', fontFamily: 'var(--jn-font-serif)',
              fontSize: '13px', border: '1px solid rgba(209,26,56,0.15)', background: 'rgba(255,255,255,0.9)',
              outline: 'none', color: '#2A2321', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)',
            }}
          />
          <button
            onClick={handleFilter}
            disabled={filterLoading || !filterQuery.trim()}
            style={{
              padding: '9px 16px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)',
              color: '#fff', border: 'none', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.05em', cursor: filterLoading || !filterQuery.trim() ? 'not-allowed' : 'pointer',
              opacity: filterLoading || !filterQuery.trim() ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {filterLoading ? '...' : '🤖 Match'}
          </button>
        </div>
      </div>

      {filterResult && (
        <div style={{
          padding: '12px 16px', borderRadius: '12px', background: '#FFFDF9',
          borderLeft: '3px solid #D4AF37', fontSize: '13px', fontFamily: 'var(--jn-font-serif)',
          fontStyle: 'italic', lineHeight: 1.6, color: '#2A2321',
        }}>
          🗣️ {filterResult}
        </div>
      )}

      {/* ── AI Recommendations: Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-faint)', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
            ⏳ Consulting the registrar for your ideal stay…
          </p>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
          ))}
        </div>
      )}

      {/* ── AI-Recommended Hotel Cards ── */}
      {!loading && (
        <div className="space-y-3">
          {displayHotels.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--jn-ink-faint)', fontFamily: 'var(--jn-font-serif)', fontSize: '13px', padding: '20px 0', fontStyle: 'italic' }}>
              No AI recommendations yet. Try the search above!
            </p>
          )}
          {displayHotels.map((rec, idx) => {
            const hotel = getHotelData(rec.name) || HOTELS_DB[idx] || HOTELS_DB[0]
            const isExpanded = expandedId === hotel.id
            const isHighlighted = highlightedId === hotel.id
            const isBaseCamp = selectedHotel?.id === hotel.id
            return (
              <div
                key={hotel.id}
                id={`hotel-card-${hotel.id}`}
                className={`hotel-card ${isBaseCamp ? 'selected' : ''}`}
                style={isHighlighted ? { boxShadow: '0 0 0 2px #D4AF37, 0 8px 24px rgba(212,175,55,0.25)', transform: 'scale(1.01)' } : {}}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : hotel.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {hotel.image ? (
                      <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        border: '2px double #D4AF37',
                        padding: '1.5px',
                        background: '#FAF6EE',
                        boxShadow: '0 4px 8px rgba(139,90,43,0.15)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <img 
                          src={hotel.image} 
                          alt={hotel.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{
                        fontSize: '24px', padding: '8px', borderRadius: '12px', flexShrink: 0,
                        background: isBaseCamp ? 'rgba(209,26,56,0.08)' : '#FAF6EE',
                        border: isBaseCamp ? '1px solid rgba(209,26,56,0.2)' : '1px solid rgba(139,90,75,0.1)',
                      }}>{hotel.emoji}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '15px', fontWeight: 700, color: '#2A2321', margin: '0 0 6px', lineHeight: 1.2 }}>
                        {hotel.name}
                        {isBaseCamp && <span style={{ fontSize: '10px', background: '#D11A38', color: '#fff', padding: '1px 6px', borderRadius: '999px', marginLeft: '8px', fontWeight: 700, fontFamily: 'var(--jn-font-sans)', letterSpacing: '0.04em' }}>✓ Selected</span>}
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: rec.reason ? '8px' : 0 }}>
                        <span style={{ padding: '2px 8px', borderRadius: '999px', background: '#FAF6EE', border: '1px solid rgba(139,90,75,0.15)', fontSize: '10px', fontFamily: 'var(--jn-font-sans)', fontWeight: 700, color: '#8B5A4B' }}>
                          {hotel.tier}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', fontSize: '10px', fontFamily: 'var(--jn-font-sans)', fontWeight: 700, color: '#059669' }}>
                          💰 {hotel.cost}
                        </span>
                      </div>
                      {rec.reason && (
                        <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '12px', fontStyle: 'italic', color: '#BA0C2F', margin: 0, lineHeight: 1.5 }}>
                          “{rec.reason}”
                        </p>
                      )}
                    </div>
                    <span style={{ color: 'rgba(92,84,81,0.4)', fontSize: '10px', flexShrink: 0, marginTop: '4px' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: '1px dashed rgba(209,26,56,0.12)', marginTop: '12px', paddingTop: '12px' }}>
                    <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '13px', color: '#5C5451', lineHeight: 1.65, margin: '0 0 10px' }}>{hotel.desc}</p>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontFamily: 'var(--jn-font-sans)', fontWeight: 700, color: 'rgba(92,84,81,0.75)', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span>📍 {hotel.neighborhood}</span>
                      <span>&bull;</span>
                      <span>🚗 {hotel.dist}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isBaseCamp ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', background: '#D11A38', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em' }}>
                          ✓ Your Base Camp
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedHotel(hotel); awardXP(50, 'Established Base Camp'); playCampStampSound() }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '999px',
                            background: 'rgba(209,26,56,0.06)', border: '1.5px solid rgba(209,26,56,0.25)',
                            color: '#D11A38', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            letterSpacing: '0.04em', transition: 'all 0.2s ease',
                          }}
                        >
                          🔑 Set as Base Camp
                        </button>
                      )}
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '7px 14px', borderRadius: '999px',
                          background: '#FAF6EE', border: '1px solid rgba(212,175,55,0.4)',
                          color: '#2A2321', fontSize: '11px', fontWeight: 700,
                          textDecoration: 'none', letterSpacing: '0.04em',
                        }}
                      >
                        🏨 Book on Booking.com
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
