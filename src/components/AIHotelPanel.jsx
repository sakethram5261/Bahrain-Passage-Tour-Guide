import { useState, useEffect } from 'react'
import { callLocalAI, buildHotelAdvisorPrompt } from '../services/aiService'

// Extended hotel database
const HOTELS_DB = [
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
  },
]

export default function AIHotelPanel({ moods, tier, duration }) {
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [filterResult, setFilterResult] = useState(null)
  const [filterLoading, setFilterLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

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
      // Extract JSON from the response
      const jsonMatch = raw.match(/\[[\s\S]*\]/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
    } catch {}

    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      // Fallback: pick top 3 by mood match
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

  const handleFilter = async () => {
    if (!filterQuery.trim()) return
    setFilterLoading(true)
    const hotelList = HOTELS_DB.map((h, i) => `${i+1}. ${h.name} (${h.neighborhood}): ${h.desc}`).join('\n')
    const result = await callLocalAI(
      `You are a Bahrain hotel concierge. Based on the traveler's request, recommend the BEST hotel from the list in this exact format: "HOTEL: [name] | REASON: [1 sentence]"`,
      `Traveler says: "${filterQuery}"\n\nHotels:\n${hotelList}`,
      `I recommend ${HOTELS_DB[0].name} as the best fit for your needs.`,
      { useCache: false, maxTokens: 80 }
    )
    setFilterResult(result)
    setFilterLoading(false)
  }

  // Get full hotel data for a recommendation
  const getHotelData = (name) =>
    HOTELS_DB.find(h => h.name.toLowerCase().includes(name?.toLowerCase()?.slice(0, 12))) || null

  const displayHotels = loading ? [] : (recommendations || [])

  return (
    <div className="space-y-4">
      <div>
        <span className="font-sans text-[11px] tracking-[0.25em] text-bahrain-red uppercase font-bold block">
          AI-Curated Accommodations
        </span>
        <h3 className="font-serif text-xl text-bronze-charcoal font-semibold mt-0.5">
          Your Perfect Stays
        </h3>
        <p className="font-sans text-xs text-bronze-muted leading-relaxed font-semibold mt-1">
          Matched to your {Array.isArray(moods) ? moods.join(', ') : 'travel'} vibes and {tier} budget.
        </p>
      </div>

      {/* AI filter input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={filterQuery}
          onChange={e => setFilterQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFilter()}
          placeholder='Ask AI: "something near Muharraq..."'
          className="flex-1 px-3 py-2 text-[15px] font-serif rounded-xl border border-red-500/15 bg-white focus:outline-none focus:border-bahrain-red/40 text-bronze-charcoal placeholder-bronze-muted/40"
        />
        <button
          onClick={handleFilter}
          disabled={filterLoading || !filterQuery.trim()}
          className="px-3 py-2 rounded-xl bg-bahrain-red text-white text-[13px] font-extrabold uppercase tracking-wide cursor-pointer hover:bg-red-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {filterLoading ? '...' : '🤖 Ask'}
        </button>
      </div>

      {filterResult && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-400/30 text-[13.5px] font-serif italic text-bronze-charcoal leading-relaxed">
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
          <p className="text-center text-[12px] font-serif italic text-bronze-muted/60 animate-pulse">
            AI is personalizing your stays...
          </p>
        </div>
      )}

      {/* Hotel cards */}
      {!loading && (
        <div className="space-y-3">
          {displayHotels.map((rec, idx) => {
            const hotel = getHotelData(rec.name) || HOTELS_DB[idx] || HOTELS_DB[0]
            const isExpanded = expandedId === hotel.id

            return (
              <div
                key={hotel.id}
                className="rounded-xl border border-red-500/10 bg-white shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : hotel.id)}
                  className="w-full p-3.5 flex items-start gap-3 text-left cursor-pointer hover:bg-red-500/2 transition-all"
                >
                  <span className="text-2xl p-2 bg-amber-500/6 border border-amber-500/10 rounded-xl shrink-0">
                    {hotel.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-serif text-[14px] font-bold text-bronze-charcoal leading-tight">
                      {hotel.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-amber-600/10 text-amber-700 text-[11px] font-sans font-bold uppercase tracking-wider">
                        {hotel.tier}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800 text-[11px] font-sans font-bold uppercase tracking-wider">
                        💰 {hotel.cost}
                      </span>
                    </div>
                    {rec.reason && (
                      <p className="font-serif text-[13px] italic text-bahrain-red/80 mt-1.5 leading-relaxed">
                        🤖 "{rec.reason}"
                      </p>
                    )}
                  </div>
                  <span className="text-[12px] text-bronze-muted/40 shrink-0 mt-1">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3.5 border-t border-red-500/8 pt-3 space-y-2">
                    <p className="font-sans text-[13.5px] text-bronze-muted leading-relaxed">{hotel.desc}</p>
                    <div className="flex items-center gap-1.5 text-[11px] font-sans text-bronze-muted/70 font-semibold">
                      <span>📍 {hotel.neighborhood}</span>
                      <span>•</span>
                      <span>🚗 {hotel.dist}</span>
                    </div>
                    <a
                      href={hotel.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-extrabold uppercase tracking-wide transition-all cursor-pointer shadow-sm mt-1"
                    >
                      🔗 View on Booking.com
                    </a>
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
