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
    soundVolume,
    soundMuted
  } = useVibe()

  const [animating, setAnimating] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [coverOpened, setCoverOpened] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [activeLogIndex, setActiveLogIndex] = useState(0)
  const [customBudgetVal, setCustomBudgetVal] = useState('')

  // Real-time ticking system clock state for the physical pocket watch hand rotations
  const [systemTime, setSystemTime] = useState(new Date())

  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const logsEndRef = useRef(null)

  const handleCustomBudgetChange = (val) => {
    setCustomBudgetVal(val)
    if (val) {
      const numeric = parseFloat(val)
      if (numeric <= 0) return
      if (numeric < 15) {
        setTier('Wandering')
      } else if (numeric >= 15 && numeric < 50) {
        setTier('Curated')
      } else {
        setTier('Exquisite')
      }
    }
  }

  // Update watch clock hands every second
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setSystemTime(new Date())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

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
          return prev
        })
      }
    }, 550)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [coverOpened, duration, tier])

  // Scroll terminal logs automatically
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs])

  useEffect(() => {
    if (coverOpened && contentRef.current) {
      gsap.fromTo(contentRef.current,
        { rotateY: 75, opacity: 0, scale: 0.95 },
        { rotateY: 0, opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' }
      )
    }
  }, [coverOpened])

  const handleGenerateChronicle = async () => {
    if (animating) return
    setAnimating(true)
    setLoadingAI(true)
    playTypewriterClick(1.6)

    // Add final compiling logs
    setTerminalLogs(logs => [
      ...logs,
      `Imprinting the border customs entry stamps...`,
      `Ledger parameters locked! Mapped coordinates secured.`
    ])

    const parsed = await fetchAICuratedItinerary(selectedMoods, tier, duration, pace)
    
    if (parsed) {
      setAiItinerary(parsed)
    }

    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        setStep(5)
        setLoadingAI(false)
        setAnimating(false)
      }
    })
  }

  // Calculate hands degrees for clock
  const secondsAngle = systemTime.getSeconds() * 6
  const minutesAngle = systemTime.getMinutes() * 6 + systemTime.getSeconds() * 0.1
  const hoursAngle = (systemTime.getHours() % 12) * 30 + systemTime.getMinutes() * 0.5

  // Filter current spots dynamically being parsed in real-time
  const activeDiscoveredSpots = spotsCatalog
    .filter(s => selectedMoods.includes(s.mood))
    .slice(0, Math.min(spotsCatalog.length, duration * 3))

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start wood-desk-backdrop overflow-y-auto px-4 pt-8 pb-16 md:pt-12 md:pb-20"
    >
      {/* 1. TACTILE DESKTOP PROPS (Floats around the journal book only on desktop) */}
      {coverOpened && (
        <>
          {/* Quill Pen in Ink bottle */}
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

          {/* Steaming Karak Tea Cup on brass plate */}
          <div className="hidden lg:block desktop-prop-tea" title="Generational Cardamom Karak Tea">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <ellipse cx="50" cy="72" rx="42" ry="12" fill="none" stroke="#d4af37" strokeWidth="1.8" />
              <ellipse cx="50" cy="72" rx="42" ry="12" fill="rgba(42,35,33,0.9)" />
              <path d="M 24,42 Q 22,25 24,18 L 76,18 Q 78,25 76,42 Q 74,68 50,70 Q 26,68 24,42 Z" fill="#FAF9F6" stroke="#aa7c11" strokeWidth="1" />
              <ellipse cx="50" cy="20" rx="23" ry="5" fill="#a46d37" />
              <ellipse cx="50" cy="18" rx="26" ry="6" fill="none" stroke="#d4af37" strokeWidth="1.5" />
              <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#FAF9F6" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" />
              <path d="M 38,10 Q 34,4 40,-2 T 36,-10" className="tea-steam-line" />
              <path d="M 50,10 Q 54,4 48,-2 T 52,-10" className="tea-steam-line" style={{ animationDelay: '1.2s' }} />
              <path d="M 62,10 Q 58,4 64,-2 T 60,-10" className="tea-steam-line" style={{ animationDelay: '2.4s' }} />
            </svg>
          </div>

          {/* Ticking Brass Pocket Watch displaying user actual system time */}
          <div className="hidden lg:block desktop-prop-watch" title="Nautical chronometer watch (synced to local time)">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="4" />
              <circle cx="50" cy="50" r="46" fill="rgba(42,35,33,0.95)" />
              <circle cx="50" cy="2" r="8" fill="none" stroke="#aa7c11" strokeWidth="2" />
              <circle cx="50" cy="50" r="38" fill="#FAF9F6" stroke="#221c1a" strokeWidth="1.5" />
              {Array.from({ length: 12 }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="16"
                  x2="50"
                  y2="20"
                  stroke="#1A1412"
                  strokeWidth="1.5"
                  transform={`rotate(${i * 30} 50 50)`}
                />
              ))}
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="30"
                stroke="#1A1412"
                strokeWidth="2.8"
                strokeLinecap="round"
                transform={`rotate(${hoursAngle} 50 50)`}
              />
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="20"
                stroke="#3D3330"
                strokeWidth="1.8"
                strokeLinecap="round"
                transform={`rotate(${minutesAngle} 50 50)`}
              />
              <line
                x1="50"
                y1="55"
                x2="50"
                y2="18"
                stroke="#C1122F"
                strokeWidth="0.8"
                strokeLinecap="round"
                transform={`rotate(${secondsAngle} 50 50)`}
              />
              <circle cx="50" cy="50" r="3.2" fill="#d4af37" stroke="#1A1412" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Leather-bound Bahrain Passage Visa Passport */}
          <div className="hidden lg:block desktop-prop-passport">
            <svg viewBox="0 0 120 180" className="w-full h-auto">
              <defs>
                <filter id="passShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="2" dy="5" stdDeviation="4" floodOpacity="0.4"/>
                </filter>
              </defs>
              <rect x="5" y="5" width="110" height="170" rx="8" fill="#5F161B" stroke="#8C1D24" strokeWidth="1" filter="url(#passShadow)" />
              <rect x="9" y="9" width="102" height="162" rx="5" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="3,3" />
              <circle cx="60" cy="72" r="16" fill="none" stroke="#D4AF37" strokeWidth="0.75" />
              <path d="M 50,72 Q 60,82 70,72 Q 60,62 50,72 Z M 55,72 Q 60,77 65,72" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
              <path d="M 60,56 L 60,88 M 44,72 L 76,72" stroke="#D4AF37" strokeWidth="0.5" opacity="0.6" />
              <text x="60" y="32" fill="#D4AF37" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.2" textAnchor="middle">KINGDOM OF BAHRAIN</text>
              <text x="60" y="146" fill="#D4AF37" fontSize="8" fontFamily="serif" letterSpacing="2" textAnchor="middle">PASSPORT</text>
              <text x="60" y="156" fill="#D4AF37" fontSize="4" fontFamily="sans-serif" letterSpacing="1" textAnchor="middle" opacity="0.65">ENTRY VISA ACTIVATE</text>
            </svg>
          </div>
        </>
      )}

      {/* 2. MAIN WORKSPACE CONTENT GRID */}
      {!coverOpened ? (
        /* Book Cover */
        <div
          ref={contentRef}
          className="relative w-full max-w-sm md:max-w-md select-none"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px',
          }}
        >
          {/* Outer book border */}
          <div
            className="relative rounded-3xl overflow-hidden flex flex-col"
            style={{
              border: '14px solid #1A1210',
              boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9), 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.3)',
              outline: '2px solid rgba(212,175,55,0.35)',
              outlineOffset: '-14px',
            }}
          >
            {/* Brass corner clips */}
            <div className="book-corner-clip top-left" />
            <div className="book-corner-clip top-right" />
            <div className="book-corner-clip bottom-left" />
            <div className="book-corner-clip bottom-right" />

            {/* Book spine shadow */}
            <div className="absolute top-0 bottom-0 left-0 w-5 bg-gradient-to-r from-black/30 to-transparent pointer-events-none z-20" />

            {/* TOP RED BANNER — Bahrain flag inspired */}
            <div
              className="relative flex flex-col items-center justify-center py-8 px-8 text-center overflow-hidden"
              style={{ background: '#D11A38' }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
              />
              {/* Decorative compass */}
              <svg viewBox="0 0 100 100" className="absolute right-4 top-3 w-20 h-20 opacity-10" fill="none" stroke="white" strokeWidth="0.7">
                <circle cx="50" cy="50" r="42" strokeDasharray="3,4" />
                <circle cx="50" cy="50" r="18" />
                <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
                <path d="M 50,50 L 46,20 L 50,5 L 54,20 Z" fill="rgba(255,255,255,0.12)" />
                <circle cx="50" cy="50" r="3" fill="white" />
              </svg>

              <p className="relative z-10 font-sans text-[8px] tracking-[0.4em] uppercase font-bold text-white/60 mb-2">
                مملكة البحرين · Kingdom of Bahrain
              </p>
              <h1 className="relative z-10 font-serif text-4xl md:text-5xl font-semibold text-white leading-none">
                Bahrain
              </h1>
              <p className="relative z-10 font-serif text-xl italic font-light text-white/80 mt-1">
                Passage
              </p>
            </div>

            {/* Serrated white edge — Bahrain flag zigzag */}
            <div style={{ background: '#D11A38', lineHeight: 0 }}>
              <svg viewBox="0 0 400 20" preserveAspectRatio="none" style={{ width: '100%', height: '20px', display: 'block' }}>
                <path d="M0,0 L25,16 L50,0 L75,16 L100,0 L125,16 L150,0 L175,16 L200,0 L225,16 L250,0 L275,16 L300,0 L325,16 L350,0 L375,16 L400,0 L400,20 L0,20 Z" fill="#FAF9F6" />
              </svg>
            </div>

            {/* WHITE BOTTOM SECTION */}
            <div
              className="flex flex-col items-center justify-between px-8 py-8 gap-6 flex-1"
              style={{ background: '#FAF9F6' }}
            >
              {/* Description */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px flex-1" style={{ background: 'rgba(209,26,56,0.2)' }} />
                  <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-30" fill="none" stroke="#D11A38" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2 L12 22 M2 12 L22 12" />
                  </svg>
                  <div className="h-px flex-1" style={{ background: 'rgba(209,26,56,0.2)' }} />
                </div>

                <p className="font-serif text-sm italic leading-relaxed" style={{ color: '#5C5451' }}>
                  "Your personal local. Not a tour guide — a resident who knows every hidden alley, secret sandbank, and best karak spot in the Kingdom."
                </p>

                <div className="flex justify-center gap-4 text-[9px] font-sans font-bold uppercase tracking-widest" style={{ color: 'rgba(92,84,81,0.45)' }}>
                  <span>18 Local Spots</span>
                  <span style={{ color: 'rgba(209,26,56,0.3)' }}>·</span>
                  <span>AI-Planned</span>
                  <span style={{ color: 'rgba(209,26,56,0.3)' }}>·</span>
                  <span>Gamified</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => {
                  playTypewriterClick(1.5)
                  gsap.to(contentRef.current, {
                    rotateY: -90,
                    opacity: 0,
                    scale: 0.96,
                    duration: 0.6,
                    ease: 'power3.inOut',
                    onComplete: () => setCoverOpened(true),
                  })
                }}
                className="w-full py-4 rounded-2xl font-sans text-sm uppercase tracking-widest font-extrabold transition-all cursor-pointer active:scale-95"
                style={{
                  background: '#D11A38',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(209,26,56,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 32px rgba(209,26,56,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(209,26,56,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'}
              >
                Open My Ledger →
              </button>

              <p className="font-sans text-[8px] tracking-widest uppercase font-bold" style={{ color: 'rgba(92,84,81,0.3)' }}>
                Bahrain Passage · Volume I · 2026
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* The Inner Interactive Logbook Calibrator double-page book layout */
        <div 
          ref={contentRef}
          className="relative w-full max-w-5xl rounded-[28px] overflow-visible journal-open-book grid grid-cols-1 md:grid-cols-2 bg-[#FAF9F6] shadow-2xl"
        >
          {/* Absolute Gold Brass corner caps around the book ledger */}
          <div className="book-corner-clip top-left" />
          <div className="book-corner-clip top-right" />
          <div className="book-corner-clip bottom-left" />
          <div className="book-corner-clip bottom-right" />

          {/* Vertical Seam Down the exact middle of the book */}
          <div className="journal-center-spine pointer-events-none hidden md:block" />

          {/* Metallic 3D Spiral Binder Rings */}
          <div className="hidden md:block">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="absolute pointer-events-none" style={{ top: `${9 + idx * 13.5}%`, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
                <div className="binder-ring-shadow" style={{ top: '2px' }} />
                <div className="binder-ring" />
              </div>
            ))}
          </div>

          {/* LEFT PAGE - Clickable Parameter Deck & Guide Scroll */}
          <div className="journal-page-left p-6 md:p-8 flex flex-col relative text-left select-none">
            <div className="flex flex-col space-y-4">
              
              {/* Header Calibration */}
              <div className="pb-2 border-b border-red-500/10">
                <span className="font-sans text-[8px] tracking-[0.35em] text-bahrain-red uppercase font-bold block mb-1">
                  Local Planning — Finalise Your Trip
                </span>
                <h3 className="font-serif text-xl text-bronze-charcoal font-bold tracking-tight">
                  Trip <span className="italic text-bahrain-red">Setup</span>
                </h3>
                {selectedMoods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedMoods.map(m => (
                      <span key={m} className="text-[9px] px-2 py-0.5 rounded-full font-bold font-sans bg-red-500/10 text-bahrain-red border border-red-500/15 capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* TACTILE CLICKABLE PARAMETERS DECK */}
              <div className="p-4 rounded-xl border border-red-500/10 bg-white shadow-sm space-y-4">
                
                {/* Stay Duration circles selection */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-serif text-xs font-bold text-bronze-charcoal flex items-center gap-1.5">
                      ⏳ Stay Duration
                    </label>
                    <span className="font-mono text-xs font-extrabold text-bahrain-red bg-red-500/5 px-2.5 py-0.5 rounded-lg border border-red-500/10 shadow-sm">
                      {duration} {duration === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5 justify-center mt-2 select-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDuration(d)
                          playTypewriterClick(1.0 + d * 0.06)
                        }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-serif font-extrabold text-xs transition-all border cursor-pointer ${
                          duration === d
                            ? 'bg-bahrain-red text-white border-bahrain-red shadow-md scale-105 font-bold'
                            : 'bg-white border-red-500/10 text-bronze-charcoal hover:border-red-500/25'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget level selection cards */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-serif text-xs font-bold text-bronze-charcoal flex items-center gap-1.5">
                      🪙 Travel Budget Scope
                    </label>
                    <span className="font-sans text-[9px] tracking-wider uppercase font-extrabold text-bahrain-red bg-red-500/5 px-2 py-0.5 rounded-lg border border-red-500/10 shadow-sm">
                      {tier === 'Wandering' ? 'Wandering Local ($)' : tier === 'Curated' ? 'Curated Passage ($$)' : 'Exquisite Luxury ($$$)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { key: 'Wandering', title: 'Wandering', coins: '🪙', subtitle: 'BUDGET LOCAL' },
                      { key: 'Curated', title: 'Curated', coins: '🪙🪙', subtitle: 'BALANCED' },
                      { key: 'Exquisite', title: 'Exquisite', coins: '🪙🪙🪙', subtitle: 'PREMIUM LUXURY' }
                    ].map(b => {
                      const active = tier === b.key
                      return (
                        <button
                          key={b.key}
                          onClick={() => {
                            setTier(b.key)
                            setCustomBudgetVal('') // Reset custom budget input when preset is clicked
                            playTypewriterClick(b.key === 'Wandering' ? 0.9 : b.key === 'Curated' ? 1.15 : 1.4)
                          }}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            active
                              ? 'bg-white border-bahrain-red shadow-sm font-extrabold scale-[1.01] stitch-border'
                              : 'bg-[#FAF9F6] border-red-500/10 text-bronze-charcoal/80 hover:border-red-500/25'
                          }`}
                        >
                          <span className="font-serif text-[10px] block font-bold">{b.title}</span>
                          <span className="text-[10px] block mt-0.5">{b.coins}</span>
                          <span className="font-sans text-[5.5px] tracking-widest text-bronze-muted/50 font-bold block mt-0.5">{b.subtitle}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Or Custom daily budget limit input */}
                  <div className="mt-3 border-t border-red-500/5 pt-3">
                    <div className="flex justify-between items-center">
                      <label className="font-serif text-[11px] font-bold text-bronze-charcoal flex items-center gap-1">
                        ✍️ Set Custom Budget (BHD/Day):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        placeholder="e.g. 25"
                        value={customBudgetVal}
                        onChange={(e) => handleCustomBudgetChange(e.target.value)}
                        className="w-20 text-center font-mono text-xs font-bold text-bahrain-red bg-[#FCFBF8] border border-amber-600/30 rounded-lg py-1 px-1.5 focus:outline-none focus:border-bahrain-red shadow-inner select-all"
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Imprint Unlock Wax Seal Button */}
            <div className="pt-3 border-t border-red-500/10 flex flex-col space-y-1 mt-5 select-none">
              <button
                onClick={handleGenerateChronicle}
                disabled={loadingAI}
                className="w-full py-3 rounded-xl bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-[10.5px] uppercase tracking-widest font-extrabold transition-all shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                {loadingAI ? 'Your local is planning...' : 'Build My Bahrain 📖'}
              </button>
              <span className="font-serif text-[8.5px] text-bronze-muted/40 italic text-center block">
                AI plans your itinerary in seconds. Adjust budget & duration above.
              </span>
            </div>

          </div>

          {/* RIGHT PAGE - Curated Spots discovered in real-time */}
          <div className="journal-page-right p-6 md:p-8 flex flex-col relative text-left">
            <div className="flex flex-col gap-3">
              
              {/* Header spots parsing */}
              <div className="pb-2 border-b border-red-500/10 flex justify-between items-center mb-3">
                <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                  Your Local's Draft Plan
                </span>
                <span className="font-mono text-[7px] text-bronze-muted/40 font-bold">
                  Preview · Day 1 to {duration}
                </span>
              </div>

              <p className="font-sans text-[11.5px] text-bronze-muted font-bold leading-relaxed mb-3">
                Based on your vibes, your local is lining up the best spots — only places a resident would take you:
              </p>

              <div className="flex-1 overflow-y-auto antique-scrollbar space-y-2 max-h-[360px] pr-1 py-1">
                {activeDiscoveredSpots.map((spot, idx) => {
                  const dayNum = Math.floor(idx / 3) + 1
                  if (dayNum > duration) return null
                  return (
                    <div 
                      key={spot.id}
                      className="p-3 rounded-xl border border-red-500/10 bg-white shadow-sm flex items-start gap-2.5 transition-all duration-300 transform hover:scale-[1.01] hover:border-red-500/25 relative overflow-hidden"
                    >
                      {/* Day capsule tag */}
                      <span className="absolute top-2 right-2 font-serif text-[7.5px] font-bold text-bahrain-red bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                        Day {dayNum} Stop
                      </span>
                      
                      <span className="text-xl p-1 bg-red-500/5 rounded-lg border border-red-500/10 shrink-0">
                        {spot.keepsakeEmoji}
                      </span>
                      <div className="min-w-0 flex-1 pr-16 text-left">
                        <h5 className="font-serif text-[11px] font-bold text-bronze-charcoal leading-tight truncate">
                          {spot.name}
                        </h5>
                        <p className="font-sans text-[8.5px] text-bronze-muted/65 mt-0.5 truncate font-semibold">
                          {spot.period} • {spot.coords}
                        </p>
                        <p className="font-serif text-[9.5px] italic text-bahrain-red font-bold mt-1">
                          ★ Selected Stop (Estimated: {tier === 'Wandering' ? spot.budgetCost : spot.premiumCost})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Sync status footer */}
              <div className="pt-3 border-t border-red-500/5 mt-3 select-none flex justify-between items-center font-serif text-[9px] italic text-bronze-muted/60">
                <span>* Discovery feed locks on wax stamp imprint</span>
                <span className="font-mono text-[7.5px] not-italic text-bahrain-red font-bold">LEDGER SYNC: STANDBY</span>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  )
}
