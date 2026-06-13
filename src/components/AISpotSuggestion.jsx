import { useState, useEffect } from 'react'
import { callLocalAI, buildHiddenGemPrompt } from '../services/aiService'
import { spotsCatalog } from '../hooks/useItinerary'

export default function AISpotSuggestion({ moods, tier, locations }) {
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!locations || locations.length === 0) return
    loadSuggestion()
  }, [])

  const loadSuggestion = async () => {
    setLoading(true)
    const existingNames = [...new Set(locations.map(s => s.name.split('(')[0].trim()))]
    const { system, user } = buildHiddenGemPrompt(moods, tier, existingNames)

    const raw = await callLocalAI(system, user,
      'PLACE: Khalaf House | REASON: This quiet pearl merchant mansion is the perfect hidden gem — few tourists visit, but locals say the wind-tower ventilation systems create an otherworldly atmosphere.',
      { cacheKey: `hidden-gem:${JSON.stringify(moods)}:${tier}`, maxTokens: 100 }
    )

    // Parse "PLACE: X | REASON: Y" format
    const placeMatch = raw.match(/PLACE:\s*(.+?)\s*\|/)
    const reasonMatch = raw.match(/REASON:\s*(.+)/)

    if (placeMatch && reasonMatch) {
      const placeName = placeMatch[1].trim()
      // Try to find in catalog
      const catalogSpot = spotsCatalog.find(s =>
        s.name.toLowerCase().includes(placeName.toLowerCase().slice(0, 12)) &&
        !locations.some(l => l.id === s.id)
      )
      setSuggestion({
        name: placeName,
        reason: reasonMatch[1].trim(),
        spot: catalogSpot || null,
      })
    } else {
      // Fallback: pick an unused catalog spot
      const unused = spotsCatalog.filter(s => !locations.some(l => l.id === s.id))
      if (unused.length > 0) {
        const pick = unused[0]
        setSuggestion({
          name: pick.name,
          reason: `A ${pick.category} landmark that perfectly complements your ${moods?.[0] || 'travel'} vibe.`,
          spot: pick,
        })
      }
    }
    setLoading(false)
  }

  if (dismissed || (!loading && !suggestion)) return null

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-300/20">
        <div className="flex items-center gap-1.5">
          <span className="text-base">✨</span>
          <span className="font-sans text-[8px] tracking-widest uppercase text-amber-700 font-extrabold">
            AI Hidden Gem Suggestion
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600/50 hover:text-amber-700 text-[9px] cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-amber-300/20 rounded w-2/3" />
            <div className="h-2 bg-amber-300/15 rounded w-full" />
            <div className="h-2 bg-amber-300/15 rounded w-4/5" />
          </div>
        ) : suggestion ? (
          <div>
            <div className="flex items-start gap-2.5">
              <span className="text-xl shrink-0">
                {suggestion.spot ? (suggestion.spot.keepsakeEmoji || '🗺️') : '🗺️'}
              </span>
              <div>
                <h5 className="font-serif text-[12px] font-bold text-bronze-charcoal leading-tight">
                  {suggestion.name}
                </h5>
                {suggestion.spot && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-600/15 text-amber-700 text-[7.5px] font-sans font-bold uppercase tracking-wider">
                      {suggestion.spot.category}
                    </span>
                    <span className="text-[8px] text-bronze-muted/60 font-sans">
                      {suggestion.spot.pathCost || suggestion.spot.budgetCost || 'Free'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="font-serif text-[10.5px] italic text-bronze-charcoal/80 leading-relaxed mt-2">
              🤖 "{suggestion.reason}"
            </p>
            {suggestion.spot && (
              <p className="font-sans text-[9.5px] text-bronze-muted mt-1.5 leading-relaxed">
                {suggestion.spot.simpleTerms?.split('.')[0] + '.'}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
