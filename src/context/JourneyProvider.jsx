import { useState, useEffect, useCallback } from 'react'
import { JourneyContext } from './JourneyContext'
import { playPageSwish } from '../services/audioUtils'
import { spotsCatalog } from '../hooks/useItinerary'
import { savePhoto, clearAllPhotos, getAllPhotos } from '../services/db'
import { getLiveTideStatus } from '../services/tideService'

const savedState = (() => {
  try {
    const item = localStorage.getItem('bp_journey_state')
    return item ? JSON.parse(item) : {}
  } catch {
    return {}
  }
})()

const getSavedValue = (key, legacyKey, defaultValue, type) => {
  if (savedState && savedState[key] !== undefined) return savedState[key]
  // Fallback to legacy keys
  try {
    const legacy = localStorage.getItem(legacyKey)
    if (legacy === null) return defaultValue
    if (type === 'num') {
      const val = Number(legacy)
      return isNaN(val) ? defaultValue : val
    }
    if (type === 'json') {
      return JSON.parse(legacy)
    }
    return legacy
  } catch {
    return defaultValue
  }
}

export function JourneyProvider({ children }) {
  // ── Onboarding state ──────────────────────────────────────────────────
  const [step, setStep] = useState(() => getSavedValue('step', 'bp_step', 1, 'num'))
  const [selectedMoods, setSelectedMoods] = useState(() => getSavedValue('selectedMoods', 'bp_selectedMoods', [], 'json'))
  const [tier, setTier] = useState(() => getSavedValue('tier', 'bp_tier', 'Wandering', 'str'))
  const [duration, setDuration] = useState(() => getSavedValue('duration', 'bp_duration', 3, 'num'))

  // ── Progress ──────────────────────────────────────────────────────────
  const [unlockedDays, setUnlockedDays] = useState(() => getSavedValue('unlockedDays', 'bp_unlockedDays', [1], 'json'))
  const [completedDays, setCompletedDays] = useState(() => getSavedValue('completedDays', 'bp_completedDays', [], 'json'))
  const [currentDayTab, setCurrentDayTab] = useState(() => getSavedValue('currentDayTab', 'bp_currentDayTab', 1, 'num'))
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)

  // ── Itinerary ─────────────────────────────────────────────────────────
  const [itinerarySpots, setItinerarySpots] = useState(() => getSavedValue('itinerarySpots', 'bp_itinerarySpots', [], 'json'))
  const [itineraryLoading, setItineraryLoading] = useState(false)

  // ── Journal entries ───────────────────────────────────────────────────
  const [capturedPhotos, setCapturedPhotos] = useState({})
  const [lensStories, setLensStories] = useState(() => getSavedValue('lensStories', 'bp_lensStories', {}, 'json'))
  const [journalReflections, setJournalReflections] = useState(() => getSavedValue('journalReflections', 'bp_journalReflections', {}, 'json'))

  // ── Gamification ──────────────────────────────────────────────────────
  const [xp, setXp] = useState(() => getSavedValue('xp', 'bp_xp', 0, 'num'))
  const [xpLog, setXpLog] = useState(() => getSavedValue('xpLog', 'bp_xpLog', [], 'json'))
  const [goldFils, setGoldFils] = useState(() => getSavedValue('goldFils', 'bp_goldFils', 1200, 'num'))
  const [collectedKeepsakes, setCollectedKeepsakes] = useState(() => getSavedValue('collectedKeepsakes', 'bp_collectedKeepsakes', [], 'json'))
  const [solvedRiddles, setSolvedRiddles] = useState(() => getSavedValue('solvedRiddles', 'bp_solvedRiddles', {}, 'json'))
  const [passportStamps, setPassportStamps] = useState(() => getSavedValue('passportStamps', 'bp_passportStamps', [], 'json'))
  const [pearlsCollected, setPearlsCollected] = useState(() => getSavedValue('pearlsCollected', 'bp_pearlsCollected', [], 'json'))
  const [falconsCalled, setFalconsCalled] = useState(() => getSavedValue('falconsCalled', 'bp_falconsCalled', [], 'json'))
  const [selectedHotel, setSelectedHotel] = useState(() => getSavedValue('selectedHotel', 'bp_selectedHotel', null, 'json'))

  // ── Audio ─────────────────────────────────────────────────────────────
  const [soundVolume, setSoundVolume] = useState(() => getSavedValue('soundVolume', 'bp_soundVolume', 0.5, 'num'))
  const [soundMuted, setSoundMuted] = useState(() => getSavedValue('soundMuted', 'bp_soundMuted', '0', 'str') === '1')

  // ── Travel Bag / Saffron Theme ─────────────────────────────────────────
  const [purchasedItems, setPurchasedItems] = useState(() => getSavedValue('purchasedItems', 'bp_purchasedItems', {}, 'json'))

  // ── UI state ──────────────────────────────────────────────────────────
  const [activeLeaf, setActiveLeaf] = useState(() => getSavedValue('activeLeaf', 'bp_activeLeaf', 'chronicles', 'str'))
  const [showPassportCard, setShowPassportCard] = useState(false)

  // ── Chat history (persisted, shared across features) ──────────────────
  const [chatHistory, setChatHistory] = useState(() => getSavedValue('chatHistory', 'bp_chatHistory', [], 'json'))
  const [signature, setSignature] = useState(() => getSavedValue('signature', 'bp_signature', '', 'str'))

  // ── Tide / Weather ──────────────────────────────────────────────────────
  const [jaradaTide, setJaradaTide] = useState({ isSubmerged: false, seaLevel: 0 })

  const aligned = step === 5

  // ── Asynchronous load of photos from IndexedDB with legacy migration ────
  useEffect(() => {
    let active = true
    getAllPhotos().then(photos => {
      if (!active) return
      if (Object.keys(photos).length > 0) {
        setCapturedPhotos(photos)
      } else {
        const legacyPhotos = getSavedValue('capturedPhotos', 'bp_capturedPhotos', null, 'json')
        if (legacyPhotos && Object.keys(legacyPhotos).length > 0) {
          setCapturedPhotos(legacyPhotos)
          // Migrate to IndexedDB
          Object.entries(legacyPhotos).forEach(([id, data]) => {
            savePhoto(id, data)
          })
        }
      }
      
      // Cleanup legacy keys once migration has been performed
      setTimeout(() => {
        const legacyKeys = [
          'bp_step', 'bp_selectedMoods', 'bp_tier', 'bp_duration',
          'bp_unlockedDays', 'bp_completedDays', 'bp_currentDayTab',
          'bp_itinerarySpots', 'bp_capturedPhotos', 'bp_lensStories',
          'bp_collectedKeepsakes', 'bp_journalReflections', 'bp_soundVolume', 'bp_soundMuted',
          'bp_purchasedItems', 'bp_activeLeaf', 'bp_xp', 'bp_xpLog', 'bp_solvedRiddles',
          'bp_goldFils', 'bp_passportStamps', 'bp_pearlsCollected', 'bp_falconsCalled',
          'bp_selectedHotel', 'bp_chatHistory'
        ]
        legacyKeys.forEach(k => localStorage.removeItem(k))
      }, 2000)
    })

    // Fetch tide status on mount
    getLiveTideStatus().then(tideData => {
      if (!active) return
      setJaradaTide(tideData)
    })

    return () => { active = false }
  }, [])

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

  // Debounced single key localStorage sync (excluding photos)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stateToSave = {
          step,
          selectedMoods,
          tier,
          duration,
          unlockedDays,
          completedDays,
          currentDayTab,
          itinerarySpots,
          lensStories,
          journalReflections,
          soundVolume,
          soundMuted,
          purchasedItems,
          activeLeaf,
          xp,
          xpLog,
          solvedRiddles,
          goldFils,
          passportStamps,
          pearlsCollected,
          falconsCalled,
          selectedHotel,
          collectedKeepsakes,
          chatHistory,
          signature
        }
        localStorage.setItem('bp_journey_state', JSON.stringify(stateToSave))
      } catch (e) {
        console.error('Failed to sync journey state', e)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [step, selectedMoods, tier, duration, unlockedDays, completedDays, currentDayTab, itinerarySpots, lensStories, journalReflections, soundVolume, soundMuted, purchasedItems, activeLeaf, xp, xpLog, solvedRiddles, goldFils, passportStamps, pearlsCollected, falconsCalled, selectedHotel, collectedKeepsakes, chatHistory, signature])

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
    savePhoto(spotId, dataUrl) // Save immediately to IndexedDB
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
    clearAllPhotos() // Clear IndexedDB
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
    setSignature('')
    try {
      localStorage.removeItem('bp_journey_state')
      const keys = [
        'bp_step', 'bp_selectedMoods', 'bp_tier', 'bp_duration',
        'bp_unlockedDays', 'bp_completedDays', 'bp_currentDayTab',
        'bp_itinerarySpots', 'bp_capturedPhotos', 'bp_lensStories',
        'bp_collectedKeepsakes', 'bp_journalReflections', 'bp_soundVolume', 'bp_soundMuted',
        'bp_purchasedItems',
        'bp_activeLeaf', 'bp_xp', 'bp_xpLog', 'bp_solvedRiddles', 'bp_goldFils',
        'bp_passportStamps', 'bp_pearlsCollected', 'bp_falconsCalled', 'bp_chatHistory', 'bp_signature'
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

  const generateItinerary = useCallback(async (moods, dur, budgetTier) => {
    setItineraryLoading(true)
    let compiledSpots = []
    let localCatalog = spotsCatalog
    let localCategoryImages = {
      fort: '/assets/images/fort.jpg',
      souq: '/assets/images/souq.jpg',
      coast: '/assets/images/coast.jpg',
      modern: '/assets/images/modern.jpg',
      desert: '/assets/images/desert.jpg',
      culture: '/assets/images/culture.jpg',
      default: '/assets/images/fort.jpg'
    }

    let aiFetched = false
    try {
      if (moods && moods.length > 0) {
        const systemPrompt = `You are a highly knowledgeable Bahraini travel planner.
Generate a list of interesting, culturally rich, and fun spots in Bahrain tailored to the traveler's selected vibes/moods, budget tier, and duration.
You must return a valid JSON array of spot objects.
Each spot object must contain the following keys exactly:
- id: unique string in kebab-case
- name: English name
- arabic: Arabic script of the name (e.g. "موقع قلعة البحرين")
- mood: one of: empires, spice, sea, lights, desert, culture
- coords: approx coordinates, e.g. "26.2339° N, 50.5198° E"
- period: historical period or "Modern Era"
- desc: brief description (1-2 sentences)
- simpleTerms: What this offers: description of what a visitor actually does there (1-2 sentences)
- insider: an insider secret, unique tip, or personal observation (1 sentence)
- budgetGuide: how a budget-conscious traveler can enjoy it (1 sentence)
- premiumGuide: a curated, luxury or premium experience there (1 sentence)
- budgetCost: estimate cost (e.g., "Free Entry" or "Under 1 BHD")
- premiumCost: estimate cost (e.g., "15 BHD" or "40 BHD")
- category: one of: fort, souq, coast, modern, desert, culture
- keepsakeId: unique stamp identifier, e.g. "custom-X"
- keepsakeName: name of custom keepsake
- keepsakeEmoji: single emoji representing the keepsake
- keepsakeDesc: description of the keepsake

Please generate exactly ${dur * 2} spots (excluding airport arrival/departure) spread across the ${dur} days, or a minimum of 4 spots if the duration is 1 day.
Assign a "day" field (integer from 1 to ${dur}) to each spot to distribute them evenly across the days.
Do NOT wrap the JSON inside markdown code blocks (e.g. no \`\`\`json). Return ONLY valid JSON array.`;

        const userPrompt = `Generate a customized itinerary for a ${dur}-day trip to Bahrain.
Traveler Vibes/Moods: ${moods.join(', ')}
Budget Tier: ${budgetTier}
Generate exactly ${dur * 2} spots distributed evenly across the ${dur} days.
Make the spots highly engaging and authentic to Bahrain. Do not include airport arrival or departure in the generated spots, as those will be appended automatically.`;

        const { callLocalAI } = await import('../services/aiService')
        const responseText = await callLocalAI(systemPrompt, userPrompt, '', { maxTokens: 1800, useJson: true })
        if (responseText && !responseText.includes('error')) {
          let cleaned = responseText.trim()
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim()
          }
          try {
            const parsed = JSON.parse(cleaned)
            if (Array.isArray(parsed) && parsed.length > 0) {
              compiledSpots = parsed.map(item => ({
                ...item,
                pathGuide: budgetTier === 'Wandering' ? (item.budgetGuide || item.desc) : (item.premiumGuide || item.desc),
                pathCost: budgetTier === 'Wandering' ? (item.budgetCost || 'Free Entry') : (item.premiumCost || 'Free Entry'),
                image: localCategoryImages[item.category?.toLowerCase()] || localCategoryImages.default
              }))
              aiFetched = true
            }
          } catch (jsonErr) {
            console.warn("AI itinerary JSON parsing failed, using catalog:", jsonErr)
          }
        }
      }
    } catch (aiErr) {
      console.error("AI itinerary compilation failed:", aiErr)
    }

    if (!aiFetched && localCatalog) {
      const filtered = localCatalog.filter(s => moods.includes(s.mood) && s.id !== 'airport-arrival' && s.id !== 'airport-departure')
      compiledSpots = filtered.map((item, idx) => {
        const targetDay = (idx % dur) + 1
        return {
          ...item,
          day: targetDay,
          pathGuide: budgetTier === 'Wandering' ? item.budgetGuide : item.premiumGuide,
          pathCost: budgetTier === 'Wandering' ? item.budgetCost : item.premiumCost
        }
      })
    }

    // Append Airport arrival & departures automatically
    if (localCatalog) {
      const arrivalSpot = localCatalog.find(s => s.id === 'airport-arrival')
      const departureSpot = localCatalog.find(s => s.id === 'airport-departure')
      
      if (arrivalSpot) {
        compiledSpots.push({
          ...arrivalSpot,
          day: 1,
          pathGuide: budgetTier === 'Wandering' ? arrivalSpot.budgetGuide : arrivalSpot.premiumGuide,
          pathCost: budgetTier === 'Wandering' ? arrivalSpot.budgetCost : arrivalSpot.premiumCost
        })
      }
      if (departureSpot) {
        compiledSpots.push({
          ...departureSpot,
          day: dur,
          pathGuide: budgetTier === 'Wandering' ? departureSpot.budgetGuide : departureSpot.premiumGuide,
          pathCost: budgetTier === 'Wandering' ? departureSpot.budgetCost : departureSpot.premiumCost
        })
      }
    }

    // Sort spots by day
    const sorted = compiledSpots.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day
      if (a.id === 'airport-arrival') return -1
      if (b.id === 'airport-arrival') return 1
      if (a.id === 'airport-departure') return 1
      if (b.id === 'airport-departure') return -1
      return 0
    })

    setItinerarySpots(sorted)
    setItineraryLoading(false)
  }, [])

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
      generateItinerary,

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
      quickStart,

      // UI
      activeLeaf,
      setActiveLeaf,

      // Chat (shared across features)
      chatHistory,
      setChatHistory,

      // Signature
      signature,
      setSignature,

      // Live Tide
      jaradaTide,
    }}>
      {children}
    </JourneyContext.Provider>
  )
}

