import { useRef, useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Pagination } from 'swiper/modules'
import { Trash2, BookOpen } from 'lucide-react'
import { playTypewriterClick } from '../services/audioUtils'
import 'swiper/css'
import 'swiper/css/pagination'

const guidePhrases = [
  `Assembling your personalized guide...`,
  `Selecting points of interest for Day 1...`,
  `Loading historical details and background info...`,
  `Mapping coastal forts in Muharraq...`,
  `Checking tide conditions for Jarada Island...`,
  `Retrieving transport options and ferry schedules...`,
  `Optimizing walking routes for the day...`,
  `Getting recommendations for local cafes...`,
  `Preparing your custom travel passport...`,
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

  const [coverOpened] = useState(true)
  const [showPreviewOverview, setShowPreviewOverview] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [logsComplete, setLogsComplete] = useState(false)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [sealing, setSealing] = useState(false) 
  const [isAtEnd, setIsAtEnd] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Swipe-to-delete variables and handlers
  const [swipeOffsets, setSwipeOffsets] = useState({})
  const [activePointerIdState, setActivePointerIdState] = useState(null)
  const pointerStartX = useRef(0)
  const activePointerId = useRef(null)
  const intervalRef = useRef(null)

  const handleSkipCuration = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    setTerminalLogs(guidePhrases)
    setLogsComplete(true)
    setShowPreviewOverview(true)
  }

  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)
  const swipeActivated = useRef(false)

  const handlePointerDown = (e, _index) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.pointer-events-auto')) return
    if (e.button !== undefined && e.button !== 0) return
    swipeStartX.current = e.clientX
    swipeStartY.current = e.clientY
    swipeActivated.current = false
    pointerStartX.current = e.clientX
    activePointerId.current = e.pointerId
    setActivePointerIdState(e.pointerId)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch { /* ignore */ }
  };

  const handlePointerMove = (e, index) => {
    if (activePointerId.current !== e.pointerId) return
    const diffX = e.clientX - pointerStartX.current
    const diffY = e.clientY - swipeStartY.current
    if (!swipeActivated.current && Math.abs(diffY) > Math.abs(diffX) * 2) {
      return
    }
    if (Math.abs(diffX) > 20) swipeActivated.current = true
    if (!swipeActivated.current) return
    setSwipeOffsets(prev => ({
      ...prev,
      [index]: diffX
    }))
  };

  const handlePointerUp = (e, index) => {
    if (activePointerId.current !== e.pointerId) return
    activePointerId.current = null
    setActivePointerIdState(null)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch { /* ignore */ }

    if (!swipeActivated.current) {
      setSwipeOffsets(prev => ({ ...prev, [index]: 0 }))
      return
    }

    const offset = swipeOffsets[index] || 0
    if (Math.abs(offset) > 140) {
      playClick(0.75)
      setSwipeOffsets(prev => ({
        ...prev,
        [index]: offset > 0 ? window.innerWidth : -window.innerWidth
      }))
      setTimeout(() => {
        const remaining = itinerarySpots.filter((_, sIdx) => sIdx !== index)
        setItinerarySpots(remaining)
        setSwipeOffsets(prev => {
          const next = { ...prev }
          delete next[index]
          return next
        })
      }, 250)
    } else {
      setSwipeOffsets(prev => ({
        ...prev,
        [index]: 0
      }))
    }
  };

  const contentRef = useRef(null)
  const logsEndRef = useRef(null)

  const playClick = useCallback((pitchMultiplier = 1.0) => {
    playTypewriterClick(pitchMultiplier, soundVolume, soundMuted)
  }, [soundMuted, soundVolume])

  const compileItinerary = useCallback(async () => {
    let compiledSpots = []
    let localCatalog = null
    try {
      const itineraryModule = await import('../hooks/useItinerary')
      if (itineraryModule && itineraryModule.spotsCatalog) {
        localCatalog = itineraryModule.spotsCatalog
      }
    } catch (importErr) {
      console.error("Dynamic catalog chunk load protected:", importErr)
    }

    try {
      if (localCatalog && Array.isArray(localCatalog)) {
        const filtered = localCatalog.filter(s => selectedMoods && selectedMoods.includes(s.mood) && s.id !== 'airport-arrival' && s.id !== 'airport-departure')
        compiledSpots = filtered.map((item, idx) => {
          const targetDay = (idx % (duration || 1)) + 1
          return {
            ...item,
            day: targetDay,
            pathGuide: tier === 'Wandering' ? item.budgetGuide : item.premiumGuide,
            pathCost: tier === 'Wandering' ? item.budgetCost : item.premiumCost
          }
        })

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
            day: duration || 1,
            pathGuide: tier === 'Wandering' ? departureSpot.budgetGuide : departureSpot.premiumGuide,
            pathCost: tier === 'Wandering' ? departureSpot.budgetCost : departureSpot.premiumCost
          })
        }
      }
    } catch (catalogErr) {
      console.error("Catalog filtering error handled safely:", catalogErr)
    }

    if (!compiledSpots || compiledSpots.length === 0) {
      compiledSpots = [{
        id: 'emergency-fallback-gate',
        name: 'Bab Al Bahrain',
        arabic: 'باب البحرين',
        mood: 'empires',
        coords: '26.2361° N, 50.5772° E',
        period: '1949 Modern Era',
        desc: 'The historic gateway to the Manama Souq.',
        simpleTerms: 'A beautiful historical archway marking the entrance to the old city bazaar.',
        insider: 'Grab a fresh hot chai from the local market stalls right behind the gate area.',
        pathGuide: 'Walk through the grand archway directly into the historical souq alleys.',
        pathCost: 'Free Entry',
        image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Manama_Bab_al-Bahrain_Souq_1.jpg',
        day: 1
      }]
    }

    compiledSpots.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      if (a.id === 'airport-arrival') return -1
      if (b.id === 'airport-arrival') return 1
      if (a.id === 'airport-departure') return 1
      if (b.id === 'airport-departure') return -1
      return 0
    })
    
    queueMicrotask(() => {
      setItinerarySpots(compiledSpots)
      setContentLoaded(true)
    })
  }, [selectedMoods, duration, tier, setItinerarySpots])

  useEffect(() => {
    if (coverOpened) compileItinerary()
  }, [coverOpened, compileItinerary])

  useEffect(() => {
    if (!coverOpened) return
    let active = true
    let activeLogIndex = 0
    queueMicrotask(() => {
      setTerminalLogs([guidePhrases[0]])
    })

    intervalRef.current = setInterval(() => {
      if (active) {
        const next = activeLogIndex + 1
        if (next < guidePhrases.length) {
          playClick(1.0 + Math.random() * 0.25)
          setTerminalLogs(logs => [...logs, guidePhrases[next]])
          activeLogIndex = next
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
  }, [coverOpened, playClick])

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs])

  useEffect(() => {
    if (logsComplete && contentLoaded) {
      queueMicrotask(() => setShowPreviewOverview(true))
    }
  }, [logsComplete, contentLoaded])

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-colors duration-700 ${
        showPreviewOverview ? 'bg-[#1a1210]' : 'wood-desk-backdrop'
      }`}
    >
      <style>{`
        .swiper-pagination-vertical {
          right: 18px !important;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .swiper-pagination-bullet {
          width: 7px !important;
          height: 7px !important;
          background: rgba(255, 255, 255, 0.45) !important;
          opacity: 0.65 !important;
          border-radius: 99px !important;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .swiper-pagination-bullet-active {
          width: 7px !important;
          height: 26px !important;
          background: #D4AF37 !important;
          opacity: 1 !important;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.75);
        }
        .swiper-button-next, .swiper-button-prev { color: rgba(255,255,255,0.8); }
        .swiper-button-next:hover, .swiper-button-prev:hover { color: #fff; transform: scale(1.1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-screenEntry { animation: fadeIn 0.8s ease forwards; }
      `}</style>

      {showPreviewOverview ? (
        <div ref={contentRef} className="w-full h-full relative animate-screenEntry">
          {itinerarySpots.length === 0 ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 bg-[#1C1917] text-white">
              <BookOpen size={40} className="text-white/30 mb-4" />
              <h3 className="font-serif text-2xl font-bold text-white mb-2">No Stops Selected</h3>
              <p className="font-sans text-xs text-white/60 max-w-[280px] mb-6 leading-relaxed">
                You have removed all stops. Please go back to align your vibes and rebuild your itinerary!
              </p>
              <button
                onClick={() => {
                  playClick(0.85)
                  if (onBack) onBack()
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C1122F] to-[#8B0D22] text-white font-sans text-xs uppercase tracking-widest font-bold cursor-pointer active:scale-95 transition-all"
              >
                Adjust Vibes
              </button>
            </div>
          ) : (
            <>
              <Swiper
                direction={'vertical'}
                grabCursor={true}
                slidesPerView={1}
                speed={550}
                resistanceRatio={0.9}
                mousewheel={{
                  sensitivity: 1.0,
                  releaseOnEdges: true,
                }}
                keyboard={{
                  enabled: true,
                }}
                pagination={{ clickable: false }}
                modules={[Pagination, Mousewheel]}
                className="w-full h-full"
                onSlideChange={(swiper) => {
                  playClick(1.0)
                  setIsAtEnd(swiper.isEnd)
                }}
                onReachEnd={() => setIsAtEnd(true)}
              >
                {itinerarySpots.map((spot, i) => (
                  <SwiperSlide 
                    key={spot.id + i}
                    className="w-full h-full overflow-hidden relative"
                  >
                    {/* Background Slide Delete Indicator */}
                    {Math.abs(swipeOffsets[i] || 0) > 10 && (
                      <div className="absolute inset-0 bg-[#3b0a11] flex items-center justify-between px-10 text-red-400 z-0">
                        <div style={{ opacity: Math.min(1, Math.abs(swipeOffsets[i] || 0) / 100) }} className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest">
                          <Trash2 size={16} /> Remove Stop
                        </div>
                        <div style={{ opacity: Math.min(1, Math.abs(swipeOffsets[i] || 0) / 100) }} className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-widest">
                          Remove Stop <Trash2 size={16} />
                        </div>
                      </div>
                    )}

                    <div 
                      className="w-full h-full relative select-none cursor-grab active:cursor-grabbing touch-pan-y z-10"
                      onPointerDown={(e) => handlePointerDown(e, i)}
                      onPointerMove={(e) => handlePointerMove(e, i)}
                      onPointerUp={(e) => handlePointerUp(e, i)}
                      onPointerCancel={(e) => handlePointerUp(e, i)}
                      style={{
                        transform: `translateX(${swipeOffsets[i] || 0}px)`,
                        opacity: 1 - Math.abs(swipeOffsets[i] || 0) / (window.innerWidth || 500),
                        transition: activePointerIdState === null ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease' : 'none'
                      }}
                    >
                      {/* Swipe Left/Right Affordance arrows */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-30 bg-black/40 backdrop-blur-sm w-7 h-7 rounded-full flex items-center justify-center text-white/60 text-xs border border-white/10 opacity-60">
                        ◀
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-30 bg-black/40 backdrop-blur-sm w-7 h-7 rounded-full flex items-center justify-center text-white/60 text-xs border border-white/10 opacity-60">
                        ▶
                      </div>
                      
                      <img
                        src={spot.image || 'https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_Fort_March_2015.JPG'}
                        alt={spot.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.classList.remove('hidden') }}
                      />
                      <div className="absolute inset-0 w-full h-full hidden flex items-center justify-center bg-gradient-to-br from-[#2A2321] to-[#1a1210]">
                        <span className="text-6xl opacity-40">{spot.keepsakeEmoji || '📍'}</span>
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1210]/95 via-[#1a1210]/60 to-[#BA0C2F]/80" />
 
                      <div className="absolute inset-0 flex flex-col justify-between items-center py-16 px-6 max-w-4xl mx-auto text-white h-full pointer-events-none">
                        
                        <div className="w-full flex justify-between items-start mt-8">
                         <div className="flex flex-col text-left max-w-[calc(100%-140px)] overflow-visible">
                             <span className="font-mono text-[10.5px] md:text-sm tracking-[0.22em] text-white/80 uppercase font-black drop-shadow-md block w-full break-words">
                               DAY {spot.day || 1} • {spot.period}
                             </span>
                             <h2 className="font-serif text-xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight mt-1 text-white drop-shadow-2xl w-full break-words">
                               {spot.keepsakeEmoji || '📍'} {spot.name}
                             </h2>
                             <span className="font-serif text-base md:text-xl italic text-[#ffb5c2] drop-shadow-xl font-semibold mt-1 w-full break-words">
                               {spot.arabic}
                             </span>
                           </div>
 
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              playClick(0.75)
                              const remaining = itinerarySpots.filter((_, sIdx) => sIdx !== i)
                              setItinerarySpots(remaining)
                            }}
                            className="pointer-events-auto shrink-0 px-4 py-2.5 rounded-full bg-red-950/45 hover:bg-red-700/80 border border-red-500/25 hover:border-red-500 text-red-200 hover:text-white font-sans text-[10px] uppercase tracking-widest font-extrabold transition-all duration-300 backdrop-blur-md cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5 z-50"
                          >
                            <Trash2 size={11} className="text-red-400" />
                            Remove Stop
                          </button>
                        </div>
 
                        <div className="w-full mt-auto space-y-5 mb-16 pointer-events-auto">
                          {/* Integrated Details Panel - Premium Dark Glassmorphism */}
                          <div 
                            className="rounded-2xl p-5 border shadow-2xl relative overflow-hidden"
                            style={{
                              background: 'linear-gradient(135deg, rgba(20, 15, 15, 0.75) 0%, rgba(10, 5, 5, 0.55) 100%)',
                              borderColor: 'rgba(212, 175, 55, 0.22)',
                              backdropFilter: 'blur(16px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            <span className="font-sans text-[9.5px] tracking-[0.18em] text-[#D4AF37] uppercase font-bold block mb-2">
                              Guide Plan
                            </span>
                            <p className="font-serif text-[13.5px] leading-relaxed text-white/90 font-medium">
                              {spot.pathGuide}
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="font-sans text-[11px] tracking-[0.12em] text-[#FFE082] uppercase font-bold">
                                {spot.pathCost || spot.budgetCost || 'Free Entry'}
                              </span>
                              <span className="font-mono text-[9px] text-white/50 tracking-wider">
                                {spot.coords}
                              </span>
                            </div>
                          </div>
 
                          {/* What You Can Find Here - Subtle Complementary Glassmorphism */}
                          <div 
                            className="rounded-xl p-4 border"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                              borderColor: 'rgba(255, 255, 255, 0.08)',
                              backdropFilter: 'blur(12px)',
                              WebkitBackdropFilter: 'blur(12px)',
                              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <span className="font-sans text-[8.5px] tracking-[0.18em] text-white/60 uppercase font-bold block mb-1.5">
                              What to See
                            </span>
                            <p className="font-serif text-[12px] text-white/80 leading-relaxed font-semibold">
                              {spot.simpleTerms}
                            </p>
                          </div>
                        </div>
 
                      </div>
 
                      {/* Gesture Guidance Tip */}
                      <div className="absolute bottom-[90px] left-0 right-0 text-center pointer-events-none z-30 select-none">
                        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900/90 backdrop-blur-md border border-white/10 text-[11px] font-sans font-bold tracking-widest text-white uppercase">
                          <span>↔ Swipe card to remove</span>
                          <span className="opacity-30">•</span>
                          <span>↕ Scroll for next</span>
                        </div>
                      </div>
 
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
 
              {/* Floating Actions */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-50 px-6 pointer-events-none">
                <button
                  onClick={() => {
                    playClick(0.85)
                    if (onBack) onBack()
                  }}
                  className="pointer-events-auto px-6 py-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider transition-all active:scale-95"
                >
                  ❮ Back
                </button>
                
                <button
                  disabled={sealing || !isAtEnd}
                  onClick={() => {
                    if (sealing || !isAtEnd) return
                    setConfirmOpen(true)
                  }}
                  className={`pointer-events-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#C1122F] to-[#8B0D22] text-white font-sans text-xs uppercase tracking-widest font-bold flex items-center gap-2 shadow-[0_10px_30px_rgba(193,18,47,0.25)] transition-all hover:scale-105 active:scale-95 ${!isAtEnd ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <BookOpen size={13} className="text-white" />
                  <span>{sealing ? 'Confirming...' : isAtEnd ? 'Confirm Itinerary' : 'Scroll to review stops'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* LOADING STAGE */
        <div className="relative w-full max-w-md md:max-w-xl rounded-2xl overflow-hidden bg-[#FAF9F6] border border-neutral-200/50 shadow-xl min-h-[360px] flex flex-col justify-center items-center p-8 select-none space-y-6">
          <div className="w-20 h-20 rounded-full border border-dashed border-[#C1122F]/30 flex items-center justify-center relative bg-white/50">
            <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-75" fill="none" stroke="#C1122F" strokeWidth="1.5" style={{ animation: 'spin 10s linear infinite' }}>
              <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
              <circle cx="50" cy="50" r="16" />
              <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
            </svg>
          </div>

          <div className="space-y-2 text-center">
            <p className="font-sans text-[8px] tracking-[0.3em] uppercase font-bold text-neutral-400">
              Kingdom of Bahrain
            </p>
            <h3 className="font-serif text-xl font-bold text-neutral-900">
              Building your route...
            </h3>
          </div>
          
          <div className="w-full max-w-[200px] bg-neutral-200 h-1 rounded-full overflow-hidden relative">
            <div className="h-full bg-[#C1122F] rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(100, (terminalLogs.length / guidePhrases.length) * 100)}%` }} />
          </div>
          
          <button
            onClick={handleSkipCuration}
            className="text-[#C1122F] hover:underline font-sans text-xs tracking-wide font-bold cursor-pointer active:scale-95 transition-all"
          >
            Skip →
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 border border-neutral-100">
            <h4 className="font-serif text-xl font-bold text-neutral-900">Ready to begin your journey?</h4>
            <p className="font-sans text-xs text-neutral-500 leading-relaxed">
              Confirming will seal your initial itinerary and unlock your digital travel journal. You can adjust settings or regenerate your trip at any time.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  playClick(0.85);
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-neutral-600 border border-neutral-200 text-xs font-bold hover:bg-neutral-50 active:scale-95 transition-all"
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C1122F] to-[#8B0D22] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
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
