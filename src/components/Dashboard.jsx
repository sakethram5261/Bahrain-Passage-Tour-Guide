import { useState, useEffect, useRef, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { useItinerary, spotsCatalog } from '../hooks/useItinerary'
import WayfarerLens from './WayfarerLens'
import WayfarerMap from './WayfarerMap'
import PassportCard from './PassportCard'
import TourChatbot from './TourChatbot'
import VirtualTour, { hasVirtualTour, getTourIndexForSpot } from './VirtualTour'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, Mousewheel } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { getRank, getNextRank, RIDDLES, shopItems, getAlmanac } from './DashboardData'

import AIHotelPanel from './AIHotelPanel'
import AIBudgetAdvisor from './AIBudgetAdvisor'
import AISpotSuggestion from './AISpotSuggestion'
import { callLocalAI, buildRiddleHintPrompt } from '../services/aiService'
import Clock from './Clock'

export default function Dashboard() {
  const { 
    selectedMoods, 
    tier, 
    duration, 
    unlockedDays, 
    completedDays, 
    completeDay,
    currentDayTab, 
    setCurrentDayTab, 
    curatedItinerary,
    collectedKeepsakes,
    soundVolume,
    setSoundVolume,
    soundMuted,
    setSoundMuted,
    activeLeaf,
    setActiveLeaf,
    currentSpotIndex,
    setCurrentSpotIndex,
    capturedPhotos,
    journalReflections,
    saveJournalReflection,
    xp,
    markSpotVisited,
    showPassportCard,
    setShowPassportCard,
    solvedRiddles,
    solveRiddle,
    goldFils,
    setGoldFils,
    spendFils,
    awardXP,
    unlockKeepsake,
    saveLensStory,
    setStep,
    selectedHotel,
  } = useVibe()


  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const rankProgress = nextRank ? Math.round(((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100) : 100
  
  const todayDateStr = (() => {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}.${mm}.${yyyy}`
  })()

  const { locations } = useItinerary(selectedMoods, tier, duration, curatedItinerary)
  
  // Move declarations above effects to prevent temporary dead zone issues
  const activeSpots = locations.filter(s => s.day === currentDayTab)
  const hasSpots = activeSpots.length > 0
  const totalSteps = hasSpots ? activeSpots.length + 1 : 0
  const isSealStep = currentSpotIndex === activeSpots.length
  const activeSpot = !isSealStep && hasSpots ? activeSpots[currentSpotIndex] : null
  const isDayCompleted = completedDays.includes(currentDayTab)
  const hasKeepsake = (spotId) => collectedKeepsakes && collectedKeepsakes.includes(spotId)

  const [activeScanSpot, setActiveScanSpot] = useState(null)
  const [selectedKeepsake, setSelectedKeepsake] = useState(null)
  const [stamping, setStamping] = useState(false)
  const [flippingLeaf] = useState(null)

  // Rank Celebration Modal States
  const prevRankIdRef = useRef(null)
  const [showRankUpModal, setShowRankUpModal] = useState(false)
  const [unlockedRankInfo, setUnlockedRankInfo] = useState(null)

  // Premium Gamification States
  const [showSouqShop, setShowSouqShop] = useState(false)
  const [shopAlert, setShopAlert] = useState(null)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [riddleError, setRiddleError] = useState(null)

  // AI Riddle Hint States
  const [aiRiddleHint, setAiRiddleHint] = useState({})
  const [aiHintLoading, setAiHintLoading] = useState(false)

  // Virtual Tour State
  const [showVirtualTour, setShowVirtualTour] = useState(false)
  const [virtualTourIndex, setVirtualTourIndex] = useState(0)

  // Local textarea state
  const [localReflection, setLocalReflection] = useState('')
  const reflectionDebounceRef = useRef(null)
  const reflectionSpotRef = useRef(null)



  const handleBuyItem = (item) => {
    if (goldFils >= item.cost) {
      const success = spendFils(item.cost)
      if (success) {
        if (item.id === 'riddle-hint') {
          awardXP(30, 'Bought map clue scroll')
          setShopAlert({ success: true, text: `Hint Purchased! Clue: "Seek Jarada Sandbank or Bahrain Fort map coordinates!"` })
        } else if (item.id === 'saffron-halwa') {
          awardXP(30, 'Bought saffron halwa')
          setShopAlert({ success: true, text: `🍯 Hot saffron halwa delivered! +25 XP!` })
        } else if (item.id === 'pearl-hook') {
          awardXP(40, 'Bought pearl hook')
          setShopAlert({ success: true, text: `🪝 Generational Pearl Hook unlocked! +30 XP!` })
        } else if (item.id === 'falcon-glove') {
          awardXP(40, 'Bought leather falcon glove')
          setShopAlert({ success: true, text: `🧤 Falconer leather glove unlocked! +30 XP!` })
        } else if (item.id === 'keepsake-bag') {
          const lockedSpot = spotsCatalog.find(s => !collectedKeepsakes.includes(s.id))
          if (lockedSpot) {
            unlockKeepsake(lockedSpot.id)
            saveLensStory(lockedSpot.id, "Purchased from a heritage merchant counter inside the historical Manama Souq bazaar.")
            setShopAlert({ success: true, text: `🛍️ Grab-bag opened! Unlocked keepsake relic: ${lockedSpot.keepsakeName} ${lockedSpot.keepsakeEmoji}!` })
          } else {
            setGoldFils(prev => prev + item.cost) 
            setShopAlert({ success: false, text: `❌ Cabinet already complete! All keepsakes are fully unlocked!` })
          }
        }
      }
    } else {
      setShopAlert({ success: false, text: `❌ Insufficient Fils! Snap photo polaroids or complete day itineraries first!` })
    }
  }

  const handleAnswerRiddle = (selectedIdx) => {
    if (!activeSpot) return
    const riddle = RIDDLES[activeSpot.id]
    if (!riddle) return
    
    if (selectedIdx === riddle.correct) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext && !soundMuted) {
          const audioCtx = new AudioContext()
          const playString = (freq, delay, dur) => {
            const osc = audioCtx.createOscillator()
            const gain = audioCtx.createGain()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay)
            gain.gain.setValueAtTime(0, audioCtx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(0.12 * soundVolume, audioCtx.currentTime + delay + 0.02)
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + dur - 0.02)
            osc.connect(gain)
            gain.connect(audioCtx.destination)
            osc.start(audioCtx.currentTime + delay)
            osc.stop(audioCtx.currentTime + delay + dur)
          }
          playString(329.63, 0.0, 0.4) 
          playString(392.00, 0.08, 0.4) 
          playString(523.25, 0.16, 0.8) 
        }
      } catch { /* ignore */ }
      
      solveRiddle(activeSpot.id)
    } else {
      playTypewriterClick()
      setRiddleError("Ah, that is not quite right. Consult the storyteller deciphers above for hints, wayfarer!")
      setTimeout(() => setRiddleError(null), 3000)
    }
  }

  // Synchronize local reflection text when the active spot changes
  useEffect(() => {
    if (activeSpot?.id !== reflectionSpotRef.current) {
      reflectionSpotRef.current = activeSpot?.id
      setLocalReflection(journalReflections[activeSpot?.id] || '')
    }
  }, [activeSpot?.id, journalReflections])

  useEffect(() => {
    if (prevRankIdRef.current === null) {
      prevRankIdRef.current = rank.id
      return
    }
    
    if (rank.id !== prevRankIdRef.current) {
      setUnlockedRankInfo(rank)
      setShowRankUpModal(true)
      
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext && !soundMuted) {
          const audioCtx = new AudioContext()
          const playNote = (freq, delay, dur) => {
            const osc = audioCtx.createOscillator()
            const gain = audioCtx.createGain()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay)
            gain.gain.setValueAtTime(0, audioCtx.currentTime + delay)
            gain.gain.linearRampToValueAtTime(0.2 * soundVolume, audioCtx.currentTime + delay + 0.05)
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + dur - 0.05)
            osc.connect(gain)
            gain.connect(audioCtx.destination)
            osc.start(audioCtx.currentTime + delay)
            osc.stop(audioCtx.currentTime + delay + dur)
          }
          playNote(261.63, 0.0, 0.6) 
          playNote(329.63, 0.1, 0.6) 
          playNote(392.00, 0.2, 0.6) 
          playNote(523.25, 0.3, 1.2) 
        }
      } catch { /* ignore */ }
      
      prevRankIdRef.current = rank.id
    }
  }, [xp, rank, soundMuted, soundVolume])

  const triggerPageTurnAnimation = useCallback((updateFn, _direction = 'right') => {
    updateFn();
  }, [])

  const handleNextStep = () => {
    if (currentSpotIndex < totalSteps - 1) {
      triggerPageTurnAnimation(() => {
        const nextIdx = currentSpotIndex + 1
        setCurrentSpotIndex(nextIdx)
        if (activeSpots[nextIdx]) markSpotVisited(activeSpots[nextIdx].id)
      }, 'right')
    }
  }

  const handlePrevStep = () => {
    if (currentSpotIndex > 0) {
      triggerPageTurnAnimation(() => {
        setCurrentSpotIndex(currentSpotIndex - 1)
      }, 'left')
    }
  }

  const getLeafOrder = (leafId) => {
    switch (leafId) {
      case 'chronicles': return 1
      case 'cartography': return 2
      case 'keepsakes': return 3
      case 'lexicon': return 4
      default: return 1
    }
  }

  const handleLeafSwitch = (leafId) => {
    if (activeLeaf === leafId) return
    const direction = getLeafOrder(leafId) > getLeafOrder(activeLeaf) ? 'right' : 'left'
    triggerPageTurnAnimation(() => {
      setActiveLeaf(leafId)
    }, direction)
  }

  const handleDaySwitch = (dayNum) => {
    if (currentDayTab === dayNum) return
    const direction = dayNum > currentDayTab ? 'right' : 'left'
    triggerPageTurnAnimation(() => {
      setCurrentDayTab(dayNum)
      setCurrentSpotIndex(0)
    }, direction)
  }

  const handleSealDay = useCallback(() => {
    setStamping(true)
    
    if (!soundMuted) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          const audioCtx = new AudioContext()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(90, audioCtx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.25)
          gain.gain.setValueAtTime(0, audioCtx.currentTime)
          gain.gain.linearRampToValueAtTime(0.24 * soundVolume, audioCtx.currentTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.24)
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.3)
        }
      } catch { /* ignore */ }
    }

    setTimeout(() => {
      completeDay(currentDayTab)
      setStamping(false)
    }, 1100)
  }, [soundMuted, soundVolume, currentDayTab, completeDay])

  const playTypewriterClick = useCallback(() => {
    if (soundMuted) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      const filter = audioCtx.createBiquadFilter()
      
      osc.type = 'sine'
      const pitchMultiplier = 0.95 + Math.random() * 0.15
      const startFreq = 1100 * pitchMultiplier
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(550, audioCtx.currentTime)
      filter.Q.setValueAtTime(4, audioCtx.currentTime)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.08 * soundVolume, audioCtx.currentTime + 0.003) 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03) 
      
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc.start()
      osc.stop(audioCtx.currentTime + 0.035)
    } catch { /* ignore */ }
  }, [soundMuted, soundVolume])

  const playGlossarySound = useCallback((arabicText, freqOffset = 0) => {
    if (soundMuted) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(arabicText)
      utterance.lang = 'ar-BH'
      utterance.rate = 0.8
      utterance.pitch = 0.98
      utterance.volume = soundVolume
      window.speechSynthesis.speak(utterance)

      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      
      const playString = (frequency, delayTime, gainVolume) => {
        const osc = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delayTime)
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delayTime)
        gainNode.gain.linearRampToValueAtTime(gainVolume * soundVolume, audioCtx.currentTime + delayTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delayTime + 1.2)
        
        osc.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        osc.start(audioCtx.currentTime + delayTime)
        osc.stop(audioCtx.currentTime + delayTime + 1.3)
      }
      
      playString(146.83 + freqOffset, 0.0, 0.22) 
      playString(220.00 + freqOffset * 1.5, 0.04, 0.16) 
    } catch { /* ignore */ }
  }, [soundMuted, soundVolume])

  const almanac = getAlmanac(currentDayTab)


  return (
    <div className="min-h-screen wood-desk-backdrop py-6 px-4 md:px-8 flex flex-col items-center justify-start md:justify-center font-sans relative select-none">
      
      {/* Desktop accent — subtle only */}
      <div className="hidden lg:block desktop-prop-quill" style={{ opacity: 0.4 }}>
        <svg viewBox="0 0 120 180" className="w-full h-auto">
          <defs>
            <linearGradient id="quillGradDash2" x1="0%" y1="0%" x2="100%" y2="100%">
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
          <path d="M 60,95 Q 50,60 30,15 Q 40,40 55,75 Z" fill="url(#quillGradDash2)" />
          <path d="M 60,95 Q 65,55 78,10 Q 70,35 63,70 Z" fill="url(#quillGradDash2)" opacity="0.9" />
          <path d="M 60,98 Q 57,60 48,12" stroke="#aa7c11" strokeWidth="1.5" fill="none" opacity="0.8" />
        </svg>
      </div>

      <div className="hidden lg:block desktop-prop-tea" style={{ opacity: 0.35 }} title="Cardamom Karak Tea">
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

      <Clock className="hidden lg:block desktop-prop-watch" style={{ opacity: 0.35 }} showSeconds={true} />

      <div className="hidden lg:block desktop-prop-passport" style={{ opacity: 0.35 }}>
        <svg viewBox="0 0 120 180" className="w-full h-auto">
          <rect x="5" y="5" width="110" height="170" rx="8" fill="#D11A38" stroke="#B0102A" strokeWidth="1.5" />
          <rect x="9" y="9" width="102" height="162" rx="5" fill="none" stroke="#FAF9F6" strokeWidth="0.75" strokeDasharray="3,3" />
          <circle cx="60" cy="72" r="16" fill="none" stroke="#FAF9F6" strokeWidth="0.75" />
          <path d="M 50,72 Q 60,82 70,72 Q 60,62 50,72 Z M 55,72 Q 60,77 65,72" fill="none" stroke="#FAF9F6" strokeWidth="0.5" />
          <path d="M 60,56 L 60,88 M 44,72 L 76,72" stroke="#FAF9F6" strokeWidth="0.5" opacity="0.6" />
          <text x="60" y="32" fill="#FAF9F6" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.2" textAnchor="middle">KINGDOM OF BAHRAIN</text>
          <text x="60" y="146" fill="#FAF9F6" fontSize="8" fontFamily="serif" letterSpacing="2" textAnchor="middle">PASSPORT</text>
          <text x="60" y="156" fill="#FAF9F6" fontSize="4" fontFamily="sans-serif" letterSpacing="1" textAnchor="middle" opacity="0.65">ENTRY VISA ACTIVATE</text>
        </svg>
      </div>

      {/* Dashboard Header — clean & focused */}
      <header className="w-full max-w-6xl z-10 select-none mb-6">
        <div className="w-full rounded-2xl overflow-hidden" style={{ background: '#D11A38', boxShadow: '0 4px 24px rgba(209,26,56,0.28)' }}>
          <div className="flex items-center justify-between px-5 py-3 gap-4">
            {/* Logo */}
            <div className="flex flex-col items-start relative pb-2">
              <h1 className="font-serif text-2xl font-semibold text-white leading-tight relative">
                Bahrain{' '}
                <span className="relative inline-block">
                  <span className="italic font-light">Passage</span>
                  <span className="absolute right-0 top-[100%] font-sans text-[7px] tracking-[0.25em] uppercase font-bold text-white/55 mt-1.5 whitespace-nowrap">
                    مملكة البحرين
                  </span>
                </span>
              </h1>
            </div>

            {/* Centre — trip status pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              <span className="font-sans text-[9px] tracking-wider uppercase font-semibold text-white/75">
                Day {currentDayTab} of {duration} · {completedDays.length} sealed
              </span>
              <span className="text-white/30 text-xs">·</span>
              <span className="font-mono text-[9px] font-bold text-white/60">{xp.toLocaleString()} XP</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {/* XP passport button */}
              <button
                onClick={() => setShowPassportCard(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.22)' }}
                title="View Explorer Passport"
              >
                <span className="text-white text-[9px] font-bold uppercase tracking-wider">Passport</span>
                <span className="font-sans text-[9px] font-bold text-white/80 uppercase tracking-wider hidden sm:inline">{rank.label}</span>
              </button>
              {/* Sound */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <button onClick={() => setSoundMuted(!soundMuted)} className="text-xs focus:outline-none hover:scale-110 transition-transform cursor-pointer">
                  {soundMuted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05" value={soundVolume}
                  onChange={(e) => { setSoundVolume(parseFloat(e.target.value)); if (soundMuted) setSoundMuted(false) }}
                  className="w-12 h-1 rounded-lg appearance-none cursor-pointer accent-bahrain-red brass-slider"
                />
              </div>
              {/* Journal Notebook — new premium view */}
              <button
                onClick={() => setStep(6)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/90 hover:text-white text-[8px] tracking-widest uppercase font-bold transition-all cursor-pointer hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(212,175,55,0.35)' }}
                title="Open Journal Notebook — Riffa Fort"
              >
                <span className="text-xs">📖</span>
                <span className="hidden sm:inline">Notebook</span>
              </button>
              {/* Edit trip */}
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 rounded-xl text-white/80 hover:text-white text-[8px] tracking-widest uppercase font-bold transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                ← Edit
              </button>
            </div>
          </div>

          {/* XP progress strip */}
          {nextRank && (
            <div className="px-5 pb-3 flex items-center gap-3">
              <span className="font-sans text-[8px] text-white/50 tracking-widest uppercase shrink-0">{rank.label}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${rankProgress}%`, background: 'rgba(255,255,255,0.85)' }} />
              </div>
              <span className="font-sans text-[8px] text-white/40 tracking-widest uppercase shrink-0">→ {nextRank.label}</span>
            </div>
          )}

          <div style={{ lineHeight: 0 }}>
            <svg viewBox="0 0 1200 12" preserveAspectRatio="none" style={{ width: '100%', height: '12px', display: 'block' }}>
              <path d="M0,0 L50,10 L100,0 L150,10 L200,0 L250,10 L300,0 L350,10 L400,0 L450,10 L500,0 L550,10 L600,0 L650,10 L700,0 L750,10 L800,0 L850,10 L900,0 L950,10 L1000,0 L1050,10 L1100,0 L1150,10 L1200,0 L1200,12 L0,12 Z" fill="#FAF9F6" />
            </svg>
          </div>
        </div>
      </header>
      {/* Outer 3D Binder Journal Container */}
      <div className="w-full max-w-5xl journal-binder-wrapper px-0 relative flex items-center justify-center mx-auto">

        {/* Open journal double-page grid */}
        <div className="relative w-full grid grid-cols-1 md:grid-cols-2 rounded-[28px] overflow-visible journal-open-book bg-[#FAF9F6] shadow-2xl mx-auto">

          {/* Protruding Leather Index Tabs — flush against right edge of book */}
          <div className="absolute top-16 left-full hidden md:flex flex-col gap-2 z-40" style={{ marginLeft: 0 }}>
            {[
              { id: 'chronicles', label: "Today's", emoji: '📖' },
              { id: 'cartography', label: 'Map', emoji: '🗺️' },
              { id: 'hotels', label: 'Hotels', emoji: '🏨' },
              { id: 'keepsakes', label: 'Souvenirs', emoji: '🪙' },
              { id: 'lexicon', label: 'Phrases', emoji: '📜' }
            ].map(tab => {
              const active = activeLeaf === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleLeafSwitch(tab.id)}
                  className={`leather-tab-item relative px-3 py-3 flex flex-col items-center justify-center text-white ${active ? 'active' : ''}`}
                  style={{ width: '48px', height: '68px' }}
                >
                  <span className="text-base leading-none">{tab.emoji}</span>
                  <span className="font-sans text-[7px] font-extrabold uppercase tracking-widest text-center mt-1 scale-90" style={{ writingMode: 'vertical-rl' }}>
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex md:hidden justify-around bg-[#FCFBF8] border-b border-red-500/10 py-3 rounded-t-[24px] px-2 w-full select-none z-40 overflow-x-auto gap-1 snap-x snap-mandatory overscroll-x-contain" style={{ scrollbarWidth: 'none', scrollPadding: '0 8px' }}>
            {[
              { id: 'chronicles', label: "Today's", emoji: '📖' },
              { id: 'cartography', label: 'Map', emoji: '🗺️' },
              { id: 'hotels', label: 'Hotels', emoji: '🏨' },
              { id: 'keepsakes', label: 'Souvenirs', emoji: '🪙' },
              { id: 'lexicon', label: 'Phrases', emoji: '📜' }
            ].map(tab => {
              const active = activeLeaf === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleLeafSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all active:scale-95 cursor-pointer snap-start flex-shrink-0 ${
                    active ? 'bg-bahrain-red text-white shadow-sm font-extrabold' : 'bg-transparent text-bronze-charcoal hover:bg-red-500/5'
                  }`}
                >
                  <span className="text-xs leading-none">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {flippingLeaf && (
            <div className="flipping-leaf-container">
              <div className={`flipping-leaf flip-${flippingLeaf}`} />
            </div>
          )}

          <div className="journal-center-spine pointer-events-none hidden md:block" />

          <div className="hidden md:block absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="absolute pointer-events-none" style={{ top: `${8 + idx * 11.5}%`, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
                <div className="binder-ring-shadow" style={{ top: '2px' }} />
                <div className="binder-ring" />
              </div>
            ))}
          </div>

          <div className="journal-page-left p-5 md:p-7 flex flex-col justify-start gap-4 relative">
            <div className="animate-fadeIn space-y-4 text-left">

              {activeLeaf === 'chronicles' && (
                <>
                  {/* Day navigation — cleaner, larger, more readable */}
                  <div className="flex items-center justify-between select-none pb-3 border-b border-red-500/10">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans text-[9px] text-bronze-charcoal/60 font-semibold tracking-wider uppercase shrink-0">Day:</span>
                      <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {Array.from({ length: duration }, (_, idx) => {
                          const d = idx + 1
                          const active = currentDayTab === d
                          const unlocked = unlockedDays.includes(d)
                          return (
                            <button
                              key={d}
                              disabled={!unlocked}
                              onClick={() => handleDaySwitch(d)}
                              title={unlocked ? `Day ${d}` : 'Seal the current day first to unlock'}
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all shrink-0 ${
                                !unlocked
                                  ? 'bg-red-500/5 text-bronze-charcoal/30 border border-dashed border-red-500/10 cursor-not-allowed'
                                  : active
                                    ? 'bg-bahrain-red text-white shadow-sm'
                                    : 'bg-white border border-red-500/15 text-bronze-charcoal hover:border-red-500/30 cursor-pointer shadow-sm'
                              }`}
                            >
                              {unlocked ? d : '🔒'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <span className="font-sans text-[8px] text-bronze-charcoal/40 font-semibold">
                      {currentSpotIndex < activeSpots.length ? `Stop ${currentSpotIndex + 1}/${activeSpots.length}` : 'All done'}
                    </span>
                  </div>

                  {/* Narrator guide comments removed */}

                  {activeSpot ? (
                    <div className="space-y-4">
                      {/* Spot header — clear hierarchy */}
                      <div className="flex flex-col items-start gap-2 mb-4">
                        <div>
                          <span className="font-sans text-[8.5px] text-bahrain-red/80 font-bold uppercase tracking-widest block mb-0.5">
                            {activeSpot.period}
                          </span>
                          <h3 className="font-serif text-xl text-bronze-charcoal font-semibold tracking-tight leading-tight">
                            {activeSpot.name}
                          </h3>
                          <p className="font-sans text-[9px] text-bronze-charcoal/50 font-mono mt-1">{activeSpot.coords}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-emerald-700/10 text-emerald-800 text-[9px] font-sans font-bold uppercase tracking-wider">
                              Cost: {activeSpot.pathCost || activeSpot.budgetCost || 'Free Entry'}
                            </span>
                          </div>
                        </div>
                        <span className="font-serif text-xl text-bahrain-red/80 font-medium mt-1">{activeSpot.arabic}</span>
                      </div>

                      <p className="font-sans text-[12px] text-bronze-muted leading-relaxed">
                        {activeSpot.desc}
                      </p>

                      {/* What You Can Find Here */}
                      <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
                        <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold block mb-1.5">
                          What to See
                        </span>
                        <p className="font-serif text-[11.5px] text-bronze-charcoal leading-relaxed font-bold">
                          {activeSpot.simpleTerms}
                        </p>
                      </div>

                      {/* Personal notes */}
                      <div className="p-3.5 rounded-xl border border-red-500/10 bg-white">
                        <span className="font-sans text-[8px] tracking-widest uppercase text-bronze-charcoal/40 font-bold block mb-1.5">
                          Your Notes
                        </span>
                        <textarea
                          value={localReflection}
                          onChange={(e) => {
                            const val = e.target.value
                            setLocalReflection(val)
                            playTypewriterClick()
                            if (reflectionDebounceRef.current) clearTimeout(reflectionDebounceRef.current)
                            reflectionDebounceRef.current = setTimeout(() => {
                              saveJournalReflection(activeSpot.id, val)
                            }, 400)
                          }}
                          placeholder="Jot down your thoughts about this place..."
                          rows="3"
                          className="w-full text-xs font-serif text-bronze-charcoal placeholder-bronze-muted/30 ruled-lines-container border-none focus:outline-none resize-none focus:ring-0 leading-6 bg-transparent"
                        />
                      </div>

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
                                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-sans text-[9px] font-bold animate-scaleIn select-none space-y-2">
                                  <p>❌ {riddleError}</p>
                                  {!aiRiddleHint[activeSpot.id] && (
                                    <button
                                      disabled={aiHintLoading}
                                      onClick={async () => {
                                        if (goldFils < 50) {
                                          setRiddleError('Not enough Fils for a hint! (Need 50 Fils)')
                                          return
                                        }
                                        setAiHintLoading(true)
                                        const { system, user } = buildRiddleHintPrompt(
                                          RIDDLES[activeSpot.id].question,
                                          RIDDLES[activeSpot.id].options
                                        )
                                        const hint = await callLocalAI(system, user,
                                          'Look closely at the most ancient aspect of this location — the answer relates to what this place is most historically known for.',
                                          { cacheKey: `hint:${activeSpot.id}`, maxTokens: 80 }
                                        )
                                        setGoldFils(prev => prev - 50)
                                        setAiRiddleHint(prev => ({ ...prev, [activeSpot.id]: hint }))
                                        setAiHintLoading(false)
                                        setRiddleError(null)
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[8px] font-extrabold uppercase tracking-wide cursor-pointer transition-all disabled:opacity-50"
                                    >
                                      {aiHintLoading ? '...' : 'Get Hint (50 Fils)'}
                                    </button>
                                  )}
                                </div>
                              )}
                              {aiRiddleHint[activeSpot.id] && (
                                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300/40">
                                  <p className="font-sans text-[7.5px] uppercase tracking-wider text-amber-700 font-extrabold mb-1">Hint</p>
                                  <p className="font-serif text-[9.5px] italic text-bronze-charcoal leading-relaxed">
                                    {aiRiddleHint[activeSpot.id]}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="font-serif text-xs italic text-bronze-muted">
                        All landmarks for this chapter sealed! Flip the tab to explore next pages.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeLeaf === 'chronicles' && !hasSpots && (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[300px]">
                  <span className="text-4xl animate-bounce">🏜️</span>
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-black">
                    Itinerary Disrupted
                  </span>
                  <h3 className="font-serif text-xl font-bold text-bronze-charcoal">
                    No Landmarks Found
                  </h3>
                  <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold max-w-[240px]">
                    The sands have shifted! We could not construct a custom itinerary with your selected vibes.
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-[8px] uppercase tracking-widest font-extrabold transition-all shadow-md cursor-pointer mt-2"
                  >
                    Adjust Vibe Settings
                  </button>
                </div>
              )}

              {activeLeaf === 'cartography' && (
                <div className="space-y-4">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Meteorological Records
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Wayfarer's Almanac
                  </h3>
                  <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold">
                    Atmospheric readings and tide charts from Sitra harbors, Jarada disappearing sandbanks, and Sakhir desert dunes.
                  </p>
                  <div className="space-y-3 mt-4">
                    {almanac.metrics.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-red-500/5 bg-white shadow-sm flex flex-col justify-between stitch-border">
                        <span className="font-sans text-[8px] uppercase tracking-wider text-bronze-muted/60 font-bold">{m.label}</span>
                        <span className="font-serif text-base font-extrabold text-bahrain-red mt-1">{m.value}</span>
                        <span className="font-sans text-[8px] text-bronze-muted/50 font-semibold mt-1">{m.desc}</span>
                      </div>
                    ))}
                  </div>
                  <span className="font-sans text-[7px] text-bronze-muted/40 italic block mt-2">
                    * Fictional meteorological records provided for thematic regional flavor and historical tourism context.
                  </span>
                </div>
              )}

              {activeLeaf === 'keepsakes' && (
                <div className="space-y-5">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Official Entry Visas
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Wayfarer's Passport
                  </h3>
                  <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold">
                    Sealed border stamps are permanently marked in your passport book upon completing a day's journey.
                  </p>
                  
                  <div className={`grid gap-2.5 mt-5 ${duration > 5 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                    {Array.from({ length: duration }, (_, idx) => {
                      const d = idx + 1
                      const completed = completedDays.includes(d)
                      return (
                        <div key={d} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 relative overflow-hidden bg-white shadow-sm ${completed ? 'border-bahrain-red/60 text-bahrain-red' : 'border-pearl-border/80 text-bronze-muted/20'}`}>
                          {completed ? (
                            <div className="w-full h-full border-2 border-double border-bahrain-red/60 rounded-full flex flex-col items-center justify-center rotate-6 text-bahrain-red p-1">
                              <span className="font-serif text-[5.5px] tracking-widest uppercase font-extrabold">Authenticated</span>
                              <span className="font-serif text-[4.5px] tracking-wider uppercase font-bold mt-0.5">Day {d} Entry</span>
                              <span className="font-mono text-[4px] text-bronze-charcoal mt-0.5">Sealed</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-base">🔒</span>
                              <span className="font-serif text-[8px] uppercase tracking-wider text-bronze-muted/50 mt-1 font-bold">Day {d} Stamp</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold block mt-4 border-t border-red-500/10 pt-4">
                    Captured Photos
                  </span>
                  <Carousel_002 
                    images={(() => {
                      const userSnaps = spotsCatalog
                        .map(spot => {
                          const photo = capturedPhotos[spot.id]
                          if (photo) {
                            return {
                              src: photo,
                              alt: spot.name
                            }
                          }
                          return null
                        })
                        .filter(Boolean);
                      
                      if (userSnaps.length > 0) return userSnaps;

                      return [
                        { 
                          src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Manama_Bab_al-Bahrain_Souq_1.jpg', 
                          alt: 'Showcase Snap: Bab Al Bahrain' 
                        },
                        { 
                          src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Manama_Bahrain_National_Museum_Exterior_1.jpg', 
                          alt: 'Showcase Snap: Bahrain National Museum' 
                        },
                        { 
                          src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_Fort_March_2015.JPG', 
                          alt: 'Showcase Snap: Qal\'at al-Bahrain (Bahrain Fort)' 
                        }
                      ];
                    })()}
                    showPagination={true}
                    showNavigation={true}
                    loop={true}
                    autoplay={true}
                    spaceBetween={40}
                  />
                </div>
              )}

              {activeLeaf === 'lexicon' && (
                <div className="space-y-4">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Bahraini Arabic · Phrasebook
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Useful Local Phrases
                  </h3>
                  <p className="font-sans text-xs text-bronze-muted leading-relaxed font-semibold">
                    Tap any word to hear the pronunciation — great for greeting locals on your visit.
                  </p>
                  <div className="grid grid-cols-1 gap-3 mt-4 max-h-[360px] overflow-y-auto antique-scrollbar pr-1">
                    {[
                      { word: "كَرَتْ", label: "Karak", arabic: "كَرَتْ", desc: "Bahrain's signature robust spiced condensed-milk tea.", pitchOffset: 0 },
                      { word: "حَلْوَى", label: "Halwa", arabic: "حَلْوَى", desc: "Saffron sweet jelly cooked in copper vats with almonds.", pitchOffset: 35 },
                      { word: "سُوقْ", label: "Souq", arabic: "سُوقْ", desc: "Ancient maze-like merchant alleyways of Old Manama.", pitchOffset: -15 },
                      { word: "دَلَّهْ", label: "Dallah", arabic: "دَلَّهْ", desc: "Long-beaked brass coffee pot used to brew Arabic coffee.", pitchOffset: 60 }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => playGlossarySound(item.word, item.pitchOffset)}
                        className="p-3 rounded-xl border border-red-500/10 bg-white hover:border-bahrain-red text-left cursor-pointer transition-all active:scale-98 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-serif text-[11px] font-bold text-bronze-charcoal">{item.label} <span className="italic text-bahrain-red font-medium">({item.arabic})</span></h5>
                          <p className="font-sans text-[9px] text-bronze-muted mt-0.5 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                        <span className="text-[9px] text-bahrain-red/60 hover:text-bahrain-red shrink-0 ml-2">🔊 Pluck</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeLeaf === 'hotels' && (
                <div className="max-h-[500px] overflow-y-auto antique-scrollbar pr-1">
                  <AIHotelPanel moods={selectedMoods} tier={tier} duration={duration} />
                </div>
              )}

            </div>

            {activeLeaf === 'chronicles' && hasSpots && (
              <div className="flex justify-between items-center pt-4 border-t border-red-500/10 mt-6 select-none">
                <span className="font-sans text-[9px] tracking-wider uppercase text-bronze-muted/60 font-bold">
                  {currentSpotIndex < activeSpots.length ? (
                    `Page ${currentSpotIndex + 1} of ${activeSpots.length}`
                  ) : (
                    "Proceed"
                  )}
                </span>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSteps }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerPageTurnAnimation(() => setCurrentSpotIndex(idx), idx > currentSpotIndex ? 'right' : 'left')}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                        currentSpotIndex === idx ? 'bg-bahrain-red scale-110' : 'bg-red-500/15'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={currentSpotIndex === 0}
                    onClick={handlePrevStep}
                    className="px-3 py-1 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-extrabold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={currentSpotIndex === totalSteps - 1}
                    onClick={handleNextStep}
                    className="px-3 py-1 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-extrabold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="journal-page-right p-6 md:p-8 flex flex-col gap-5 items-center relative">
            <div className="animate-fadeIn w-full flex flex-col items-center">
              
              {activeLeaf === 'chronicles' && (
                isSealStep ? (
                  <div className="w-full flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-red-500/25 max-w-[310px] shadow-sm rounded-2xl animate-scaleIn relative overflow-hidden select-none mt-4">
                    
                    {stamping && (
                      <div className="absolute inset-0 z-40 bg-white/80 flex items-center justify-center pointer-events-none">
                        <div className="w-32 h-32 border-4 border-double border-bahrain-red/80 rounded-full flex flex-col items-center justify-center rotate-6 text-bahrain-red shadow-lg bg-pearl-white animate-scaleIn">
                          <span className="font-serif text-[9px] tracking-widest uppercase font-extrabold">Authenticated</span>
                          <span className="font-serif text-[7px] tracking-wider uppercase font-bold mt-1">Day {currentDayTab} Entry</span>
                          <span className="font-mono text-[5px] text-bronze-charcoal mt-1">Day {currentDayTab} sealed</span>
                        </div>
                      </div>
                    )}

                    {!isDayCompleted ? (
                      <div className="relative z-10 flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 border-2 border-dashed border-red-500/20 rounded-full flex items-center justify-center text-red-500/35 mb-2 select-none">
                          🔒
                        </div>
                        <span className="font-sans text-[7px] tracking-[0.2em] text-bahrain-red uppercase font-bold block select-none">
                          Passage Sealing Verification
                        </span>
                        <h4 className="font-serif text-lg text-bronze-charcoal font-semibold">
                          Seal Day {currentDayTab}'s Passage
                        </h4>
                        <p className="font-sans text-[10px] text-bronze-muted leading-relaxed font-semibold">
                          You have explored all landmarks for this daily chapter. Imprint your official border stamp to seal the path and lock in the Insider reward.
                        </p>
                        
                        <button
                          onClick={handleSealDay}
                          className="px-6 py-2.5 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-[9px] uppercase tracking-widest font-extrabold transition-all shadow-md cursor-pointer"
                        >
                          Authenticate Stamp
                        </button>
                      </div>
                    ) : (
                      <div className="relative z-10 text-left flex flex-col justify-center items-center space-y-3 w-full">
                        <span className="font-sans text-[8px] tracking-widest text-green-700 font-extrabold select-none">
                          ✓ Day {currentDayTab} Passkey Active
                        </span>
                        <h5 className="font-serif text-[13px] font-bold text-bronze-charcoal text-center">
                          Traditional Insider Passkey:
                        </h5>
                        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center w-full">
                          <p className="font-serif text-[11px] italic text-bronze-charcoal leading-relaxed font-bold">
                            {currentDayTab === 1 && 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.'}
                            {currentDayTab === 2 && 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.'}
                            {currentDayTab === 3 && 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.'}
                            {currentDayTab === 4 && 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.'}
                            {currentDayTab === 5 && 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.'}
                          </p>
                        </div>
                        <div className="w-24 h-24 border-4 border-double border-bahrain-red/70 rounded-full flex flex-col items-center justify-center rotate-12 text-bahrain-red bg-pearl-white/40 shrink-0 select-none shadow-sm mt-3">
                          <span className="font-serif text-[7px] tracking-widest uppercase font-bold">Authenticated</span>
                          <span className="font-serif text-[5px] tracking-wider uppercase font-bold mt-0.5">Bahrain Entry</span>
                          <span className="font-serif text-[4px] text-bronze-charcoal mt-0.5">Passage sealed</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  activeSpot && (
                    <div className="flex flex-col items-center w-full space-y-6 py-2">
                      
                      <div className="relative bg-white p-3.5 pb-10 shadow-xl border border-red-500/5 rotate-[-1.5deg] hover:rotate-[1deg] transition-all duration-700 w-full max-w-[240px] shrink-0">
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/40 backdrop-blur-[1px] border border-white/20 shadow-sm rotate-[-3deg] z-10 pointer-events-none" />
                        
                        {hasKeepsake(activeSpot.id) && (
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-600/40 flex items-center justify-center rotate-12 text-amber-600 shadow-sm z-30 font-serif font-extrabold text-[12px] pointer-events-none select-none">
                            ★
                          </div>
                        )}

                        <div className="w-full h-44 overflow-hidden relative border border-red-500/5 bg-bahrain-dark flex items-center justify-center rounded-sm">
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#FCFBF8] border-8 border-double border-bahrain-red/20 text-center select-none z-0 relative">
                            <div className="absolute inset-0 border-4 border-transparent" style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, #D11A38, #D11A38 8px, #FFFFFF 8px, #FFFFFF 16px, #4B85C4 16px, #4B85C4 24px, #FFFFFF 24px, #FFFFFF 32px)',
                              opacity: 0.15,
                              pointerEvents: 'none'
                            }} />
                            <div className="z-10 flex flex-col items-center space-y-1">
                              <span className="text-3xl animate-pulse">📮</span>
                              <span className="font-serif text-[10px] text-bahrain-red font-bold tracking-wider uppercase">BAHRAIN POST</span>
                              <span className="font-serif text-[11px] text-bronze-charcoal/80 font-medium italic mt-0.5 max-w-[160px] truncate">{activeSpot.name}</span>
                              <span className="font-serif text-[10px] text-bahrain-red/90 font-bold mt-0.5">{activeSpot.arabic}</span>
                              <span className="font-sans text-[7px] text-bronze-muted/60 uppercase tracking-widest font-semibold mt-1">Official Chronicle Card</span>
                            </div>
                          </div>
                          
                          <img
                            src={capturedPhotos[activeSpot.id] || activeSpot.image}
                            alt={activeSpot.name}
                            className="w-full h-full object-cover block relative z-10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>

                        {capturedPhotos[activeSpot.id] && (
                          <div className="postmark-stamp scale-75 -bottom-2 -right-3">
                            <span className="font-serif text-[6px] tracking-widest text-bahrain-red block uppercase font-extrabold">Sealed</span>
                            <span className="font-serif text-[5px] text-bahrain-red/60 uppercase block font-bold mt-0.5">MANAMA</span>
                            <span className="font-mono text-[4px] text-bahrain-red/80 block uppercase font-bold mt-0.5">{todayDateStr}</span>
                          </div>
                        )}

                        <div className="absolute bottom-2.5 left-4 right-4 text-left">
                          <span className="font-serif text-[10px] text-bronze-charcoal/80 font-bold tracking-tight truncate block">{activeSpot.name}</span>
                          <span className="font-sans text-[6px] text-bronze-muted/50 tracking-wider uppercase font-semibold block mt-0.5">Scrapbook postcard • 2026</span>
                        </div>
                      </div>

                      {/* Action buttons — clearer grouping */}
                      <div className="flex gap-2 flex-wrap justify-center">
                        <button
                          onClick={() => setActiveScanSpot(activeSpot)}
                          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-[9px] tracking-widest uppercase font-bold transition-all cursor-pointer shadow-md ${
                            capturedPhotos[activeSpot.id]
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-bahrain-red hover:bg-bahrain-dark text-white'
                          }`}
                        >
                          {capturedPhotos[activeSpot.id] ? 'Retake Photo' : 'Capture Photo'}
                        </button>
                        {hasVirtualTour(activeSpot.id) && (
                          <button
                            onClick={() => {
                              setVirtualTourIndex(getTourIndexForSpot(activeSpot.id))
                              setShowVirtualTour(true)
                            }}
                            className="flex-1 min-w-[130px] px-4 py-2.5 rounded-xl text-[9px] tracking-widest uppercase font-bold transition-all cursor-pointer shadow-md bg-white border border-red-500/20 text-bahrain-red hover:bg-red-500/5"
                          >
                            Virtual Tour
                          </button>
                        )}
                      </div>

                      <div className="w-full max-w-[320px] p-4.5 rounded-2xl border border-amber-600/35 bg-[#FCFBF8] shadow-sm text-left select-none relative overflow-hidden stitch-border shrink-0 my-2">
                        <div className="paper-clip-asset" style={{ right: '20px', left: 'auto' }} />
                        <span className="font-sans text-[7.5px] tracking-widest text-bahrain-red uppercase font-extrabold block mb-2">
                          Day {currentDayTab} Itinerary
                        </span>
                        
                        <div className="space-y-2 mt-1">
                          {/* 1. Departure Base Camp Stop */}
                          {selectedHotel ? (
                            <button
                              onClick={() => handleLeafSwitch('hotels')}
                              className="w-full flex items-center justify-between p-2 rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF9] text-left transition-all hover:border-[#D4AF37]/60"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs shrink-0">🏡</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-serif text-[10px] font-bold text-bronze-charcoal truncate">
                                    Base Camp Departure
                                  </span>
                                  <span className="font-sans text-[8px] text-bronze-muted/70 truncate">
                                    {selectedHotel.name} ({selectedHotel.neighborhood.split(',')[0]})
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[7px] text-bahrain-red/60 uppercase tracking-widest font-bold">Start</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLeafSwitch('hotels')}
                              className="w-full flex items-center justify-between p-2 rounded-xl border border-dashed border-[#BA0C2F]/20 bg-[#FAF9F6]/50 text-left transition-all hover:bg-[#BA0C2F]/5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs shrink-0">🏨</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-serif text-[10px] font-bold text-[#BA0C2F] underline truncate font-extrabold">
                                    Select Base Camp
                                  </span>
                                  <span className="font-sans text-[8px] text-bronze-muted/50 truncate font-semibold">
                                    Tap to find AI accommodations
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[7px] text-[#BA0C2F]/60 uppercase tracking-widest font-bold">Stay</span>
                            </button>
                          )}

                          {/* 2. Destination Stops */}
                          {activeSpots.map((spot, idx) => {
                            const isSelected = activeSpot && activeSpot.id === spot.id
                            const scanned = hasKeepsake(spot.id)
                            return (
                              <button
                                key={spot.id}
                                onClick={() => triggerPageTurnAnimation(() => setCurrentSpotIndex(idx), idx > currentSpotIndex ? 'right' : 'left')}
                                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                                  isSelected 
                                    ? 'bg-white border-bahrain-red shadow-sm font-bold scale-[1.01]' 
                                    : 'bg-transparent border-transparent hover:border-red-500/10'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {scanned ? (
                                    <span className="text-green-600 text-xs shrink-0 font-bold">✓</span>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-full border border-red-500/25 shrink-0 flex items-center justify-center font-sans text-[6px] font-bold text-red-500">
                                      {idx + 1}
                                    </span>
                                  )}
                                  <span className="font-serif text-[10px] text-bronze-charcoal truncate">
                                    {spot.name}
                                  </span>
                                </div>
                                <span className="font-mono text-[7px] text-bronze-muted/40 tracking-wider">
                                  {spot.coords.split(',')[0]}
                                </span>
                              </button>
                            )
                          })}

                          {/* 3. Overnight Return Stay */}
                          {hasSpots && selectedHotel && (
                            <button
                              onClick={() => handleLeafSwitch('hotels')}
                              className="w-full flex items-center justify-between p-2 rounded-xl border border-[#D4AF37]/30 bg-[#FFFDF9] text-left transition-all hover:border-[#D4AF37]/60"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs shrink-0">🛌</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-serif text-[10px] font-bold text-bronze-charcoal truncate font-extrabold">
                                    Overnight Rest
                                  </span>
                                  <span className="font-sans text-[8px] text-bronze-muted/70 truncate font-semibold">
                                    Return to {selectedHotel.name}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[7px] text-bronze-muted/40 uppercase tracking-widest font-bold">End</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )
                )
              )}

              {activeLeaf === 'cartography' && (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-[280px] aged-paper-gradient border border-dashed border-amber-600/20 rounded-2xl shadow-sm mt-4 space-y-4">
                  <div className="space-y-1">
                    <span className="font-sans text-[7.5px] tracking-[0.25em] text-bahrain-red uppercase font-bold block">
                      Map
                    </span>
                    <h5 className="font-serif text-xs font-bold text-bronze-charcoal">Bahrain Archipelago Map</h5>
                  </div>
                  <p className="font-serif text-[10px] italic text-bronze-muted leading-relaxed">
                    View your route, find landmarks, and discover treasures.
                  </p>
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-sans font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-600/15 border border-amber-600/20 active:scale-98 flex items-center justify-center gap-1.5"
                  >
                    Open Map
                  </button>
                </div>
              )}

              {activeLeaf === 'keepsakes' && (
                <div className="w-full max-w-[350px] flex flex-col items-center space-y-4">
                  <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-600/25">
                    <span className="font-sans text-[8px] tracking-wider text-amber-700 font-extrabold flex items-center gap-1 uppercase">
                      Balance
                    </span>
                    <span className="font-mono text-xs font-black text-amber-800">
                      {goldFils.toLocaleString()} Fils
                    </span>
                  </div>

                  <button 
                    onClick={() => { setShowSouqShop(true); setShopAlert(null); }}
                    className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-sans font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-amber-600/15 border border-amber-600/20 active:scale-98"
                  >
                    Open Shop
                  </button>

                  <div className="w-full p-5 rounded-2xl bg-amber-500/5 border border-amber-600/20 shadow-sm animate-fadeIn">
                    <span className="font-sans text-[7.5px] tracking-[0.2em] text-amber-800 uppercase font-extrabold block mb-3 text-center">
                      Your Collection
                    </span>
                    <div className="grid grid-cols-4 gap-2.5 relative z-10">
                      {spotsCatalog.map(spot => {
                        const unlocked = collectedKeepsakes.includes(spot.id)
                        return (
                          <button
                            key={spot.id}
                            disabled={!unlocked}
                            onClick={() => setSelectedKeepsake(spot)}
                            title={unlocked ? `Souvenir: ${spot.keepsakeDesc}` : 'Souvenir Locked — Capture snap using Lens at location to unlock!'}
                            className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 relative border ${
                              unlocked
                                ? 'brass-coin-frame cursor-pointer hover:scale-105 active:scale-95'
                                : 'bg-amber-600/5 border-dashed border-amber-600/15 opacity-30 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-base">{unlocked ? spot.keepsakeEmoji : '🔒'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {collectedKeepsakes.length === 0 && (
                    <p className="font-serif text-[10px] italic text-bronze-muted/80 text-center leading-relaxed font-semibold">
                      Cabinet empty. Focus Capture Lens at chronicle spots to unlock traditional souvenirs!
                    </p>
                  )}

                  {/* Resident Guild Reputation removed */}

                  {selectedKeepsake && (
                    <div className="p-4 rounded-xl bg-white border border-amber-600/40 text-left relative animate-scaleIn w-full shadow-sm">
                      <button 
                        onClick={() => setSelectedKeepsake(null)}
                        className="absolute top-2 right-2 text-[9px] text-bronze-muted/60 hover:text-bahrain-red cursor-pointer font-bold"
                      >
                        ✕ Close
                      </button>
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-amber-600/10">
                        <span className="text-xl">{selectedKeepsake.keepsakeEmoji}</span>
                        <div>
                          <h6 className="font-serif text-[11px] font-black text-bronze-charcoal leading-none">{selectedKeepsake.keepsakeId.replace(/-/g, ' ').toUpperCase()}</h6>
                          <span className="font-sans text-[6.5px] text-amber-700 font-extrabold tracking-wider uppercase">{selectedKeepsake.name}</span>
                        </div>
                      </div>
                      <p className="font-serif text-[9.5px] leading-relaxed italic text-bronze-charcoal font-semibold">
                        "{selectedKeepsake.keepsakeDesc}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeLeaf === 'lexicon' && (
                <div className="w-full max-w-[320px] flex flex-col items-center space-y-4 text-left animate-fadeIn">
                  <div className="w-full p-4 rounded-2xl bg-amber-500/5 border border-amber-600/15 space-y-3">
                    <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-black block">
                      Pronunciation Guide
                    </span>
                    <div className="space-y-2">
                      <div className="pb-2 border-b border-amber-600/10">
                        <p className="font-serif text-[11px] font-bold text-bronze-charcoal">The Arabic "Kh" (خ)</p>
                        <p className="font-sans text-[9px] text-bronze-muted leading-relaxed">
                          Pronounced like a soft, raspy scratch at the back of the throat (similar to the Scottish "loch" or Spanish "j"). Try saying <span className="italic font-bold">"Khubz"</span> (bread).
                        </p>
                      </div>
                      <div className="pb-2 border-b border-amber-600/10">
                        <p className="font-serif text-[11px] font-bold text-bronze-charcoal">The Cardinal G (ق / G)</p>
                        <p className="font-sans text-[9px] text-bronze-muted leading-relaxed">
                          In Gulf dialect, the standard "q" (qaf) is universally softened to a hard "g" sound as in "gold". E.g., <span className="italic font-bold">"Qal'at"</span> is pronounced <span className="italic font-bold">"Gal-at"</span>.
                        </p>
                      </div>
                      <div>
                        <p className="font-serif text-[11px] font-bold text-bronze-charcoal">Double Vowels (aa / ee)</p>
                        <p className="font-sans text-[9px] text-bronze-muted leading-relaxed">
                          Elongate the sound slightly, like drawing out a sigh. E.g., <span className="italic font-bold">"Hala"</span> is quick, while <span className="italic font-bold">"Habeebee"</span> flows.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-4 rounded-2xl bg-amber-600/5 border border-dashed border-amber-600/25 space-y-2">
                    <span className="font-sans text-[8px] tracking-[0.25em] text-amber-700 uppercase font-black block">
                      Practice Phrases
                    </span>
                    <p className="font-serif text-[10px] italic text-bronze-charcoal/80 leading-relaxed font-semibold">
                      "Raise your hand in greeting and say: 'Salam Alaykum, ya sadiqee!' (Peace be upon you, my friend!)"
                    </p>
                  </div>
                </div>
              )}

              {activeLeaf === 'hotels' && (
                <div className="flex flex-col items-center justify-center p-4 text-center max-w-[280px] aged-paper-gradient border border-dashed border-amber-600/20 rounded-2xl shadow-sm mt-4 space-y-3">
                  <span className="text-4xl">🏨</span>
                  <p className="font-serif text-[10px] italic text-bronze-muted leading-relaxed">
                    AI-personalized stays matched to your {duration}-day itinerary and travel style.
                  </p>
                </div>
              )}

              {activeLeaf === 'chronicles' && hasSpots && activeSpot && (
                <div className="w-full max-w-[320px] mt-2 space-y-3">
                  <AIBudgetAdvisor
                    goldFils={goldFils}
                    currentDay={currentDayTab}
                    totalDays={duration}
                    tier={tier}
                  />
                  <AISpotSuggestion
                    moods={selectedMoods}
                    tier={tier}
                    locations={locations}
                  />
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      <footer className="wood-desk-footer w-full max-w-6xl pt-6 pb-2 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left select-none text-bronze-charcoal/50 z-10">
        <span className="font-sans text-[8px] tracking-wider uppercase font-semibold">
          Bahrain Tourism & Passage Guide © 2026
        </span>
        <span className="font-sans text-[8px] tracking-widest text-bahrain-red/60 uppercase font-extrabold">
          National Red & White Pearl Archives
        </span>
      </footer>

      {isMapOpen && locations && locations.length > 0 && (
        <WayfarerMap locations={locations} onClose={() => setIsMapOpen(false)} />
      )}

      {showVirtualTour && (
        <VirtualTour
          initialIndex={virtualTourIndex}
          onClose={() => setShowVirtualTour(false)}
        />
      )}

      <TourChatbot activeSpotName={activeSpot?.name} />

      {showSouqShop && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1A0A0C]/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#FAF9F6] border-4 border-double border-[#C1122F]/40 rounded-3xl p-6 text-left shadow-[0_24px_50px_rgba(42,35,33,0.25)] text-[#3D3330] relative animate-scaleIn select-none">
            <div className="absolute inset-1.5 border border-dashed border-[#C1122F]/15 rounded-[22px] pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#C1122F]/20">
                <div className="flex flex-col">
                  <span className="font-sans text-[8px] tracking-[0.2em] text-[#C1122F] uppercase font-black">
                    Manama Heritage Kiosk
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#2A2321] mt-0.5 flex items-center gap-1.5">
                    Souq Shop
                  </h3>
                </div>
                <button 
                  onClick={() => { setShowSouqShop(false); setShopAlert(null); }}
                  className="px-3 py-1.5 rounded-xl bg-[#C1122F]/10 hover:bg-[#C1122F]/20 text-[#C1122F] hover:text-[#9E0D25] text-[9px] font-sans font-extrabold cursor-pointer transition-all border border-[#C1122F]/10"
                >
                  ✕ Exit Shop
                </button>
              </div>

              {shopAlert && (
                <div className={`p-2.5 rounded-xl border text-[9.5px] leading-relaxed font-bold font-sans ${shopAlert.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800 animate-fadeIn' : 'bg-rose-50 border-rose-200 text-rose-800 animate-fadeIn'}`}>
                  {shopAlert.text}
                </div>
              )}

              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#C1122F]/5 border border-[#C1122F]/15">
                <span className="font-sans text-[8px] tracking-wider text-[#C1122F] font-extrabold uppercase flex items-center gap-1">
                  Your Balance
                </span>
                <span className="font-mono text-sm font-black text-[#2A2321]">
                  {goldFils.toLocaleString()} Fils
                </span>
              </div>

              <p className="font-serif text-[10px] italic text-[#554D4A] leading-relaxed">
                "Marhaban traveler! Spend your golden Fils stipend on spice guild halwa, falcon hoods, or pearl hunt clue scrolls to enhance your reputation with Manama residents."
              </p>

              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 antique-scrollbar">
                {shopItems.map(item => (
                  <div 
                    key={item.id} 
                    className="p-2.5 rounded-xl bg-white border border-[#C1122F]/10 flex items-center justify-between gap-3 hover:border-[#C1122F]/25 transition-all shadow-sm"
                  >
                    <span className="text-2xl shrink-0 p-1.5 bg-[#C1122F]/5 rounded-xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h6 className="font-serif text-[11px] font-bold text-[#2A2321] leading-none">{item.name}</h6>
                      <p className="font-sans text-[8px] text-[#8C827E] mt-1 leading-normal">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => handleBuyItem(item)}
                      className="px-3 py-2 rounded-xl bg-[#C1122F] hover:bg-[#9E0D25] text-white font-sans font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-red-600/10 shrink-0"
                    >
                      {item.cost.toLocaleString()} Fils
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeScanSpot && (
        <WayfarerLens 
          spot={activeScanSpot} 
          onClose={() => setActiveScanSpot(null)} 
        />
      )}

      {showPassportCard && (
        <PassportCard onClose={() => setShowPassportCard(false)} />
      )}

      {showRankUpModal && unlockedRankInfo && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-[#1a0a0c]/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowRankUpModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[32px] overflow-hidden p-6 text-center stitch-border relative select-none animate-scaleIn"
            style={{
              background: 'linear-gradient(135deg, #D11A38 0%, #A81028 100%)',
              boxShadow: '0 30px 80px rgba(209, 26, 56, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              border: '4px solid #FAF9F6'
            }}
          >
            <div className="absolute inset-2 border border-dashed border-white/20 rounded-[24px] pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <span className="font-sans text-[8px] tracking-[0.3em] text-[#FAF9F6]/80 uppercase font-extrabold block">
                ✦ Explorer Rank Advanced ✦
              </span>

              <div 
                className="w-24 h-24 mx-auto rounded-full bg-[#FAF9F6] border-4 border-double border-bahrain-red flex items-center justify-center text-4xl shadow-md"
                style={{ animation: 'stampSlam 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
              >
                {unlockedRankInfo.id === 'wanderer' && '🧭'}
                {unlockedRankInfo.id === 'nomad' && '🏕️'}
                {unlockedRankInfo.id === 'merchant' && '⛵'}
                {unlockedRankInfo.id === 'chronicler' && '📖'}
                {unlockedRankInfo.id === 'pearldiver' && '🦪'}
                {unlockedRankInfo.id === 'dilmun' && '💎'}
              </div>

              <h2 className="font-serif text-3xl font-bold text-white tracking-wide leading-none mt-2">
                {unlockedRankInfo.label}
              </h2>
              <h3 className="font-serif text-base text-[#FAF9F6] font-bold italic mt-0.5">
                ({unlockedRankInfo.arabic})
              </h3>

              <p className="font-sans text-[11px] text-white/95 leading-relaxed font-semibold max-w-[280px] mx-auto pt-1">
                You have advanced in the Bahrain Passage! Keep documenting your steps, capturing snaps with the Lens, and solving native riddles to unlock ancient pearling lore.
              </p>

              <div className="pt-3">
                <button
                  onClick={() => setShowRankUpModal(false)}
                  className="px-8 py-3 rounded-xl bg-white text-bahrain-red hover:bg-[#FAF9F6] font-sans text-[9px] uppercase tracking-widest font-extrabold shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 animate-pulse"
                >
                  Continue Passage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Carousel_002({
  images = [],
  showPagination = true,
  showNavigation = true,
  loop = true,
  autoplay = true,
  spaceBetween = 40
}) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#a19688]/40 bg-[#FCFBF8] flex flex-col items-center justify-center text-center p-6 text-[#9c8e88]/60 select-none">
        <span className="text-3xl animate-bounce">📸</span>
        <span className="font-serif text-[11px] font-bold mt-2">Album Empty</span>
        <span className="font-sans text-[8.5px] mt-0.5 leading-relaxed">Focus your Wayfarer Lens on chronicle spots and snap photos to print cards here!</span>
      </div>
    )
  }

  const autoplayConfig = autoplay 
    ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
    : false

  return (
    <div className="w-full max-w-[280px] mx-auto py-4 select-none relative skiper-cards-carousel relative">
      <Swiper
        grabCursor={true}
        modules={[Navigation, Pagination, Autoplay, Mousewheel]}
        mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
        loop={loop && images.length > 1}
        autoplay={images.length > 1 ? autoplayConfig : false}
        spaceBetween={spaceBetween}
        pagination={showPagination && images.length > 1 ? { clickable: true } : false}
        navigation={showNavigation && images.length > 1 ? true : false}
        className="mySwiper w-full aspect-[4/3] overflow-visible"
      >
        {images.map((img, idx) => (
          <SwiperSlide 
            key={idx} 
            className="rounded-xl overflow-hidden shadow-2xl bg-white border border-[#a19688]/20 p-2.5 pb-8 relative flex flex-col justify-between"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Absolute photo corners in physical album style */}
            <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-black z-20" />
            <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-black z-20" />
            <div className="absolute bottom-8 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-black z-20" />
            <div className="absolute bottom-8 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-black z-20" />

            <div className="w-full h-[calc(100%-8px)] rounded overflow-hidden relative bg-bahrain-dark flex items-center justify-center">
              <img 
                src={img.src} 
                alt={img.alt || 'Passport snapshot'} 
                className="w-full h-full object-cover relative z-10"
              />
            </div>
            
            {/* Postmark stamp simulation on slide */}
            <div className="absolute bottom-1 right-2 scale-[0.65] origin-bottom-right pointer-events-none select-none opacity-90 z-20">
              <div className="border-2 border-double border-bahrain-red/60 rounded-full w-14 h-14 rotate-12 flex flex-col items-center justify-center text-bahrain-red font-serif text-[4.5px] font-bold">
                <span className="uppercase tracking-widest leading-none">PASSPORT</span>
                <span className="uppercase text-[3.5px] mt-0.5 leading-none">SEALED</span>
              </div>
            </div>

            <div className="absolute bottom-1 left-3 right-3 text-left">
              <span className="font-serif text-[8.5px] text-bronze-charcoal font-bold tracking-tight block truncate">
                {img.alt}
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
