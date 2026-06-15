import { useState, useEffect } from 'react'
import { useVibe } from '../hooks/useVibe'
import { callLocalAI, buildHotelAdvisorPrompt } from '../services/aiService'

// Extended hotel database
export const HOTELS_DB = [
  {
    id: 'merchant-house',
    name: 'The Merchant House',
    tier: 'Heritage Boutique',
    cost: 'From 80 BHD/night',
    emoji: '🏛️',
    neighborhood: 'Bab Al Bahrain, Manama',
    dist: 'Next to Manama Souq',
    desc: 'Art-filled suite hotel in a restored heritage building near Bab Al Bahrain. Exposed coral walls, arched windows, and handmade Gulf furniture.',
    moodFit: ['spice', 'culture', 'empires'],
    tierFit: ['Curated', 'Luxury'],
    bookingUrl: 'https://www.booking.com/hotel/bh/the-merchant-house.html',
    coords: '26.2375° N, 50.5728° E'
  },
  {
    id: 'four-seasons',
    name: 'Four Seasons Bahrain Bay',
    tier: 'Ultra Luxury',
    cost: 'From 140 BHD/night',
    emoji: '🏝️',
    neighborhood: 'Bahrain Bay, Manama',
    dist: '10 min from National Museum',
    desc: 'Private island resort featuring spectacular bay views, private beach, award-winning spa, and the best sunset terrace in the kingdom.',
    moodFit: ['lights', 'sea', 'modern'],
    tierFit: ['Luxury'],
    bookingUrl: 'https://www.booking.com/hotel/bh/four-seasons-bahrain-bay.html',
    coords: '26.2505° N, 50.5822° E'
  },
  {
    id: 'al-areen-palace',
    name: 'Al Areen Palace & Spa',
    tier: 'Desert Sanctuary',
    cost: 'From 110 BHD/night',
    emoji: '🕌',
    neighborhood: 'Sakhir Desert',
    dist: '5 min from Tree of Life',
    desc: 'Private pool villas nestled in the Sakhir dunes. Ideal for starlit silence, Arabian spa treatments, and access to Al Areen Wildlife Reserve.',
    moodFit: ['desert', 'empires'],
    tierFit: ['Luxury', 'Curated'],
    bookingUrl: 'https://www.booking.com/hotel/bh/al-areen-palace-spa.html',
    coords: '26.0042° N, 50.4912° E'
  },
  {
    id: 'muharraq-heritage',
    name: 'Muharraq Heritage Houses',
    tier: 'Authentic / Budget',
    cost: 'From 25 BHD/night',
    emoji: '⛵',
    neighborhood: 'Muharraq Historic District',
    dist: 'Walking to Pearling Path',
    desc: 'Restored pearling-era merchant houses turned guesthouses. Coral-stone walls, wooden mashrabiya screens, and a resident cook serving traditional breakfast.',
    moodFit: ['sea', 'culture', 'empires', 'spice'],
    tierFit: ['Wandering', 'Curated'],
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Muharraq+heritage+hotel',
    coords: '26.2498° N, 50.6115° E'
  },
  {
    id: 'k-hotel-juffair',
    name: 'The K Hotel Juffair',
    tier: 'Modern / Budget',
    cost: 'From 35 BHD/night',
    emoji: '🏢',
    neighborhood: 'Juffair, Manama',
    dist: '15 min from Block 338',
    desc: 'Comfortable modern high-rise with rooftop pool and city views. Excellent base for exploring Adliya arts scene and the city\'s modern waterfront.',
    moodFit: ['lights', 'modern'],
    tierFit: ['Wandering', 'Curated'],
    bookingUrl: 'https://www.booking.com/hotel/bh/k-hotel.html',
    coords: '26.2162° N, 50.6068° E'
  },
  {
    id: 'ramee-grand',
    name: 'Ramee Grand Hotel & Spa',
    tier: 'Mid-Range',
    cost: 'From 55 BHD/night',
    emoji: '🌟',
    neighborhood: 'Seef District',
    dist: '20 min from Bahrain Fort',
    desc: 'Elegant full-service hotel with a large outdoor pool and excellent location between Manama souqs and the modern Seef Mall.',
    moodFit: ['culture', 'spice', 'empires'],
    tierFit: ['Curated', 'Wandering'],
    bookingUrl: 'https://www.booking.com/hotel/bh/ramee-grand.html',
    coords: '26.2325° N, 50.5398° E'
  },
  {
    id: 'sofitel',
    name: 'Sofitel Bahrain Zallaq Thalassa',
    tier: 'Beachfront Luxury',
    cost: 'From 120 BHD/night',
    emoji: '🌊',
    neighborhood: 'Zallaq Beach',
    dist: 'Near Al Areen wildlife reserve',
    desc: 'French-accented beachfront resort with a private sea corridor, thalassotherapy spa, and spectacular Gulf of Bahrain sunsets from your terrace.',
    moodFit: ['sea', 'desert'],
    tierFit: ['Luxury'],
    bookingUrl: 'https://www.booking.com/hotel/bh/sofitel-bahrain.html',
    coords: '26.0545° N, 50.4820° E'
  },
  {
    id: 'gulf-hotel',
    name: 'Gulf Hotel Bahrain',
    tier: 'Classic Grande',
    cost: 'From 70 BHD/night',
    emoji: '🏨',
    neighborhood: 'Adliya, Manama',
    dist: 'Walking to Block 338',
    desc: 'A Bahrain landmark since 1969 — grand lobbies, nine restaurants, and a lush pool garden. Located steps from the bohemian Adliya art district.',
    moodFit: ['lights', 'spice', 'culture'],
    tierFit: ['Curated', 'Luxury'],
    bookingUrl: 'https://www.booking.com/hotel/bh/gulf-hotel.html',
    coords: '26.2198° N, 50.5878° E'
  },
]

export default function AIHotelPanel({ moods, tier, duration }) {
  const { selectedHotel, setSelectedHotel, awardXP } = useVibe()
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [filterResult, setFilterResult] = useState(null)
  const [filterLoading, setFilterLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [highlightedId, setHighlightedId] = useState(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
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
    } catch {}

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
  }

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
    } catch {}
  }

  const handleFilter = async () => {
    if (!filterQuery.trim()) return
    setFilterLoading(true)
    const hotelList = HOTELS_DB.map((h, i) => `${i+1}. ${h.name} (${h.neighborhood}): ${h.desc}`).join('\n')
    
    try {
      const result = await callLocalAI(
        `You are a Bahrain hotel concierge. Based on the traveler's request, recommend the BEST hotel from the list in this exact format: "HOTEL: [name] | REASON: [1 sentence]"`,
        `Traveler says: "${filterQuery}"\n\nHotels:\n${hotelList}`,
        `I recommend The Merchant House as the best fit for your needs.`,
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
      {/* Title block with antique traveler styling */}
      <div>
        <span className="font-sans text-[11px] tracking-[0.25em] text-[#BA0C2F] uppercase font-bold block">
          AI-Curated Accommodations
        </span>
        <h3 className="font-serif text-xl text-[#2A2321] font-extrabold mt-0.5">
          Your Perfect Stays
        </h3>
        <p className="font-sans text-xs text-[#5C5451] leading-relaxed font-semibold mt-1">
          Matched to your {Array.isArray(moods) ? moods.join(', ') : 'travel'} vibes and {tier} budget.
        </p>
      </div>

      {/* Thematic Concierge Desk Search Box */}
      <div 
        className="p-4 rounded-2xl border relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 100% 0%, #FFFDF9 0%, #FAF6EE 100%)',
          border: '1.5px solid rgba(139, 90, 43, 0.2)',
          boxShadow: '0 4px 15px rgba(42,35,33,0.04)'
        }}
      >
        <div className="absolute top-2 right-3 text-sm opacity-15">⚜️</div>
        
        <div className="flex gap-3 items-center mb-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BA0C2F] to-[#8A0A22] border-2 border-[#D4AF37] flex items-center justify-center text-lg shadow-sm">
            👳‍♂️
          </div>
          <div>
            <h4 className="font-serif text-[13px] font-bold text-[#2A2321] leading-tight">
              Concierge Desk
            </h4>
            <p className="font-sans text-[10px] text-bronze-muted/70 font-semibold leading-none mt-0.5">
              Jafar · Chief Travel Advisor
            </p>
          </div>
        </div>

        <p className="font-serif text-[11.5px] italic text-[#5C5451] leading-relaxed mb-3">
          "Tell me what you desire for your stay—be it beachfront peace, heritage walls, or proximity to the souq—and I shall find your base camp."
        </p>

        <div className="flex gap-2 relative z-10">
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder='e.g. "beachfront sunset" or "near Manama Souq"...'
            className="flex-1 px-3.5 py-2 text-[13px] font-serif rounded-xl border border-red-500/15 bg-white/90 focus:outline-none focus:border-bahrain-red/40 text-bronze-charcoal placeholder-[#5C5451]/30 shadow-inner"
          />
          <button
            onClick={handleFilter}
            disabled={filterLoading || !filterQuery.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#BA0C2F] to-[#8A0A22] border border-[#BA0C2F] text-white text-[11px] font-extrabold uppercase tracking-wide cursor-pointer hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
          >
            {filterLoading ? '...' : '🤖 Match'}
          </button>
        </div>
      </div>

      {filterResult && (
        <div 
          className="p-3 rounded-xl border text-[12.5px] font-serif italic text-[#2A2321] leading-relaxed relative animate-fadeIn"
          style={{
            background: '#FFFDF9',
            borderLeft: '4px solid #D4AF37',
            borderColor: 'rgba(212,175,55,0.25)'
          }}
        >
          <div className="absolute top-1.5 right-2 text-[10px] text-bahrain-red font-sans font-bold uppercase tracking-widest opacity-40">Advisor</div>
          🗣️ {filterResult}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3.5 rounded-xl border border-red-500/8 bg-white animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-bronze-muted/15 rounded w-3/4" />
                <div className="h-2 bg-bronze-muted/10 rounded w-1/2" />
                <div className="h-2 bg-bronze-muted/10 rounded w-full" />
              </div>
            </div>
          ))}
          <p className="text-center text-[11px] font-serif italic text-bronze-muted/60 animate-pulse">
            AI is consulting the registrar logs...
          </p>
        </div>
      )}

      {/* Hotel cards */}
      {!loading && (
        <div className="space-y-3 pb-2">
          {displayHotels.map((rec, idx) => {
            const hotel = getHotelData(rec.name) || HOTELS_DB[idx] || HOTELS_DB[0]
            const isExpanded = expandedId === hotel.id
            const isHighlighted = highlightedId === hotel.id
            const isBaseCamp = selectedHotel?.id === hotel.id

            return (
              <div
                key={hotel.id}
                id={`hotel-card-${hotel.id}`}
                className={`rounded-xl border transition-all overflow-hidden relative ${
                  isHighlighted 
                    ? 'border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.5)] scale-[1.01]' 
                    : isBaseCamp
                      ? 'border-[#BA0C2F] shadow-sm'
                      : 'border-red-500/10 shadow-sm hover:border-red-500/20'
                }`}
                style={{
                  background: isBaseCamp 
                    ? 'linear-gradient(135deg, #FFFDF9 0%, #FAF7EE 100%)' 
                    : '#FFFDF9',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                }}
              >
                {/* Inner vintage stitch dashed border */}
                <div
                  className="absolute inset-1.5 pointer-events-none rounded-lg"
                  style={{
                    border: isBaseCamp 
                      ? '1.5px dashed rgba(186, 12, 47, 0.25)' 
                      : '1px dashed rgba(139, 90, 43, 0.12)',
                  }}
                />

                <button
                  onClick={() => setExpandedId(isExpanded ? null : hotel.id)}
                  className="w-full p-4 flex items-start gap-3.5 text-left cursor-pointer transition-all relative z-10"
                >
                  <span className={`text-2xl p-2 rounded-xl shrink-0 transition-colors ${
                    isBaseCamp 
                      ? 'bg-[#BA0C2F]/10 border border-[#BA0C2F]/20' 
                      : 'bg-[#FAF6EE] border border-[#8B5A4B]/15'
                  }`}>
                    {hotel.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-[14px] font-extrabold text-[#2A2321] leading-tight">
                      {hotel.name}
                    </h5>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF6EE] text-[#8B5A4B] text-[10px] font-sans font-bold uppercase tracking-wider border border-[#8B5A4B]/15">
                        {hotel.tier}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800 text-[10px] font-sans font-bold uppercase tracking-wider border border-emerald-700/10">
                        💰 {hotel.cost}
                      </span>
                    </div>
                    {rec.reason && (
                      <p className="font-serif text-[12.5px] italic text-[#BA0C2F]/85 mt-2 leading-relaxed">
                        🤖 "{rec.reason}"
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-bronze-muted/40 shrink-0 mt-1">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-dashed border-red-500/10 pt-3.5 space-y-3.5 relative z-10 ml-[52px]">
                    <p className="font-sans text-[12.5px] text-[#5C5451] leading-relaxed font-medium">{hotel.desc}</p>
                    <div className="flex items-center gap-1.5 text-[10.5px] font-sans text-bronze-muted/70 font-bold">
                      <span>📍 {hotel.neighborhood}</span>
                      <span>•</span>
                      <span>🚗 {hotel.dist}</span>
                    </div>
                    
                    <div className="flex items-center gap-3.5 pt-1 flex-wrap">
                      {/* Set Base Camp Button */}
                      {isBaseCamp ? (
                        <button
                          disabled={true}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#BA0C2F] to-[#8A0A22] text-white text-[11.5px] font-extrabold uppercase tracking-wide shadow-md"
                          style={{ border: '1.5px solid #D4AF37' }}
                        >
                          ✓ Base Camp Active
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedHotel(hotel)
                            awardXP(50, 'Established Base Camp')
                            playCampStampSound()
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F3EFE4] text-[#BA0C2F] border border-[#BA0C2F]/35 hover:border-[#BA0C2F]/60 text-[11.5px] font-extrabold uppercase tracking-wide transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          🔑 Set as Base Camp
                        </button>
                      )}

                      {/* View Booking.com Button */}
                      <a
                        href={hotel.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFDF9] hover:bg-[#FAF6EE] text-bronze-charcoal border border-[#D4AF37] text-[11px] font-extrabold uppercase tracking-wide transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        🗺️ Booking Link
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
