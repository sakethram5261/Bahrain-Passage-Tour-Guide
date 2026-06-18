/**
 * JournalNotebook.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * "Bahrain Passage" — Premium Mobile-First Digital Travel Journal
 *
 * Layout Structure:
 *   • Mobile: Single-column layout showing active tab content.
 *   • Desktop: Dual-page layout where Left Page = Active Spot Info / Seal Day,
 *              and Right Page = Active Sub-Tab (Itinerary, Map, Souvenirs, Phrases).
 *
 * Tab list:
 *   📝 Info · 📍 Itinerary · 🗺️ Map · 🪙 Souvenirs · 📜 Phrases
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { useItinerary, spotsCatalog } from '../hooks/useItinerary'
import VirtualTour from './VirtualTour'
import WayfarerLens from './WayfarerLens'
import PassportCard from './PassportCard'
import MapSkeleton from './skeletons/MapSkeleton'
import { 
  shopItems, 
  getAlmanac, 
  getRank, 
  RIDDLES 
} from './DashboardData'
import { hasVirtualTour, getTourIndexForSpot } from './VirtualTour'
import AIHotelPanel, { HOTELS_DB } from './AIHotelPanel'
import LangToggle from './LangToggle'
import { useLang } from '../context/LangContext'

const WayfarerMap = lazy(() => import('./WayfarerMap'))
const TourChatbot = lazy(() => import('./TourChatbot'))


/* ─── Tabs definition ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'info',       label: 'Today',    emoji: '📅' },
  { id: 'itinerary',  label: 'Route',    emoji: '📍' },
  { id: 'map',        label: 'Map',      emoji: '🗺️' },
  { id: 'hotels',     label: 'Hotels',   emoji: '🏨' },
  { id: 'souvenirs',  label: 'Souvenirs',emoji: '🪙' },
  { id: 'phrasebook', label: 'Phrases',  emoji: '📜' },
]




const PHRASES = [
  { label: 'Karak',  arabic: 'كَرَّكْ',  desc: "Bahrain's signature robust spiced condensed-milk tea.", pitchOffset: 0 },
  { label: 'Halwa',  arabic: 'حَلْوَى', desc: 'Saffron sweet jelly cooked in copper vats with almonds.', pitchOffset: 35 },
  { label: 'Souq',   arabic: 'سُوقْ',   desc: 'Ancient maze-like merchant alleyways of Old Manama.', pitchOffset: -15 },
  { label: 'Dallah', arabic: 'دَلَّهْ', desc: 'Long-beaked brass coffee pot used to brew Arabic coffee.', pitchOffset: 60 },
  { label: 'Marhaba',arabic: 'مَرْحَبَاً',desc: 'Welcome / Hello — the warmest Bahraini greeting.',  pitchOffset: -20 },
  { label: 'Shukran',arabic: 'شُكْرَاً', desc: 'Thank you — essential courtesy in any market.',       pitchOffset: 10 },
]

/* ─── Tiny physics spring for XP counter ────────────────────────────────────*/
function useSpring(target, stiffness = 180, damping = 22) {
  const [value, setValue] = useState(target)
  const velocity = useRef(0)
  const current  = useRef(target)
  const rafId    = useRef(null)

  const animate = useCallback(() => {
    const tick = () => {
      const dt    = 1 / 60
      const force = stiffness * (target - current.current)
      velocity.current += force * dt
      velocity.current *= 1 - damping * dt
      current.current  += velocity.current * dt
      setValue(current.current)
      if (Math.abs(target - current.current) > 0.01 || Math.abs(velocity.current) > 0.01) {
        rafId.current = requestAnimationFrame(tick)
      }
    }
    tick()
  }, [target, stiffness, damping])

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId.current)
  }, [animate])

  return Math.round(value)
}

/* ─── Phrase pronunciation (Web Audio API) ───────────────────────────────── */
function playPhrase(phraseText) {
  // 1. Play standard organic click feedback tone
  try {
    const AC  = window.AudioContext || window.webkitAudioContext
    if (AC) {
      const ctx  = new AC()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(330, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.22)
    }
  } catch { /* ignore */ }

  // 2. Perform high-fidelity browser speech synthesis in Arabic
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any current utterance
      const utterance = new SpeechSynthesisUtterance(phraseText)
      utterance.lang = 'ar-BH' // Bahraini Arabic locale
      
      const voices = window.speechSynthesis.getVoices()
      const arabicVoice = voices.find(v => v.lang.startsWith('ar'))
      if (arabicVoice) {
        utterance.voice = arabicVoice
      }
      utterance.rate = 0.82 // Slightly slower rate for clear tourist learning
      window.speechSynthesis.speak(utterance)
    }
  } catch (e) {
    console.error('SpeechSynthesis error:', e)
  }
}

export default function JournalNotebook({ onBack }) {
  /* ── Context integration ────────────────────────────────────────────────── */
  const {
    selectedMoods = [],
    tier = 'Wandering',
    duration = 3,
    curatedItinerary = null,
    currentDayTab = 1,
    setCurrentDayTab = () => {},
    unlockedDays = [1],
    completedDays = [],
    completeDay = () => {},
    currentSpotIndex = 0,
    setCurrentSpotIndex = () => {},
    capturedPhotos = {},
    collectedKeepsakes = [],
    solvedRiddles = {},
    solveRiddle = () => {},
    goldFils = 0,
    spendFils = () => {},

    xp = 0,
    awardXP = () => {},
    soundVolume = 0.5,
    soundMuted = false,
    journalReflections = {},
    saveJournalReflection = () => {},
    showPassportCard = false,
    setShowPassportCard = () => {},
    selectedHotel,
    setSelectedHotel,
    playOrganicPageSwish,
  } = useVibe() || {}

  /* ── Language + Toast context ──────────────────────────────────────────── */
  const { lang, isRTL } = useLang()

  /* ── Dynamic itinerary loading ──────────────────────────────────────────── */
  const { locations = [], loading = false } = useItinerary(selectedMoods, tier, duration, curatedItinerary)
  
  // Filter spots active on the current selected day tab
  const activeSpots = locations.filter(s => s.day === currentDayTab)
  const hasSpots = activeSpots.length > 0
  const isSealStep = hasSpots && currentSpotIndex >= activeSpots.length
  const safeSpotIndex = currentSpotIndex >= activeSpots.length ? 0 : currentSpotIndex
  const activeSpot = !isSealStep && hasSpots ? activeSpots[safeSpotIndex] : null

  /* ── Local UI state ──────────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState('info')
  const [tabKey,       setTabKey]       = useState(0)       // bumped on every switch → remount → fresh anim
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [chatOpen,     setChatOpen]     = useState(false)   // AI chatbot panel
  

  // Modals & overlay states
  const [mapOpen,         setMapOpen]         = useState(false)
  const [tourOpen,        setTourOpen]        = useState(false)
  const [lensOpenSpot,    setLensOpenSpot]    = useState(null)
  const [shopOpen,        setShopOpen]        = useState(false)
  const [shopAlert,       setShopAlert]       = useState(null)
  const [riddleModalOpen, setRiddleModalOpen] = useState(false)
  const [imageErrors,     setImageErrors]     = useState({})
  const [baseCampPromptOpen, setBaseCampPromptOpen] = useState(false)
  const [quickInfoOpen, setQuickInfoOpen] = useState(false)
  const [selectedKsake, setSelectedKsake] = useState(null)

  useEffect(() => {
    if (!selectedHotel) {
      const timer = setTimeout(() => {
        setBaseCampPromptOpen(true)
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [selectedHotel])

  // Stamping and rank-up states
  const [stamping, setStamping] = useState(false)
  const [unlockedRankInfo, setUnlockedRankInfo] = useState(null)
  const [showRankUpModal, setShowRankUpModal] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  
  const prevRankIdRef = useRef(null)
  const rank = getRank(xp)

  const stampRef = useRef(null)
  const inkRef = useRef(null)
  const shockwaveRef = useRef(null)
  const boxRef = useRef(null)

  /* ── Spring XP display ───────────────────────────────────────────────────── */
  const displayXP = useSpring(xp, 120, 18)

  /* ── Sound effects helper ────────────────────────────────────────────────── */
  const playTypewriterClick = (pitchMultiplier = 1.0) => {
    if (soundMuted) return
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      const ctx = new AC()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      
      osc.type = 'sine'
      const startFreq = 1100 * pitchMultiplier
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(500, ctx.currentTime)
      filter.Q.setValueAtTime(5, ctx.currentTime)
      
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.12 * soundVolume, ctx.currentTime + 0.003)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)
      
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch { /* ignore */ }
  }

  /* ── Rank up detection ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (prevRankIdRef.current === null) {
      prevRankIdRef.current = rank.id
      return
    }
    if (rank.id !== prevRankIdRef.current) {
      setUnlockedRankInfo(rank)
      setShowRankUpModal(true)
      prevRankIdRef.current = rank.id
      
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC && !soundMuted) {
          const ctx = new AC()
          const playNote = (freq, delay, dur) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
            gain.gain.setValueAtTime(0, ctx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(0.2 * soundVolume, ctx.currentTime + delay + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur - 0.05)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(ctx.currentTime + delay)
            osc.stop(ctx.currentTime + delay + dur)
          }
          playNote(261.63, 0, 0.2) // C4
          playNote(329.63, 0.15, 0.2) // E4
          playNote(392.00, 0.3, 0.2) // G4
          playNote(523.25, 0.45, 0.5) // C5
        }
      } catch { /* ignore */ }
    }
  }, [rank, soundMuted, soundVolume])

  const triggerCoinFlyout = (startX, startY) => {
    const statsEl = document.querySelector('.jn-xp-pill') || document.querySelector('.jn-header-right')
    if (!statsEl) return

    const rect = statsEl.getBoundingClientRect()
    const targetX = rect.left + rect.width / 2
    const targetY = rect.top + rect.height / 2

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const coin = document.createElement('div')
        coin.innerHTML = '🪙'
        coin.style.position = 'fixed'
        coin.style.left = `${startX}px`
        coin.style.top = `${startY}px`
        coin.style.zIndex = '9999'
        coin.style.pointerEvents = 'none'
        coin.style.fontSize = '18px'
        document.body.appendChild(coin)

        const midX = startX + (targetX - startX) * 0.4 + (Math.random() - 0.5) * 120
        const midY = startY + (targetY - startY) * 0.4 - 100 - Math.random() * 50

        gsap.timeline({
          onComplete: () => {
            coin.remove()
            gsap.fromTo(statsEl, { scale: 1.05 }, { scale: 1, duration: 0.2, ease: 'power2.out' })
          }
        })
        .to(coin, {
          x: midX - startX,
          y: midY - startY,
          scale: 1.3,
          duration: 0.35,
          ease: 'power1.out'
        })
        .to(coin, {
          x: targetX - startX,
          y: targetY - startY,
          scale: 0.7,
          opacity: 0.5,
          duration: 0.45,
          ease: 'power2.in'
        })
      }, i * 75)
    }
  }

  useEffect(() => {
    if (stamping && stampRef.current && inkRef.current && shockwaveRef.current) {
      gsap.set(stampRef.current, { y: -180, scale: 2, rotation: -15, opacity: 0 })
      gsap.set(inkRef.current, { opacity: 0, scale: 0.9 })
      gsap.set(shockwaveRef.current, { scale: 0.2, opacity: 0 })

      const tl = gsap.timeline()

      tl.to(stampRef.current, {
        y: 0,
        scale: 1,
        rotation: 5,
        opacity: 1,
        duration: 0.32,
        ease: 'back.in(1.2)'
      })
      
      tl.add(() => {
        if (boxRef.current) {
          const shakeTl = gsap.timeline()
          shakeTl.to(boxRef.current, { y: -4, duration: 0.05 })
                 .to(boxRef.current, { y: 3, duration: 0.05 })
                 .to(boxRef.current, { y: -2, duration: 0.05 })
                 .to(boxRef.current, { y: 1, duration: 0.05 })
                 .to(boxRef.current, { y: 0, duration: 0.05 })
        }
        gsap.to(inkRef.current, { opacity: 0.92, scale: 1, duration: 0.05 })
        gsap.fromTo(shockwaveRef.current, 
          { scale: 0.8, opacity: 1 }, 
          { scale: 2.8, opacity: 0, duration: 0.45, ease: 'power2.out' }
        )
      })

      tl.to(stampRef.current, {
        y: -180,
        scale: 1.3,
        rotation: -8,
        opacity: 0,
        duration: 0.42,
        delay: 0.25,
        ease: 'power3.out'
      })
    }
  }, [stamping])

  /* ── Reflection Note Debounce ────────────────────────────────────────────── */
  const [localReflection, setLocalReflection] = useState('')
  const reflectionDebounceRef = useRef(null)

  useEffect(() => {
    queueMicrotask(() => {
      if (activeSpot) {
        setLocalReflection(journalReflections[activeSpot.id] || '')
      } else {
        setLocalReflection('')
      }
    })
  }, [activeSpot?.id, journalReflections])

  const handleReflectionChange = (e) => {
    const val = e.target.value
    setLocalReflection(val)
    playTypewriterClick()
    
    if (reflectionDebounceRef.current) {
      clearTimeout(reflectionDebounceRef.current)
    }
    reflectionDebounceRef.current = setTimeout(() => {
      if (activeSpot) {
        saveJournalReflection(activeSpot.id, val)
      }
    }, 400)
  }

  /* ── Tab switch ──────────────────────────────────────────────────────────── */
  const switchTab = (tab, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    if (tab === activeTab) return

    if (playOrganicPageSwish) {
      playOrganicPageSwish()
    }

    setActiveTab(tab)
    setTabKey(k => k + 1)
    setMenuOpen(false)
  }

  /* ── Day Sealing ─────────────────────────────────────────────────────────── */
  const isDayCompleted = completedDays.includes(currentDayTab)
  
  const handleSealDay = (e) => {
    setStamping(true)
    
    const rect = e?.currentTarget?.getBoundingClientRect()
    const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    
    if (!soundMuted) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC) {
          const ctx = new AC()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(90, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.25)
          gain.gain.setValueAtTime(0, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0.24 * soundVolume, ctx.currentTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.3)
        }
      } catch { /* ignore */ }
    }

    setTimeout(() => {
      triggerCoinFlyout(startX, startY)
    }, 350)

    setTimeout(() => {
      completeDay(currentDayTab)
      setStamping(false)
    }, 1100)
  }

  /* ── Riddle solver state ─────────────────────────────────────────────────── */
  const [riddleAnswer, setRiddleAnswer] = useState(null)
  const [riddleError, setRiddleError] = useState(null)

  useEffect(() => {
    queueMicrotask(() => {
      setRiddleAnswer(null)
      setRiddleError(null)
      setRiddleModalOpen(false)
    })
  }, [activeSpot?.id])

  const handleAnswerRiddle = (idx) => {
    if (!activeSpot) return
    const riddle = RIDDLES[activeSpot.id]
    if (!riddle) return

    setRiddleAnswer(idx)
    if (idx === riddle.correct) {
      const activeEl = document.activeElement
      const rect = activeEl ? activeEl.getBoundingClientRect() : null
      const startX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
      const startY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC && !soundMuted) {
          const ctx = new AC()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(440, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0.15 * soundVolume, ctx.currentTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.3)
        }
      } catch { /* ignore */ }
      
      setTimeout(() => {
        triggerCoinFlyout(startX, startY)
      }, 100)
      
      setTimeout(() => {
        solveRiddle(activeSpot.id)
      }, 700)
    } else {
      try {
        const AC = window.AudioContext || window.webkitAudioContext
        if (AC && !soundMuted) {
          const ctx = new AC()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(120, ctx.currentTime)
          gain.gain.setValueAtTime(0, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0.2 * soundVolume, ctx.currentTime + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.25)
        }
      } catch { /* ignore */ }
      
      setRiddleError("Wrong answer, traveler! Read the guide comments closely.")
      setTimeout(() => {
        setRiddleAnswer(null)
        setRiddleError(null)
      }, 1500)
    }
  }

  /* ── Shop purchase ───────────────────────────────────────────────────────── */
  const handleBuyItem = (item) => {
    if (goldFils < item.cost) {
      setShopAlert({ success: false, text: `Not enough Fils! You have ${goldFils.toLocaleString()} Fils.` })
      return
    }
    if (spendFils(item.cost)) {
      awardXP(item.xpReward || 20, `Bought ${item.name}`)
      setShopAlert({ success: true, text: `✅ Purchased ${item.name}! +${item.xpReward || 20} XP` })
    }
  }

  /* ── Keyboard: Escape closes overlays ────────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setMapOpen(false)
        setTourOpen(false)
        setLensOpenSpot(null)
        setShopOpen(false)
        setSelectedKsake(null)
        setBaseCampPromptOpen(false)
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  /* ── Almanac data ─────────────────────────────────────────────────────────── */
  const almanac = getAlmanac ? getAlmanac() : { metrics: [] }

  /* ── Spot Details Helper ──────────────────────────────────────────────────── */
  const renderSpotDetails = () => {
    if (!activeSpot) return null
    return (
      <div className="space-y-5">
        <p className="jn-description">{activeSpot.desc}</p>

        {/* Action buttons row — Lens capture, virtual tour, riddle */}
        <div className="jn-action-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', marginBottom: '14px' }}>
          <button
            className="jn-action-btn jn-action-btn--primary"
            onClick={() => setLensOpenSpot(activeSpot)}
            aria-label="Open camera lens simulator to capture photo"
            style={{ flex: '1 1 120px' }}
          >
            {capturedPhotos[activeSpot.id] ? 'Retake Photo' : 'Capture Photo'}
          </button>
          {hasVirtualTour(activeSpot.id) && (
            <button
              className="jn-action-btn jn-action-btn--ghost"
              onClick={() => setTourOpen(true)}
              aria-label="Open virtual tour clip"
              style={{ flex: '1 1 120px' }}
            >
              Virtual Tour
            </button>
          )}
        </div>

        {/* What You Can Find Here */}
        <div className="jn-insider-box" role="complementary" aria-label="What you can find here">
          <span className="jn-tag jn-tag--red">What to See</span>
          <p className="jn-insider-text">{activeSpot.simpleTerms}</p>
        </div>

        {/* Estimated Cost / Budget */}
        <div className="jn-insider-box" style={{ background: '#fffdf9', border: '1px solid var(--jn-gold-muted)', padding: '15px' }} role="complementary" aria-label="Estimated Cost / Budget">
          <span className="jn-tag jn-tag--green">Estimated Cost</span>
          <p className="jn-insider-text" style={{ fontWeight: 'bold', marginTop: '5px' }}>
            {activeSpot.pathCost || activeSpot.budgetCost || 'Free Entry'}
          </p>
        </div>

        {/* Journal reflections textarea */}
        <div style={{ marginBottom: 'var(--jn-sp-lg)' }}>
          <label
            htmlFor={`reflection-${activeSpot.id}`}
            style={{
              display: 'block',
              fontFamily: 'var(--jn-font-sans)',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--jn-crimson)',
              marginBottom: '6px',
            }}
          >
            My Notes
          </label>
          <textarea
            id={`reflection-${activeSpot.id}`}
            value={localReflection}
            onChange={handleReflectionChange}
            placeholder="Jot down your thoughts, observations, or memories from this spot…"
            rows={3}
            style={{
              width: '100%',
              fontFamily: 'var(--jn-font-serif)',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--jn-ink)',
              background: '#fffdf9',
              border: '1px solid rgba(193,18,47,0.15)',
              borderRadius: 'var(--jn-r-md)',
              padding: '10px 14px',
              resize: 'none',
              outline: 'none',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--jn-crimson)'}
            onBlur={e => e.target.style.borderColor = 'rgba(193,18,47,0.15)'}
          />
        </div>

        {/* Riddle Quest */}
        {RIDDLES[activeSpot.id] && (
          <div className="p-4 rounded-xl border border-red-500/10 shadow-sm relative overflow-hidden bg-white/70">
            <div className="flex justify-between items-center mb-2 select-none">
              <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold flex items-center gap-1">
                Riddle
              </span>
              {solvedRiddles[activeSpot.id] ? (
                <span className="text-[8px] bg-green-100 text-green-800 font-extrabold px-1.5 py-0.5 rounded-full">
                  ✓ Solved (+35 XP)
                </span>
              ) : (
                <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  Unsolved (+35 XP)
                </span>
              )}
            </div>

            <p className="font-serif text-[10.5px] text-bronze-charcoal leading-relaxed font-bold mb-3">
              "{RIDDLES[activeSpot.id].question}"
            </p>

            {solvedRiddles[activeSpot.id] ? (
              <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1">
                <p className="font-sans text-[8px] uppercase tracking-wider text-green-700 font-extrabold select-none">Insider Discovery Reveal:</p>
                <p className="font-serif text-[9.5px] text-bronze-charcoal leading-relaxed italic font-semibold">
                  {RIDDLES[activeSpot.id].insider}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {RIDDLES[activeSpot.id].options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerRiddle(oIdx)}
                    className="w-full p-2 text-left rounded-lg border border-red-500/10 hover:border-bahrain-red bg-white hover:bg-red-500/5 text-[9px] font-sans font-bold text-bronze-charcoal transition-all cursor-pointer active:scale-99"
                  >
                    {opt}
                  </button>
                ))}
                {riddleError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-sans text-[9px] font-bold animate-scaleIn select-none">
                    ❌ {riddleError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Next Itinerary Item Button */}
        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed rgba(186,12,47,0.15)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              const nextIndex = currentSpotIndex + 1
              setCurrentSpotIndex(nextIndex)
              playTypewriterClick(1.05)
              if (window.innerWidth < 768) {
                setActiveTab('info')
              }
              setTimeout(() => {
                const el = document.getElementById('panel-tabs') || window
                el.scrollTo({ top: 0, behavior: 'smooth' })
              }, 50)
            }}
            className="jn-action-btn jn-action-btn--primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {currentSpotIndex === activeSpots.length - 1 ? 'Go to Sealing Chamber 🔒' : `Next Itinerary Item ${isRTL ? '←' : '➜'}`}
          </button>
        </div>
      </div>
    )
  }

  /* RENDER */
  return (
    <div className="jn-root" role="main" aria-label="Bahrain Passage Journal Notebook">


      {/* ── Fixed minimal header ────────────────────────────────────────────── */}
      <header className="jn-header" role="banner">
        {/* Slim Utility Bar */}
        <div className="jn-header-inner">
          <div className="jn-brand" onClick={onBack} style={{ cursor: onBack ? 'pointer' : 'default' }}>
            <span className="jn-brand-title">
              Bahrain <em>Passage</em>
            </span>
            <span className="jn-brand-arabic" lang="ar">
              مملكة البحرين
            </span>
          </div>

          <div className="jn-header-right" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* XP progress pill */}
            <div className="jn-xp-pill" aria-label={`${displayXP} XP earned`}>
              <span className="jn-xp-icon">⚡</span>
              <span className="jn-xp-num">{displayXP} XP</span>
            </div>

            {/* Passport card trigger */}
            <button
              onClick={() => setShowPassportCard(true)}
              className="jn-utility-btn-rank"
              title="View Explorer Passport"
            >
              <span>🗺️</span>
              <span>{rank.label}</span>
            </button>

            {/* Edit trip / back */}
            {onBack && (
              <button
                onClick={onBack}
                className="jn-utility-btn jn-utility-btn--edit"
                title="Adjust vibe settings"
              >
                {isRTL ? 'Edit ➜' : '← Edit'}
              </button>
            )}
          </div>
        </div>
      </header>


      {/* ── Mobile menu: back only, no separate overlay needed ── */}
      {menuOpen && (
        <div
          id="jn-mobile-menu"
          className="jn-mobile-menu jn-mobile-menu--open"
          role="dialog"
          aria-modal="true"
          aria-label="More options"
        >
          {activeSpot && hasVirtualTour(activeSpot.id) && (
            <button className="jn-mob-nav-btn" onClick={() => { setTourOpen(true); setMenuOpen(false) }}>
              🎬 Virtual Tour
            </button>
          )}
          {onBack && (
            <button className="jn-mob-nav-btn jn-mob-nav-btn--back" onClick={onBack}>
              {isRTL ? 'Adjust Vibe Settings ➜' : '← Adjust Vibe Settings'}
            </button>
          )}
        </div>
      )}
      {menuOpen && <div className="jn-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}


      {/* ── Main content area with binder ring system ───────────────────────── */}
      <div className="jn-body">

        {/* ── INTEGRATED PAGE NAVIGATION (Tabbed System for Book UI) ── */}
        <div className="jn-book-tabs-container">
          <nav className="jn-book-tabs" role="tablist" aria-label="Journal sections">
            {TABS.map(t => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={activeTab === t.id}
                aria-controls={`panel-${t.id}`}
                className={`jn-book-tab-pill ${activeTab === t.id ? 'active' : ''}`}
                onClick={(e) => switchTab(t.id, e)}
              >
                <span className="jn-tab-emoji">{t.emoji}</span>
                <span className="jn-tab-label">{t.label}</span>
                {t.id === 'souvenirs' && collectedKeepsakes.length > 0 && (
                  <span className="jn-tab-badge">
                    {collectedKeepsakes.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <main className="jn-book">
          
          {/* ════════════════════ LEFT PAGE: INFO & LANDMARK ════════════════════ */}
          <div 
            className={`jn-page jn-page--left jn-page-tactile ${
              activeTab === 'info' ? 'jn-page--visible' : 'jn-page--hidden'
            }`}
            id="panel-info" 
            role="tabpanel" 
            aria-labelledby="tab-info"
          >
            <div key={tabKey} className="jn-page-anim-wrap">
              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <span className="jn-tag jn-tag--amber animate-pulse">⏳ Loading...</span>
                </div>
              ) : !hasSpots ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }} className="space-y-4">
                  <span style={{ fontSize: '40px', display: 'block' }}>🏜️</span>
                  <h3 className="jn-section-title" style={{ textAlign: 'center' }}>No landmarks on custom route</h3>
                  <p className="jn-description" style={{ textAlign: 'center' }}>
                    Adjust your settings to assemble an authentic itinerary matching your vibes.
                  </p>
                  {onBack && (
                    <button className="jn-action-btn jn-action-btn--primary" onClick={onBack}>
                      Adjust Vibe Settings
                    </button>
                  )}
                </div>
              ) : isSealStep ? (
                /* ─── SEAL DAY PANEL ─── */
                <div className="space-y-6" style={{ padding: '10px 0' }}>
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Chapter Sealed</h2>
                    <span className="jn-section-subtitle">Day {currentDayTab} Passkey verification</span>
                  </div>
                  
                  <hr className="jn-divider" aria-hidden="true" />
                  
                  <div ref={boxRef} style={{ position: 'relative', overflow: 'hidden' }} className="jn-insider-box">
                    
                    {stamping && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,249,246,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        {/* Shockwave ring */}
                        <div ref={shockwaveRef} className="jn-stamp-shockwave" style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--jn-gold)', opacity: 0, pointerEvents: 'none', zIndex: 5 }} />

                        {/* Dilmun Wax Seal Imprint */}
                        <div 
                          ref={inkRef} 
                          className="jn-wax-seal" 
                          style={{ opacity: 0 }}
                        >
                          <span style={{ fontSize: '7px', fontWeight: 900 }}>Dilmun Seal</span>
                          <div className="jn-wax-seal-label">Day {currentDayTab}</div>
                        </div>

                        {/* Physical stamp handle */}
                        <div ref={stampRef} style={{ position: 'absolute', pointerEvents: 'none', zIndex: 20, transform: 'scale(2) translateY(-200px)' }}>
                          <svg width="80" height="120" viewBox="0 0 80 120" style={{ filter: 'drop-shadow(0 15px 10px rgba(0,0,0,0.35))' }}>
                            <path d="M40,10 C25,10 20,30 30,50 L34,80 L46,80 L50,50 C60,30 55,10 40,10 Z" fill="#8B5A2B" stroke="#5C3815" strokeWidth="2" />
                            <rect x="25" y="80" width="30" height="15" rx="3" fill="#D4AF37" stroke="#AA7C11" strokeWidth="1.5" />
                            <ellipse cx="40" cy="95" rx="20" ry="8" fill="#AA7C11" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {!isDayCompleted ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px' }} className="space-y-4">
                        <span style={{ fontSize: '40px', display: 'block' }}>🔒</span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '18px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Complete Day {currentDayTab}
                        </h4>
                        <p className="jn-description" style={{ textAlign: 'center', fontSize: '12px' }}>
                          You've visited all locations. Seal this chapter to earn the insider reward.
                        </p>
                        <button
                          onClick={handleSealDay}
                          className="jn-action-btn jn-action-btn--primary"
                        >
                           Seal Day
                        </button>
                      </div>
                    ) : (
                      <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span className="jn-tag jn-tag--green" style={{ display: 'inline-flex' }}>✓ Day {currentDayTab} Verified</span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '16px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Traditional Insider Passkey:
                        </h4>
                        <div style={{ background: 'rgba(193,18,47,0.04)', border: '1px dashed var(--jn-crimson-mid)', padding: '15px', paddingRight: '75px', borderRadius: '12px', position: 'relative' }}>
                          <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--jn-ink-muted)' }}>
                            {currentDayTab === 1 && 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.'}
                            {currentDayTab === 2 && 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.'}
                            {currentDayTab === 3 && 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.'}
                            {currentDayTab === 4 && 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.'}
                            {currentDayTab === 5 && 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.'}
                          </p>
                          <button
                            onClick={() => {
                              const keys = {
                                1: 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.',
                                2: 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.',
                                3: 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.',
                                4: 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.',
                                5: 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.'
                              };
                              navigator.clipboard.writeText(keys[currentDayTab] || '');
                              setCopiedKey(true);
                              setTimeout(() => setCopiedKey(false), 2000);
                            }}
                            className="pointer-events-auto"
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: copiedKey ? '#2e7d32' : 'var(--jn-crimson)',
                              color: '#fff',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              zIndex: 10,
                              transition: 'all 0.2s ease',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            {copiedKey ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>

                        {/* Ink stamp render */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                          <div style={{
                            width: '110px',
                            height: '110px',
                            borderRadius: '50%',
                            border: '4px double #1b5e20',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'rotate(-8deg)',
                            color: '#1b5e20',
                            background: 'rgba(27, 94, 32, 0.04)',
                            boxShadow: '0 0 0 3px rgba(27, 94, 32, 0.05)',
                            lineHeight: '1.1',
                            userSelect: 'none'
                          }}>
                            <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em' }}>KINGDOM OF BAHRAIN</span>
                            <span style={{
                              fontFamily: 'var(--jn-font-sans)',
                              fontSize: '9.5px',
                              fontWeight: 900,
                              textTransform: 'uppercase',
                              borderTop: '1px solid #1b5e20',
                              borderBottom: '1px solid #1b5e20',
                              padding: '2px 3px',
                              margin: '3px 0',
                              letterSpacing: '0.04em'
                            }}>
                              ENTRY APPROVED
                            </span>
                            <span style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '9px', fontWeight: 800 }}>DAY {currentDayTab} SEAL</span>
                          </div>
                        </div>

                        {/* Next day button */}
                        {currentDayTab < duration && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', borderTop: '1px dashed rgba(186,12,47,0.15)', paddingTop: '20px' }}>
                            <button
                              onClick={() => {
                                setCurrentDayTab(currentDayTab + 1)
                                setCurrentSpotIndex(0)
                                playTypewriterClick(1.1)
                                if (window.innerWidth < 768) {
                                  setActiveTab('info')
                                }
                                setTimeout(() => {
                                  const el = document.getElementById('panel-tabs') || window
                                  el.scrollTo({ top: 0, behavior: 'smooth' })
                                }, 50)
                              }}
                              className="jn-action-btn jn-action-btn--primary animate-pulse"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px',
                                fontSize: '12px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Start Day {currentDayTab + 1} Journey {isRTL ? '←' : '➜'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeSpot ? (
                /* ─── ACTIVE SPOT SHOWN ─── */
                <div className="space-y-5">
                  {/* Hero postcard stamp */}
                  <figure className="jn-hero-stamp" aria-label={`${activeSpot.name} vintage postage stamp`}>
                    {!activeSpot.image || imageErrors[activeSpot.id] ? (
                      <div className="jn-hero-fallback-stamp">
                        <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                          {activeSpot.keepsakeEmoji || '🗺️'}
                        </div>
                        <span className="jn-tag jn-tag--red" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {activeSpot.category || 'Archipelago'}
                        </span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '15px', fontWeight: 'bold', color: 'var(--jn-ink)', margin: '4px 0' }}>
                          {activeSpot.name}
                        </h4>
                        <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '12px', color: 'var(--jn-ink-faint)', textTransform: 'uppercase', fontWeight: '600' }}>
                          {activeSpot.period}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={activeSpot.image}
                        alt={activeSpot.name}
                        className="jn-hero-img"
                        loading="eager"
                        onError={() => {
                          setImageErrors(prev => ({ ...prev, [activeSpot.id]: true }))
                        }}
                      />
                    )}
                    <div className="jn-stamp-postmark" aria-hidden="true">
                      <span className="jn-postmark-text">{activeSpot.category?.toUpperCase() || 'BAHRAIN'}</span>
                      <span className="jn-postmark-sub">ARCHIPELAGO</span>
                    </div>
                  </figure>

                  {/* Title block */}
                  <div className="jn-spot-header">
                    <div>
                      <span className="jn-period-tag">{activeSpot.period}</span>
                      <h2 className="jn-spot-name">{activeSpot.name}</h2>
                      <p className="jn-coords" aria-label={`GPS: ${activeSpot.coords}`}>
                        {activeSpot.coords}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeSpot.name + ' ' + activeSpot.coords)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="jn-maps-link pointer-events-auto"
                          style={{
                            marginLeft: '10px',
                            color: 'var(--jn-crimson)',
                            textDecoration: 'underline',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Open in Maps
                        </a>
                      </p>
                    </div>
                    <span className="jn-arabic" lang="ar">{activeSpot.arabic}</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* On desktop: hide details on left page (rendered on right page instead) */}
                  <div className="jn-desktop-hidden-details">
                    {renderSpotDetails()}
                  </div>
                </div>
              ) : null}
              <div className="jn-page-footer-spacer" />
            </div>
          </div>

          {/* ════════════════════ RIGHT PAGE: TAB STRIP SELECTIVE ════════════════ */}
          <div 
            className={`jn-page jn-page--right jn-page-tactile ${
              activeTab !== 'info' ? 'jn-page--visible' : 'jn-page--hidden'
            }`}
            id="panel-tabs" 
            role="tabpanel"
          >
            <div key={tabKey} className="jn-page-anim-wrap">
              
              {/* Mobile-only Spot Context Bar */}
              {activeSpot && activeTab !== 'info' && (
                <div className="jn-mobile-context-bar block md:hidden">
                  <div className="jn-mobile-context-content">
                    <img 
                      src={activeSpot.image || 'https://images.unsplash.com/photo-1585123334904-845d60e97b29?auto=format&fit=crop&w=120&q=80'} 
                      alt="" 
                      className="jn-mobile-context-thumb" 
                    />
                    <div className="jn-mobile-context-text">
                      <span className="jn-mobile-context-tag">Active Landmark:</span>
                      <h4 className="jn-mobile-context-title">{activeSpot.name}</h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      playTypewriterClick(1.0);
                      setActiveTab('info');
                    }}
                    className="jn-mobile-context-back-btn pointer-events-auto"
                  >
                    Back to Info
                  </button>
                </div>
              )}

              {/* ─── SUB-TAB: ITINERARY / LANDMARK DETAILS SPLIT ─── */}
              {/* ─── SUB-TAB: LANDMARK DETAILS (INFO) ─── */}
              {activeTab === 'info' && (
                <div className="jn-desktop-shown-details">
                  {activeSpot && (
                    <div className="space-y-4">
                      <div className="jn-section-heading">
                        <h2 className="jn-section-title">About This Spot</h2>
                        <span className="jn-section-subtitle">Details & Riddle</span>
                      </div>
                      <hr className="jn-divider" aria-hidden="true" />
                      {renderSpotDetails()}
                    </div>
                  )}
                  {isSealStep && (
                    <div className="space-y-4">
                      <div className="jn-section-heading">
                        <h2 className="jn-section-title">Chapter Sealed</h2>
                        <span className="jn-section-subtitle">Select Day Chapter above to read other pages</span>
                      </div>
                      <hr className="jn-divider" aria-hidden="true" />
                      <p className="jn-description" style={{ fontStyle: 'italic', color: 'var(--jn-ink-faint)' }}>
                        This daily chapter's travel route has been completed. Use the chapter selector at the top or side tabs to continue.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── SUB-TAB: ITINERARY TIMELINE ─── */}
              {activeTab === 'itinerary' && (
                <div className="jn-mobile-shown-timeline">
                  <div className="space-y-4">
                    <div className="jn-section-heading">
                      <h2 className="jn-section-title">Today's Route</h2>
                      <span className="jn-section-subtitle">Your itinerary for this day</span>
                    </div>

                    <hr className="jn-divider" aria-hidden="true" />

                    {/* Day chapter tabs — using clean day-badge utility classes */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'var(--jn-ink-faint)', flexShrink: 0 }}>Day:</span>
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'wrap' }}>
                        {Array.from({ length: duration }, (_, idx) => {
                          const d = idx + 1
                          const unlocked = unlockedDays.includes(d)
                          const active = currentDayTab === d
                          const completed = completedDays.includes(d)
                          return (
                            <button
                              key={d}
                              disabled={!unlocked}
                              onClick={() => {
                                setCurrentDayTab(d)
                                setCurrentSpotIndex(0)
                                playTypewriterClick(1.0)
                              }}
                              title={!unlocked ? `Complete Day ${d - 1} to unlock Day ${d}` : `Go to Day ${d}`}
                              className={`day-badge ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''} ${completed && !active ? 'completed' : ''}`}
                            >
                              {!unlocked ? '🔒' : completed ? '✓' : d}
                            </button>
                          )
                        })}
                      </div>
                    </div>


                    {/* Progress strip */}
                    {hasSpots && (() => {
                      const capturedCount = activeSpots.filter(s => capturedPhotos[s.id]).length
                      const solvedCount = activeSpots.filter(s => solvedRiddles[s.id]).length
                      return (
                        <div style={{
                          display: 'flex', gap: '10px', padding: '7px 12px',
                          background: 'var(--jn-crimson-light)', border: '1px solid var(--jn-crimson-mid)',
                          borderRadius: 'var(--jn-r-md)', marginBottom: '10px', flexWrap: 'wrap',
                        }}>
                          <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', fontWeight: '700', color: 'var(--jn-ink-muted)' }}>
                            {capturedCount}/{activeSpots.length} captured
                          </span>
                          <span style={{ color: 'var(--jn-ink-faint)' }}>·</span>
                          <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', fontWeight: '700', color: 'var(--jn-ink-muted)' }}>
                            {solvedCount} riddle{solvedCount !== 1 ? 's' : ''} solved
                          </span>
                          {isDayCompleted && (
                            <><span style={{ color: 'var(--jn-ink-faint)' }}>·</span>
                            <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', fontWeight: '700', color: 'var(--jn-green)' }}>✓ Day sealed</span></>
                          )}
                        </div>
                      )
                    })()}

                    {/* Itinerary timeline stops */}
                    <ol className="jn-timeline" aria-label="Day itinerary stops">
                      {/* 1. Departure Base Camp Stop */}
                      {selectedHotel ? (
                        <li
                          className="jn-timeline-item"
                          onClick={() => {
                            setActiveTab('hotels')
                            playTypewriterClick(0.9)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="jn-tl-node" aria-hidden="true">
                            <span className="jn-tl-emoji">🏡</span>
                            <div className="jn-tl-connector" />
                          </div>
                          <div className="jn-tl-content">
                            <div className="jn-tl-meta">
                              <span className="jn-tl-stop-num">Base Camp Departure</span>
                            </div>
                            <h3 className="jn-tl-stop-name" style={{ color: 'var(--jn-ink)' }}>
                              Start at {selectedHotel.name}
                            </h3>
                            <p className="jn-tl-note" style={{ fontSize: '11px' }}>{selectedHotel.neighborhood}</p>
                          </div>
                        </li>
                      ) : (
                        <li
                          className="jn-timeline-item"
                          onClick={() => {
                            setActiveTab('hotels')
                            playTypewriterClick(0.9)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="jn-tl-node" aria-hidden="true">
                            <span className="jn-tl-emoji">🏨</span>
                            <div className="jn-tl-connector" style={{ borderLeft: '2px dashed rgba(186,12,47,0.25)', background: 'transparent' }} />
                          </div>
                          <div className="jn-tl-content" style={{ opacity: 0.85 }}>
                            <div className="jn-tl-meta">
                              <span className="jn-tl-stop-num" style={{ color: '#BA0C2F', fontWeight: 'bold' }}>Stay Accommodation</span>
                            </div>
                            <h3 className="jn-tl-stop-name" style={{ color: 'var(--jn-crimson)', textDecoration: 'underline' }}>
                              Establish Base Camp stay
                            </h3>
                            <p className="jn-tl-note" style={{ fontSize: '11px', color: 'var(--jn-ink-faint)' }}>Tap to select an AI recommended hotel</p>
                          </div>
                        </li>
                      )}

                      {/* 2. Destination Stops */}
                      {activeSpots.map((stop, idx) => {
                        const isSelected = activeSpot && activeSpot.id === stop.id
                        const hasPic = !!capturedPhotos[stop.id]
                        return (
                          <li
                            key={stop.id}
                            className={`jn-timeline-item ${isSelected ? 'jn-timeline-item--active' : ''}`}
                            onClick={() => {
                              setCurrentSpotIndex(idx)
                              playTypewriterClick(0.95 + idx * 0.05)
                              // On mobile, click stop -> switch to Info tab to see it
                              if (window.innerWidth < 768) {
                                setActiveTab('info')
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="jn-tl-node" aria-hidden="true">
                              <span className="jn-tl-emoji">{hasPic ? '📸' : idx + 1}</span>
                              <div className="jn-tl-connector" />
                            </div>
                            <div className="jn-tl-content">
                              <div className="jn-tl-meta">
                                <span className="jn-tl-stop-num">Stop {idx + 1}</span>
                                <span style={{ fontSize: '10px', color: 'var(--jn-crimson)', fontWeight: 'bold' }}>{stop.pathCost}</span>
                              </div>
                              <h3 className="jn-tl-stop-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {stop.name} {hasPic && <span style={{ color: 'var(--jn-green)', fontSize: '10px' }}>✓ Captured</span>}
                              </h3>
                              <p className="jn-tl-coords">{stop.coords}</p>
                              <p className="jn-tl-note" style={{ fontSize: '11px' }}>{stop.pathGuide}</p>
                            </div>
                          </li>
                        )
                      })}

                      {/* 3. Seal Day Stop */}
                      {hasSpots && (
                        <li
                          className={`jn-timeline-item ${isSealStep ? 'jn-timeline-item--active' : ''}`}
                          onClick={() => {
                            setCurrentSpotIndex(activeSpots.length)
                            playTypewriterClick(1.2)
                            if (window.innerWidth < 768) {
                              setActiveTab('info')
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="jn-tl-node" aria-hidden="true">
                            <span className="jn-tl-emoji">{isDayCompleted ? '✓' : '🔒'}</span>
                            {selectedHotel && <div className="jn-tl-connector" />}
                          </div>
                          <div className="jn-tl-content">
                            <div className="jn-tl-meta">
                              <span className="jn-tl-stop-num">End of Day</span>
                            </div>
                            <h3 className="jn-tl-stop-name">Seal Chapter {currentDayTab}</h3>
                            <p className="jn-tl-note" style={{ fontSize: '11px' }}>
                              {isDayCompleted ? '✓ Entry fully sealed & passkey active' : 'Authenticate entry with the border stamp'}
                            </p>
                          </div>
                        </li>
                      )}

                      {/* 4. Overnight Return Stay */}
                      {hasSpots && selectedHotel && (
                        <li
                          className="jn-timeline-item"
                          onClick={() => {
                            setActiveTab('hotels')
                            playTypewriterClick(1.2)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="jn-tl-node" aria-hidden="true">
                            <span className="jn-tl-emoji">🛌</span>
                          </div>
                          <div className="jn-tl-content">
                            <div className="jn-tl-meta">
                              <span className="jn-tl-stop-num">Overnight Rest</span>
                            </div>
                            <h3 className="jn-tl-stop-name" style={{ color: 'var(--jn-ink)' }}>
                              Return to {selectedHotel.name}
                            </h3>
                            <p className="jn-tl-note" style={{ fontSize: '11px' }}>Rest and reflect on your Day {currentDayTab} passage</p>
                          </div>
                        </li>
                      )}
                    </ol>
                  </div>
                </div>
              )}

              {/* ─── SUB-TAB: MAP ─── */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Map</h2>
                    <span className="jn-section-subtitle">Your route across Bahrain</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Map preview card */}
                  <div className="jn-map-preview-card">
                    <div className="jn-map-preview-decoration" aria-hidden="true">
                      <div className="jn-map-grid-lines" />
                      <span className="jn-map-compass">🧭</span>
                    </div>
                    <div className="jn-map-preview-content">
                      <span className="jn-tag jn-tag--amber">Route Map</span>
                      <h3 className="jn-map-preview-title">Bahrain Archipelago Map</h3>
                      <p className="jn-map-preview-desc">
                        View your route, find landmarks, and discover hidden treasures.
                      </p>
                      <ul style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-muted)', margin: '0 0 14px 0', padding: '0 0 0 16px', lineHeight: 1.9 }}>
                        <li>{locations.length} landmark{locations.length !== 1 ? 's' : ''} pinned to your route</li>
                        <li>Interactive zoom & tap any pin for details</li>
                        <li>Hidden treasure coordinates to discover</li>
                      </ul>
                      <button
                        className="jn-action-btn jn-action-btn--amber"
                        onClick={() => setMapOpen(true)}
                        aria-label="Open interactive Bahrain map"
                      >
                        Open Map
                      </button>
                    </div>
                  </div>

                  {/* Almanac weather metrics */}
                  {almanac.metrics && almanac.metrics.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="jn-subsection-title">Weather & Conditions</h3>
                      <div className="jn-almanac-grid">
                        {almanac.metrics.map((m, i) => (
                          <div key={i} className="jn-almanac-card">
                            <span className="jn-almanac-label">{m.label}</span>
                            <span className="jn-almanac-value">{m.value}</span>
                            <span className="jn-almanac-desc">{m.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── SUB-TAB: SOUVENIRS ─── */}
              {activeTab === 'souvenirs' && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Souvenirs</h2>
                    <span className="jn-section-subtitle">Your collection</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Fils balance */}
                  <div className="jn-fils-bar">
                    <span className="jn-fils-label">Fils Balance</span>
                    <span className="jn-fils-amount">{(goldFils || 0).toLocaleString()} Fils</span>
                  </div>
                  <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-faint)', marginTop: '-6px', marginBottom: '14px', fontStyle: 'italic' }}>
                    Earn Fils by capturing spots and solving riddles
                  </p>
                  {/* Souq shop button */}
                  <button
                    className="jn-action-btn jn-action-btn--amber jn-action-btn--full"
                    onClick={() => { setShopOpen(true); setShopAlert(null) }}
                    aria-label="Enter Souq Shop"
                  >
                    Open Shop
                  </button>

                  {/* Keepsake grid */}
                  <div className="jn-keepsake-cabinet">
                    <span className="jn-keepsake-cabinet-label">Collected Keepsakes</span>
                    <div className="jn-keepsake-grid">
                      {spotsCatalog.map(spot => {
                        const unlocked = (collectedKeepsakes || []).includes(spot.id)
                        return (
                          <button
                            key={spot.id}
                            disabled={!unlocked}
                            onClick={() => unlocked && setSelectedKsake(spot)}
                            title={unlocked ? `${spot.keepsakeName}: ${spot.keepsakeDesc}` : 'Souvenir Locked — Capture with Lens to unlock!'}
                            className={`jn-keepsake-coin ${unlocked ? 'jn-keepsake-coin--unlocked' : 'jn-keepsake-coin--locked'}`}
                            aria-label={unlocked ? `Keepsake: ${spot.keepsakeName}` : `Locked keepsake from ${spot.name}`}
                          >
                            <span>{unlocked ? spot.keepsakeEmoji : '🔒'}</span>
                          </button>
                        )
                      })}
                    </div>
                    {(collectedKeepsakes || []).length === 0 && (
                      <p className="jn-keepsake-empty">
                        Cabinet empty. Capture spots with the Lens or solve riddles to unlock souvenirs!
                      </p>
                    )}
                  </div>

                </div>
              )}

              {/* ─── SUB-TAB: HOTELS ─── */}
              {activeTab === 'hotels' && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Stay & Hotels</h2>
                    <span className="jn-section-subtitle">AI-matched to your vibe</span>
                  </div>
                  <hr className="jn-divider" aria-hidden="true" />
                  <AIHotelPanel moods={selectedMoods} tier={tier} duration={duration} autoLoad={true} />
                </div>
              )}


              {/* ─── SUB-TAB: PHRASEBOOK ─── */}
              {activeTab === 'phrasebook' && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Phrasebook</h2>
                    <span className="jn-section-subtitle">Bahraini Arabic · Tap to Hear</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Phrase cards */}
                  <div className="jn-phrase-list">
                    {PHRASES.map((p, idx) => (
                      <button
                        key={idx}
                        className="jn-phrase-card"
                        onClick={() => playPhrase(p.arabic)}
                        aria-label={`Hear pronunciation of ${p.label}`}
                      >
                        <div className="jn-phrase-card-content">
                          <div>
                            <h4 className="jn-phrase-label">{p.label} <span className="jn-phrase-arabic" lang="ar">({p.arabic})</span></h4>
                            <p className="jn-phrase-desc">{p.desc}</p>
                          </div>
                          <span className="jn-phrase-pluck" aria-hidden="true">🔊</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Pronunciation guide */}
                  <div className="jn-pronunciation-guide">
                    <span className="jn-subsection-title">🗣️ Pronunciation Guide</span>
                    <div className="jn-pronun-item">
                      <p className="jn-pronun-rule">The Arabic "Kh" (خ)</p>
                      <p className="jn-pronun-note">Soft raspy scratch at the back of the throat — like the Scottish "loch". Try: <em>Khubz</em> (bread).</p>
                    </div>
                    <div className="jn-pronun-item">
                      <p className="jn-pronun-rule">The Cardinal G (ق)</p>
                      <p className="jn-pronun-note">In Gulf dialect, "q" softens to a hard "g". <em>Qal'at</em> → <em>Gal-at</em>.</p>
                    </div>
                    <div className="jn-pronun-item">
                      <p className="jn-pronun-rule">Double Vowels (aa / ee)</p>
                      <p className="jn-pronun-note">Elongate the sound like drawing out a sigh. <em>Habeebee</em> flows, <em>Hala</em> is quick.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="jn-page-footer-spacer" />
            </div>
          </div>

        </main>
      </div>

      {/* SOUQ SHOP MODAL */}
      {shopOpen && (
        <div
          className="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Souq Shop"
          onClick={(e) => { if (e.target === e.currentTarget) setShopOpen(false) }}
        >
          <div className="jn-shop-modal">
            <div className="jn-shop-header">
              <div>
                <span className="jn-shop-eyebrow">Manama Heritage Kiosk</span>
                <h3 className="jn-shop-title">🏪 Manama Souq Shop</h3>
              </div>
              <button className="jn-shop-close" onClick={() => setShopOpen(false)} aria-label="Close shop">✕ Exit Shop</button>
            </div>

            {shopAlert && (
              <div className={`jn-shop-alert ${shopAlert.success ? 'jn-shop-alert--success' : 'jn-shop-alert--error'}`}>
                {shopAlert.text}
              </div>
            )}

            <div className="jn-shop-fils-bar">
              <span>Your Fils Balance</span>
              <strong>{(goldFils || 0).toLocaleString()} Fils</strong>
            </div>

            <p className="jn-shop-intro">
              "Marhaban traveler! Spend your golden Fils on spice guild halwa, falcon hoods, or pearl hunt clue scrolls."
            </p>

            <div className="jn-shop-items">
              {(shopItems || []).map(item => (
                <div key={item.id} className="jn-shop-item">
                  <span className="jn-shop-item-emoji">{item.emoji}</span>
                  <div className="jn-shop-item-info">
                    <h5 className="jn-shop-item-name">{item.name}</h5>
                    <p className="jn-shop-item-desc">{item.desc}</p>
                  </div>
                  <button
                    className="jn-shop-buy-btn"
                    onClick={() => handleBuyItem(item)}
                  >
                    {item.cost.toLocaleString()} Fils
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KEEPSAKE DETAIL MODAL */}
      {selectedKsake && (
        <div
          className="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedKsake(null) }}
        >
          <div className="jn-ksake-modal">
            <button className="jn-ksake-close" onClick={() => setSelectedKsake(null)} aria-label="Close keepsake detail">✕ Close</button>
            <div className="jn-ksake-header">
              <span className="jn-ksake-emoji">{selectedKsake.keepsakeEmoji}</span>
              <div>
                <h4 className="jn-ksake-name">{selectedKsake.keepsakeName}</h4>
                <span className="jn-ksake-from">{selectedKsake.name}</span>
              </div>
            </div>
            <p className="jn-ksake-desc">"{selectedKsake.keepsakeDesc}"</p>
          </div>
        </div>
      )}

      {/* WAYFARER MAP (fullscreen, component handles its own close) */}
      {mapOpen && (
        <div className="jn-map-fullscreen" role="dialog" aria-modal="true" aria-label="Wayfarer Map">
          <Suspense fallback={<MapSkeleton label="Loading live route chart..." height="100%" />}>
            <WayfarerMap locations={locations} onClose={() => setMapOpen(false)} />
          </Suspense>
        </div>
      )}

      {/* BASE CAMP PROMPT POPUP */}
      {baseCampPromptOpen && !selectedHotel && (
        <div
          className="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Establish Base Camp Stay"
          onClick={(e) => { if (e.target === e.currentTarget) setBaseCampPromptOpen(false) }}
        >
          <div className="jn-ksake-modal" style={{ maxWidth: '460px' }}>
            <button 
              className="jn-ksake-close" 
              onClick={() => setBaseCampPromptOpen(false)} 
              aria-label="Close base camp selection"
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--jn-ink-muted)' }}
            >
              ✕ Skip
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ fontSize: '32px' }}>🏨</div>
              <div>
                <span className="jn-shop-eyebrow" style={{ color: 'var(--jn-crimson)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Welcome to Bahrain</span>
                <h4 className="jn-ksake-name" style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'var(--jn-font-serif)', color: 'var(--jn-ink)' }}>Establish your Base Camp</h4>
              </div>
            </div>
            <p className="jn-ksake-desc" style={{ fontSize: '12.5px', color: 'var(--jn-ink-muted)', marginBottom: '16px', lineHeight: 1.55 }}>
              Before starting your chronicle, select a recommended hotel matching your <strong>{tier}</strong> budget and vibe to serve as your journey's central base.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
              {(HOTELS_DB.filter(h => h.tierFit.includes(tier) || h.moodFit.some(m => selectedMoods.includes(m))).length > 0
                ? HOTELS_DB.filter(h => h.tierFit.includes(tier) || h.moodFit.some(m => selectedMoods.includes(m)))
                : HOTELS_DB
              ).map(hotel => (
                <button
                  key={hotel.id}
                  onClick={() => {
                    setSelectedHotel(hotel)
                    awardXP(50, 'Established Base Camp')
                    setBaseCampPromptOpen(false)
                    try {
                      const ctx = new (window.AudioContext || window.webkitAudioContext)()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      osc.type = 'sine'
                      osc.frequency.setValueAtTime(587.33, ctx.currentTime)
                      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15)
                      gain.gain.setValueAtTime(0, ctx.currentTime)
                      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02)
                      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
                      osc.connect(gain)
                      gain.connect(ctx.destination)
                      osc.start()
                      osc.stop(ctx.currentTime + 0.5)
                    } catch { /* ignore */ }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#fffdf9',
                    border: '1.5px solid rgba(139,90,43,0.15)',
                    textAlign: isRTL ? 'right' : 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jn-crimson)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,90,43,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: '22px', padding: '6px', borderRadius: '8px', background: '#FAF6EE', border: '1px solid rgba(139,90,75,0.1)', flexShrink: 0 }}>{hotel.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ margin: 0, fontFamily: 'var(--jn-font-serif)', fontSize: '13px', fontWeight: 700, color: '#2A2321' }}>{hotel.name}</h5>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '1px 5px', borderRadius: '999px' }}>{hotel.cost.replace('From ', '')}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#5C5451', lineHeight: 1.4 }}>{hotel.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setBaseCampPromptOpen(false)
                  setActiveTab('hotels')
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid var(--jn-crimson)',
                  color: 'var(--jn-crimson)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Browse All Hotels
              </button>
              <button
                onClick={() => setBaseCampPromptOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Decide Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIRTUAL TOUR (component handles its own fullscreen) */}
      {tourOpen && activeSpot && hasVirtualTour(activeSpot.id) && (
        <VirtualTour initialIndex={getTourIndexForSpot(activeSpot.id)} onClose={() => setTourOpen(false)} />
      )}

      {/* WAYFARER LENS PHOTO SIMULATOR MODAL */}
      {lensOpenSpot && (
        <WayfarerLens
          spot={lensOpenSpot}
          onClose={() => setLensOpenSpot(null)}
        />
      )}

      {/* EXPLORER PASSPORT CARD OVERLAY */}
      {showPassportCard && (
        <PassportCard onClose={() => setShowPassportCard(false)} />
      )}

      {/* EXPLORER RANK ADVANCED CELEBRATION MODAL */}
      {showRankUpModal && unlockedRankInfo && (
        <div
          className="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Explorer Rank Advanced"
          onClick={() => setShowRankUpModal(false)}
          style={{ zIndex: 300, background: 'rgba(26,10,12,0.85)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="jn-ksake-modal"
            style={{
              background: 'linear-gradient(135deg, var(--jn-crimson) 0%, var(--jn-crimson-deep) 100%)',
              border: '4px solid var(--jn-parchment)',
              boxShadow: '0 30px 80px rgba(193, 18, 47, 0.45)',
              color: '#ffffff',
              textAlign: 'center',
              padding: '30px'
            }}
          >
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>✦ Explorer Rank Advanced ✦</span>
            <div style={{ fontSize: '60px', margin: '20px 0' }}>🏆</div>
            <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: '#ffffff' }}>
              {unlockedRankInfo.label}
            </h4>
            <span className="jn-tag jn-tag--amber" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', padding: '4px 12px' }}>
              {unlockedRankInfo.arabic}
            </span>
            <p style={{ fontSize: '12px', margin: '20px 0 0 0', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
              "Traveler, you have gained sufficient experience to be officially recognized by the guilds of the Archipelago. May the desert winds guide your sails!"
            </p>
            <button
              onClick={() => setShowRankUpModal(false)}
              className="jn-action-btn jn-action-btn--primary"
              style={{ background: '#ffffff', color: 'var(--jn-crimson)', fontWeight: 900, width: '100%', marginTop: '20px' }}
            >
              Accept Rank Promotion
            </button>
          </div>
        </div>
      )}

      {/* Sticky bottom CTA for Local Riddle */}
      {activeTab === 'info' && activeSpot && RIDDLES[activeSpot.id] && (
        <div className="jn-sticky-cta jn-sticky-cta--visible">
          <button 
            className="jn-cta-btn jn-action-btn jn-action-btn--primary"
            onClick={() => setRiddleModalOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={riddleModalOpen}
          >
            {solvedRiddles[activeSpot.id] ? 'Review Riddle (Solved)' : 'Solve Riddle (+35 XP)'}
          </button>
        </div>
      )}

      {/* Local Riddle Bottom Sheet Modal */}
      {riddleModalOpen && activeSpot && RIDDLES[activeSpot.id] && (
        <>
          <div className="jn-overlay" onClick={() => setRiddleModalOpen(false)} />
          <div 
            className="jn-bottom-sheet" 
            role="dialog" 
            aria-modal="true" 
            aria-label={`Riddle for ${activeSpot.name}`}
          >
            <div className="jn-sheet-handle" />
            <div className="jn-sheet-inner">
              <div className="jn-sheet-header">
                <div>
                  <span className="jn-tag jn-tag--red" style={{ marginBottom: '4px' }}>Riddle</span>
                  <h3 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0 0' }}>
                    {activeSpot.name}
                  </h3>
                </div>
                <button className="jn-icon-btn" onClick={() => setRiddleModalOpen(false)} aria-label="Close sheet">✕</button>
              </div>

              <blockquote className="jn-riddle-question">
                "{RIDDLES[activeSpot.id].question}"
              </blockquote>

              {solvedRiddles[activeSpot.id] ? (
                <div className="jn-insider-reveal">
                  <span className="jn-tag jn-tag--green" style={{ marginBottom: '8px' }}>✓ Solved (+35 XP)</span>
                  <strong style={{ color: 'var(--jn-crimson)', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>Discovery Secret:</strong>
                  <p>
                    {RIDDLES[activeSpot.id].insider}
                  </p>
                </div>
              ) : (
                <div className="jn-choices">
                  {RIDDLES[activeSpot.id].options.map((opt, idx) => {
                    const isSelected = riddleAnswer === idx;
                    const isCorrect = RIDDLES[activeSpot.id].correct === idx;
                    const isWrong = riddleAnswer !== null && isSelected && !isCorrect;
                    
                    let btnClass = 'jn-choice-btn';
                    if (riddleAnswer !== null) {
                      if (isCorrect) btnClass += ' jn-choice-btn--correct';
                      if (isWrong) btnClass += ' jn-choice-btn--wrong';
                    }

                    return (
                      <button
                        key={idx}
                        className={btnClass}
                        onClick={() => handleAnswerRiddle(idx)}
                        disabled={riddleAnswer !== null}
                      >
                        <span className="jn-choice-letter">{String.fromCharCode(65 + idx)}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}

                  {riddleError && (
                    <p className="jn-error-hint">
                      ❌ {riddleError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* AI GUIDE CHATBOT — Floating Action Button + Panel */}
      <>
        {/* Floating chat button — lifts above riddle CTA when visible */}
        {(() => {
          const riddleCTAVisible = activeTab === 'info' && activeSpot && RIDDLES[activeSpot.id]
          const fabBottom = riddleCTAVisible ? '158px' : '90px'
          const panelBottom = riddleCTAVisible ? '222px' : '155px'
          return (
            <>
              <button
                onClick={() => setChatOpen(v => !v)}
                aria-label={chatOpen ? 'Close AI Guide' : 'Open AI Guide'}
                style={{
                  position: 'fixed',
                  bottom: fabBottom,
                  right: '20px',
                  zIndex: 200,
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: chatOpen ? '#2A2321' : 'linear-gradient(135deg, #D11A38, #A81028)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 8px 24px rgba(209,26,56,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  transform: chatOpen ? 'scale(0.92)' : 'scale(1)',
                }}
              >
                {chatOpen ? '✕' : '🤖'}
              </button>

              {/* Chatbot panel — slides up when open */}
              {chatOpen && (
                <div
                  style={{
                    position: 'fixed',
                    bottom: panelBottom,
                    right: '16px',
                    width: 'min(380px, calc(100vw - 32px))',
                    zIndex: 199,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(209,26,56,0.12)',
                    animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1) both',
                  }}
                >
                  <Suspense fallback={<MapSkeleton label="Connecting with concierge..." height={350} />}>
                    <TourChatbot
                      activeSpotName={activeSpot?.name}
                      embedded={true}
                      onClose={() => setChatOpen(false)}
                    />
                  </Suspense>
                </div>
              )}
            </>
          )
        })()}
      </>


      {/* ⚡ Quick Info FAB */}
      <button
        id="quick-info-fab"
        onClick={() => setQuickInfoOpen(true)}
        aria-label="Quick map & current spot info"
        title="Quick Info"
        style={{
          position: 'fixed',
          bottom: 160,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4AF37 0%, #a88020 100%)',
          border: '2px solid rgba(255,255,255,0.3)',
          color: '#fff',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 197,
          boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,175,55,0.6)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,175,55,0.4)' }}
      >
        ⚡
      </button>

      {/* Quick Info Sheet */}
      {quickInfoOpen && activeSpot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Quick info: ${activeSpot.name}`}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setQuickInfoOpen(false) }}
        >
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,11,0.55)', backdropFilter: 'blur(4px)' }} />

          {/* Sheet */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 560,
            background: '#FAF9F6',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px 40px',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(42,35,33,0.15)', margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#BA0C2F', fontWeight: 800, margin: '0 0 4px' }}>
                  Quick Info · Day {currentDayTab}
                </p>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2A2321', margin: 0, lineHeight: 1.2 }}>
                  {lang === 'ar' && activeSpot.arabic ? activeSpot.arabic : activeSpot.name}
                </h2>
                {lang === 'ar' && activeSpot.arabic && (
                  <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(92,84,81,0.6)', margin: '2px 0 0' }}>{activeSpot.name}</p>
                )}
              </div>
              <button
                onClick={() => setQuickInfoOpen(false)}
                aria-label="Close quick info"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'rgba(92,84,81,0.4)', padding: '0 0 0 12px', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Info pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {activeSpot.coords && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: '#FAF6EE', border: '1px solid rgba(139,90,75,0.15)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#8B5A4B' }}>
                  {activeSpot.coords}
                </span>
              )}
              {(activeSpot.pathCost || activeSpot.budgetCost) && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#059669' }}>
                  {activeSpot.pathCost || activeSpot.budgetCost}
                </span>
              )}
              {activeSpot.category && (
                <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(209,26,56,0.06)', border: '1px solid rgba(209,26,56,0.15)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#BA0C2F' }}>
                  {activeSpot.category}
                </span>
              )}
            </div>

            {/* Description */}
            {activeSpot.simpleTerms && (
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontStyle: 'italic', color: '#5C5451', lineHeight: 1.65, marginBottom: 20 }}>
                {activeSpot.simpleTerms}
              </p>
            )}

            {/* Insider tip */}
            {activeSpot.insider && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', marginBottom: 20 }}>
                <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 12, fontStyle: 'italic', color: '#2A2321', lineHeight: 1.6, margin: 0 }}>
                  {activeSpot.insider}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              {activeSpot.coords && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeSpot.coords + ' Bahrain')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)',
                    color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
                    textAlign: 'center', textDecoration: 'none', letterSpacing: '0.04em',
                  }}
                >
                  Get Directions
                </a>
              )}
              <button
                onClick={() => { setMapOpen(true); setQuickInfoOpen(false) }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: '#FAF6EE', border: '1px solid rgba(212,175,55,0.3)',
                  color: '#2A2321', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
                  cursor: 'pointer', letterSpacing: '0.04em',
                }}
              >
                Open Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
