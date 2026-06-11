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

import { useState, useEffect, useRef, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { useItinerary, spotsCatalog } from '../hooks/useItinerary'
import WayfarerMap from './WayfarerMap'
import VirtualTour from './VirtualTour'
import WayfarerLens from './WayfarerLens'
import PassportCard from './PassportCard'
import { 
  shopItems, 
  getAlmanac, 
  getRank, 
  getNextRank, 
  RIDDLES, 
  getGuideThoughts, 
  guides 
} from './DashboardData'
import { hasVirtualTour, getTourIndexForSpot } from './VirtualTour'

/* ─── Tabs definition ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'info',       emoji: '📝', label: 'Info'       },
  { id: 'itinerary',  emoji: '📍', label: 'Itinerary'  },
  { id: 'map',        emoji: '🗺️', label: 'Map'        },
  { id: 'souvenirs',  emoji: '🪙', label: 'Souvenirs'  },
  { id: 'phrasebook', emoji: '📜', label: 'Phrases'    },
]

const PHRASES = [
  { label: 'Karak',  arabic: 'كَرَتْ',  desc: "Bahrain's signature robust spiced condensed-milk tea.", pitchOffset: 0 },
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
    const dt    = 1 / 60
    const force = stiffness * (target - current.current)
    velocity.current += force * dt
    velocity.current *= 1 - damping * dt
    current.current  += velocity.current * dt
    setValue(current.current)
    if (Math.abs(target - current.current) > 0.01 || Math.abs(velocity.current) > 0.01) {
      rafId.current = requestAnimationFrame(animate)
    }
  }, [target, stiffness, damping])

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId.current)
  }, [animate])

  return Math.round(value)
}

/* ─── Phrase pronunciation (Web Audio API) ───────────────────────────────── */
function playPhrase(pitchOffset = 0) {
  try {
    const AC  = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx  = new AC()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220 + pitchOffset, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(330 + pitchOffset, ctx.currentTime + 0.12)
    osc.frequency.exponentialRampToValueAtTime(280 + pitchOffset, ctx.currentTime + 0.28)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)
  } catch (_) {}
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
    saveCapturedPhoto = () => {},
    collectedKeepsakes = [],
    unlockKeepsake = () => {},
    solvedRiddles = {},
    solveRiddle = () => {},
    goldFils = 0,
    spendFils = () => {},
    characterRep = {},
    awardReputation = () => {},
    xp = 0,
    awardXP = () => {},
    soundVolume = 0.5,
    soundMuted = false,
    setStep = () => {},
    activeGuide = 'jafar',
    setActiveGuide = () => {},
    journalReflections = {},
    saveJournalReflection = () => {},
    showPassportCard = false,
    setShowPassportCard = () => {},
    passportStamps = [],
  } = useVibe() || {}

  /* ── Dynamic itinerary loading ──────────────────────────────────────────── */
  const { locations = [], loading = false } = useItinerary(selectedMoods, tier, duration, curatedItinerary)
  
  // Filter spots active on the current selected day tab
  const activeSpots = locations.filter(s => s.day === currentDayTab)
  const hasSpots = activeSpots.length > 0
  const isSealStep = hasSpots && currentSpotIndex === activeSpots.length
  const activeSpot = !isSealStep && hasSpots ? activeSpots[currentSpotIndex] : null

  /* ── Local UI state ──────────────────────────────────────────────────────── */
  const [activeTab,    setActiveTab]    = useState('info')
  const [tabKey,       setTabKey]       = useState(0)       // bumped on every switch → remount → fresh anim
  const [menuOpen,     setMenuOpen]     = useState(false)
  
  // Modals & overlay states
  const [mapOpen,         setMapOpen]         = useState(false)
  const [tourOpen,        setTourOpen]        = useState(false)
  const [lensOpenSpot,    setLensOpenSpot]    = useState(null)
  const [shopOpen,        setShopOpen]        = useState(false)
  const [shopAlert,       setShopAlert]       = useState(null)
  const [selectedKsake,   setSelectedKsake]   = useState(null)
  const [riddleModalOpen, setRiddleModalOpen] = useState(false)
  const [imageErrors,     setImageErrors]     = useState({})

  // Stamping and rank-up states
  const [stamping, setStamping] = useState(false)
  const [unlockedRankInfo, setUnlockedRankInfo] = useState(null)
  const [showRankUpModal, setShowRankUpModal] = useState(false)
  
  const prevRankIdRef = useRef(null)
  const rank = getRank(xp)

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
    } catch (_) {}
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
      } catch (_) {}
    }
  }, [rank, soundMuted, soundVolume])

  /* ── Reflection Note Debounce ────────────────────────────────────────────── */
  const [localReflection, setLocalReflection] = useState('')
  const reflectionDebounceRef = useRef(null)

  useEffect(() => {
    if (activeSpot) {
      setLocalReflection(journalReflections[activeSpot.id] || '')
    } else {
      setLocalReflection('')
    }
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
    setActiveTab(tab)
    setTabKey(k => k + 1)
    setMenuOpen(false)
  }

  /* ── Day Sealing ─────────────────────────────────────────────────────────── */
  const isDayCompleted = completedDays.includes(currentDayTab)
  
  const handleSealDay = () => {
    setStamping(true)
    
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
      } catch (_) {}
    }

    setTimeout(() => {
      completeDay(currentDayTab)
      setStamping(false)
    }, 1100)
  }

  /* ── Riddle solver state ─────────────────────────────────────────────────── */
  const [riddleAnswer, setRiddleAnswer] = useState(null)
  const [riddleError, setRiddleError] = useState(null)

  useEffect(() => {
    setRiddleAnswer(null)
    setRiddleError(null)
    setRiddleModalOpen(false)
  }, [activeSpot?.id])

  const handleAnswerRiddle = (idx) => {
    if (!activeSpot) return
    const riddle = RIDDLES[activeSpot.id]
    if (!riddle) return

    setRiddleAnswer(idx)
    if (idx === riddle.correct) {
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
      } catch (_) {}
      
      setTimeout(() => {
        solveRiddle(activeSpot.id)
        awardReputation('jafar', 15)
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
      } catch (_) {}
      
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
      awardReputation('jafar', 10)
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
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  /* ── Almanac data ─────────────────────────────────────────────────────────── */
  const almanac = getAlmanac ? getAlmanac() : { metrics: [] }

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="jn-root" role="main" aria-label="Bahrain Passage Journal Notebook">

      {/* ── Fixed crimson header ────────────────────────────────────────────── */}
      <header className="jn-header" role="banner">
        <div className="jn-header-inner">
          <div className="jn-brand">
            <span className="jn-brand-arabic" lang="ar">مملكة البحرين</span>
            <span className="jn-brand-title">Bahrain <em>Passage</em></span>
          </div>

          <nav className="jn-desktop-nav" aria-label="Desktop sections">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`jn-nav-btn ${activeTab === t.id ? 'jn-nav-btn--active' : ''}`}
                onClick={(e) => switchTab(t.id, e)}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </nav>

          <div className="jn-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Passport card trigger */}
            <button
              onClick={() => setShowPassportCard(true)}
              className="jn-action-btn jn-action-btn--ghost"
              style={{ padding: '6px 12px', fontSize: '10px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}
              title="View Explorer Passport"
            >
              <span>🪪</span>
              <span className="jn-level-badge">{rank.label}</span>
            </button>

            {/* XP progress */}
            <div className="jn-xp-pill" aria-label={`${displayXP} XP earned`} style={{ margin: 0 }}>
              <span className="jn-xp-icon">⚡</span>
              <span className="jn-xp-num">{displayXP} XP</span>
            </div>
            
            <button
              id="jn-menu-btn"
              className={`jn-menu-btn ${menuOpen ? 'jn-menu-btn--open' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              aria-controls="jn-mobile-menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Decorative diamond border */}
        <div className="jn-header-diamonds" aria-hidden="true" />
      </header>

      {/* ── Slim mobile menu: Virtual Tour + back only ── */}
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
              ← Adjust Vibe Settings
            </button>
          )}
        </div>
      )}
      {menuOpen && <div className="jn-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      {/* ── Scrollable tab strip (never cramped — swipe to see all 5) ── */}
      <div className="jn-mobile-tabs-wrap">
        <nav
          className="jn-mobile-tabs"
          role="tablist"
          aria-label="Journal sections"
        >
          {TABS.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`jn-tab ${activeTab === t.id ? 'jn-tab--active' : ''}`}
              onClick={(e) => switchTab(t.id, e)}
            >
              <span className="jn-tab-emoji">{t.emoji}</span>
              <span className="jn-tab-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Main content area with binder ring system ───────────────────────── */}
      <div className="jn-body">

        <main className="jn-book">
          
          {/* ════════════════════ LEFT PAGE: INFO & LANDMARK ════════════════════ */}
          <div 
            className={`jn-page jn-page--left ${activeTab === 'info' ? 'jn-page--visible' : 'jn-page--hidden'}`}
            id="panel-info" 
            role="tabpanel" 
            aria-labelledby="tab-info"
          >
            <div key={tabKey} className="jn-page-anim-wrap">
              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <span className="jn-tag jn-tag--amber animate-pulse">⏳ Opening Ledger...</span>
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
                  
                  <div style={{ position: 'relative', overflow: 'hidden' }} className="jn-insider-box">
                    
                    {stamping && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,249,246,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '4px double var(--jn-crimson)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-5deg)', color: 'var(--jn-crimson)' }}>
                          <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sealing</span>
                          <span style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '8px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>Day {currentDayTab} Entry</span>
                          <span style={{ fontSize: '6px', marginTop: '4px' }}>AUTHENTICATED</span>
                        </div>
                      </div>
                    )}

                    {!isDayCompleted ? (
                      <div style={{ textAlign: 'center', padding: '20px 10px' }} className="space-y-4">
                        <span style={{ fontSize: '40px', display: 'block' }}>🔒</span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '18px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Seal Day {currentDayTab}'s Passage
                        </h4>
                        <p className="jn-description" style={{ textAlign: 'center', fontSize: '12px' }}>
                          You have explored all landmarks for this daily chapter. Imprint your official border stamp to seal the path and lock in the Insider reward.
                        </p>
                        <button
                          onClick={handleSealDay}
                          className="jn-action-btn jn-action-btn--primary"
                        >
                          Authenticate Stamp
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 text-left">
                        <span className="jn-tag jn-tag--green" style={{ display: 'inline-flex' }}>✓ Day {currentDayTab} Passkey Active</span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '16px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Traditional Insider Passkey:
                        </h4>
                        <div style={{ background: 'rgba(193,18,47,0.04)', border: '1px dashed var(--jn-crimson-mid)', padding: '15px', borderRadius: '12px' }}>
                          <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--jn-ink-muted)' }}>
                            {currentDayTab === 1 && 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.'}
                            {currentDayTab === 2 && 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.'}
                            {currentDayTab === 3 && 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.'}
                            {currentDayTab === 4 && 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.'}
                            {currentDayTab === 5 && 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.'}
                          </p>
                        </div>

                        {/* Ink stamp render */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                          <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px double rgba(46, 125, 50, 0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(10deg)', color: '#2e7d32', fontStyle: 'italic' }}>
                            <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>Sealed</span>
                            <span style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '7px', fontWeight: 'bold', marginTop: '2px' }}>Day {currentDayTab}</span>
                            <span style={{ fontSize: '5px', marginTop: '2px' }}>PASSPORT OK</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeSpot ? (
                /* ─── ACTIVE SPOT SHOWN ─── */
                <div className="space-y-5">
                  {/* Hero postcard stamp */}
                  <figure className="jn-hero-stamp" aria-label={`${activeSpot.name} vintage postage stamp`}>
                    {imageErrors[activeSpot.id] ? (
                      <div className="jn-hero-fallback-stamp">
                        <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                          {activeSpot.keepsakeEmoji || '🗺️'}
                        </div>
                        <span className="jn-tag jn-tag--red" style={{ fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>
                          {activeSpot.category || 'Archipelago'}
                        </span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '14px', fontWeight: 'bold', color: 'var(--jn-ink)', margin: '4px 0' }}>
                          {activeSpot.name}
                        </h4>
                        <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '9px', color: 'var(--jn-ink-faint)', textTransform: 'uppercase' }}>
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
                      <p className="jn-coords" aria-label={`GPS: ${activeSpot.coords}`}>📍 {activeSpot.coords}</p>
                    </div>
                    <span className="jn-arabic" lang="ar">{activeSpot.arabic}</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  <p className="jn-description">{activeSpot.desc}</p>

                  {/* Action buttons row — Lens capture, virtual tour, riddle */}
                  <div className="jn-action-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      className="jn-action-btn jn-action-btn--primary"
                      onClick={() => setLensOpenSpot(activeSpot)}
                      aria-label="Open camera lens simulator to capture photo"
                      style={{ flex: '1 1 120px' }}
                    >
                      {capturedPhotos[activeSpot.id] ? '📷 Re-shoot Spot' : '📷 Capture Lens'}
                    </button>
                    {hasVirtualTour(activeSpot.id) && (
                      <button
                        className="jn-action-btn jn-action-btn--ghost"
                        onClick={() => {
                          setTourOpen(true)
                          // Set tourIndex correctly
                          const tIdx = getTourIndexForSpot(activeSpot.id)
                          // Set VirtualTour index
                        }}
                        aria-label="Open virtual tour clip"
                        style={{ flex: '1 1 120px' }}
                      >
                        🎬 Virtual Tour
                      </button>
                    )}
                  </div>

                  {/* Guide comments with collapsible tabs */}
                  <div className="jn-insider-box" style={{ background: '#fffdf9', border: '1px solid var(--jn-gold-muted)', padding: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(193, 18, 47, 0.08)', paddingBottom: '6px' }}>
                        <span className="jn-tag jn-tag--red">🎙️ Narrator Guide</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--jn-font-sans)', color: 'var(--jn-ink-faint)', fontStyle: 'italic' }}>Tap to switch guide</span>
                      </div>
                      
                      {/* Swipeable track for guides selector */}
                      <div 
                        className="jn-guides-track"
                        style={{
                          display: 'flex',
                          gap: '8px',
                          overflowX: 'auto',
                          flexWrap: 'nowrap',
                          WebkitOverflowScrolling: 'touch',
                          paddingBottom: '6px',
                          scrollbarWidth: 'none',
                        }}
                      >
                        {guides.map(g => {
                          const isActive = activeGuide === g.id
                          return (
                            <button
                              key={g.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setActiveGuide(g.id)
                              }}
                              style={{
                                display: 'inline-flex',
                                flex: '0 0 auto',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px 12px',
                                minWidth: '95px',
                                borderRadius: '10px',
                                border: isActive ? '1.5px solid var(--jn-crimson)' : '1.5px solid rgba(193, 18, 47, 0.08)',
                                background: isActive ? 'var(--jn-crimson-light)' : '#ffffff',
                                color: isActive ? 'var(--jn-crimson)' : 'var(--jn-ink-muted)',
                                boxShadow: isActive ? '0 4px 10px rgba(193, 18, 47, 0.12)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <span style={{ fontSize: '20px', marginBottom: '2px' }}>{g.emoji}</span>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {g.name.split(' ')[0]}
                              </span>
                              <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                                {g.role || 'Guide'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '10px', borderTop: '1px dashed rgba(193, 18, 47, 0.08)', paddingTop: '10px' }}>
                      <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '13px', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--jn-ink-muted)' }}>
                        "{getGuideThoughts(activeSpot, activeGuide)}"
                      </p>
                    </div>
                  </div>

                  {/* Insider tip */}
                  <div className="jn-insider-box" role="complementary" aria-label="Local insider tip">
                    <span className="jn-tag jn-tag--red">✨ Local Insider Tip</span>
                    <p className="jn-insider-text">{activeSpot.insider}</p>
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
                      🗒️ My Notes
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
                        resize: 'vertical',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.04)',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--jn-crimson)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(193,18,47,0.15)'}
                    />
                  </div>
                </div>
              ) : null}
              <div className="jn-page-footer-spacer" />
            </div>
          </div>

          {/* ════════════════════ RIGHT PAGE: TAB STRIP SELECTIVE ════════════════ */}
          <div 
            className={`jn-page jn-page--right ${activeTab !== 'info' ? 'jn-page--visible' : 'jn-page--hidden'}`}
            id="panel-tabs" 
            role="tabpanel"
          >
            <div key={tabKey} className="jn-page-anim-wrap">
              
              {/* ─── SUB-TAB: ITINERARY ─── */}
              {(activeTab === 'itinerary' || activeTab === 'info' /* Shown on desktop right page */) && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Discovery Route</h2>
                    <span className="jn-section-subtitle">Bahrain Custom Itinerary timeline</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Day chapter tabs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', color: 'var(--jn-ink-faint)' }}>Chapter Day:</span>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                      {Array.from({ length: duration }, (_, idx) => {
                        const d = idx + 1
                        const unlocked = unlockedDays.includes(d)
                        const active = currentDayTab === d
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
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              border: active ? '1px solid var(--jn-crimson)' : '1px solid rgba(0,0,0,0.08)',
                              background: active ? 'var(--jn-crimson)' : unlocked ? '#ffffff' : 'rgba(0,0,0,0.03)',
                              color: active ? '#ffffff' : unlocked ? 'var(--jn-ink-muted)' : 'rgba(0,0,0,0.2)',
                              cursor: unlocked ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {unlocked ? d : '🔒'}
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
                          📸 {capturedCount}/{activeSpots.length} captured
                        </span>
                        <span style={{ color: 'var(--jn-ink-faint)' }}>·</span>
                        <span style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', fontWeight: '700', color: 'var(--jn-ink-muted)' }}>
                          🧭 {solvedCount} riddle{solvedCount !== 1 ? 's' : ''} solved
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
                            {idx < activeSpots.length - 1 && <div className="jn-tl-connector" />}
                          </div>
                          <div className="jn-tl-content">
                            <div className="jn-tl-meta">
                              <span className="jn-tl-stop-num">Stop {idx + 1}</span>
                              <span style={{ fontSize: '10px', color: 'var(--jn-crimson)', fontWeight: 'bold' }}>{stop.pathCost}</span>
                            </div>
                            <h3 className="jn-tl-stop-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {stop.name} {hasPic && <span style={{ color: 'var(--jn-green)', fontSize: '10px' }}>✓ Captured</span>}
                            </h3>
                            <p className="jn-tl-coords">📍 {stop.coords}</p>
                            <p className="jn-tl-note" style={{ fontSize: '11px' }}>{stop.pathGuide}</p>
                          </div>
                        </li>
                      )
                    })}

                    {/* Seal day timeline node */}
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
                  </ol>
                </div>
              )}

              {/* ─── SUB-TAB: MAP ─── */}
              {activeTab === 'map' && (
                <div className="space-y-4">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Wayfarer's Map</h2>
                    <span className="jn-section-subtitle">Bahrain Archipelago Route Chart</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Map preview card */}
                  <div className="jn-map-preview-card">
                    <div className="jn-map-preview-decoration" aria-hidden="true">
                      <div className="jn-map-grid-lines" />
                      <span className="jn-map-compass">🧭</span>
                    </div>
                    <div className="jn-map-preview-content">
                      <span className="jn-tag jn-tag--amber">🗺️ Geographical Chart</span>
                      <h3 className="jn-map-preview-title">Bahrain Archipelago Map</h3>
                      <p className="jn-map-preview-desc">
                        Unroll the grand parchment chart to trace your live itinerary route, locate active
                        daily checkpoints, and hunt for hidden Dilmun Pearl coordinates.
                      </p>
                      <ul style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-muted)', margin: '0 0 14px 0', padding: '0 0 0 16px', lineHeight: 1.9 }}>
                        <li>📍 {locations.length} landmark{locations.length !== 1 ? 's' : ''} pinned to your route</li>
                        <li>🔍 Interactive zoom &amp; tap any pin for details</li>
                        <li>⭐ Hidden Dilmun Pearl coordinates to discover</li>
                      </ul>
                      <button
                        className="jn-action-btn jn-action-btn--amber"
                        onClick={() => setMapOpen(true)}
                        aria-label="Open interactive Bahrain map"
                      >
                        🧭 Open Wayfarer Map
                      </button>
                    </div>
                  </div>

                  {/* Almanac weather metrics */}
                  {almanac.metrics && almanac.metrics.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="jn-subsection-title">📊 Wayfarer's Almanac</h3>
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
                    <span className="jn-section-subtitle">Teak Keepsake Cabinet</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Fils balance */}
                  <div className="jn-fils-bar">
                    <span className="jn-fils-label">🪙 Travel Stipend</span>
                    <span className="jn-fils-amount">{(goldFils || 0).toLocaleString()} Fils</span>
                  </div>
                  <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-faint)', marginTop: '-6px', marginBottom: '14px', fontStyle: 'italic' }}>
                    Earn Fils by capturing spots 📸 and solving riddles 🧭
                  </p>
                  {/* Souq shop button */}
                  <button
                    className="jn-action-btn jn-action-btn--amber jn-action-btn--full"
                    onClick={() => { setShopOpen(true); setShopAlert(null) }}
                    aria-label="Enter Jafar's Souq Shop"
                  >
                    🏪 Enter Jafar's Souq Shop
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

                  {/* Resident reputation */}
                  <div className="jn-rep-panel">
                    <span className="jn-subsection-title">Guild Reputation</span>
                    <p style={{ fontFamily: 'var(--jn-font-sans)', fontSize: '11px', color: 'var(--jn-ink-faint)', margin: '4px 0 12px 0', fontStyle: 'italic' }}>
                      Increases by buying souvenirs, solving riddles, and capturing spots.
                    </p>
                    {[
                      { name: 'Jafar (Spice Merchant)', rep: (characterRep || {}).jafar  || 10, color: '#C1122F' },
                      { name: 'Seyadi (Pearl Diver)',   rep: (characterRep || {}).seyadi || 10, color: '#d97706' },
                      { name: 'Faisal (Falconer)',      rep: (characterRep || {}).faisal || 10, color: '#059669' },
                    ].map(r => (
                      <div key={r.name} className="jn-rep-row">
                        <div className="jn-rep-meta">
                          <span className="jn-rep-name">{r.name}</span>
                          <span className="jn-rep-pct">{r.rep}%</span>
                        </div>
                        <div className="jn-rep-bar-track">
                          <div className="jn-rep-bar-fill" style={{ width: `${r.rep}%`, background: r.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
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
                        onClick={() => playPhrase(p.pitchOffset)}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          SOUQ SHOP MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {shopOpen && (
        <div
          className="jn-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Jafar's Souq Shop"
          onClick={(e) => { if (e.target === e.currentTarget) setShopOpen(false) }}
        >
          <div className="jn-shop-modal">
            <div className="jn-shop-header">
              <div>
                <span className="jn-shop-eyebrow">Manama Heritage Kiosk</span>
                <h3 className="jn-shop-title">🏪 Master Jafar's Souq Shop</h3>
              </div>
              <button className="jn-shop-close" onClick={() => setShopOpen(false)} aria-label="Close shop">✕ Exit Shop</button>
            </div>

            {shopAlert && (
              <div className={`jn-shop-alert ${shopAlert.success ? 'jn-shop-alert--success' : 'jn-shop-alert--error'}`}>
                {shopAlert.text}
              </div>
            )}

            <div className="jn-shop-fils-bar">
              <span>🪙 Your Travel Stipend</span>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          KEEPSAKE DETAIL MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════
          WAYFARER MAP (fullscreen, component handles its own close)
          ═══════════════════════════════════════════════════════════════════════ */}
      {mapOpen && (
        <div className="jn-map-fullscreen" role="dialog" aria-modal="true" aria-label="Wayfarer Map">
          <WayfarerMap locations={locations} onClose={() => setMapOpen(false)} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VIRTUAL TOUR (component handles its own fullscreen)
          ═══════════════════════════════════════════════════════════════════════ */}
      {tourOpen && activeSpot && hasVirtualTour(activeSpot.id) && (
        <VirtualTour initialIndex={getTourIndexForSpot(activeSpot.id)} onClose={() => setTourOpen(false)} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          WAYFARER LENS PHOTO SIMULATOR MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
      {lensOpenSpot && (
        <WayfarerLens
          spot={lensOpenSpot}
          onClose={() => setLensOpenSpot(null)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EXPLORER PASSPORT CARD OVERLAY
          ═══════════════════════════════════════════════════════════════════════ */}
      {showPassportCard && (
        <PassportCard onClose={() => setShowPassportCard(false)} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EXPLORER RANK ADVANCED CELEBRATION MODAL
          ═══════════════════════════════════════════════════════════════════════ */}
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
            🧭 {solvedRiddles[activeSpot.id] ? 'Review Local Riddle (Solved)' : 'Solve Local Riddle (+35 XP)'}
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
                  <span className="jn-tag jn-tag--red" style={{ marginBottom: '4px' }}>🧭 Local Riddle</span>
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

    </div>
  )
}
