import { useRef, useState, useEffect } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { fetchAICuratedItinerary } from '../services/openrouter'
import { spotsCatalog } from '../hooks/useItinerary'

export default function SensoryHero() {
  const { 
    setStep, 
    selectedMoods, 
    tier, 
    setTier, 
    duration, 
    setDuration, 
    pace, 
    setPace, 
    setAiItinerary,
    itinerarySpots,
    setItinerarySpots,
    soundVolume,
    soundMuted,
    resetChronicle,
    systemTime,
  } = useVibe()

  const [animating, setAnimating] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [coverOpened, setCoverOpened] = useState(true)
  const [showPreviewOverview, setShowPreviewOverview] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [activeLogIndex, setActiveLogIndex] = useState(0)
  const [logsComplete, setLogsComplete] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [sealing, setSealing] = useState(false) // Issue 13: loading state for seal button

  // Swipe gesture tracking references
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  // Carousel item switching handlers
  const handleNextSpot = () => {
    if (itinerarySpots.length === 0) return
    playTypewriterClick(1.05)
    setCarouselIndex((prev) => (prev + 1) % itinerarySpots.length)
  }

  const handlePrevSpot = () => {
    if (itinerarySpots.length === 0) return
    playTypewriterClick(0.95)
    setCarouselIndex((prev) => (prev - 1 + itinerarySpots.length) % itinerarySpots.length)
  }

  // Touch handlers for direct swipe interaction using changedTouches for bulletproof mobile swipe behavior
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX
    touchStartY.current = e.changedTouches[0].clientY
  }

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    
    const diffX = touchStartX.current - endX
    const diffY = touchStartY.current - endY
    
    const swipeThreshold = 40 // lower threshold for responsive touch feelings
    
    // Only trigger if horizontal movement is primary
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          handleNextSpot()
        } else {
          handlePrevSpot()
        }
      }
    }
  }


  // Reset image load errors when switching slides
  useEffect(() => {
    setImageError(false)
  }, [carouselIndex])

  // Bulletproof safety check to prevent carouselIndex out of bounds
  useEffect(() => {
    if (itinerarySpots.length > 0 && (carouselIndex >= itinerarySpots.length || carouselIndex < 0)) {
      setCarouselIndex(0)
    }
  }, [itinerarySpots, carouselIndex])

  // systemTime now comes from global VibeProvider context (Issue 28: no duplicate setInterval)

  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const logsEndRef = useRef(null)

  // Synthesis of Typewriter mechanical key clicking sounds
  const playTypewriterClick = (pitchMultiplier = 1.0) => {
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
    } catch (e) {}
  }

  // Pre-compiled list of dynamic warm Tour Guide notes (Replacing AI jargon)
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

  // Start background compilation immediately when cover is opened
  useEffect(() => {
    if (coverOpened) {
      compileItinerary()
    }
  }, [coverOpened])

  // Compile itinerary
  const compileItinerary = async () => {
    setLoadingAI(true)
    const parsed = await fetchAICuratedItinerary(selectedMoods, tier, duration, pace)
    
    let compiledSpots = []

    if (parsed && parsed.itinerary && Array.isArray(parsed.itinerary)) {
      setAiItinerary(parsed)
      compiledSpots = parsed.itinerary.map(aiItem => {
        const catalogSpot = spotsCatalog.find(s => s.id === aiItem.id)
        if (catalogSpot) {
          return {
            ...catalogSpot,
            day: aiItem.day,
            pathGuide: tier === 'Wandering' ? catalogSpot.budgetGuide : catalogSpot.premiumGuide,
            pathCost: tier === 'Wandering' ? catalogSpot.budgetCost : catalogSpot.premiumCost
          }
        }
        return {
          id: aiItem.id || `spot-${Math.random().toString(36).substr(2, 9)}`,
          name: aiItem.name || 'Authentic Bahrain Landmark',
          arabic: aiItem.arabic || 'معلم بحريني',
          mood: aiItem.mood || 'empires',
          coords: aiItem.coords || '26.2285° N, 50.5860° E',
          period: aiItem.period || 'Ancient Era',
          desc: aiItem.desc || 'An authentic local spot full of history and heritage waiting to be discovered.',
          simpleTerms: aiItem.simpleTerms || 'A gorgeous historical landmark rich in cultural legacy.',
          insider: aiItem.insider || 'Speak to local shopkeepers nearby; they love sharing stories.',
          pathGuide: aiItem.pathGuide || 'Walk around the grounds.',
          pathCost: aiItem.pathCost || 'Free Entry',
          image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop',
          day: aiItem.day || 1
        }
      }).filter(Boolean)
    } else {
      const filtered = spotsCatalog.filter(s => selectedMoods.includes(s.mood))
      compiledSpots = filtered.map((item, idx) => {
        const targetDay = (idx % duration) + 1
        return {
          ...item,
          day: targetDay,
          pathGuide: tier === 'Wandering' ? item.budgetGuide : item.premiumGuide,
          pathCost: tier === 'Wandering' ? item.budgetCost : item.premiumCost
        }
      })
    }

    compiledSpots.sort((a, b) => a.day - b.day)
    setItinerarySpots(compiledSpots)
    setAiLoaded(true)
    setLoadingAI(false)
  }

  // Type out guide notes in real-time
  useEffect(() => {
    if (!coverOpened) return
    let active = true
    setActiveLogIndex(0)
    setTerminalLogs([guidePhrases[0]])

    const interval = setInterval(() => {
      if (active) {
        setActiveLogIndex(prev => {
          const next = prev + 1
          if (next < guidePhrases.length) {
            playTypewriterClick(1.0 + Math.random() * 0.25)
            setTerminalLogs(logs => [...logs, guidePhrases[next]])
            return next
          }
          clearInterval(interval)
          setLogsComplete(true)
          return prev
        })
      }
    }, 450)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [coverOpened])

  // Scroll terminal logs automatically
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs])

  // Transition to the card carousel overview smoothly once loading complete
  useEffect(() => {
    if (logsComplete && aiLoaded) {
      if (contentRef.current) {
        gsap.to(contentRef.current, {
          scale: 0.95,
          rotateY: 25,
          opacity: 0,
          duration: 0.5,
          ease: 'power3.in',
          onComplete: () => {
            setShowPreviewOverview(true)
            // Wait a small tick for React to swap key DOM nodes
            setTimeout(() => {
              if (contentRef.current) {
                // Clear any inline styles left over by GSAP reconciliation reuse
                gsap.set(contentRef.current, { clearProps: 'all' })
                gsap.fromTo(contentRef.current,
                  { scale: 0.95, rotateY: -25, opacity: 0 },
                  { scale: 1, rotateY: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
                )
              }
            }, 50)
          }
        })
      } else {
        setShowPreviewOverview(true)
      }
    }
  }, [logsComplete, aiLoaded])

  useEffect(() => {
    if (coverOpened && contentRef.current && !showPreviewOverview) {
      gsap.fromTo(contentRef.current,
        { rotateY: 75, opacity: 0, scale: 0.95 },
        { rotateY: 0, opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' }
      )
    }
  }, [coverOpened])

  // Calculate hands degrees for clock
  const secondsAngle = systemTime.getSeconds() * 6
  const minutesAngle = systemTime.getMinutes() * 6 + systemTime.getSeconds() * 0.1
  const hoursAngle = (systemTime.getHours() % 12) * 30 + systemTime.getMinutes() * 0.5

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center wood-desk-backdrop overflow-y-auto px-4 py-6"
    >
      <style>{`
        @keyframes rotateCompass {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGold {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(212,175,55,0.4)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(212,175,55,0.85)); }
        }
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-rotateCompass {
          animation: rotateCompass 12s linear infinite;
        }
        .animate-pulseGold {
          animation: pulseGold 3s ease-in-out infinite;
        }
        .animate-slideUpFade {
          animation: slideUpFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 1. TACTILE DESKTOP PROPS (Floats around the journal book only on desktop) */}
      {coverOpened && (
        <>
          <div className="hidden lg:block desktop-prop-quill">
            <svg viewBox="0 0 120 180" className="w-full h-auto">
              <defs>
                <linearGradient id="quillGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4a3e3d" />
                  <stop offset="60%" stopColor="#2c2120" />
                  <stop offset="100%" stopColor="#120c0c" />
                </linearGradient>
              </defs>
              <rect x="35" y="110" width="50" height="50" rx="10" fill="#1A1817" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <rect x="35" y="110" width="50" height="15" fill="rgba(193,18,47,0.3)" /> 
              <rect x="47" y="92" width="26" height="18" fill="#1C1817" />
              <ellipse cx="60" cy="92" rx="13" ry="4" fill="#3D302F" />
              <path d="M 47,100 Q 60,103 73,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" fill="none" />
              <path d="M 60,95 Q 50,60 30,15 Q 40,40 55,75 Z" fill="url(#quillGradDash)" />
              <path d="M 60,95 Q 65,55 78,10 Q 70,35 63,70 Z" fill="url(#quillGradDash)" opacity="0.9" />
              <path d="M 60,98 Q 57,60 48,12" stroke="#aa7c11" strokeWidth="1.5" fill="none" opacity="0.8" /> 
            </svg>
          </div>
          <div className="hidden lg:block desktop-prop-tea" title="Generational Cardamom Karak Tea">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="72" rx="42" ry="12" fill="none" stroke="#d4af37" strokeWidth="1.8" />
              <ellipse cx="50" cy="72" rx="42" ry="12" fill="rgba(42,35,33,0.9)" />
              <path d="M 24,42 Q 22,25 24,18 L 76,18 Q 78,25 76,42 Q 74,68 50,70 Q 26,68 24,42 Z" fill="#FAF9F6" stroke="#aa7c11" strokeWidth="1" />
              <ellipse cx="50" cy="20" rx="23" ry="5" fill="#a46d37" />
              <ellipse cx="50" cy="18" rx="26" ry="6" fill="none" stroke="#d4af37" strokeWidth="1.5" />
              <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#FAF9F6" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </div>
          <div className="hidden lg:block desktop-prop-watch" title="Nautical chronometer watch (synced to local time)">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="4" />
              <circle cx="50" cy="50" r="46" fill="rgba(42,35,33,0.95)" />
              <circle cx="50" cy="50" r="38" fill="#FAF9F6" stroke="#221c1a" strokeWidth="1.5" />
              <line x1="50" y1="50" x2="50" y2="30" stroke="#1A1412" strokeWidth="2.8" strokeLinecap="round" transform={`rotate(${hoursAngle} 50 50)`} />
              <line x1="50" y1="50" x2="50" y2="20" stroke="#3D3330" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${minutesAngle} 50 50)`} />
            </svg>
          </div>
        </>
      )}

      {/* 2. MAIN WORKSPACE CONTENT GRID */}
      {showPreviewOverview ? (
        /* STAGE 3: FULL SCREEN TACTILE DECK CAROUSEL PREVIEW OVERVIEW */
        <div 
          key="carousel-screen"
          ref={contentRef}
          className="relative w-full max-w-md mx-auto select-none animate-fadeIn flex flex-col gap-5 justify-center"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1200px',
          }}
        >
          {/* Desktop-Only absolute flanking navigation arrows */}
          {itinerarySpots.length > 1 && (
            <>
              <button
                onClick={handlePrevSpot}
                className="hidden lg:flex absolute left-[-64px] top-[40%] -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#A80D27]/18 text-[#A80D27] shadow-md hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer z-40 font-bold"
                title="Previous Stop"
              >
                ❮
              </button>
              <button
                onClick={handleNextSpot}
                className="hidden lg:flex absolute right-[-64px] top-[40%] -translate-y-1/2 w-11 h-11 items-center justify-center rounded-full bg-white border border-[#A80D27]/18 text-[#A80D27] shadow-md hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer z-40 font-bold"
                title="Next Stop"
              >
                ❯
              </button>
            </>
          )}

          {/* Floating tactile card wrapper */}
          <div
            className="relative rounded-[24px] overflow-hidden flex flex-col transition-all duration-350 border border-amber-600/30 bg-[#FAF8F5] select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              boxShadow: '0 25px 55px -12px rgba(0,0,0,0.3), 0 8px 18px -6px rgba(0,0,0,0.2)',
              touchAction: 'pan-y'
            }}
          >
            {itinerarySpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[420px]" style={{ background: '#FAF8F5' }}>
                <span className="text-4xl animate-bounce">📭</span>
                <button onClick={() => resetChronicle()} className="px-5 py-2 rounded-xl border border-red-500/25 bg-white font-sans text-[10px] uppercase tracking-widest font-black text-bahrain-red cursor-pointer">
                  🔄 Reset Settings
                </button>
              </div>
            ) : (
              (() => {
                const activeSpot = itinerarySpots[carouselIndex] || itinerarySpots[0]
                if (!activeSpot) {
                  return (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[420px]" style={{ background: '#FAF8F5' }}>
                      <span className="text-4xl animate-bounce">📭</span>
                      <button onClick={() => resetChronicle()} className="px-5 py-2 rounded-xl border border-red-500/25 bg-white font-sans text-[10px] uppercase tracking-widest font-black text-bahrain-red cursor-pointer">
                        🔄 Reset Settings
                      </button>
                    </div>
                  )
                }
                return (
                  <>
                    <div className="relative h-52 overflow-hidden bg-zinc-950 flex items-center justify-center shrink-0">
                      {!imageError ? (
                        <img 
                          src={activeSpot.image} 
                          alt={activeSpot.name} 
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover opacity-90 transition-transform duration-[1200ms] hover:scale-105" 
                        />
                      ) : (
                        /* Premium coordinate-sketch visual fallback */
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none"
                          style={{
                            background: 'radial-gradient(circle, #FAF8F5 0%, #EFEBE4 100%)',
                            borderBottom: '1px solid rgba(168,13,39,0.1)'
                          }}
                        >
                          {/* Aged graph/coordinate lines */}
                          <div className="absolute inset-0 opacity-[0.04]" style={{
                            backgroundImage: 'radial-gradient(#A80D27 1.5px, transparent 1.5px)',
                            backgroundSize: '16px 16px'
                          }} />
                          
                          {/* Vintage Compass Dial Icon */}
                          <div className="w-16 h-16 rounded-full border border-dashed border-[#A80D27]/25 flex items-center justify-center mb-2 animate-rotateCompass bg-white/20">
                            <span className="text-xl">🧭</span>
                          </div>
                          
                          <span className="font-mono text-[9px] text-[#A80D27] tracking-wider uppercase font-bold">
                            {activeSpot.coords || '26.2285° N, 50.5860° E'}
                          </span>
                          <span className="font-serif text-[10px] text-bronze-muted/60 italic mt-0.5">
                            Local Landmark Coordinates Sync
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                      <span className="absolute top-4 left-4 font-serif text-[10px] tracking-widest uppercase font-bold text-white py-1 px-3 rounded-full" style={{ background: 'linear-gradient(to right, #A80D27, #800A1E)' }}>
                        Day {activeSpot.day} Stop
                      </span>
                    </div>

                    <div className="p-6 pb-20 flex flex-col justify-between bg-[#FAF8F5] relative min-h-[260px] text-left">
                      <div>
                        <h4 
                          key={activeSpot.id}
                          className="font-serif text-xl md:text-2xl font-black text-bronze-charcoal tracking-tight leading-tight flex items-start gap-2.5 animate-slideUpFade"
                        >
                          <span className="text-2xl shrink-0">{activeSpot.keepsakeEmoji || '📍'}</span>
                          <span>{activeSpot.name}</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-serif text-xs italic text-[#A80D27] font-bold shrink-0">{activeSpot.arabic}</span>
                          <span className="h-[1px] flex-1 bg-red-500/10" />
                          <span className="font-mono text-[8px] text-bronze-muted/50 tracking-wider uppercase font-bold shrink-0">{activeSpot.period}</span>
                        </div>
                        <div className="bg-[#FCFBF8] border border-dashed border-[#A80D27]/18 rounded-xl p-4 mt-4 space-y-3 shadow-inner aged-paper-gradient">
                          <div>
                            <span className="font-sans text-[7px] tracking-[0.22em] text-[#A80D27] uppercase font-black block mb-0.5">
                              🗺️ Curated Local Guide Plan
                            </span>
                            <p className="font-serif text-[11px] leading-relaxed text-bronze-charcoal font-semibold select-text">
                              {activeSpot.pathGuide}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-red-500/5">
                            <span className="font-sans text-[7px] tracking-[0.22em] text-amber-600 uppercase font-black block mb-0.5">
                              📜 Generational Insider Secret
                            </span>
                            <p className="font-serif text-[11px] italic text-bronze-muted leading-relaxed font-bold select-text">
                              "{activeSpot.insider}"
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          playTypewriterClick(0.75)
                          const remaining = itinerarySpots.filter((_, idx) => idx !== carouselIndex)
                          setItinerarySpots(remaining)
                          if (carouselIndex >= remaining.length && remaining.length > 0) setCarouselIndex(remaining.length - 1)
                        }}
                        className="absolute bottom-5 right-5 px-3 py-1.5 rounded-lg border border-[#A80D27]/15 hover:border-[#A80D27]/35 bg-red-500/5 hover:bg-red-500/10 text-[#A80D27] font-sans text-[8.5px] uppercase tracking-wider font-extrabold cursor-pointer flex items-center gap-1 active:scale-95 z-30"
                      >
                        🗑️ Remove Stop
                      </button>
                    </div>
                  </>
                )
              })()
            )}
          </div>

          {/* Dots Indicator, Swipe Cue, & Centered Wax-Seal Proceed Action */}
          {itinerarySpots.length > 0 && (
            <div className="flex flex-col items-center gap-3 mt-1 select-none w-full animate-fadeIn shrink-0">
              {/* Dots list */}
              <div className="flex items-center gap-2">
                {itinerarySpots.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playTypewriterClick(1.0)
                      setCarouselIndex(idx)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === carouselIndex 
                        ? 'bg-[#A80D27] scale-120 shadow-sm' 
                        : 'bg-[#A80D27]/20 hover:bg-[#A80D27]/40'
                    }`}
                  />
                ))}
              </div>

              {/* Mobile Cue */}
              <span className="lg:hidden text-[9.5px] font-sans font-bold text-bronze-muted/50 tracking-wider uppercase mt-0.5">
                Swipe Card or Tap Dots to Explore
              </span>

              {/* Glowing Crimson Wax Seal Proceed Button */}
              <div className="mt-3 w-full flex justify-center">
                <button
                  disabled={sealing}
                  onClick={() => {
                    if (sealing) return
                    setSealing(true)
                    playTypewriterClick(1.6)
                    const stampSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav')
                    stampSfx.volume = 0.25 * soundVolume
                    stampSfx.play().catch(() => {})
                    
                    gsap.to(contentRef.current, {
                      scale: 0.94,
                      opacity: 0,
                      y: 15,
                      duration: 0.55,
                      ease: 'power3.inOut',
                      onComplete: () => {
                        setStep(5) // Transition to Dashboard
                        setSealing(false)
                      }
                    })
                  }}
                  className={`group relative flex flex-col items-center justify-center transition-transform duration-300 py-1 px-8 ${sealing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                >
                  <div className="absolute inset-0 bg-[#A80D27] rounded-full filter blur-[10px] opacity-15 group-hover:opacity-25 animate-pulse" />
                  <div 
                    className="relative py-3 px-8 rounded-full bg-gradient-to-b from-[#BA0C2F] to-[#8A0A22] text-white font-sans text-[10.5px] uppercase tracking-widest font-black flex items-center gap-2 border border-red-400/20 shadow-lg"
                    style={{
                      boxShadow: '0 8px 24px rgba(138,10,34,0.35), inset 0 2px 2px rgba(255,255,255,0.25)',
                      letterSpacing: '0.18em'
                    }}
                  >
                    <span className="text-xs">{sealing ? '⏳' : '📜'}</span>
                    {sealing ? 'Sealing Passage...' : 'Imprint Seal & Enter Ledger'}
                    {!sealing && <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>}
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STAGE 2: PREMIUM COMPILING LEDGER SCREEN (Loading stage, double-page layout on desktop, centered card on mobile) */
        <div 
          key="compiling-screen"
          ref={contentRef}
          className="relative w-full max-w-md md:max-w-5xl rounded-[28px] overflow-visible journal-open-book grid grid-cols-1 md:grid-cols-2 bg-[#FAF9F6] shadow-2xl min-h-[380px] md:min-h-[460px]"
        >
          {/* Absolute corner clips & spine */}
          <div className="book-corner-clip top-left" />
          <div className="book-corner-clip top-right" />
          <div className="book-corner-clip bottom-left" />
          <div className="book-corner-clip bottom-right" />
          <div className="journal-center-spine pointer-events-none hidden md:block" />

          {/* Metallic 3D Spiral Binder Rings - absolute so it doesn't consume a grid cell */}
          <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="absolute pointer-events-none" style={{ top: `${9 + idx * 13.5}%`, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
                <div className="binder-ring-shadow" style={{ top: '2px' }} />
                <div className="binder-ring" />
              </div>
            ))}
          </div>

          {/* LEFT PAGE - Compiling status, Rotating Brass Compass */}
          <div className="journal-page-left p-8 flex flex-col justify-center items-center text-center select-none space-y-6">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#A80D27]/25 flex items-center justify-center relative bg-white/40 shadow-inner">
              <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-75 animate-rotateCompass" fill="none" stroke="#A80D27" strokeWidth="1.2">
                <circle cx="50" cy="50" r="42" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r="16" />
                <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
                <path d="M 50,50 L 46,22 L 50,6 L 54,22 Z" fill="rgba(168,13,39,0.25)" />
                <path d="M 50,50 L 46,78 L 50,94 L 54,78 Z" fill="rgba(168,13,39,0.08)" />
              </svg>
              <span className="absolute text-xl animate-pulseGold">🧭</span>
            </div>

            <div className="space-y-2">
              <p className="font-sans text-[9px] tracking-[0.4em] uppercase font-bold text-bahrain-red">
                مملكة البحرين
              </p>
              <h3 className="font-serif text-2xl font-black text-bronze-charcoal leading-none">
                Curating Your Passage
              </h3>
              <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold max-w-[240px] mx-auto pt-2">
                Your local narrator is selecting authentic spots, securing border visas, and weaving storyteller keys.
              </p>
            </div>

            <div className="w-full max-w-[200px] bg-red-500/10 h-1.5 rounded-full overflow-hidden relative shadow-inner">
              <div className="h-full bg-bahrain-red rounded-full animate-pulse w-3/4" style={{
                animationDuration: '2s',
                animationIterationCount: 'infinite'
              }} />
            </div>

            {/* Mobile-Only active compilation log card (avoids stacked columns) */}
            <div className="md:hidden w-full max-w-[280px] bg-[#FCFBF8] border border-dashed border-[#A80D27]/18 rounded-xl p-3 shadow-inner mt-1 max-h-[30vh] overflow-y-auto antique-scrollbar">
              <span className="font-sans text-[7.5px] tracking-[0.2em] text-[#A80D27] uppercase font-black block mb-1 sticky top-0 bg-[#FCFBF8]">
                ⏳ Live Curation Log
              </span>
              <div className="space-y-1">
                {terminalLogs.length > 0 ? terminalLogs.slice(-8).map((log, i) => (
                  <p key={i} className="font-mono text-[9px] leading-relaxed text-bronze-charcoal font-semibold opacity-80">
                    {log}
                  </p>
                )) : (
                  <p className="font-mono text-[9.5px] leading-relaxed text-bronze-charcoal font-bold min-h-[36px] flex items-center justify-center">
                    Assembling ledger...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PAGE - Typewriter Compiling Logs */}
          <div className="hidden md:flex journal-page-right p-8 flex-col relative text-left h-full justify-between overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="pb-2 border-b border-red-500/10 flex justify-between items-center mb-3">
                <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                  Curator Chronicle Logs
                </span>
                <span className="font-mono text-[7px] text-bronze-muted/40 font-bold">
                  Live Log · Status: Compiling
                </span>
              </div>

              {/* Typewriter text logs */}
              <div 
                className="flex-1 overflow-y-auto p-4 rounded-xl border border-dashed border-red-500/15 bg-[#FCFBF8] space-y-2.5 font-mono text-[10.5px] leading-relaxed text-bronze-charcoal shadow-inner"
                style={{ maxHeight: '300px' }}
              >
                {terminalLogs.map((log, idx) => {
                  const isLast = idx === terminalLogs.length - 1;
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 transition-all duration-300 ${isLast ? 'animate-fadeIn text-bahrain-red font-bold' : 'opacity-70'}`}
                    >
                      <span className="text-[#A80D27]/60 shrink-0">❯</span>
                      <span>{log}</span>
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </div>

            <div className="pt-3 border-t border-red-500/5 flex items-center justify-between mt-4 shrink-0">
              <span className="font-serif text-[8.5px] text-bronze-muted/40 italic">
                * Ledger stamps imprint active on transition
              </span>
              <span className="font-mono text-[7.5px] text-bahrain-red font-black tracking-widest animate-pulse">
                PLANNING IN PROGRESS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
