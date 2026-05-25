import { useState, useEffect } from 'react'
import { VibeContext } from './VibeContext'

export function VibeProvider({ children }) {
  const [step, setStep] = useState(1)
  const [selectedMoods, setSelectedMoods] = useState(['empires', 'sea', 'spice', 'lights'])
  const [tier, setTier] = useState('Wandering')
  const [duration, setDuration] = useState(3)
  const [pace, setPace] = useState('Serene')
  const [progress, setProgress] = useState(0)

  const [unlockedDays, setUnlockedDays] = useState([1])
  const [completedDays, setCompletedDays] = useState([])
  const [currentDayTab, setCurrentDayTab] = useState(1)

  const [aiItinerary, setAiItinerary] = useState(null)
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

  const aligned = step === 5

  useEffect(() => {
    setCurrentSpotIndex(0)
  }, [currentDayTab])

  const completeDay = (dayNum) => {
    if (!completedDays.includes(dayNum)) {
      setCompletedDays([...completedDays, dayNum])
      
      const nextDay = dayNum + 1
      if (nextDay <= duration && !unlockedDays.includes(nextDay)) {
        setUnlockedDays([...unlockedDays, nextDay])
      }
    }
  }

  const saveCapturedPhoto = (spotId, dataUrl) => {
    setCapturedPhotos(prev => ({ ...prev, [spotId]: dataUrl }))
  }

  const saveLensStory = (spotId, storyText) => {
    setLensStories(prev => ({ ...prev, [spotId]: storyText }))
  }

  const unlockKeepsake = (spotId) => {
    if (!collectedKeepsakes.includes(spotId)) {
      setCollectedKeepsakes(prev => [...prev, spotId])
    }
  }

  const saveJournalReflection = (spotId, text) => {
    setJournalReflections(prev => ({ ...prev, [spotId]: text }))
  }

  const resetChronicle = () => {
    setUnlockedDays([1])
    setCompletedDays([])
    setCurrentDayTab(1)
    setAiItinerary(null)
    setCapturedPhotos({})
    setLensStories({})
    setActiveGuide('jafar')
    setCollectedKeepsakes([])
    setJournalReflections({})
    setActiveLeaf('chronicles')
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
      setActiveLeaf
    }}>
      {children}
    </VibeContext.Provider>
  )
}
