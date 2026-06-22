import { useState, useEffect, useCallback } from 'react'
import { JourneyContext } from './JourneyContext'
import { playPageSwish } from '../services/audioUtils'
import { spotsCatalog } from '../hooks/useItinerary'


const safeGetJSON = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    return JSON.parse(item)
  } catch {
    return defaultValue
  }
}

const safeGetNum = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue
    const val = Number(item)
    return isNaN(val) ? defaultValue : val
  } catch {
    return defaultValue
  }
}

const safeGetStr = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key)
    return item !== null ? item : defaultValue
  } catch {
    return defaultValue
  }
}

export function JourneyProvider({ children }) {
  // ── Onboarding state ──────────────────────────────────────────────────
  const [step, setStep] = useState(() => safeGetNum('bp_step', 1))
  const [selectedMoods, setSelectedMoods] = useState(() => safeGetJSON('bp_selectedMoods', []))
  const [tier, setTier] = useState(() => safeGetStr('bp_tier', 'Wandering'))
  const [duration, setDuration] = useState(() => safeGetNum('bp_duration', 3))

  // ── Progress ──────────────────────────────────────────────────────────
  const [unlockedDays, setUnlockedDays] = useState(() => safeGetJSON('bp_unlockedDays', [1]))
  const [completedDays, setCompletedDays] = useState(() => safeGetJSON('bp_completedDays', []))
  const [currentDayTab, setCurrentDayTab] = useState(() => safeGetNum('bp_currentDayTab', 1))
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)

  // ── Itinerary ─────────────────────────────────────────────────────────
  const [itinerarySpots, setItinerarySpots] = useState(() => safeGetJSON('bp_itinerarySpots', []))
  const [itineraryLoading, setItineraryLoading] = useState(false)

  // ── Journal entries ───────────────────────────────────────────────────
  const [capturedPhotos, setCapturedPhotos] = useState(() => safeGetJSON('bp_capturedPhotos', {}))
  const [lensStories, setLensStories] = useState(() => safeGetJSON('bp_lensStories', {}))
  const [journalReflections, setJournalReflections] = useState(() => safeGetJSON('bp_journalReflections', {}))

  // ── Gamification ──────────────────────────────────────────────────────
  const [xp, setXp] = useState(() => safeGetNum('bp_xp', 0))
  const [xpLog, setXpLog] = useState(() => safeGetJSON('bp_xpLog', []))
  const [goldFils, setGoldFils] = useState(() => safeGetNum('bp_goldFils', 1200))
  const [collectedKeepsakes, setCollectedKeepsakes] = useState(() => safeGetJSON('bp_collectedKeepsakes', []))
  const [solvedRiddles, setSolvedRiddles] = useState(() => safeGetJSON('bp_solvedRiddles', {}))
  const [passportStamps, setPassportStamps] = useState(() => safeGetJSON('bp_passportStamps', []))
  const [pearlsCollected, setPearlsCollected] = useState(() => safeGetJSON('bp_pearlsCollected', []))
  const [falconsCalled, setFalconsCalled] = useState(() => safeGetJSON('bp_falconsCalled', []))
  const [selectedHotel, setSelectedHotel] = useState(() => safeGetJSON('bp_selectedHotel', null))


  // ── Audio ─────────────────────────────────────────────────────────────
  const [soundVolume, setSoundVolume] = useState(() => safeGetNum('bp_soundVolume', 0.5))
  const [soundMuted, setSoundMuted] = useState(() => safeGetStr('bp_soundMuted', '0') === '1')

  // ── Travel Bag / Saffron Theme ─────────────────────────────────────────
  const [purchasedItems, setPurchasedItems] = useState(() => safeGetJSON('bp_purchasedItems', {}))
  const [saffronThemeActive, setSaffronThemeActive] = useState(() => safeGetJSON('bp_saffronThemeActive', false))


  // ── UI state ──────────────────────────────────────────────────────────
  const [activeLeaf, setActiveLeaf] = useState(() => safeGetStr('bp_activeLeaf', 'chronicles'))
  const [showPassportCard, setShowPassportCard] = useState(false)

  // ── Chat history (persisted, shared across features) ──────────────────
  const [chatHistory, setChatHistory] = useState(() => safeGetJSON('bp_chatHistory', []))

  const aligned = step === 5

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentSpotIndex(0)
    })
  }, [currentDayTab])

  useEffect(() => {
    queueMicrotask(() => {
      setUnlockedDays(prev => {
        const filtered = prev.filter(d => d <= duration)
        return filtered.length === 0 ? [1] : filtered
      })
      setCompletedDays(prev => prev.filter(d => d <= duration))
      if (currentDayTab > duration) {
        setCurrentDayTab(1)
        setCurrentSpotIndex(0)
      }
    })
  }, [duration, currentDayTab])

  // Batched localStorage sync
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('bp_step', step)
        localStorage.setItem('bp_selectedMoods', JSON.stringify(selectedMoods))
        localStorage.setItem('bp_tier', tier)
        localStorage.setItem('bp_duration', duration)
        localStorage.setItem('bp_unlockedDays', JSON.stringify(unlockedDays))
        localStorage.setItem('bp_completedDays', JSON.stringify(completedDays))
        localStorage.setItem('bp_currentDayTab', currentDayTab)
        localStorage.setItem('bp_itinerarySpots', JSON.stringify(itinerarySpots))
        localStorage.setItem('bp_capturedPhotos', JSON.stringify(capturedPhotos))
        localStorage.setItem('bp_lensStories', JSON.stringify(lensStories))
        localStorage.setItem('bp_journalReflections', JSON.stringify(journalReflections))
        localStorage.setItem('bp_soundVolume', soundVolume)
        localStorage.setItem('bp_soundMuted', soundMuted ? '1' : '0')
        localStorage.setItem('bp_purchasedItems', JSON.stringify(purchasedItems))
        localStorage.setItem('bp_saffronThemeActive', JSON.stringify(saffronThemeActive))
        localStorage.setItem('bp_activeLeaf', activeLeaf)
        localStorage.setItem('bp_xp', xp)
        localStorage.setItem('bp_xpLog', JSON.stringify(xpLog))
        localStorage.setItem('bp_solvedRiddles', JSON.stringify(solvedRiddles))
        localStorage.setItem('bp_goldFils', goldFils)
        localStorage.setItem('bp_passportStamps', JSON.stringify(passportStamps))
        localStorage.setItem('bp_pearlsCollected', JSON.stringify(pearlsCollected))
        localStorage.setItem('bp_falconsCalled', JSON.stringify(falconsCalled))
        localStorage.setItem('bp_selectedHotel', selectedHotel ? JSON.stringify(selectedHotel) : '')
        localStorage.setItem('bp_collectedKeepsakes', JSON.stringify(collectedKeepsakes))
        localStorage.setItem('bp_chatHistory', JSON.stringify(chatHistory))
      } catch (e) { console.error(e) }
    }, 200)
    return () => clearTimeout(timer)
  }, [step, selectedMoods, tier, duration, unlockedDays, completedDays, currentDayTab, itinerarySpots, capturedPhotos, lensStories, journalReflections, soundVolume, soundMuted, purchasedItems, saffronThemeActive, activeLeaf, xp, xpLog, solvedRiddles, goldFils, passportStamps, pearlsCollected, falconsCalled, selectedHotel, collectedKeepsakes, chatHistory])



  const awardXP = useCallback((amount, reason) => {
    setXp(prev => prev + amount)
    setXpLog(prev => [...prev.slice(-19), { amount, reason, ts: Date.now() }])
  }, [])

  const unlockKeepsake = (spotId) => {
    if (!collectedKeepsakes.includes(spotId)) {
      setCollectedKeepsakes(prev => [...prev, spotId])
      awardXP(50, 'Keepsake unlocked')
    }
  }

  const completeDay = (dayNum) => {
    if (!completedDays.includes(dayNum)) {
      setCompletedDays(prev => [...prev, dayNum])
      awardXP(100, `Day ${dayNum} sealed`)
      setGoldFils(prev => prev + 400)
      const nextDay = dayNum + 1
      if (nextDay <= duration && !unlockedDays.includes(nextDay)) {
        setUnlockedDays(prev => [...prev, nextDay])
      }
    }
  }

  const saveCapturedPhoto = (spotId, dataUrl) => {
    setCapturedPhotos(prev => ({ ...prev, [spotId]: dataUrl }))
    awardXP(30, 'Lens snapshot captured')
    setGoldFils(prev => prev + 250)
    if (!passportStamps.includes(spotId)) {
      setPassportStamps(prev => [...prev, spotId])
    }
  }

  const saveLensStory = (spotId, storyText) => {
    setLensStories(prev => ({ ...prev, [spotId]: storyText }))
  }

  const saveJournalReflection = (spotId, text) => {
    const hadEntry = !!journalReflections[spotId]
    setJournalReflections(prev => ({ ...prev, [spotId]: text }))
    if (!hadEntry && text.trim().length > 10) {
      awardXP(15, 'Journal entry written')
      setGoldFils(prev => prev + 100)
    }
  }

  const markSpotVisited = useCallback(() => {
    awardXP(25, 'Spot explored')
    setGoldFils(prev => prev + 80)
  }, [awardXP])

  const solveRiddle = (spotId) => {
    if (!solvedRiddles[spotId]) {
      setSolvedRiddles(prev => ({ ...prev, [spotId]: true }))
      awardXP(35, 'Riddle solved')
      setGoldFils(prev => prev + 150)
      unlockKeepsake(spotId)
    }
  }

  const spendFils = (amount) => {
    if (goldFils >= amount) {
      setGoldFils(prev => prev - amount)
      return true
    }
    return false
  }

  const resetChronicle = () => {
    setUnlockedDays([1])
    setCompletedDays([])
    setCurrentDayTab(1)
    setItinerarySpots([])
    setCapturedPhotos({})
    setLensStories({})
    setCollectedKeepsakes([])
    setJournalReflections({})
    setActiveLeaf('chronicles')
    setXp(0)
    setXpLog([])
    setShowPassportCard(false)
    setSelectedMoods([])
    setSolvedRiddles({})
    setGoldFils(1200)
    setPassportStamps([])
    setPearlsCollected([])
    setFalconsCalled([])
    setChatHistory([])
    setStep(1)
    setPurchasedItems({})
    setSaffronThemeActive(false)
    try {
      const keys = [
        'bp_step', 'bp_selectedMoods', 'bp_tier', 'bp_duration',
        'bp_unlockedDays', 'bp_completedDays', 'bp_currentDayTab',
        'bp_itinerarySpots', 'bp_capturedPhotos', 'bp_lensStories',
        'bp_collectedKeepsakes', 'bp_journalReflections', 'bp_soundVolume', 'bp_soundMuted',
        'bp_purchasedItems', 'bp_saffronThemeActive',
        'bp_activeLeaf', 'bp_xp', 'bp_xpLog', 'bp_solvedRiddles', 'bp_goldFils',
        'bp_passportStamps', 'bp_pearlsCollected', 'bp_falconsCalled', 'bp_chatHistory'
      ]

      keys.forEach(k => localStorage.removeItem(k))
    } catch (e) {
      console.error(e)
    }
  }


  const transitionSetStep = useCallback((val) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setStep(val)
      })
    } else {
      setStep(val)
    }
  }, [])

  const playOrganicPageSwish = useCallback(() => {
    playPageSwish(soundVolume, soundMuted)
  }, [soundMuted, soundVolume])

  const quickStart = useCallback(() => {
    playOrganicPageSwish()
    const moods = selectedMoods.length > 0 ? selectedMoods : ['empires', 'spice']
    setSelectedMoods(moods)
    const dur = duration || 3

    const filtered = spotsCatalog.filter(s => moods.includes(s.mood) && s.id !== 'airport-arrival' && s.id !== 'airport-departure')
    const mapped = filtered.map((item, idx) => {
      const targetDay = (idx % dur) + 1
      return {
        ...item,
        day: targetDay,
        pathGuide: tier === 'Wandering' ? item.budgetGuide : item.premiumGuide,
        pathCost: tier === 'Wandering' ? item.budgetCost : item.premiumCost
      }
    })

    const arrivalSpot = spotsCatalog.find(s => s.id === 'airport-arrival')
    const departureSpot = spotsCatalog.find(s => s.id === 'airport-departure')
    if (arrivalSpot) {
      mapped.push({
        ...arrivalSpot,
        day: 1,
        pathGuide: tier === 'Wandering' ? arrivalSpot.budgetGuide : arrivalSpot.premiumGuide,
        pathCost: tier === 'Wandering' ? arrivalSpot.budgetCost : arrivalSpot.premiumCost
      })
    }
    if (departureSpot) {
      mapped.push({
        ...departureSpot,
        day: dur,
        pathGuide: tier === 'Wandering' ? departureSpot.budgetGuide : departureSpot.premiumGuide,
        pathCost: tier === 'Wandering' ? departureSpot.budgetCost : departureSpot.premiumCost
      })
    }

    const sorted = mapped.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      if (a.id === 'airport-arrival') return -1
      if (b.id === 'airport-arrival') return 1
      if (a.id === 'airport-departure') return 1
      if (b.id === 'airport-departure') return -1
      return 0
    })

    setItinerarySpots(sorted)
    setStep(5)
  }, [selectedMoods, duration, tier, setSelectedMoods, setItinerarySpots, setStep, playOrganicPageSwish])


  return (
    <JourneyContext.Provider value={{
      // Onboarding
      step,
      setStep: transitionSetStep,
      selectedMoods,
      setSelectedMoods,
      tier,
      setTier,
      duration,
      setDuration,

      // Progress
      aligned,
      unlockedDays,
      completedDays,
      currentDayTab,
      setCurrentDayTab,
      completeDay,
      resetChronicle,

      // Itinerary
      itinerarySpots,
      setItinerarySpots,
      itineraryLoading,
      setItineraryLoading,
      currentSpotIndex,
      setCurrentSpotIndex,

      // Journal
      capturedPhotos,
      saveCapturedPhoto,
      lensStories,
      saveLensStory,
      journalReflections,
      saveJournalReflection,

      // Gamification
      xp,
      xpLog,
      awardXP,
      markSpotVisited,
      showPassportCard,
      setShowPassportCard,
      solvedRiddles,
      solveRiddle,
      goldFils,
      setGoldFils,
      passportStamps,
      setPassportStamps,
      spendFils,
      pearlsCollected,
      setPearlsCollected,
      falconsCalled,
      setFalconsCalled,
      selectedHotel,
      setSelectedHotel,
      collectedKeepsakes,
      unlockKeepsake,


      // Audio
      soundVolume,
      setSoundVolume,
      soundMuted,
      setSoundMuted,
      playOrganicPageSwish,

      // Travel Bag / Saffron Theme
      purchasedItems,
      setPurchasedItems,
      saffronThemeActive,
      setSaffronThemeActive,
      quickStart,

      // UI
      activeLeaf,
      setActiveLeaf,

      // Chat (shared across features)
      chatHistory,
      setChatHistory,
    }}>
      {children}
    </JourneyContext.Provider>
  )
}

