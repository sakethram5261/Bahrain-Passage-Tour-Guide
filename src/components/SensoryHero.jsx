import { useRef, useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const guidePhrases = [
  `Greetings wayfarer! Your local guide deck is assembling...`,
  `Merchant Jafar is curating aromatic souq spices for Day 1...`,
  `Priestess Ninsun is matching Dilmun temple relics with historical records...`,
  `Architect Al-Farsi is outlining coastal fort maps in Muharraq...`,
  `Scanning Jarada disappearing island marine sandbar low-tide coordinates...`,
  `Syncing local sea taxi and boat ferry timetables from Sitra port...`,
  `Optimizing desert walking paths to avoid Sakhir desert midday heat...`,
  `Confirming fresh Arabic coffee dallah balances at Haji's Traditional Cafe...`,
  `Aligning custom entry visa seals in your travel passport...`,
  `Guide alignment fully calibrated. Click below to unroll your ledger leaves!`
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

  // Swipe-to-delete variables and handlers
  const [swipeOffsets, setSwipeOffsets] = useState({})
  const [activePointerIdState, setActivePointerIdState] = useState(null)
  const pointerStartX = useRef(0)
  const activePointerId = useRef(null)

  const handlePointerDown = (e, index) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.pointer-events-auto')) return
    if (e.button !== undefined && e.button !== 0) return
    pointerStartX.current = e.clientX
    activePointerId.current = e.pointerId
    setActivePointerIdState(e.pointerId)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (err) {}
  };

  const handlePointerMove = (e, index) => {
    if (activePointerId.current !== e.pointerId) return
    const diffX = e.clientX - pointerStartX.current
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
    } catch (err) {}

    const offset = swipeOffsets[index] || 0
    if (Math.abs(offset) > 140) {
      playTypewriterClick(0.75)
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

  const playTypewriterClick = useCallback((pitchMultiplier = 1.0) => {
    if (soundMuted) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      const filter = audioCtx.createBiquadFilter()
      
      osc.type = 'sine'
      const startFreq = 1150 * pitchMultiplier
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.04)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(500, audioCtx.currentTime)
      filter.Q.setValueAtTime(5, audioCtx.currentTime)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.12 * soundVolume, audioCtx.currentTime + 0.003) 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.035) 
      
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc.start()
      osc.stop(audioCtx.currentTime + 0.04)
    } catch { /* ignore */ }
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
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/75/BabAlBahrain1.jpg',
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

    const interval = setInterval(() => {
      if (active) {
        const next = activeLogIndex + 1
        if (next < guidePhrases.length) {
          playTypewriterClick(1.0 + Math.random() * 0.25)
          setTerminalLogs(logs => [...logs, guidePhrases[next]])
          activeLogIndex = next
        } else {
          clearInterval(interval)
          setLogsComplete(true)
        }
      }
    }, 450)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [coverOpened, playTypewriterClick])

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
        .swiper-pagination-bullet { background: rgba(255,255,255,0.5); }
        .swiper-pagination-bullet-active { background: #BA0C2F; }
        .swiper-button-next, .swiper-button-prev { color: rgba(255,255,255,0.8); }
        .swiper-button-next:hover, .swiper-button-prev:hover { color: #fff; transform: scale(1.1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-screenEntry { animation: fadeIn 0.8s ease forwards; }
      `}</style>

      {showPreviewOverview ? (
        <div ref={contentRef} className="w-full h-full relative animate-screenEntry">
          {itinerarySpots.length === 0 ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 bg-[#1a1210] text-white">
              <span className="text-5xl animate-bounce mb-4">📍</span>
              <h3 className="font-serif text-2xl font-bold text-[#ffb5c2] mb-2">Ledger is Empty</h3>
              <p className="font-sans text-xs text-white/60 max-w-[280px] mb-6 leading-relaxed">
                You have removed all stops from your travel path. Please go back to align your vibes and rebuild your itinerary!
              </p>
              <button
                onClick={() => {
                  playTypewriterClick(0.85)
                  if (onBack) onBack()
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#BA0C2F] to-[#8A0A22] text-white font-sans text-xs uppercase tracking-widest font-black cursor-pointer active:scale-95 transition-all"
              >
                🔄 Adjust Vibes
              </button>
            </div>
          ) : (
            <>
              <Swiper
                direction={'vertical'}
                grabCursor={true}
                slidesPerView={1}
                speed={700}
                resistanceRatio={0.85}
                mousewheel={{
                  sensitivity: 0.85,
                  releaseOnEdges: true,
                  thresholdDelta: 25,
                  thresholdTime: 60
                }}
                keyboard={{
                  enabled: true,
                }}
                pagination={{ clickable: true, dynamicBullets: true }}
                modules={[Pagination, Mousewheel]}
                className="w-full h-full"
                onSlideChange={(swiper) => {
                  playTypewriterClick(1.0)
                  setIsAtEnd(swiper.isEnd)
                }}
                onReachEnd={() => setIsAtEnd(true)}
              >
                {itinerarySpots.map((spot, i) => (
                  <SwiperSlide 
                    key={spot.id + i}
                    className="w-full h-full overflow-hidden"
                  >
                    <div 
                      className="w-full h-full relative select-none cursor-grab active:cursor-grabbing touch-pan-y"
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
                      
                      <img
                        src={spot.image || 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG'}
                        alt={spot.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#1a1210]/95 via-[#1a1210]/60 to-[#BA0C2F]/80" />

                      <div className="absolute inset-0 flex flex-col justify-between items-center py-16 px-6 max-w-4xl mx-auto text-white h-full pointer-events-none">
                        
                        <div className="w-full flex justify-between items-start mt-8">
                           <div className="flex flex-col text-left">
                            <span className="font-mono text-xs md:text-sm tracking-[0.25em] text-white/80 uppercase font-black drop-shadow-md">
                              DAY {spot.day || 1} • {spot.period}
                            </span>
                            <h2 className="font-serif text-3xl md:text-5xl lg:text-7xl font-black tracking-tight leading-tight mt-2 text-white drop-shadow-2xl">
                              {spot.keepsakeEmoji || '📍'} {spot.name}
                            </h2>
                            <span className="font-serif text-xl md:text-3xl italic text-[#ffb5c2] drop-shadow-xl font-semibold mt-2">
                              {spot.arabic}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              playTypewriterClick(0.75)
                              const remaining = itinerarySpots.filter((_, sIdx) => sIdx !== i)
                              setItinerarySpots(remaining)
                            }}
                            className="pointer-events-auto shrink-0 px-4.5 py-2.5 rounded-full bg-red-500/15 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-200 hover:text-white font-sans text-[10px] uppercase tracking-widest font-black transition-all duration-300 backdrop-blur-md cursor-pointer active:scale-95 shadow-md flex items-center gap-1.5 z-50"
                          >
                            🗑️ Remove Stop
                          </button>
                        </div>

                        <div className="w-full mt-auto space-y-6 mb-16 pointer-events-auto">
                          {/* Integrated Details Panel */}
                          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner">
                            <span className="font-sans text-[10px] tracking-[0.15em] text-white/50 uppercase font-black block mb-2">
                              🗺️ Curated Local Guide Plan
                            </span>
                            <p className="font-serif text-[14px] leading-relaxed text-white font-medium">
                              {spot.pathGuide}
                            </p>
                            
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="font-sans text-[11px] tracking-[0.12em] text-emerald-400 uppercase font-black">
                                💰 {spot.pathCost || spot.budgetCost || 'Free Entry'}
                              </span>
                              <span className="font-mono text-[9px] text-white/40 tracking-wider">
                                {spot.coords}
                              </span>
                            </div>
                          </div>

                          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/5">
                            <span className="font-sans text-[9px] tracking-[0.15em] text-amber-500 uppercase font-black block mb-1">
                              🔍 What You Can Find Here
                            </span>
                            <p className="font-serif text-[12px] text-white/90 leading-relaxed font-semibold">
                              {spot.simpleTerms}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Gesture Guidance Tip */}
                      <div className="absolute bottom-[80px] left-0 right-0 text-center pointer-events-none z-30 select-none">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[8.5px] font-sans font-extrabold tracking-widest text-white/60 uppercase animate-pulse">
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
                    playTypewriterClick(0.85)
                    if (onBack) onBack()
                  }}
                  className="pointer-events-auto px-6 py-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider transition-all active:scale-95"
                >
                  ❮ Back
                </button>
                
                <button
                  disabled={sealing}
                  onClick={() => {
                    if (sealing) return
                    setSealing(true)
                    playTypewriterClick(1.6)
                    const stampSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav')
                    stampSfx.volume = 0.25 * (soundVolume || 1)
                    stampSfx.play().catch(() => {})
                    
                    if (contentRef.current) {
                      contentRef.current.style.transition = 'opacity 0.5s ease, transform 0.5s ease'
                      contentRef.current.style.opacity = '0'
                      contentRef.current.style.transform = 'scale(1.05)'
                    }
                    setTimeout(() => {
                      setStep(5)
                      setSealing(false)
                    }, 550)
                  }}
                  className={`pointer-events-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#BA0C2F] to-[#8A0A22] text-white font-sans text-xs uppercase tracking-widest font-black flex items-center gap-2 border border-red-400/20 shadow-[0_10px_30px_rgba(186,12,47,0.4)] transition-all hover:scale-105 active:scale-95 ${!isAtEnd ? 'opacity-90' : 'animate-pulse'}`}
                >
                  <span>{sealing ? '⏳' : '📜'}</span>
                  <span>{sealing ? 'Sealing...' : 'Confirm Chronicle'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* LOADING STAGE */
        <div className="relative w-full max-w-md md:max-w-5xl rounded-[28px] overflow-hidden bg-[#FAF9F6] shadow-2xl min-h-[460px] grid grid-cols-1 md:grid-cols-2">
          
          <div className="p-8 flex flex-col justify-center items-center text-center select-none space-y-6">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#A80D27]/25 flex items-center justify-center relative bg-white/40">
              <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-75" fill="none" stroke="#A80D27" strokeWidth="1.2" style={{ animation: 'spin 12s linear infinite' }}>
                <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r="16" />
                <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
              </svg>
              <span className="absolute text-xl" style={{ animation: 'pulse 3s infinite' }}>🧭</span>
            </div>

            <div className="space-y-2">
              <p className="font-sans text-[9px] tracking-[0.4em] uppercase font-bold text-[#A80D27]">
                مملكة البحرين
              </p>
              <h3 className="font-serif text-2xl font-black text-[#2A2321]">
                Curating Your Passage
              </h3>
            </div>
            
            <div className="w-full max-w-[200px] bg-red-500/10 h-1.5 rounded-full overflow-hidden relative">
              <div className="h-full bg-[#A80D27] rounded-full animate-pulse w-3/4" />
            </div>
          </div>

          <div className="hidden md:flex p-8 flex-col relative text-left h-full border-l border-red-500/10 bg-[#FCFBF8]">
            <span className="font-sans text-[8px] tracking-[0.25em] text-[#A80D27] uppercase font-bold mb-4">
              Live Curation Log
            </span>
            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] text-[#5C5451]">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className={`flex items-start gap-2 ${idx === terminalLogs.length - 1 ? 'text-[#A80D27] font-bold' : 'opacity-70'}`}>
                  <span>❯</span><span>{log}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
