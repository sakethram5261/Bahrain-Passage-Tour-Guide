import { useRef, useState, useEffect, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import NauticalChronometer from './NauticalChronometer'

const CARD_VIDEOS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4'
]

const BAHRAIN_CARD_GRADIENTS = [
  'linear-gradient(135deg, #A80D27 0%, #5C000E 100%)', // Bahrain Crimson
  'linear-gradient(135deg, #aa7c11 0%, #543d08 100%)', // Dilmun Gold
  'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', // Persian Gulf Blue
  'linear-gradient(135deg, #065f46 0%, #022c22 100%)', // Oasis Green
  'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)', // Twilight Indigo
  'linear-gradient(135deg, #7c3aed 0%, #2e1065 100%)', // Royal Purple
]

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
    resetChronicle = () => {},
  } = useVibe()

  const [coverOpened] = useState(true)
  const [showPreviewOverview, setShowPreviewOverview] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [terminalLogs, setTerminalLogs] = useState([])
  const [logsComplete, setLogsComplete] = useState(false)
  const [contentLoaded, setContentLoaded] = useState(false)
  const [sealing, setSealing] = useState(false) 
  const [flippedIndex, setFlippedIndex] = useState(null)

  // Swipe & Drag gesture tracking references
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const dragStartProgress = useRef(0)
  const dragType = useRef(null)
  const swipeOffsetX = useRef(0)

  // 3D Cylinder References
  const cardsRefs = useRef([])
  const progress = useRef(0)
  const targetProgress = useRef(0)
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const frameId = useRef(0)
  const isHovered = useRef(false)
  const lastIndexRef = useRef(0)

  // Responsive state containing card dimensions
  const [metrics, setMetrics] = useState({
    cardW: 336,
    cardH: 211, // 1.59 standard credit card ratio
  })

  // Carousel item switching handlers
  const handleNextSpot = () => {
    if (!itinerarySpots || itinerarySpots.length === 0) return
    playTypewriterClick(1.05)
    setFlippedIndex(null)
    targetProgress.current = Math.round(targetProgress.current) + 1
  }

  const handlePrevSpot = () => {
    if (!itinerarySpots || itinerarySpots.length === 0) return
    playTypewriterClick(0.95)
    setFlippedIndex(null)
    targetProgress.current = Math.round(targetProgress.current) - 1
  }

  // Shortest-path circular navigation helper
  const goToIndex = (targetIdx) => {
    if (!itinerarySpots || itinerarySpots.length === 0) return
    const cardCount = itinerarySpots.length
    const curProgress = progress.current
    
    // Find current active index as rounded modulo
    let curActive = Math.round(curProgress) % cardCount
    if (curActive < 0) curActive += cardCount
    
    // Shortest path difference
    let diff = targetIdx - curActive
    const half = cardCount / 2
    while (diff > half) diff -= cardCount
    while (diff < -half) diff += cardCount
    
    setFlippedIndex(null)
    targetProgress.current = Math.round(curProgress) + diff
  }

  // Touch/Mouse drag handlers for 3D cylinder layout & swipe-to-delete gesture
  const handleDragStart = (clientX, clientY) => {
    isDragging.current = true
    dragStartX.current = clientX
    dragStartY.current = clientY
    dragStartProgress.current = targetProgress.current
    swipeOffsetX.current = 0
    dragType.current = null
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging.current) return
    const diffX = clientX - dragStartX.current
    const diffY = clientY - dragStartY.current

    if (dragType.current === null) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        dragType.current = 'horizontal'
      } else if (Math.abs(diffY) > 10) {
        dragType.current = 'vertical'
      }
    }

    if (dragType.current === 'vertical') {
      // Swipe up/down to scroll vertical cylinder
      targetProgress.current = dragStartProgress.current - (diffY / 180)
    } else if (dragType.current === 'horizontal') {
      // Swipe left/right on active card to delete
      swipeOffsetX.current = diffX
    }
  }

  const handleDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false

    if (dragType.current === 'vertical') {
      targetProgress.current = Math.round(targetProgress.current)
    } else if (dragType.current === 'horizontal') {
      // Threshold check to delete active spot
      if (Math.abs(swipeOffsetX.current) > 120) {
        playTypewriterClick(0.75)
        const remaining = itinerarySpots.filter((_, sIdx) => sIdx !== carouselIndex)
        setItinerarySpots(remaining)
      }
      swipeOffsetX.current = 0
    }
    dragType.current = null
  }

  // Register window mouse listeners to catch releases outside the container
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDragging.current) {
        handleDragMove(e.clientX, e.clientY)
      }
    }

    const handleWindowMouseUp = () => {
      if (isDragging.current) {
        handleDragEnd()
      }
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [itinerarySpots, carouselIndex])

  // Card flipping click handler
  const handleCardClick = (idx) => {
    // Only allow flipping of the active card
    if (idx !== carouselIndex) {
      goToIndex(idx)
      return
    }
    playTypewriterClick(1.1)
    if (flippedIndex === idx) {
      setFlippedIndex(null)
    } else {
      setFlippedIndex(idx)
    }
  }

  // Track mouse coordinates for interactive 3D parallax tilt with inertia damping
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Screen-space cursor offset relative to window center, clamped to [-1.0, 1.0] range
      const rx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)
      const ry = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)
      mouse.current.targetX = Math.max(-1, Math.min(1, rx))
      mouse.current.targetY = Math.max(-1, Math.min(1, ry))
    }

    const handleMouseLeave = () => {
      // Return gently to center orientation when mouse focus is lost or moves away
      mouse.current.targetX = 0
      mouse.current.targetY = 0
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Calculate card sizing dynamically
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      // Calculate Card Metrics (shrink cards if height is small to save space)
      let cardW = Math.round(w * 0.16 + 130)
      
      const heightFactor = Math.min(1.0, Math.max(0.65, h / 850))
      cardW = Math.round(cardW * heightFactor)
      
      cardW = Math.min(336, Math.max(150, cardW))
      const cardH = Math.round(cardW / 1.5925) // Standard credit card ratio

      setMetrics({ cardW, cardH })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Safely clean up / clamp refs on array size changes
  useEffect(() => {
    const cardCount = itinerarySpots.length
    cardsRefs.current = cardsRefs.current.slice(0, cardCount)
    progress.current = 0
    targetProgress.current = 0
    lastIndexRef.current = 0
    queueMicrotask(() => {
      setCarouselIndex(0)
      setFlippedIndex(null)
    })
  }, [itinerarySpots.length])

  // 60fps render loop to compute 3D transformation values in a vertical cylinder
  const renderLoop = useCallback(() => {
    const cardCount = itinerarySpots.length
    if (cardCount === 0) return

    // Slow idle drift if cursor is not hovering, card is not flipped, and user is not dragging
    if (!isHovered.current && flippedIndex === null && !isDragging.current) {
      targetProgress.current += 0.0006
    }

    // Interpolate mouse tracking with inertia damping
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.08
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.08

    // Interpolate continuous progress with spring physics
    progress.current += (targetProgress.current - progress.current) * 0.08

    const cards = cardsRefs.current
    const continuousProgress = progress.current
    const roundedIndex = Math.round(continuousProgress)
    const diffFromRound = continuousProgress - roundedIndex
    
    // Magnetic central snap calculation
    const easedDiff = Math.sign(diffFromRound) * Math.pow(Math.abs(diffFromRound) * 2, 4.2) / 2
    const virtualActiveIndex = roundedIndex + easedDiff

    // Throttled state update for metadata panel below
    let activeIdx = roundedIndex % cardCount
    if (activeIdx < 0) activeIdx += cardCount
    if (activeIdx !== lastIndexRef.current) {
      lastIndexRef.current = activeIdx
      setCarouselIndex(activeIdx)
    }

    const lerp = (start, end, amt) => (1 - amt) * start + amt * end

    for (let i = 0; i < cardCount; i++) {
      const card = cards[i]
      if (!card) continue

      // Solve circular wrapping
      let offset = i - virtualActiveIndex
      const halfCount = cardCount / 2
      while (offset > halfCount) offset -= cardCount
      while (offset < -halfCount) offset += cardCount

      const absOffset = Math.abs(offset)
      const sign = Math.sign(offset)

      // Hide off-screen elements smoothly and limit clipping
      if (absOffset > 2.2) {
        card.style.visibility = 'hidden'
        card.style.opacity = '0'
        continue
      } else {
        card.style.visibility = 'visible'
      }

      let y = 0
      let z = 0
      let rot = 0
      let opacity = 1

      if (absOffset <= 1) {
        const t = absOffset
        y = sign * t * 130
        z = lerp(350, 150, t)
        rot = sign * t * 45
        opacity = 1
      } else {
        const t = Math.min(absOffset - 1, 1.2)
        y = sign * (130 + t * 90)
        z = lerp(150, -50, t)
        rot = sign * (45 + t * 45)
        opacity = lerp(1, 0, t)
      }

      const localCardRotation = -sign * rot
      const centerFactor = Math.max(0, 1 - absOffset)

      const maxTiltY = 12
      const maxTiltX = 10

      const activeTiltX = -mouse.current.y * maxTiltX * centerFactor
      const activeTiltY = mouse.current.x * maxTiltY * centerFactor

      // 180deg flip around the X-axis for details disclosure
      const isFlipped = flippedIndex === i
      const flipAngle = isFlipped ? 180 : 0

      const totalRotX = localCardRotation + activeTiltX + flipAngle
      const totalRotY = activeTiltY

      card.style.zIndex = Math.round(z).toString()
      
      let translateX = 0
      let cardOpacity = opacity

      // If active card is being swiped horizontally, apply translation & fade out
      if (absOffset < 0.5 && dragType.current === 'horizontal') {
        translateX = swipeOffsetX.current
        cardOpacity = opacity * Math.max(0, 1 - Math.abs(swipeOffsetX.current) / 320)
      }

      card.style.opacity = cardOpacity.toFixed(3)
      card.style.transform = `translateX(${translateX.toFixed(1)}px) translateY(${y.toFixed(1)}px) translateZ(${z.toFixed(1)}px) rotateX(${totalRotX.toFixed(1)}deg) rotateY(${totalRotY.toFixed(1)}deg) rotateZ(-3deg)`
    }
  }, [itinerarySpots, flippedIndex, metrics])

  // 60fps Animation tick
  useEffect(() => {
    const tick = () => {
      renderLoop()
      frameId.current = requestAnimationFrame(tick)
    }

    frameId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId.current)
  }, [renderLoop])

  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const logsEndRef = useRef(null)

  // Synthesis of Typewriter mechanical key clicking sounds
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

  // Compile itinerary
  const compileItinerary = useCallback(async () => {
    let compiledSpots = []

    // Safely extract spots catalog dynamically to completely break circular dependency loops
    let localCatalog = null
    try {
      const itineraryModule = await import('../hooks/useItinerary')
      if (itineraryModule && itineraryModule.spotsCatalog) {
        localCatalog = itineraryModule.spotsCatalog
      }
    } catch (importErr) {
      console.error("Dynamic catalog chunk load protected:", importErr)
    }

    // Process directly via the localized catalog generator
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

    // DISASTER PROTECTION GUARD: If local state arrays remain empty, provide explicit fallback data layout
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
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop',
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
    if (coverOpened) {
      compileItinerary()
    }
  }, [coverOpened, compileItinerary])

  // Type out guide notes in real-time
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

  // Scroll terminal logs automatically
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs])

  // Transition to the card carousel overview cleanly when loading finishes
  useEffect(() => {
    if (logsComplete && contentLoaded) {
      queueMicrotask(() => {
        setShowPreviewOverview(true)
      })
    }
  }, [logsComplete, contentLoaded])
  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto px-4 py-6 transition-colors duration-700 ${
        showPreviewOverview ? 'bg-[#FAF9F6]' : 'wood-desk-backdrop'
      }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        @keyframes rotateCompass {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGold {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(212,175,55,0.4)); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(212,175,55,0.85)); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInEffect {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-rotateCompass { animation: rotateCompass 12s linear infinite; }
        .animate-pulseGold { animation: pulseGold 3s ease-in-out infinite; }
        .animate-slideUpFade { animation: slideUpFade 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-screenEntry { animation: fadeInEffect 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* 1. TACTILE DESKTOP PROPS */}
      {coverOpened && !showPreviewOverview && (
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
          <NauticalChronometer className="hidden lg:block desktop-prop-watch" showSeconds={false} />
        </>
      )}

      {/* 2. MAIN WORKSPACE CONTENT GRID */}
      {showPreviewOverview ? (
        /* STAGE 3: CAROUSEL PREVIEW OVERVIEW */
        <div 
          key="carousel-screen"
          ref={contentRef}
          className="relative w-full max-w-md mx-auto select-none animate-screenEntry flex flex-col gap-5 justify-center z-10"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1200px',
          }}
        >
          {/* Flanking navigation arrows */}
          {itinerarySpots && itinerarySpots.length > 1 && (
            <>
              <button
                onClick={handlePrevSpot}
                className="hidden lg:flex absolute left-[-80px] top-[140px] w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-40 font-bold"
                title="Previous Stop"
              >
                ❮
              </button>
              <button
                onClick={handleNextSpot}
                className="hidden lg:flex absolute right-[-80px] top-[140px] w-12 h-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer z-40 font-bold"
                title="Next Stop"
              >
                ❯
              </button>
            </>
          )}

          {/* Interactive 3D Card Viewport Container */}
          <div
            className="relative w-full h-[320px] sm:h-[350px] flex items-center justify-center overflow-visible select-none pointer-events-auto cursor-grab active:cursor-grabbing"
            onMouseEnter={() => { isHovered.current = true }}
            onMouseLeave={() => { isHovered.current = false }}
            onMouseDown={(e) => {
              if (e.button !== 0) return
              handleDragStart(e.clientX, e.clientY)
            }}
            onTouchStart={(e) => {
              const t = e.touches[0]
              handleDragStart(t.clientX, t.clientY)
            }}
            onTouchMove={(e) => {
              const t = e.touches[0]
              handleDragMove(t.clientX, t.clientY)
            }}
            onTouchEnd={handleDragEnd}
          >
            <div
              className="relative w-full h-full flex items-center justify-center pointer-events-none"
              style={{
                perspective: '1350px',
              }}
            >
              <div
                className="absolute pointer-events-auto"
                style={{
                  width: `${metrics.cardW}px`,
                  height: `${metrics.cardH}px`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {itinerarySpots.map((spot, i) => {
                  const zLayers = [-1.47, -0.73, 0, 0.73, 1.47]
                  const cardGradient = BAHRAIN_CARD_GRADIENTS[i % BAHRAIN_CARD_GRADIENTS.length]
                  const videoSrc = CARD_VIDEOS[i % CARD_VIDEOS.length]

                  return (
                    <div
                      key={spot.id}
                      ref={(el) => { cardsRefs.current[i] = el }}
                      className="absolute inset-0 transition-opacity duration-300"
                      onClick={() => handleCardClick(i)}
                      style={{
                        width: `${metrics.cardW}px`,
                        height: `${metrics.cardH}px`,
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'visible',
                        cursor: 'pointer'
                      }}
                    >
                      {zLayers.map((zOffset, layerIdx) => {
                        const isFrontFace = layerIdx === zLayers.length - 1
                        const isBackFace = layerIdx === 0

                        // Middle structure edge layer
                        if (!isFrontFace && !isBackFace) {
                          return (
                            <div
                              key={layerIdx}
                              className="absolute inset-0 rounded-[16px] pointer-events-none overflow-hidden border border-white/5"
                              style={{
                                background: '#1c1c1e',
                                transform: `translateZ(${zOffset}px)`,
                                boxShadow: '0 0 4px rgba(255,255,255,0.05)'
                              }}
                            />
                          )
                        }

                        // Front Face of Card
                        if (isFrontFace) {
                          return (
                            <div
                              key={layerIdx}
                              className="absolute inset-0 rounded-[16px] border border-white/25 pointer-events-none overflow-hidden select-none"
                              style={{
                                background: 'linear-gradient(135deg, #BA0C2F 0%, #7A0019 100%)',
                                transform: `translateZ(${zOffset}px)`,
                                backfaceVisibility: 'hidden',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25), 0 10px 25px rgba(0,0,0,0.35)',
                              }}
                            >
                              {/* Background Place Image */}
                              <img
                                src={spot.image || 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=600&auto=format&fit=crop'}
                                alt={spot.name}
                                className="absolute inset-0 w-full h-full object-cover rounded-[16px] opacity-75"
                              />
                              {/* Crimson Gradient Overlay for contrast and red theme blending */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/40 to-[#A80D27]/85 rounded-[16px]" />

                              {/* Bahrain Flag Serrated Border on Left */}
                              <svg className="absolute inset-y-0 left-0 w-[20px] h-full" viewBox="0 0 24 100" preserveAspectRatio="none" fill="none">
                                <path d="M0,0 L24,0 L12,10 L24,20 L12,30 L24,40 L12,50 L24,60 L12,70 L24,80 L12,90 L24,100 L0,100 Z" fill="white" />
                              </svg>

                              {/* Card details overlay */}
                              <div className="absolute inset-0 pl-8 pr-4 py-4 sm:pl-10 sm:pr-5 sm:py-5 text-white h-full w-full font-sans z-10 flex flex-col justify-between">
                                {/* Top Header */}
                                <div className="flex justify-between items-start">
                                  <div className="flex flex-col text-left">
                                    <span className="font-mono text-[7.5px] tracking-[0.25em] text-white/60 uppercase font-black">
                                      BAHRAIN PASSAGE
                                    </span>
                                    <span className="font-serif text-[11px] sm:text-[13px] font-black tracking-tight leading-tight mt-0.5 max-w-[170px] text-white drop-shadow-md">
                                      {spot.keepsakeEmoji || '📍'} {spot.name}
                                    </span>
                                  </div>

                                  {/* Travel Compass Emblem */}
                                  <div className="opacity-90 shrink-0 text-white">
                                    <svg
                                      className="w-6 h-6 animate-pulseGold"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeDasharray="3 3" />
                                      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" fill="rgba(255,255,255,0.2)" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Middle Accent - travel stamp overlay */}
                                <div className="flex items-center justify-between mt-auto mb-1.5 pointer-events-none">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-[8px] tracking-[0.1em] text-white/50 bg-white/10 px-2 py-0.5 rounded uppercase">
                                      STAMP CALIBRATED
                                    </span>
                                  </div>
                                </div>

                                {/* Bottom area */}
                                <div className="flex justify-between items-end">
                                  <span className="font-serif text-[11px] sm:text-xs italic text-white/95 drop-shadow font-semibold">
                                    {spot.arabic}
                                  </span>

                                  {/* Intersecting Travel Rings */}
                                  <div className="flex -space-x-3 items-center opacity-90">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 backdrop-blur-[1px] border border-white/15" />
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/35 backdrop-blur-[1px] border border-white/15" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        // Back Face of Card
                        if (isBackFace) {
                          return (
                            <div
                              key={layerIdx}
                              className="absolute inset-0 rounded-[16px] border border-[#A80D27]/30 pointer-events-none overflow-hidden select-none"
                              style={{
                                background: '#FFFFFF',
                                transform: `translateZ(${zOffset}px) rotateX(180deg)`,
                                backfaceVisibility: 'hidden',
                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 10px 25px rgba(0,0,0,0.15)',
                              }}
                            >
                              {/* Bahrain Flag Serrated Border on Left (Crimson red color) */}
                              <svg className="absolute inset-y-0 left-0 w-[20px] h-full" viewBox="0 0 24 100" preserveAspectRatio="none" fill="none">
                                <path d="M0,0 L24,0 L12,10 L24,20 L12,30 L24,40 L12,50 L24,60 L12,70 L24,80 L12,90 L24,100 L0,100 Z" fill="#A80D27" />
                              </svg>

                              {/* Details in JetBrains Mono & Serif */}
                              <div
                                className="absolute inset-0 pl-8 pr-4 py-4 sm:pl-10 sm:pr-5 sm:py-5 z-20 flex flex-col justify-between text-left text-bronze-charcoal"
                                style={{ fontFamily: '"JetBrains Mono", monospace' }}
                              >
                                {/* Coordinates as Card Identifier */}
                                <div className="font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.05em] text-[#A80D27] select-none">
                                  {spot.coords || '26.2285° N, 50.5860° E'}
                                </div>

                                {/* Middle traveler stamp watermark */}
                                <div className="my-auto opacity-10 flex justify-center items-center select-none">
                                  <svg className="w-16 h-16" viewBox="0 0 100 100" fill="none" stroke="#A80D27" strokeWidth="2">
                                    <circle cx="50" cy="50" r="40" strokeDasharray="4 4" />
                                    <path d="M50 20 L50 80 M20 50 L80 50" />
                                  </svg>
                                </div>

                                {/* Name and CVV details */}
                                <div className="font-mono text-[6.5px] sm:text-[7.5px] font-bold text-bronze-muted/80 tracking-wide flex items-center justify-between select-none">
                                  <div className="flex items-center gap-1.5 uppercase max-w-[180px] truncate">
                                    <span>{spot.name}</span>
                                    <span className="text-bronze-muted/40 font-light">•</span>
                                    <span className="italic font-serif text-[#A80D27]">{spot.arabic}</span>
                                  </div>
                                  <span className="font-bold text-[#A80D27]">DAY {spot.day || 1}</span>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return null
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Details Panel of Selected Spot */}
          <div className="w-full relative z-10 select-none animate-slideUpFade">
            {!itinerarySpots || itinerarySpots.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[200px] bg-[#FAF8F5] rounded-[24px] border border-amber-600/30">
                <span className="text-4xl animate-bounce">📭</span>
                <button
                  onClick={() => resetChronicle()}
                  className="px-5 py-2 rounded-xl border border-red-500/25 bg-white font-sans text-[10px] uppercase tracking-widest font-black text-bahrain-red cursor-pointer"
                >
                  🔄 Reset Settings
                </button>
              </div>
            ) : (
              (() => {
                const spot = itinerarySpots[carouselIndex]
                if (!spot) return null
                return (
                  <div
                    className="relative rounded-[24px] overflow-hidden flex flex-col border border-amber-600/25 bg-[#FAF8F5]/95 backdrop-blur-md select-none w-full"
                    style={{
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div className="p-5 flex flex-col justify-between relative min-h-[240px] text-left">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span
                            className="font-serif text-[10px] tracking-widest uppercase font-bold text-white py-1 px-3 rounded-full shrink-0"
                            style={{ background: 'linear-gradient(to right, #A80D27, #800A1E)' }}
                          >
                            Day {spot.day || 1} Stop
                          </span>
                          <span className="font-mono text-[8.5px] text-bronze-muted/65 tracking-wider uppercase font-bold">
                            {spot.period}
                          </span>
                        </div>

                        <h4 className="font-serif text-lg md:text-xl font-black text-bronze-charcoal tracking-tight leading-tight flex items-start gap-2">
                          <span className="text-xl shrink-0">{spot.keepsakeEmoji || '📍'}</span>
                          <span>{spot.name}</span>
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-serif text-xs italic text-[#A80D27] font-bold shrink-0">
                            {spot.arabic}
                          </span>
                          <span className="h-[1px] flex-1 bg-red-500/10" />
                          <span className="font-mono text-[8.5px] text-bronze-muted/50 tracking-wider">
                            {spot.coords}
                          </span>
                        </div>

                        <div className="bg-[#FCFBF8] border border-dashed border-[#A80D27]/18 rounded-xl p-3.5 mt-3 space-y-2.5 shadow-inner aged-paper-gradient">
                          <div>
                            <span className="font-sans text-[8.5px] tracking-[0.12em] text-[#A80D27] uppercase font-black block mb-0.5">
                              🗺️ Curated Local Guide Plan
                            </span>
                            <p className="font-serif text-[10.5px] leading-relaxed text-bronze-charcoal font-semibold select-text">
                              {spot.pathGuide}
                            </p>
                          </div>
                          <div className="pt-1.5 border-t border-red-500/5">
                            <span className="font-sans text-[8.5px] tracking-[0.12em] text-amber-600 uppercase font-black block mb-0.5">
                              🔍 What You Can Find Here
                            </span>
                            <p className="font-serif text-[10.5px] text-bronze-charcoal leading-relaxed font-semibold select-text">
                              {spot.simpleTerms}
                            </p>
                          </div>
                          <div className="pt-1.5 border-t border-red-500/5 flex justify-between items-center">
                            <span className="font-sans text-[8.5px] tracking-[0.12em] text-emerald-600 uppercase font-black shrink-0">
                              💰 Estimated Cost
                            </span>
                            <span className="font-serif text-[10.5px] text-emerald-700 font-bold select-text">
                              {spot.pathCost || spot.budgetCost || 'Free Entry'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-red-500/5">
                        <span className="text-[9px] font-sans font-bold text-bronze-muted/60 tracking-wider uppercase font-semibold">
                          💡 Tap active card to view details
                        </span>
                        <span className="text-[9px] font-sans font-bold text-[#A80D27]/80 tracking-wider uppercase flex items-center gap-1">
                          ↔️ Swipe card left/right to delete
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </div>

          {/* Indicators list & Action Buttons */}
          {itinerarySpots && itinerarySpots.length > 0 && (
            <div className="flex flex-col items-center gap-3 mt-1 select-none w-full animate-fadeIn shrink-0 z-10">
              <div className="flex items-center gap-2">
                {itinerarySpots.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playTypewriterClick(1.0)
                      goToIndex(idx)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === carouselIndex 
                        ? 'bg-[#A80D27] scale-120 shadow-sm' 
                        : 'bg-[#A80D27]/20 hover:bg-[#A80D27]/40'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-2 w-full flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    playTypewriterClick(0.85)
                    if (onBack) onBack()
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#A80D27]/15 hover:bg-[#A80D27]/5 text-bronze-charcoal font-bold text-xs tracking-wider transition-all cursor-pointer active:scale-95 select-none"
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
                      contentRef.current.style.transition = 'opacity 0.55s ease, transform 0.55s ease'
                      contentRef.current.style.opacity = '0'
                      contentRef.current.style.transform = 'scale(0.94) translateY(15px)'
                    }
                    setTimeout(() => {
                      setStep(5)
                      setSealing(false)
                    }, 580)
                  }}
                  className={`group relative py-2.5 px-6 rounded-xl bg-gradient-to-b from-[#BA0C2F] to-[#8A0A22] text-white font-sans text-xs uppercase tracking-widest font-black flex items-center gap-2 border border-red-400/20 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 ${sealing ? 'cursor-not-allowed opacity-70' : ''}`}
                  style={{
                    boxShadow: '0 8px 20px rgba(138,10,34,0.25), inset 0 1px 1px rgba(255,255,255,0.2)'
                  }}
                >
                  <span>{sealing ? '⏳' : '📜'}</span>
                  <span>{sealing ? 'Sealing...' : 'Confirm Chronicle'}</span>
                  {!sealing && <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* STAGE 2: LOADING LEDGER SCREEN */
        <div 
          key="compiling-screen"
          ref={contentRef}
          className="relative w-full max-w-md md:max-w-5xl rounded-[28px] overflow-visible journal-open-book grid grid-cols-1 md:grid-cols-2 bg-[#FAF9F6] shadow-2xl min-h-[380px] md:min-h-[460px] animate-screenEntry"
        >
          <div className="book-corner-clip top-left" />
          <div className="book-corner-clip top-right" />
          <div className="book-corner-clip bottom-left" />
          <div className="book-corner-clip bottom-right" />
          <div className="journal-center-spine pointer-events-none hidden md:block" />

          <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="absolute pointer-events-none" style={{ top: `${9 + idx * 13.5}%`, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
                <div className="binder-ring-shadow" style={{ top: '2px' }} />
                <div className="binder-ring" />
              </div>
            ))}
          </div>

          {/* LEFT PAGE */}
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

            <div className="md:hidden w-full max-w-[280px] bg-[#FCFBF8] border border-dashed border-[#A80D27]/18 rounded-xl p-3 shadow-inner mt-1 max-h-[30vh] overflow-y-auto antique-scrollbar">
              <span className="font-sans text-[7.5px] tracking-[0.2em] text-[#A80D27] uppercase font-black block mb-1 sticky top-0 bg-[#FCFBF8]">
                ⏳ Live Curation Log
              </span>
              <div className="space-y-1">
                {terminalLogs && terminalLogs.length > 0 ? terminalLogs.slice(-8).map((log, i) => (
                  <p key={i} className="font-mono text-[9px] leading-relaxed text-bronze-charcoal font-semibold opacity-80">
                    {log}
                  </p>
                )) : (
                  <p className="font-mono text-[9.5px] leading-relaxed text-bronze-charcoal font-bold min-h-[36px] flex items-center justify-center">
                    Assembling Passage...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PAGE */}
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

              <div 
                className="flex-1 overflow-y-auto p-4 rounded-xl border border-dashed border-red-500/15 bg-[#FCFBF8] space-y-2.5 font-mono text-[10.5px] leading-relaxed text-bronze-charcoal shadow-inner"
                style={{ maxHeight: '300px' }}
              >
                {terminalLogs && terminalLogs.map((log, idx) => {
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
