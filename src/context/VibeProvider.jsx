import { useState, useEffect, useCallback } from 'react'
import { VibeContext } from './VibeContext'
import { playPageSwish } from '../services/audioUtils'

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

export function VibeProvider({ children }) {
  const [step, setStep] = useState(() => safeGetNum('bp_step', 1))
  const [selectedMoods, setSelectedMoods] = useState(() => safeGetJSON('bp_selectedMoods', []))
  const [tier, setTier] = useState(() => safeGetStr('bp_tier', 'Wandering'))
  const [duration, setDuration] = useState(() => safeGetNum('bp_duration', 3))
  const [pace, setPace] = useState(() => safeGetStr('bp_pace', 'Serene'))
  const [progress, setProgress] = useState(() => safeGetNum('bp_progress', 0))

  const [unlockedDays, setUnlockedDays] = useState(() => safeGetJSON('bp_unlockedDays', [1]))
  const [completedDays, setCompletedDays] = useState(() => safeGetJSON('bp_completedDays', []))
  const [currentDayTab, setCurrentDayTab] = useState(() => safeGetNum('bp_currentDayTab', 1))

  const [curatedItinerary, setCuratedItinerary] = useState(() => safeGetJSON('bp_curatedItinerary', null))
  const [itinerarySpots, setItinerarySpots] = useState(() => safeGetJSON('bp_itinerarySpots', []))
  const [itineraryLoading, setItineraryLoading] = useState(false)
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)

  const [capturedPhotos, setCapturedPhotos] = useState(() => safeGetJSON('bp_capturedPhotos', {}))
  const [lensStories, setLensStories] = useState(() => safeGetJSON('bp_lensStories', {}))

  const [activeGuide, setActiveGuide] = useState(() => safeGetStr('bp_activeGuide', 'jafar'))
  const [collectedKeepsakes, setCollectedKeepsakes] = useState(() => safeGetJSON('bp_collectedKeepsakes', []))
  const [journalReflections, setJournalReflections] = useState(() => safeGetJSON('bp_journalReflections', {}))
  const [soundVolume, setSoundVolume] = useState(() => safeGetNum('bp_soundVolume', 0.5))
  const [soundMuted, setSoundMuted] = useState(() => safeGetStr('bp_soundMuted', '0') === '1')
  const [activeLeaf, setActiveLeaf] = useState(() => safeGetStr('bp_activeLeaf', 'chronicles'))

  const [xp, setXp] = useState(() => safeGetNum('bp_xp', 0))
  const [xpLog, setXpLog] = useState(() => safeGetJSON('bp_xpLog', []))
  const [showPassportCard, setShowPassportCard] = useState(false)
  
  // Riddle solving persistence for the gamified tour guide
  const [solvedRiddles, setSolvedRiddles] = useState(() => safeGetJSON('bp_solvedRiddles', {}))

  // Premium Gamification & local Fils Economy States
  const [goldFils, setGoldFils] = useState(() => safeGetNum('bp_goldFils', 1200)) // Start with warm travel stipend
  const [characterRep, setCharacterRep] = useState(() => safeGetJSON('bp_characterRep', { jafar: 10, seyadi: 10, faisal: 10 })) // Base rep values
  const [passportStamps, setPassportStamps] = useState(() => safeGetJSON('bp_passportStamps', [])) // Unlocked visual ink stamps

  // Pearl quest progress — global so it persists across tab switches
  const [pearlsCollected, setPearlsCollected] = useState(() => safeGetJSON('bp_pearlsCollected', []))
  const [selectedHotel, setSelectedHotel] = useState(() => safeGetJSON('bp_selectedHotel', null))
  const aligned = step === 5

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentSpotIndex(0)
    })
  }, [currentDayTab])

  // Prune completed and unlocked days if duration is decreased, preventing zombie days
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

  // Batched localStorage sync — single effect using a debounced microtask
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('bp_step', step)
        localStorage.setItem('bp_selectedMoods', JSON.stringify(selectedMoods))
        localStorage.setItem('bp_tier', tier)
        localStorage.setItem('bp_duration', duration)
        localStorage.setItem('bp_pace', pace)
        localStorage.setItem('bp_progress', progress)
        localStorage.setItem('bp_unlockedDays', JSON.stringify(unlockedDays))
        localStorage.setItem('bp_completedDays', JSON.stringify(completedDays))
        localStorage.setItem('bp_currentDayTab', currentDayTab)
        localStorage.setItem('bp_curatedItinerary', curatedItinerary ? JSON.stringify(curatedItinerary) : '')
        localStorage.setItem('bp_itinerarySpots', JSON.stringify(itinerarySpots))
        localStorage.setItem('bp_capturedPhotos', JSON.stringify(capturedPhotos))
        localStorage.setItem('bp_lensStories', JSON.stringify(lensStories))
        localStorage.setItem('bp_activeGuide', activeGuide)
        localStorage.setItem('bp_collectedKeepsakes', JSON.stringify(collectedKeepsakes))
        localStorage.setItem('bp_journalReflections', JSON.stringify(journalReflections))
        localStorage.setItem('bp_soundVolume', soundVolume)
        localStorage.setItem('bp_soundMuted', soundMuted ? '1' : '0')
        localStorage.setItem('bp_activeLeaf', activeLeaf)
        localStorage.setItem('bp_xp', xp)
        localStorage.setItem('bp_xpLog', JSON.stringify(xpLog))
        localStorage.setItem('bp_solvedRiddles', JSON.stringify(solvedRiddles))
        localStorage.setItem('bp_goldFils', goldFils)
        localStorage.setItem('bp_characterRep', JSON.stringify(characterRep))
        localStorage.setItem('bp_passportStamps', JSON.stringify(passportStamps))
        localStorage.setItem('bp_pearlsCollected', JSON.stringify(pearlsCollected))
        localStorage.setItem('bp_selectedHotel', selectedHotel ? JSON.stringify(selectedHotel) : '')
      } catch (e) { console.error(e) }
    }, 200)
    return () => clearTimeout(timer)
  }, [step, selectedMoods, tier, duration, pace, progress, unlockedDays, completedDays, currentDayTab, curatedItinerary, itinerarySpots, capturedPhotos, lensStories, activeGuide, collectedKeepsakes, journalReflections, soundVolume, soundMuted, activeLeaf, xp, xpLog, solvedRiddles, goldFils, characterRep, passportStamps, pearlsCollected, selectedHotel])

  const awardXP = useCallback((amount, reason) => {
    setXp(prev => prev + amount)
    setXpLog(prev => [...prev.slice(-19), { amount, reason, ts: Date.now() }])
  }, [])

  // Hoisting Fix: Define unlockKeepsake early since other handlers depend on it
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
      setGoldFils(prev => prev + 400) // Grant coins for sealing day
      const nextDay = dayNum + 1
      if (nextDay <= duration && !unlockedDays.includes(nextDay)) {
        setUnlockedDays(prev => [...prev, nextDay])
      }
    }
  }

  const saveCapturedPhoto = (spotId, dataUrl) => {
    setCapturedPhotos(prev => ({ ...prev, [spotId]: dataUrl }))
    awardXP(30, 'Lens snapshot captured')
    setGoldFils(prev => prev + 250) // Reward coins for photo snap
    
    // Auto-unlock stamp for that spot
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
      setGoldFils(prev => prev + 100) // Reward reflection coins
    }
  }

  const markSpotVisited = useCallback(() => {
    awardXP(25, 'Spot explored')
    setGoldFils(prev => prev + 80) // Exploratory fils stipend
  }, [awardXP])

  const solveRiddle = (spotId) => {
    if (!solvedRiddles[spotId]) {
      setSolvedRiddles(prev => ({ ...prev, [spotId]: true }))
      awardXP(35, 'Riddle solved')
      setGoldFils(prev => prev + 150) // Reward riddle solving fils
      
      // Auto-unlock keepsake upon solving riddle
      unlockKeepsake(spotId)
    }
  }

  // Deduct fils to unlock premium items in virtual souq shop
  const spendFils = (amount) => {
    if (goldFils >= amount) {
      setGoldFils(prev => prev - amount)
      return true
    }
    return false
  }

  // Level up local resident relationship guilds
  const awardReputation = (character, amount) => {
    setCharacterRep(prev => ({
      ...prev,
      [character]: Math.min((prev[character] || 0) + amount, 100)
    }))
  }

  const resetChronicle = () => {
    setUnlockedDays([1])
    setCompletedDays([])
    setCurrentDayTab(1)
    setCuratedItinerary(null)
    setItinerarySpots([])
    setCapturedPhotos({})
    setLensStories({})
    setActiveGuide('jafar')
    setCollectedKeepsakes([])
    setJournalReflections({})
    setActiveLeaf('chronicles')
    setXp(0)
    setXpLog([])
    setShowPassportCard(false)
    setSelectedMoods([])
    setSolvedRiddles({})
    setGoldFils(1200)
    setCharacterRep({ jafar: 10, seyadi: 10, faisal: 10 })
    setPassportStamps([])
    setPearlsCollected([])
    setStep(1)
    try {
      const keys = [
        'bp_step', 'bp_selectedMoods', 'bp_tier', 'bp_duration', 'bp_pace', 'bp_progress',
        'bp_unlockedDays', 'bp_completedDays', 'bp_currentDayTab', 'bp_curatedItinerary',
        'bp_itinerarySpots', 'bp_capturedPhotos', 'bp_lensStories', 'bp_activeGuide',
        'bp_collectedKeepsakes', 'bp_journalReflections', 'bp_soundVolume', 'bp_soundMuted',
        'bp_activeLeaf', 'bp_xp', 'bp_xpLog', 'bp_solvedRiddles', 'bp_goldFils',
        'bp_characterRep', 'bp_passportStamps', 'bp_pearlsCollected'
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

  return (
    <VibeContext.Provider value={{ 
      step, 
      setStep: transitionSetStep, 
      playOrganicPageSwish, 
      selectedMoods,
      setSelectedMoods,
      tier, 
      setTier, 
      duration,
      setDuration,
      pace, 
      setPace, 
      progress, 
      setProgress,
      aligned,
      unlockedDays,
      completedDays,
      currentDayTab,
      setCurrentDayTab,
      completeDay,
      resetChronicle,
      curatedItinerary,
      setCuratedItinerary,
      itinerarySpots,
      setItinerarySpots,
      itineraryLoading,
      setItineraryLoading,
      currentSpotIndex,
      setCurrentSpotIndex,
      capturedPhotos,
      saveCapturedPhoto,
      lensStories,
      saveLensStory,
      activeGuide,
      setActiveGuide,
      collectedKeepsakes,
      unlockKeepsake,
      journalReflections,
      saveJournalReflection,
      soundVolume,
      setSoundVolume,
      soundMuted,
      setSoundMuted,
      activeLeaf,
      setActiveLeaf,
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
      characterRep,
      setCharacterRep,
      passportStamps,
      setPassportStamps,
      spendFils,
      awardReputation,
      pearlsCollected,
      setPearlsCollected,
      selectedHotel,
      setSelectedHotel,
    }}>
      {children}
    </VibeContext.Provider>
  )
}
