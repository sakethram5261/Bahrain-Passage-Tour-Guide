import { useRef, useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { 
  Trash2, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Landmark, 
  Waves, 
  Coffee, 
  Building2, 
  Compass, 
  MapPin 
} from 'lucide-react'
import { playTypewriterClick } from '../services/audioUtils'
import { callLocalAI } from '../services/aiService'

const CATEGORY_ICONS = {
  fort: Landmark,
  souq: Coffee,
  coast: Waves,
  modern: Building2,
  desert: Compass,
  culture: BookOpen,
  default: MapPin
}

const guidePhrases = [
  `Assembling your personalized guide...`,
  `Analyzing historical archives and geographic data...`,
  `Selecting cultural routes and points of interest...`,
  `Loading historical details and archival records...`,
  `Mapping coastal landmarks in Muharraq...`,
  `Verifying tidal conditions for Jarada Island...`,
  `Consulting regional transit and sea schedules...`,
  `Optimizing geographic routes and walking paths...`,
  `Retrieving recommendations for local culinary ateliers...`,
  `Preparing your custom travel chronicle passport...`,
  `Itinerary ready! Click below to view.`
]

export default function SensoryHero({ onBack }) {
  const {
    setStep = () => {},
    selectedMoods = [],
    tier = 'Wandering',
    duration = 1,
    itinerarySpots = [],
    setItinerarySpots = () => {},
    soundVolume = 1,
    soundMuted = false,
  } = useVibe()

  const [showPreviewOverview, setShowPreviewOverview] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [logsComplete, setLogsComplete] = useState(false)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [sealing, setSealing] = useState(false) 
  const [confirmOpen, setConfirmOpen] = useState(false)
  
  // Accordion expanded states for spots
  const [expandedSpots, setExpandedSpots] = useState({})

  const contentRef = useRef(null)
  const logsEndRef = useRef(null)
  const intervalRef = useRef(null)

  const playClick = useCallback((pitchMultiplier = 1.0) => {
    playTypewriterClick(pitchMultiplier, soundVolume, soundMuted)
  }, [soundMuted, soundVolume])

  const handleSkipCuration = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTerminalLogs(guidePhrases)
    setLogsComplete(true)
    setShowPreviewOverview(true)
  }

  const toggleSpotExpand = (spotId) => {
    playClick(0.95)
    setExpandedSpots(prev => ({
      ...prev,
      [spotId]: !prev[spotId]
    }))
  }

  const compileItinerary = useCallback(async () => {
    let compiledSpots = []
    let localCatalog = null
    let localCategoryImages = null
    try {
      const itineraryModule = await import('../hooks/useItinerary')
      if (itineraryModule) {
        localCatalog = itineraryModule.spotsCatalog
        localCategoryImages = itineraryModule.categoryImages
      }
    } catch (importErr) {
      console.error("Dynamic catalog chunk load protected:", importErr)
    }

    let aiFetched = false
    try {
      if (selectedMoods && selectedMoods.length > 0) {
        setTerminalLogs(logs => [...logs, "Analyzing local archives and heritage registries..."])

        const systemPrompt = `You are a highly knowledgeable Bahraini travel planner.
Generate a list of interesting, culturally rich, and fun spots in Bahrain tailored to the traveler's selected vibes/moods, budget tier, and duration.
You must return a valid JSON array of spot objects.
Each spot object must contain the following keys exactly:
- id: unique string in kebab-case
- name: English name
- arabic: Arabic script of the name (e.g. "موقع قلعة البحرين")
- mood: one of: empires, spice, sea, lights, desert, culture
- coords: approx coordinates, e.g. "26.2339° N, 50.5198° E"
- period: historical period or "Modern Era"
- desc: brief description (1-2 sentences)
- simpleTerms: What this offers: description of what a visitor actually does there (1-2 sentences)
- insider: an insider secret, unique tip, or personal observation (1 sentence)
- budgetGuide: how a budget-conscious traveler can enjoy it (1 sentence)
- premiumGuide: a curated, luxury or premium experience there (1 sentence)
- budgetCost: estimate cost (e.g., "Free Entry" or "Under 1 BHD")
- premiumCost: estimate cost (e.g., "15 BHD" or "40 BHD")
- category: one of: fort, souq, coast, modern, desert, culture
- keepsakeId: unique stamp identifier, e.g. "custom-X"
- keepsakeName: name of custom keepsake
- keepsakeEmoji: single emoji representing the keepsake
- keepsakeDesc: description of the keepsake

Please generate exactly ${duration * 2} spots (excluding airport arrival/departure) spread across the ${duration} days, or a minimum of 4 spots if the duration is 1 day.
Assign a "day" field (integer from 1 to ${duration}) to each spot to distribute them evenly across the days.
Do NOT wrap the JSON inside markdown code blocks (e.g. no \`\`\`json). Return ONLY valid JSON array.`;

        const userPrompt = `Generate a customized itinerary for a ${duration}-day trip to Bahrain.
Traveler Vibes/Moods: ${selectedMoods.join(', ')}
Budget Tier: ${tier}
Generate exactly ${duration * 2} spots distributed evenly across the ${duration} days.
Make the spots highly engaging and authentic to Bahrain. Do not include airport arrival or departure in the generated spots, as those will be appended automatically.`;

        const responseText = await callLocalAI(systemPrompt, userPrompt, '', { maxTokens: 1800, useJson: true })
        if (responseText && !responseText.includes('error')) {
          let cleaned = responseText.trim()
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim()
          }
          try {
            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed) && parsed.length > 0) {
              compiledSpots = parsed.map(item => ({
                ...item,
                pathGuide: tier === 'Wandering' ? (item.budgetGuide || item.desc) : (item.premiumGuide || item.desc),
                pathCost: tier === 'Wandering' ? (item.budgetCost || 'Free Entry') : (item.premiumCost || 'Free Entry'),
                image: (localCategoryImages && localCategoryImages[item.category?.toLowerCase()]) || (localCategoryImages && localCategoryImages.default) || 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG'
              }))
              aiFetched = true
              setTerminalLogs(logs => [...logs, `Successfully cataloged ${compiledSpots.length} tailored cultural locations!`])
            }
          } catch (jsonErr) {
            console.warn("AI itinerary JSON parsing failed, using catalog:", jsonErr)
          }
        }
      }
    } catch (aiErr) {
      console.error("AI itinerary compilation failed:", aiErr)
    }

    if (!aiFetched && localCatalog) {
      setTerminalLogs(logs => [...logs, "Archival server offline. Compiling itinerary from local heritage database..."])
      const filtered = localCatalog.filter(s => selectedMoods.includes(s.mood) && s.id !== 'airport-arrival' && s.id !== 'airport-departure')
      compiledSpots = filtered.map((item, idx) => {
        const targetDay = (idx % duration) + 1
        return {
          ...item,
          day: targetDay,
          pathGuide: tier === 'Wandering' ? item.budgetGuide : item.premiumGuide,
          pathCost: tier === 'Wandering' ? item.budgetCost : item.premiumCost
        }
      })
      setTerminalLogs(logs => [...logs, `Retrieved ${compiledSpots.length} authentic stops from catalog.`])
    }

    // Append Airport arrival & departures automatically
    if (localCatalog) {
      const arrivalSpot = localCatalog.find(s => s.id === 'airport-arrival')
      const departureSpot = localCatalog.find(s => s.id === 'airport-departure')
      
      if (arrivalSpot) {
        compiledSpots.push({
          ...arrivalSpot,
          day: 1,
          pathGuide: tier === 'Wandering' ? arrivalSpot.budgetGuide : arrivalSpot.premiumGuide,
          pathCost: tier === 'Wandering' ? arrivalSpot.budgetCost : arrivalSpot.premiumCost
        })
      }
      if (departureSpot) {
        compiledSpots.push({
          ...departureSpot,
          day: duration,
          pathGuide: tier === 'Wandering' ? departureSpot.budgetGuide : departureSpot.premiumGuide,
          pathCost: tier === 'Wandering' ? departureSpot.budgetCost : departureSpot.premiumCost
        })
      }
    }

    // Sort spots by day, keeping arrival at start of Day 1 and departure at end of final day
    const sorted = compiledSpots.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      if (a.id === 'airport-arrival') return -1
      if (b.id === 'airport-arrival') return 1
      if (a.id === 'airport-departure') return 1
      if (b.id === 'airport-departure') return -1
      return 0
    })

    setItinerarySpots(sorted)
    setContentLoaded(true)
    setTerminalLogs(logs => [...logs, "Travel blueprint fully loaded! Welcome to Bahrain."])
  }, [selectedMoods, duration, tier, setItinerarySpots])

  // Terminal compilation cycle
  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) {
        setTerminalLogs([guidePhrases[0]])
      }
    })

    let phraseIdx = 1
    intervalRef.current = setInterval(() => {
      if (active) {
        if (phraseIdx < guidePhrases.length - 1) {
          setTerminalLogs(logs => [...logs, guidePhrases[phraseIdx]])
          phraseIdx++
          if (phraseIdx === 2) {
            compileItinerary()
          }
        } else {
          clearInterval(intervalRef.current)
          setLogsComplete(true)
        }
      }
    }, 120)

    return () => {
      active = false
      clearInterval(intervalRef.current)
    }
  }, [compileItinerary])

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs])

  useEffect(() => {
    if (logsComplete && contentLoaded) {
      queueMicrotask(() => setShowPreviewOverview(true))
    }
  }, [logsComplete, contentLoaded])

  // Group spots by day for rendering
  const spotsByDay = {}
  itinerarySpots.forEach(spot => {
    const d = spot.day || 1
    if (!spotsByDay[d]) spotsByDay[d] = []
    spotsByDay[d].push(spot)
  })
  const sortedDays = Object.keys(spotsByDay).sort((a, b) => Number(a) - Number(b))

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 ${
        showPreviewOverview ? 'bg-[var(--color-surface)]' : 'wood-desk-backdrop'
      }`}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-screenEntry { animation: fadeIn 0.6s ease forwards; }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.12);
          border-radius: 99px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.22);
        }
      `}</style>

      {showPreviewOverview ? (
        <div ref={contentRef} className="w-full h-full flex flex-col relative animate-screenEntry bg-[var(--color-surface)] text-[var(--color-text)]">
          
          {/* Editorial Header Banner */}
          <div 
            className="w-full shrink-0 relative overflow-hidden pb-6 pt-10 px-6 border-b-[3px]" 
            style={{ 
              background: 'var(--color-primary)', 
              borderColor: 'var(--color-accent)',
              boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.08)'
            }}
          >
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
            />

            <div className="max-w-3xl mx-auto flex flex-col text-center md:text-left md:flex-row md:justify-between md:items-end gap-4 relative z-10">
              <div>
                <span className="text-overline block" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>PREVIEW ITINERARY</span>
                <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1 text-white leading-tight">Your Custom Passage</h1>
                <span className="font-serif text-body italic text-white/85 block mt-1">
                  Tailored to your selected vibes and budget tier
                </span>
              </div>
              <div 
                className="shrink-0 font-mono text-caption text-white/90 bg-white/10 border border-white/25 px-3 py-2 rounded-full inline-flex items-center gap-2 self-center select-none backdrop-blur-xs"
                aria-label={`${itinerarySpots.length} stops across ${duration} days`}
              >
                <span><span aria-hidden="true">📍</span> {itinerarySpots.length} Stops</span>
                <span className="opacity-35">•</span>
                <span><span aria-hidden="true">📅</span> {duration} Day{duration > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Scrollable Content Feed */}
          {itinerarySpots.length === 0 ? (
            <div 
              className="flex-1 flex flex-col justify-center items-center text-center p-8 text-[var(--color-text)]"
              style={{ background: 'var(--color-surface)' }}
            >
              <BookOpen size={40} className="text-[var(--color-text-faint)] mb-4" aria-hidden="true" />
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">No Stops Selected</h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-[280px] mb-6 leading-relaxed">
                You have removed all stops. Please go back to align your vibes and rebuild your itinerary!
              </p>
              <button
                onClick={() => {
                  playClick(0.85)
                  if (onBack) onBack()
                }}
                className="btn-primary cursor-pointer"
              >
                Adjust Vibes
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-6 py-6 space-y-8 scrollbar-thin">
              {sortedDays.map((dayNum) => {
                const daySpots = spotsByDay[dayNum] || []
                return (
                  <div key={dayNum} className="space-y-4">
                    
                    {/* Day Divider Header */}
                    <div className="flex items-center gap-3 select-none">
                      <span
                        className="text-overline px-3 py-1 rounded-full border"
                        style={{
                          color: 'var(--color-accent)',
                          background: 'rgba(184,134,11,0.1)',
                          borderColor: 'rgba(184,134,11,0.25)',
                        }}
                      >
                        Day {dayNum}
                      </span>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-stone-200 to-transparent" />
                    </div>

                    {/* Spot Cards List */}
                    <div className="space-y-3">
                      {daySpots.map((spot, idx) => {
                        const isExpanded = !!expandedSpots[spot.id]
                        const isAirport = spot.id === 'airport-arrival' || spot.id === 'airport-departure'
                        return (
                          <div 
                            key={spot.id + idx}
                            className="w-full rounded-2xl border transition-all duration-300 overflow-hidden"
                            style={{
                              background: isExpanded ? '#ffffff' : 'rgba(255, 255, 255, 0.75)',
                              borderColor: isExpanded ? 'var(--color-primary)' : 'var(--color-border-light)',
                              boxShadow: isExpanded ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                            }}
                          >
                            {/* Main Row */}
                            <div 
                              onClick={() => toggleSpotExpand(spot.id)}
                              className="flex items-center gap-4 p-4 cursor-pointer select-none"
                            >
                              {/* Thumbnail */}
                              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative border border-[var(--color-border-light)]" style={{ background: 'var(--color-surface-2)' }}>
                                <img
                                  src={spot.image || 'https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_Fort_March_2015.JPG'}
                                  alt={spot.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('hidden') }}
                                />
                                <div className="absolute inset-0 hidden flex items-center justify-center bg-stone-100">
                                  <span className="text-xl">{spot.keepsakeEmoji || '📍'}</span>
                                </div>
                              </div>

                              {/* Center Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-overline text-[var(--color-text-muted)] uppercase tracking-wider">
                                    {spot.period || 'Ancient Era'}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                                  <span className="text-overline uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
                                    {spot.category || 'culture'}
                                  </span>
                                </div>
                                <h3 className="font-serif text-body-lg font-bold text-[var(--color-text)] mt-1 truncate flex items-center gap-1.5">
                                  {(() => {
                                    const IconComponent = CATEGORY_ICONS[spot.category?.toLowerCase()] || CATEGORY_ICONS.default
                                    return <IconComponent size={13} className="shrink-0" strokeWidth={1.75} style={{ color: 'var(--color-accent)' }} />
                                  })()}
                                  <span className="truncate">{spot.name}</span>
                                </h3>
                                <p className="font-serif text-body italic mt-1 truncate" style={{ color: 'var(--color-primary)' }}>
                                  {spot.arabic}
                                </p>
                              </div>

                              {/* Actions / Expand State */}
                              <div className="flex items-center gap-3 shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                
                                {/* Remove Stop Button (Disabled for Airport checkpoints to preserve route stability) */}
                                {!isAirport && (
                                  <button
                                    onClick={() => {
                                      playClick(0.75)
                                      const remaining = itinerarySpots.filter(s => s.id !== spot.id)
                                      setItinerarySpots(remaining)
                                    }}
                                    className="p-2 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition-all cursor-pointer active:scale-95"
                                    title="Remove Stop"
                                    aria-label="Remove stop"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}

                                {/* Toggle Accordion Button */}
                                <button
                                  onClick={() => toggleSpotExpand(spot.id)}
                                  aria-label={isExpanded ? 'Collapse stop details' : 'Expand stop details'}
                                  aria-expanded={isExpanded}
                                  className="p-2 rounded-full bg-stone-50 hover:bg-stone-100 border border-stone-200 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-all cursor-pointer active:scale-95"
                                >
                                  {isExpanded ? <ChevronUp size={13} aria-hidden="true" /> : <ChevronDown size={13} aria-hidden="true" />}
                                </button>

                              </div>
                            </div>

                            {/* Expandable Accordion Panel */}
                            {isExpanded && (
                              <div className="border-t border-[var(--color-border-light)] p-4 space-y-4 bg-[var(--color-surface-2)]/40 animate-fadeIn">
                                
                                {/* Guide Plan Details */}
                                <div className="space-y-1">
                                  <span className="text-overline block" style={{ color: 'var(--color-accent)' }}>
                                    Guide Plan
                                  </span>
                                  <p className="font-serif text-body text-[var(--color-text)] leading-relaxed">
                                    {spot.pathGuide || spot.desc}
                                  </p>
                                </div>

                                {/* What to See */}
                                {spot.simpleTerms && (
                                  <div className="space-y-1 pt-2 border-t border-[var(--color-border-light)]">
                                    <span className="text-overline text-[var(--color-text-muted)] block">
                                      What to See
                                    </span>
                                    <p className="font-serif text-body text-[var(--color-text-muted)] leading-relaxed">
                                      {spot.simpleTerms}
                                    </p>
                                  </div>
                                )}

                                {/* Extra details (cost, coords) */}
                                <div className="flex justify-between items-center pt-2 border-t border-[var(--color-border-light)] text-[10px] font-mono">
                                  <span className="text-caption font-mono font-semibold" style={{ color: 'var(--color-accent)' }}>
                                    Est. Cost: {spot.pathCost || 'Free Entry'}
                                  </span>
                                  <span className="font-mono text-overline text-[var(--color-text-faint)]">
                                    {spot.coords}
                                  </span>
                                </div>

                              </div>
                            )}

                          </div>
                        )
                      })}
                    </div>

                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Footer Actions (Sticky) */}
          <div className="w-full shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-md py-5 px-6">
            <div className="max-w-3xl mx-auto flex justify-center gap-4">
              <button
                onClick={() => {
                  playClick(0.85)
                  if (onBack) onBack()
                }}
                className="px-6 py-3 rounded-full bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border)] text-[var(--color-text)] text-caption font-semibold tracking-wide transition-all active:scale-95 cursor-pointer"
              >
                ❮ Adjust Vibes
              </button>
              
              <button
                disabled={sealing || itinerarySpots.length === 0}
                onClick={() => {
                  if (sealing || itinerarySpots.length === 0) return
                  setConfirmOpen(true)
                }}
                className={`btn-primary flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${itinerarySpots.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <BookOpen size={13} className="text-white" />
                <span>{sealing ? 'Confirming...' : 'Confirm & Start Journey'}</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* LOADING STAGE */
        <div className="relative w-full max-w-md md:max-w-xl rounded-2xl overflow-hidden border border-neutral-200/50 shadow-xl min-h-[360px] flex flex-col justify-center items-center p-8 select-none space-y-6" style={{ background: 'var(--color-surface)' }}>
          <div className="w-20 h-20 rounded-full border border-dashed flex items-center justify-center relative bg-white/50" style={{ borderColor: 'rgba(193,18,47,0.3)' }}>
            <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-75" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" style={{ animation: 'spin 10s linear infinite' }}>
              <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="16" />
              <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
            </svg>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-overline text-[var(--color-text-faint)]">
              Kingdom of Bahrain
            </p>
            <h3 className="text-title text-[var(--color-text)]">
              Building your route...
            </h3>
          </div>
          
          <div className="w-full max-w-[200px] bg-neutral-200 h-1 rounded-full overflow-hidden relative">
            <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(100, (terminalLogs.length / guidePhrases.length) * 100)}%`, background: 'var(--color-primary)' }} />
          </div>
          
          <button
            onClick={handleSkipCuration}
            className="font-sans text-caption font-semibold cursor-pointer active:scale-95 transition-all hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Skip →
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-neutral-100">
            <h4 className="text-title text-[var(--color-text)]">Ready to begin your journey?</h4>
            <p className="text-body text-[var(--color-text-muted)] leading-relaxed">
              Confirming will seal your initial itinerary and unlock your digital travel journal. You can adjust settings or regenerate your trip at any time.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  playClick(0.85);
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl border text-caption font-medium hover:bg-[var(--color-surface-2)] active:scale-95 transition-all"
                style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setSealing(true);
                  playClick(1.6);
                  const stampSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
                  stampSfx.volume = 0.25 * (soundVolume || 1);
                  stampSfx.play().catch(() => {});
                  
                  if (contentRef.current) {
                    contentRef.current.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    contentRef.current.style.opacity = '0';
                    contentRef.current.style.transform = 'scale(1.05)';
                  }
                  setTimeout(() => {
                    setStep(5);
                    setSealing(false);
                  }, 550);
                }}
                className="btn-primary px-5 py-2 hover:scale-105 active:scale-95 transition-all"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
