import { useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { callLocalAI, buildHotelAdvisorPrompt } from '../services/aiService'
import { playCampStampSound } from '../services/audioUtils'
import { HOTELS_DB } from '../data/hotelsData'
import { ConciergeBell, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../context/ToastContext'

// Re-export so existing importers (JournalNotebook) don't break
export { HOTELS_DB }

export default function AIHotelPanel({ moods, tier, duration, autoLoad = true }) {
  const { selectedHotel, setSelectedHotel, awardXP, soundVolume, soundMuted } = useVibe()
  const { toast } = useToast()
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

  // Centralized audio used on selection

  const handleFilter = async () => {
    if (!filterQuery.trim()) {
      toast.info('Please describe your ideal stay (e.g. beachfront sunset)')
      return
    }
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
        <div className="bg-gradient-to-br from-[#C1122F] to-[#8B0D22] rounded-2xl p-4 text-white flex items-center gap-3.5 shadow-lg shadow-[#C1122F]/25 relative overflow-hidden animate-fadeIn">
          {selectedHotel.image ? (
            <div className="w-13 h-13 rounded-full border-2 border-double border-[#C5A880]/70 p-0.5 bg-white/10 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src={selectedHotel.image} 
                alt={selectedHotel.name}
                className="w-full h-full rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : (
            <div className="text-3xl shrink-0">{selectedHotel.emoji}</div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FFF1F3] opacity-75 font-sans">Your Base Camp ✓</span>
            <h4 className="font-serif text-base font-bold mt-0.5 mb-1 text-white">
              {selectedHotel.name}
            </h4>
            <p className="font-sans text-xs text-[#FFF1F3]/80">
              {selectedHotel.neighborhood} &middot; {selectedHotel.cost}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <a
              href={selectedHotel.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/30 text-white font-bold text-[10px] no-underline whitespace-nowrap tracking-wider hover:bg-white/25 transition-colors font-sans"
            >
              Book Now
            </a>
            <button
              onClick={() => setSelectedHotel(null)}
              className="bg-transparent border-none text-[#FFF1F3]/60 text-[10px] cursor-pointer p-0 text-center hover:text-white/80 transition-colors font-sans"
            >
              Change hotel
            </button>
          </div>
        </div>
      )}

      {/* ── Concierge Desk Search ── */}
      <div className="p-4 rounded-2xl bg-stone-50 border border-stone-250 shadow-sm text-left">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-stone-200/60 flex items-center justify-center shrink-0 border border-stone-300/30 text-[#C1122F]">
            <ConciergeBell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-stone-800 leading-tight">Concierge Desk</h4>
            <p className="font-sans text-[10px] text-stone-500 uppercase tracking-wider">Bahrain Travel Advisor</p>
          </div>
        </div>
        <p className="font-serif text-xs italic text-stone-600 mb-3 leading-relaxed">
          "Describe your perfect stay—beachfront calm, heritage walls, or Souq proximity—and I shall find your base camp."
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder='e.g. "beachfront sunset" or "near Manama Souq"...'
            className="flex-1 px-3.5 py-2 rounded-xl font-sans text-sm border border-stone-200 bg-white focus:outline-none focus:border-[#C1122F]/40 text-stone-800 placeholder-stone-400"
          />
          <button
            onClick={handleFilter}
            disabled={filterLoading || !filterQuery.trim()}
            className="px-4 py-2 rounded-xl shrink-0 bg-[#C1122F] text-white font-bold text-xs tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-none font-sans"
          >
            {filterLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Match'}
          </button>
        </div>
      </div>

      {filterResult && (
        <div className="p-3.5 rounded-xl bg-stone-50 border-l-2 border-[#C5A880] font-serif text-xs italic leading-relaxed text-stone-850 text-left animate-fadeIn">
          {filterResult}
        </div>
      )}

      {/* ── AI Recommendations: Loading skeleton ── */}
      {loading && (
        <div className="space-y-3">
          <p className="font-sans text-xs text-stone-400 italic text-center py-2 flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Consulting the registrar for your ideal stay…
          </p>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-stone-100 h-20 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── AI-Recommended Hotel Cards ── */}
      {!loading && (
        <div className="space-y-3">
          {displayHotels.length === 0 && (
            <p className="text-center text-stone-400 font-serif text-xs py-5 italic">
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
                className={`p-4 rounded-2xl border transition-all text-left ${
                  isBaseCamp 
                    ? 'border-[#C1122F] bg-[#C1122F]/5' 
                    : 'border-stone-200 bg-white hover:border-stone-300'
                } ${
                  isHighlighted 
                    ? 'ring-1 ring-[#C5A880] shadow-md scale-[1.01]' 
                    : 'shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : hotel.id)}
                  className="w-full bg-transparent border-none p-0 cursor-pointer text-left focus:outline-none"
                >
                  <div className="flex items-start gap-3">
                    {hotel.image ? (
                      <div className="w-13 h-13 rounded-full border border-stone-200 p-0.5 bg-stone-50 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                        <img 
                          src={hotel.image} 
                          alt={hotel.name}
                          className="w-full h-full rounded-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : (
                      <span className={`text-2.5xl p-2 rounded-xl shrink-0 flex items-center justify-center ${
                        isBaseCamp 
                          ? 'bg-[#C1122F]/10 border border-[#C1122F]/20' 
                          : 'bg-stone-50 border border-stone-200'
                      }`}>
                        {hotel.emoji}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-serif text-sm font-bold text-stone-800 mb-1.5 leading-tight flex flex-wrap items-center gap-1.5">
                        {hotel.name}
                        {isBaseCamp && (
                          <span className="text-[9px] bg-[#C1122F] text-white px-2 py-0.5 rounded-full font-bold tracking-wider uppercase font-sans border-none">
                            ✓ Selected
                          </span>
                        )}
                      </h5>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-sans font-bold text-stone-600">
                          {hotel.tier}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-250 text-[10px] font-sans font-bold text-emerald-700">
                          {hotel.cost}
                        </span>
                      </div>
                      {rec.reason && (
                        <p className="font-serif text-xs italic text-[#C1122F] m-0 leading-relaxed">
                          “{rec.reason}”
                        </p>
                      )}
                    </div>
                    <span className="text-stone-400 shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-dashed border-[#C1122F]/15 mt-3 pt-3 animate-fadeIn">
                    <p className="font-sans text-xs text-stone-600 leading-relaxed mb-2.5">{hotel.desc}</p>
                    <div className="flex gap-2 text-[10px] font-sans font-bold text-stone-500 mb-3.5 flex-wrap">
                      <span>{hotel.neighborhood}</span>
                      <span>&bull;</span>
                      <span>🚗 {hotel.dist}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {isBaseCamp ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C1122F] text-white text-xs font-bold tracking-wider font-sans">
                          ✓ Your Base Camp
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedHotel(hotel); awardXP(50, 'Established Base Camp'); playCampStampSound(soundVolume, soundMuted); toast.success(`Established Base Camp stay at ${hotel.name}! +50 XP`) }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C1122F]/5 border border-[#C1122F]/25 text-[#C1122F] hover:bg-[#C1122F]/10 text-xs font-bold cursor-pointer tracking-wider transition-colors focus:outline-none font-sans"
                        >
                          Set as Base Camp
                        </button>
                      )}
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-50 border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold no-underline tracking-wider transition-colors font-sans"
                      >
                        Book on Booking.com
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
