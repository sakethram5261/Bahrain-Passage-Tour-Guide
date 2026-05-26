import { useState, useEffect, useCallback } from 'react'
import { VibeContext } from './VibeContext'

const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#5C5451' },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#aa7c11' },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#c07b2a' },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#D11A38' },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#2563eb' },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#7c3aed' },
]

export function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

export function getNextRank(xp) {
  for (const r of RANKS) {
    if (xp < r.minXP) return r
  }
  return null
}

export { RANKS }

export function VibeProvider({ children }) {
  const [step, setStep] = useState(1)
  const [selectedMoods, setSelectedMoods] = useState([])
  const [tier, setTier] = useState('Wandering')
  const [duration, setDuration] = useState(3)
  const [pace, setPace] = useState('Serene')
  const [progress, setProgress] = useState(0)

  const [unlockedDays, setUnlockedDays] = useState([1])
  const [completedDays, setCompletedDays] = useState([])
  const [currentDayTab, setCurrentDayTab] = useState(1)

  const [aiItinerary, setAiItinerary] = useState(null)
  const [itinerarySpots, setItinerarySpots] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)

  const [capturedPhotos, setCapturedPhotos] = useState({})
  const [lensStories, setLensStories] = useState({})

  const [activeGuide, setActiveGuide] = useState('jafar')
  const [collectedKeepsakes, setCollectedKeepsakes] = useState([])
  const [journalReflections, setJournalReflections] = useState({})
  const [soundVolume, setSoundVolume] = useState(0.5)
  const [soundMuted, setSoundMuted] = useState(false)
  const [activeLeaf, setActiveLeaf] = useState('chronicles')

  const [xp, setXp] = useState(0)
  const [xpLog, setXpLog] = useState([])
  const [showPassportCard, setShowPassportCard] = useState(false)
  
  // Riddle solving persistence for the gamified tour guide
  const [solvedRiddles, setSolvedRiddles] = useState({})

  const aligned = step === 5

  useEffect(() => {
    setCurrentSpotIndex(0)
  }, [currentDayTab])

  const awardXP = useCallback((amount, reason) => {
    setXp(prev => prev + amount)
    setXpLog(prev => [...prev.slice(-19), { amount, reason, ts: Date.now() }])
  }, [])

  const completeDay = (dayNum) => {
    if (!completedDays.includes(dayNum)) {
      setCompletedDays(prev => [...prev, dayNum])
      awardXP(100, `Day ${dayNum} sealed`)
      const nextDay = dayNum + 1
      if (nextDay <= duration && !unlockedDays.includes(nextDay)) {
        setUnlockedDays(prev => [...prev, nextDay])
      }
    }
  }

  const saveCapturedPhoto = (spotId, dataUrl) => {
    setCapturedPhotos(prev => ({ ...prev, [spotId]: dataUrl }))
    awardXP(30, 'Lens snapshot captured')
  }

  const saveLensStory = (spotId, storyText) => {
    setLensStories(prev => ({ ...prev, [spotId]: storyText }))
  }

  const unlockKeepsake = (spotId) => {
    if (!collectedKeepsakes.includes(spotId)) {
      setCollectedKeepsakes(prev => [...prev, spotId])
      awardXP(50, 'Keepsake unlocked')
    }
  }

  const saveJournalReflection = (spotId, text) => {
    const hadEntry = !!journalReflections[spotId]
    setJournalReflections(prev => ({ ...prev, [spotId]: text }))
    if (!hadEntry && text.trim().length > 10) {
      awardXP(15, 'Journal entry written')
    }
  }

  const markSpotVisited = useCallback((spotId) => {
    awardXP(25, 'Spot explored')
  }, [awardXP])

  const solveRiddle = (spotId) => {
    if (!solvedRiddles[spotId]) {
      setSolvedRiddles(prev => ({ ...prev, [spotId]: true }))
      awardXP(25, 'Riddle solved')
    }
  }

  const resetChronicle = () => {
    setUnlockedDays([1])
    setCompletedDays([])
    setCurrentDayTab(1)
    setAiItinerary(null)
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
    setStep(1)
  }

  return (
    <VibeContext.Provider value={{ 
      step, 
      setStep, 
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
      aiItinerary,
      setAiItinerary,
      itinerarySpots,
      setItinerarySpots,
      aiLoading,
      setAiLoading,
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
    }}>
      {children}
    </VibeContext.Provider>
  )
}
