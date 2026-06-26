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
import { 
  Calendar, 
  MapPin, 
  Map, 
  Hotel, 
  Gift, 
  BookOpen, 
  Zap, 
  MessageSquare,
  Volume2,
  VolumeX,
  Search,
  Lock
} from 'lucide-react'
import { useVibe } from '../hooks/useVibe'
import { useItinerary, spotsCatalog } from '../hooks/useItinerary'
import VirtualTour from './VirtualTour'
import WayfarerLens from './WayfarerLens'
import PassportCard from './PassportCard'
import MapSkeleton from './skeletons/MapSkeleton'
import JournalSkeleton from './skeletons/JournalSkeleton'
import { hasVirtualTour, getTourIndexForSpot } from './VirtualTour'
import AIHotelPanel, { HOTELS_DB } from './AIHotelPanel'
import LangToggle from './LangToggle'
import { useLang } from '../context/LangContext'
import { 
  playTypewriterClick as playTypewriterClickCentral,
  playRiddleCorrect,
  playRiddleIncorrect,
  playDaySealStamp,
  playRankUpChime,
  playPhraseFeedbackTone,
  playCampStampSound
} from '../services/audioUtils'

// Inlined from DashboardData.js
const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#5C5451' },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#aa7c11' },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#c07b2a' },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#D11A38' },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#2563eb' },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#7c3aed' },
]

function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

const shopItems = [
  { id: 'riddle-hint', name: 'Riddle Scroll Clue', desc: 'A hand-written parchment scroll providing poetic guidance to help decipher coordinate riddles.', cost: 150, emoji: '📜', xpReward: 10 },
  { id: 'saffron-halwa', name: 'Saffron Halwa Plate', desc: 'A traditional delicacy prepared in copper vats, showcasing the rich cardamom and saffron heritage of Muharraq.', cost: 300, emoji: '🍯', xpReward: 25 },
  { id: 'pearl-hook', name: 'Generational Oyster Hook', desc: 'A historic diving tool allowing you to search for natural Basra Pearls in local reefs and sandbanks.', cost: 400, emoji: '🪝', xpReward: 30 },
  { id: 'falcon-glove', name: 'Falconer Leather Glove', desc: 'A premium protective leather glove used to interact with trained falcons at heritage centers.', cost: 400, emoji: '🧤', xpReward: 30 },
  { id: 'keepsake-bag', name: 'Atelier Keepsake Collection', desc: 'A curated bundle that immediately unlocks a random traditional heritage keepsake.', cost: 600, emoji: '🛍️', xpReward: 50 }
]

const ALMANAC_DATA = {
  1: {
    location: 'Manama Souq Spicery',
    metrics: [
      { label: 'Ambient Temperature', value: '31°C / 88°F', desc: 'Warm spice alleys breeze' },
      { label: 'Jasmine Bloom Peak', value: '7:00 PM - 9:30 PM', desc: 'Best aroma window left of gate' },
      { label: 'Karak Steam Rating', value: 'Excellent (High humidity)', desc: 'Perfect acoustic coffee houses' }
    ],
    icon: '☕',
    notes: 'The souq is warmest in mid-afternoon. Highly recommend exploring early morning or twilight after jasmine strands unfold.'
  },
  2: {
    location: 'Sakhir Desert Mounds',
    metrics: [
      { label: 'Desert Air Clarity', value: '94% Visibility', desc: 'Superb dry stellar stargazing' },
      { label: 'Stargazing Window', value: '9:00 PM - 2:00 AM', desc: 'Clear skies near Tree of Life' },
      { label: 'Clay Mold Temp', value: 'Warm (Clay sets quick)', desc: 'Perfect Aali kick-wheel spinning' }
    ],
    icon: '🏰',
    notes: 'High atmospheric clarity over the Sakhir dunes tonight. Clear wind gusts from the East carry cool, dry breezes.'
  },
  3: {
    location: 'Jarada Tidal Shorelines',
    metrics: [
      { label: 'Disappearing Sandbar', value: 'Low Tide (2.4m Peak)', desc: 'Sand is 100% dry and exposed' },
      { label: 'Tidal Sandbar Peak', value: '11:30 AM - 2:30 PM', desc: 'Ephemeral 3-hour low-tide peak' },
      { label: 'Marine Water Temp', value: '26°C / 79°F', desc: 'Ideal shallow coral swimming' }
    ],
    icon: '⛵',
    notes: 'Coordinate closely with speedboat captains. The Jarada sandbank will completely submerge back into the turquoise Gulf by 3:45 PM.'
  },
  4: {
    location: 'Haniniya Valley Crests',
    metrics: [
      { label: 'Valley Wind Speed', value: '12 knots (Northeast)', desc: 'Cool cliffside ventilation breeze' },
      { label: 'Promenade Neon Glow', value: 'Ignites at 7:15 PM', desc: 'Best skyline waterfront reflections' },
      { label: 'Outdoor Acoustics', value: 'Calm water surface', desc: 'Ideal Reef Island coastal walk' }
    ],
    icon: '🌅',
    notes: 'Sunset winds through the valley crests are incredibly refreshing. Excellent night-sky walks along modern promenades.'
  },
  5: {
    location: 'Sitra Pearl Harbors',
    metrics: [
      { label: 'Coastal Wave Height', value: '0.4m (Gentle ripples)', desc: 'Ideal Sitra sea ferry transits' },
      { label: 'Oyster Coral Visibility', value: 'Moderate water clarity', desc: 'Spot starfish near coral reefs' },
      { label: 'Al Dar Cabana Temp', value: '29°C / 84°F', desc: 'Cool island breeze under palm shade' }
    ],
    icon: '🦪',
    notes: 'Sea ferry waters remain calm and fully safe. Bring light linens for Sitra island harbor walking.'
  }
}

const ALMANAC_DEFAULT = {
  location: 'Kingdom of Bahrain',
  metrics: [{ label: 'Temperature', value: '30°C', desc: 'Warm Gulf breeze' }],
  icon: '🇧🇭',
  notes: 'Welcome wayfarer.'
}

function getAlmanac(dayTab) {
  return ALMANAC_DATA[dayTab] ?? ALMANAC_DEFAULT
}

const RIDDLES = {
  'qal-at-al-bahrain': {
    question: "Which empire's legendary seals were discovered in the archaeological strata here?",
    options: ["Byzantine Empire", "Dilmun Empire", "Roman Empire"],
    correct: 1,
    insider: "Dilmun clay seals carved with bulls and celestial marks were used by merchants 4,000 years ago to secure cargo bound for ancient Mesopotamia!"
  },
  'muharraq-souq': {
    question: "What signature botanical spices give Bahraini Halwa its warm, legendary aroma?",
    options: ["Ginger & Cinnamon", "Clove & Star Anise", "Saffron & Cardamom"],
    correct: 2,
    insider: "Generational copper-pot halwa makers cook date syrup and almonds with cardamom and highly precious saffron threads to produce that authentic scarlet glow."
  },
  'pearling-path': {
    question: "How did historical Bahraini pearl divers block their ears/noses during oyster dives?",
    options: ["Sea-sponges & olive oil", "Beeswax & horn-clips", "Fine linen & clay plugs"],
    correct: 1,
    insider: "Divers plugged their ears with natural beeswax and clamped their noses with 'Fattah' noseclips carved from sheep horn to withstand the deep seafloor pressure."
  },
  'block-338': {
    question: "Block 338 is celebrated today as Manama's creative core. What defines its bohemian layout?",
    options: ["Date palm gardens", "Vibrant street murals & art", "Ancient brick-kilns"],
    correct: 1,
    insider: "Walking behind the main lanes reveals hidden alleyways packed with glowing street murals, local printshops, and contemporary art courtyards!"
  },
  'jarada-island': {
    question: "What oceanographic mystery makes a speedboat voyage to Jarada Island unique?",
    options: ["It features deep sea moats", "It is covered in green palm woods", "It completely vanishes under tide"],
    correct: 2,
    insider: "Jarada is an ephemeral sandbar that completely vanishes under the turquoise sea waves twice a day, leaving only marine shells and birds."
  },
  'tree-of-life': {
    question: "How old is this solitary green canopy growing without any apparent water source in the desert?",
    options: ["Around 50 years old", "Over 400 years old", "Nearly 10,000 years old"],
    correct: 1,
    insider: "Botanists believe the tree's roots descend over 50 meters deep to reach subterranean fresh water aquifers, letting it defy the hyper-saline Sakhir sands."
  },
  'haji-cafe': {
    question: "Established in 1950 inside Manama Souq, what legendary policy makes dining at Haji's unique?",
    options: ["It is inside a military fort", "There is no printed menu", "Servings are done by robots"],
    correct: 1,
    insider: "There is no menu! You sit on the rustic wooden benches and the cooks simply serve you whatever local dishes are boiling fresh in the kitchen pots."
  },
  'aali-pottery': {
    question: "What generational method do potting masters in A'ali still use to shape their red clay jars?",
    options: ["Modern CNC routers", "Liquid silicon molding", "Foot-kick pottery wheels"],
    correct: 2,
    insider: "Generational potters spin clay harvested from local Sakhir marshes using kick-wheels that mimic designs seen on ancient Dilmun tablets."
  },
  'arad-fort': {
    question: "Arad Fort stands guard over the Muharraq coast. What is its highly unique structural layout?",
    options: ["Circular star-pattern moat", "Strictly square military shape", "Octagonal limestone tower"],
    correct: 1,
    insider: "Arad was built in a compact square shape in the 15th century, with heavy cylindrical corner towers to defend sea channels from all angles."
  },
  'national-museum': {
    question: "Which ancient Mesopotamian epic inscribed on clay tablets is preserved inside the galleries here?",
    options: ["The Odyssey", "The Hammurabi Codex", "The Epic of Gilgamesh"],
    correct: 2,
    insider: "The Epic of Gilgamesh describes Dilmun (ancient Bahrain) as a paradise land of pure fresh waters where the hero sought the secret to eternal life!"
  },
  'al-dar-islands': {
    question: "Which local marine wildlife are shallow sea-kayak trips around Sitra shores most famous for?",
    options: ["Hammerhead shark packs", "Starfish & blue swimming crabs", "Sub-tropical sea penguins"],
    correct: 1,
    insider: "Kayaking near the seagrass beds reveals millions of small blue swimming crabs, native clams, and orange starfish in crystal warm waters."
  },
  'reef-island': {
    question: "Reef Island promenade sits on Manama's northern shore. What view does it showcase at night?",
    options: ["Ancient volcanic dunes", "Skyscraper neon lights & marina", "Deep pearl oyster diving fleets"],
    correct: 1,
    insider: "The pedestrian sea promenade provides the absolute best breeze point to watch the capital's skyscraper neon lights catch the sea ripples."
  },
  'riffa-fort': {
    question: "Perched on a cliff edge, which valley wind system cools Riffa Fort's winds?",
    options: ["Euphrates Delta trade winds", "Haniniya Valley breeze", "Nile Basin thermal draft"],
    correct: 1,
    insider: "The Haniniya Valley breeze rushes up the limestone cliffs at twilight, creating a natural desert cooling draft across the fort courtyards."
  },
  'barbar-temple': {
    question: "The ancient Barbar Temple ruins are dedicated to Enki. Who was this Dilmun deity?",
    options: ["God of Sandstorms & War", "God of Wisdom & Fresh Waters", "God of Crimson Fire & Gold"],
    correct: 1,
    insider: "Ancient Sumerians believed Bahrain was a sacred sanctuary because freshwater springs bubbled up through the sea, ruled by the god of sweet waters!"
  },
  'al-jasra-house': {
    question: "What organic, traditional building materials were used to construct Al Jasra House in 1907?",
    options: ["Red kiln bricks & concrete", "Volcanic limestone & slate", "Sea coral stones & palm trunks"],
    correct: 2,
    insider: "Traditional craftsmen stacked sea coral chunks bound by mud, using palm leaf fibers and robust palm trunks to construct naturally ventilated walls."
  },
  'khalaf-house': {
    question: "Khalaf House stands as a monument in Muharraq. What trade fortunes were historically weighed here?",
    options: ["Aromatic spice shipments", "Natural sea oyster pearls", "Red clay pottery cargoes"],
    correct: 1,
    insider: "This grand merchant home served as the royal salon where pearl divers brought rare Basra pearls to be weighed against brass weights for fortunes."
  },
  'manama-souq': {
    question: "What does the name of the iconic stone archway 'Bab Al Bahrain' translate to?",
    options: ["Citadel of Bahrain", "Gateway of Bahrain", "Springs of Bahrain"],
    correct: 1,
    insider: "Built in 1949, Bab Al Bahrain ('Gateway of Bahrain') marked the exact point where sea waters originally met the historic customs square."
  },
  'al-areen': {
    question: "Which majestic, long-horned white desert animal is Al Areen Park famous for preserving?",
    options: ["Sahara Cheetah", "Arabian Oryx", "Persian Antelope"],
    correct: 1,
    insider: "The beautiful white Arabian Oryx was saved from extinction in the 1970s through local Sakhir desert breeding programs, now numbering in the hundreds."
  },
  'beit-al-quran': {
    question: "Which century do the oldest manuscripts in this collection date back to?",
    options: ["5th Century", "7th Century", "10th Century"],
    correct: 1,
    insider: "The 7th-century manuscripts are part of a rare collection that highlights the early spread of Islamic literacy in the Arabian Peninsula."
  },
  'saar-temple': {
    question: "Which ancient civilization built the Saar Temple?",
    options: ["Dilmun", "Sumerian", "Phoenician"],
    correct: 0,
    insider: "The Dilmun civilization was a major maritime hub connecting Mesopotamia and the Indus Valley, making Saar a strategic religious center."
  },
  'al-khamis-mosque': {
    question: "What is unique about the Al Khamis Mosque's minarets?",
    options: ["They are made of gold", "There are two of them", "They are submerged in water"],
    correct: 1,
    insider: "The twin minarets are a hallmark of the mosque's reconstruction phases during the medieval period, reflecting its architectural evolution."
  },
  'bin-matar-house': {
    question: "What industry built the wealth of the Bin Matar family?",
    options: ["Oil", "Pearl diving", "Textiles"],
    correct: 1,
    insider: "The Bin Matar family were prominent pearl merchants, and their house stands as a symbol of the prosperity Bahrain enjoyed during the peak of the pearling industry."
  },
  'al-jasra-craft-center': {
    question: "Which natural material is commonly used in the weaving crafts found here?",
    options: ["Date palm leaves", "Seaweed", "Cotton"],
    correct: 0,
    insider: "Palm weaving is a fundamental craft in Bahrain, traditionally used for everything from food storage to home insulation."
  },
  'durrat-al-bahrain-coast': {
    question: "Where in Bahrain is this archipelago located?",
    options: ["Northern tip", "Eastern coast", "Southern tip"],
    correct: 2,
    insider: "Durrat Al Bahrain is one of the largest man-made island projects in the region, designed to resemble a string of pearls."
  },
  'royal-camel-farm': {
    question: "Camels are often referred to as what?",
    options: ["Ships of the desert", "Kings of the plains", "Guardians of the sand"],
    correct: 0,
    insider: "Camels were the primary mode of transportation and the main source of sustenance for nomadic tribes in the Arabian Desert for thousands of years."
  },
  'bahrain-international-circuit': {
    question: "Which major international racing event is held here annually?",
    options: ["MotoGP", "Formula 1", "Le Mans"],
    correct: 1,
    insider: "The Bahrain International Circuit was the first Formula 1 track to be built in the Middle East, setting the standard for future tracks in the region."
  },
  'al-fateh-grand-mosque': {
    question: "What is unique about the dome of the Al Fateh Mosque?",
    options: ["It is made of gold", "It is the world's largest fiberglass dome", "It is made of recycled glass"],
    correct: 1,
    insider: "The dome was constructed using fiberglass, a modern engineering choice that allowed for its immense size and intricate lighting effects."
  },
  'manama-reef-walk': {
    question: "What is the name of the popular spiced milk tea found along the corniche?",
    options: ["Karak", "Matcha", "Earl Grey"],
    correct: 0,
    insider: "Karak tea, a blend of black tea, milk, sugar, and cardamom, is the definitive drink of the region and a cultural staple for socializing."
  },
  'bahrain-world-trade-center': {
    question: "What is integrated into the design of these towers to provide renewable energy?",
    options: ["Solar panels", "Wind turbines", "Hydro generators"],
    correct: 1,
    insider: "These were the first skyscrapers in the world to integrate large-scale wind turbines into their design."
  },
  'muharraq-cultural-center': {
    question: "In which historic city is this center located?",
    options: ["Manama", "Muharraq", "Riffa"],
    correct: 1,
    insider: "Muharraq is the former capital of Bahrain and is famed for its dense collection of traditional architecture and pearling history."
  },
  'al-ghous-house': {
    question: "What was the main purpose of the pearl divers?",
    options: ["Fishing", "Finding pearls", "Searching for shipwrecks"],
    correct: 1,
    insider: "Pearl diving was the backbone of Bahrain's economy for centuries before the discovery of oil in 1932."
  },
  'ad-dair-village': {
    question: "What is the primary activity in Ad Dair village?",
    options: ["Agriculture", "Fishing", "Jewelry making"],
    correct: 1,
    insider: "Fishing villages like Ad Dair are the guardians of Bahrain's maritime heritage, maintaining traditional methods that have been passed down for generations."
  }
}

function getRandomKeepsakeSpot(uncollected) {
  return uncollected[Math.floor(Math.random() * uncollected.length)]
}

const WayfarerMap = lazy(() => import('./WayfarerMap'))
const TourChatbot = lazy(() => import('./TourChatbot'))
import { useToast } from '../context/ToastContext'
import { callLocalAI, buildRiddleHintPrompt, buildSpotSearchPrompt } from '../services/aiService'


/* ─── Tabs definition ──────────────────────────────────────────────────────── */
const TABS = [
  { id: 'info',       label: 'Today' },
  { id: 'itinerary',  label: 'Route' },
  { id: 'map',        label: 'Map' },
  { id: 'hotels',     label: 'Hotels' },
  { id: 'search',     label: 'Search' },
  { id: 'souvenirs',  label: 'Artifacts' },
  { id: 'phrasebook', label: 'Phrases' },
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
function playPhrase(phraseText, soundVolume = 0.5, soundMuted = false) {
  // 1. Play standard organic click feedback tone
  playPhraseFeedbackTone(soundVolume, soundMuted)

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
    setSoundMuted = () => {},
    journalReflections = {},
    saveJournalReflection = () => {},
    showPassportCard = false,
    setShowPassportCard = () => {},
    selectedHotel,
    setSelectedHotel,
    playOrganicPageSwish,
    purchasedItems = {},
    setPurchasedItems = () => {},
    itinerarySpots = [],
    setItinerarySpots = () => {},
    falconsCalled = [],
    setFalconsCalled = () => {},
    pearlsCollected = [],
    setPearlsCollected = () => {},
    unlockKeepsake = () => {},
    setGoldFils = () => {},
    passportStamps = [],
  } = useVibe() || {}



  /* ── Language + Toast context ──────────────────────────────────────────── */
  const { lang, isRTL } = useLang()
  const { toast } = useToast()

  /* ── Dynamic itinerary loading ──────────────────────────────────────────── */
  const { locations = [], loading = false } = useItinerary(selectedMoods, tier, duration, null, itinerarySpots)
  
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
  const [riddleModalOpen, setRiddleModalOpen] = useState(false)
  const [imageErrors,     setImageErrors]     = useState({})
  const [riddleHints,     setRiddleHints]     = useState({})
  const [hintLoading,     setHintLoading]     = useState(false)
  const [saveState,       setSaveState]       = useState('saved')
  const playTypewriterClick = (pitchMultiplier = 1.0) => {
    playTypewriterClickCentral(pitchMultiplier, soundVolume, soundMuted)
  }
  const [baseCampPromptOpen, setBaseCampPromptOpen] = useState(false)
  const [quickInfoOpen, setQuickInfoOpen] = useState(false)
  const [selectedKsake, setSelectedKsake] = useState(null)

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

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
      
      playRankUpChime(soundVolume, soundMuted)
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
  const [prevActiveSpotId, setPrevActiveSpotId] = useState(activeSpot?.id)
  const [localReflection, setLocalReflection] = useState(activeSpot ? (journalReflections[activeSpot.id] || '') : '')
  const reflectionDebounceRef = useRef(null)

  if (activeSpot?.id !== prevActiveSpotId) {
    setPrevActiveSpotId(activeSpot?.id)
    setLocalReflection(activeSpot ? (journalReflections[activeSpot.id] || '') : '')
  }

  const handleReflectionChange = (e) => {
    const val = e.target.value
    setLocalReflection(val)
    playTypewriterClick()
    
    setSaveState('typing')
    
    if (reflectionDebounceRef.current) {
      clearTimeout(reflectionDebounceRef.current)
    }
    reflectionDebounceRef.current = setTimeout(() => {
      setSaveState('saving')
      if (activeSpot) {
        saveJournalReflection(activeSpot.id, val)
      }
      setTimeout(() => {
        setSaveState('saved')
      }, 300)
    }, 450)
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
    
    playDaySealStamp(soundVolume, soundMuted)

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

      playRiddleCorrect(soundVolume, soundMuted)
      
      setTimeout(() => {
        triggerCoinFlyout(startX, startY)
      }, 100)
      
      setTimeout(() => {
        solveRiddle(activeSpot.id)
        toast.success("Riddle solved! +35 XP earned.")
      }, 700)
    } else {
      playRiddleIncorrect(soundVolume, soundMuted)
      
      setRiddleError("Wrong answer, traveler! Read the guide comments closely.")
      setTimeout(() => {
        setRiddleAnswer(null)
        setRiddleError(null)
      }, 1500)
    }
  }

  const handleRequestHint = async (spotId) => {
    if (riddleHints[spotId] || hintLoading) return

    const scrollCount = purchasedItems['riddle-hint'] || 0
    if (scrollCount > 0) {
      setPurchasedItems(prev => ({
        ...prev,
        'riddle-hint': scrollCount - 1
      }))
      toast.success("Consumed 1 Riddle Scroll Clue!")
    } else {
      if (goldFils >= 150) {
        spendFils(150)
        toast.success("Spent 150 Fils for a Clue Hint!")
      } else {
        toast.error("Requires a Riddle Scroll Clue or 150 Fils to request a hint.")
        return
      }
    }

    setHintLoading(true)
    const riddle = RIDDLES[spotId]
    if (!riddle) {
      setHintLoading(false)
      return
    }
    const { system, user } = buildRiddleHintPrompt(riddle.question, riddle.options)
    const hint = await callLocalAI(
      system,
      user,
      `Guide Clue: ${riddle.insider}`,
      { maxTokens: 100 }
    )
    setRiddleHints(prev => ({ ...prev, [spotId]: hint }))
    setHintLoading(false)
  }

  /* ── Shop purchase ───────────────────────────────────────────────────────── */
  const handleBuyItem = (item) => {
    if (goldFils < item.cost) {
      toast.error(`Not enough Fils! You have ${goldFils.toLocaleString()} Fils.`)
      return
    }
    if (spendFils(item.cost)) {
      awardXP(item.xpReward || 20, `Bought ${item.name}`)
      if (item.id === 'keepsake-bag') {
        const uncollected = spotsCatalog.filter(s => s.keepsakeId && !collectedKeepsakes.includes(s.id))
        if (uncollected.length > 0) {
          const randSpot = getRandomKeepsakeSpot(uncollected)
          unlockKeepsake(randSpot.id)
          toast.success(`Grab-bag unlocked keepsake: ${randSpot.keepsakeEmoji} ${randSpot.keepsakeName}!`)
        } else {
          toast.success(`Grab-bag purchased! All keepsakes already unlocked. (+${item.xpReward} XP)`)
        }
      } else {
        setPurchasedItems(prev => ({
          ...prev,
          [item.id]: (prev[item.id] || 0) + 1
        }))
        toast.success(`Purchased ${item.name}! Added to Travel Gear. (+${item.xpReward || 20} XP)`)
      }
    }
  }

  /* ── Search Handlers ──────────────────────────────────────────────────────── */
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchResults(null)
    playTypewriterClick(1.0)
    
    try {
      const { system, user } = buildSpotSearchPrompt(searchQuery)
      let responseText = null
      try {
        responseText = await callLocalAI(
          system,
          user,
          '',
          { maxTokens: 800, useJson: true }
        )
      } catch (err) {
        console.warn("AI search service offline or timed out, falling back to local search:", err)
      }
      
      let parsed = null
      if (responseText && !responseText.includes('error')) {
        let cleaned = responseText.trim()
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim()
        }
        try {
          parsed = JSON.parse(cleaned)
        } catch (jsonErr) {
          console.warn("Failed to parse AI search JSON response:", jsonErr)
        }
      }

      // ── Client-side Fallback ───────────────────────────────────────────────
      // If AI search is offline, timed out, or not successful, search our local spotsCatalog
      if (!parsed || !parsed.success) {
        const queryClean = searchQuery.toLowerCase().trim()
        
        // 1. Try to find a matching spot in the local catalog
        let matchedSpot = spotsCatalog.find(s => 
          s.name.toLowerCase().includes(queryClean) || 
          s.arabic.includes(queryClean) ||
          (s.id && s.id.toLowerCase().includes(queryClean))
        )
        
        if (!matchedSpot) {
          matchedSpot = spotsCatalog.find(s => 
            s.desc.toLowerCase().includes(queryClean) || 
            (s.simpleTerms && s.simpleTerms.toLowerCase().includes(queryClean))
          )
        }
        
        if (matchedSpot) {
          parsed = {
            success: true,
            id: matchedSpot.id,
            name: matchedSpot.name,
            arabic: matchedSpot.arabic,
            desc: matchedSpot.desc,
            where: matchedSpot.coords,
            coords: matchedSpot.coords,
            hours: 'Open daily 9:00 AM - 6:00 PM',
            cost: matchedSpot.budgetCost || matchedSpot.premiumCost || 'Free Entry',
            modestyAlert: matchedSpot.id === 'barbar-temple' ? 'Dress respectfully' : '',
            safetyAlert: matchedSpot.id === 'jarada-island' ? 'Monitor tide timings closely' : '',
            insider: matchedSpot.insider,
            category: matchedSpot.category,
            period: matchedSpot.period,
            success: true
          }
        } else {
          // 2. Dynamic Local Spot Generator Fallback (for when AI keys are dead/out of balance)
          // This generates a realistic, authentic-feeling location in Bahrain on-the-fly!
          const capitalizedQuery = searchQuery
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')

          let category = 'culture'
          let arabicName = `معلم ${capitalizedQuery}`
          let desc = `A notable local landmark in Bahrain, highly appreciated for its unique character, welcoming environment, and local significance. It stands as an interesting stop for anyone wishing to explore the diverse facets of the island.`
          let simpleTerms = `What this offers: A welcoming local landmark that showcases Bahrain's local character and community presence.`
          let insider = `A great addition to your itinerary. Check their local schedules or visit during the late afternoon to see the area at its liveliest.`
          let hours = 'Open daily 9:00 AM - 8:00 PM'
          let cost = 'Free Entry'
          let district = 'Manama, Bahrain'
          let modestyAlert = ''
          let safetyAlert = ''

          // Parse and build custom metadata based on query type
          if (/(hospital|clinic|medical|health|dentist|doctor|care)/i.test(queryClean)) {
            category = 'modern'
            const baseName = capitalizedQuery.replace(/(hospital|clinic|medical\s*center|medical)/gi, '').trim() || capitalizedQuery
            arabicName = `مستشفى ${baseName}`
            desc = `A key healthcare and medical facility in Bahrain, providing essential services, modern medical care, and wellness support. It stands as a vital community institution serving both local residents and visitors with dedicated professional staff.`
            simpleTerms = `What this offers: Healthcare services, emergency care, and medical consultations in a professional local facility.`
            insider = `Keep their contact number handy for emergencies. The facility has modern departments and a pharmacy nearby for prescriptions.`
            hours = 'Open 24/7 (Emergency) • OPD 8:00 AM - 8:00 PM'
            cost = 'Consultation fees apply'
            district = 'Manama Medical District, Bahrain'
          } else if (/(school|university|college|academy|institute|learning|library)/i.test(queryClean)) {
            category = 'culture'
            const baseName = capitalizedQuery.replace(/(school|university|college|academy)/gi, '').trim() || capitalizedQuery
            arabicName = (queryClean.includes('university') || queryClean.includes('college')) ? `جامعة ${baseName}` : `مدرسة ${baseName}`
            desc = `A respected educational institution in Bahrain, dedicated to academic excellence, learning, and research. It plays a central role in shaping the minds of future generations and serves as an intellectual landmark in the region.`
            simpleTerms = `What this offers: Academic programs, educational resources, library facilities, and a vibrant student campus environment.`
            insider = `Visitors should check at the main reception or security gate for visitor passes before exploring the campus or library facilities.`
            hours = 'Open daily 7:30 AM - 4:00 PM'
            cost = 'Free Entry (Visitor pass required)'
            district = 'Isa Town Educational Area, Bahrain'
          } else if (/(mosque|masjid|church|temple|synagogue|cathedral|spiritual|holy)/i.test(queryClean)) {
            category = 'fort'
            const baseName = capitalizedQuery.replace(/(mosque|masjid|church|temple)/gi, '').trim() || capitalizedQuery
            arabicName = (queryClean.includes('mosque') || queryClean.includes('masjid')) ? `مسجد ${baseName}` : `دار عبادة ${baseName}`
            desc = `A beautiful and serene place of worship and reflection in Bahrain. It stands as an architectural and spiritual beacon, welcoming visitors to experience its peaceful ambiance, sacred design, and cultural significance.`
            simpleTerms = `What this offers: A sacred space for prayer, spiritual reflection, and stunning local religious architecture.`
            insider = `Dress modestly: shoulders and knees must be covered. Women should bring a headscarf. Avoid visiting during main congregational prayer times.`
            hours = 'Open daily 9:00 AM - 9:00 PM (Visitor hours vary)'
            cost = 'Free Entry'
            district = 'Manama, Bahrain'
            modestyAlert = 'Dress modestly: shoulders and knees covered'
          } else if (/(hotel|resort|inn|suites|stay|hostel|villa|palace)/i.test(queryClean)) {
            category = 'modern'
            const baseName = capitalizedQuery.replace(/(hotel|resort|inn|suites)/gi, '').trim() || capitalizedQuery
            arabicName = `فندق ${baseName}`
            desc = `A premier hospitality destination in Bahrain, offering luxurious accommodations, exceptional dining, and top-tier amenities. It serves as a comfortable retreat for travelers and a popular gathering spot for local events.`
            simpleTerms = `What this offers: High-quality lodging, leisure facilities, swimming pools, and multiple fine dining options.`
            insider = `Even if you aren't staying overnight, visit their rooftop lounge or lobby cafe for great views and excellent Arabic coffee.`
            hours = 'Open 24 hours'
            cost = 'Varies by service'
            district = 'Seef District, Manama'
          } else if (/(cafe|restaurant|food|burger|coffee|coco|bake|eats|souq|market|dine|dining|pub|bar|bistro|kitchen|house)/i.test(queryClean)) {
            category = 'souq'
            const baseName = capitalizedQuery.replace(/(restaurant|cafe|coffee|house)/gi, '').trim() || capitalizedQuery
            arabicName = (queryClean.includes('cafe') || queryClean.includes('coffee')) ? `مقهى ${baseName}` : `مطعم ${baseName}`
            desc = `A highly regarded culinary establishment in Bahrain, celebrated for its delicious menu, warm ambiance, and excellent service. It offers an inviting atmosphere where locals and tourists gather to enjoy superb flavors and great company.`
            simpleTerms = `What this offers: A delightful dining experience featuring high-quality dishes, refreshing drinks, and comfortable seating.`
            insider = `A fantastic spot for food enthusiasts. Try their signature dishes and be sure to book a table in advance during busy weekend evenings.`
            hours = 'Open daily 8:00 AM - 11:30 PM'
            cost = '3-8 BHD per person'
            district = 'Block 338 Adliya, Manama'
          } else if (/(beach|island|sea|marine|coast|reef|bay|water|shore|yacht|dive|boat|park|garden|nature|wildlife)/i.test(queryClean)) {
            category = 'coast'
            arabicName = `ساحل ${capitalizedQuery}`
            desc = `A scenic natural escape in Bahrain, beloved for its picturesque views, calming sea breeze, and outdoor recreation. It is a perfect spot for relaxation, water sports, and enjoying the island's coastal beauty.`
            simpleTerms = `What this offers: Beautiful views, swimming, walking paths, and peaceful outdoor spots to unwind.`
            insider = `Perfect for sunset watching. Bring your camera, some sunscreen, and enjoy the cool sea breeze during the late afternoon.`
            hours = 'Open daily 24 hours'
            cost = 'Free Entry'
            district = 'Manama Waterfront, Bahrain'
          } else if (/(fort|castle|ruin|archaeology|tower|ancient|heritage|history)/i.test(queryClean)) {
            category = 'fort'
            arabicName = `قلعة ${capitalizedQuery}`
            desc = `A historic fort and archaeological marvel in Bahrain, rich in stories of ancient trade, defense, and culture. It serves as a majestic gateway to the kingdom's historic past, offering visitors incredible stone layouts and expansive views.`
            simpleTerms = `What this offers: Archaeological exploration, ancient stone architecture, and stunning historical photo opportunities.`
            insider = `Ideal for history lovers. Walk along the outer ramparts during the golden hour for perfect lighting and panoramic ocean and skyline views.`
            hours = 'Open daily 8:00 AM - 6:00 PM'
            cost = 'Free Entry'
            district = 'Muharraq Island, Bahrain'
          } else if (/(desert|safari|camel|sakhir|dune|tree|stargaze|camp)/i.test(queryClean)) {
            category = 'desert'
            arabicName = `صحراء ${capitalizedQuery}`
            desc = `A mesmerizing desert landscape in Bahrain, boasting rolling sands, unique desert flora, and deep heritage. It is a favorite location for desert safaris, traditional camel sightings, and peaceful stargazing under clear night skies.`
            simpleTerms = `What this offers: Desert exploration, dune vistas, stargazing, and authentic Arabian desert camp experiences.`
            insider = `Dress warmly if visiting during winter nights as the desert temperature drops quickly. Make sure to travel in a 4WD vehicle for safety on dunes.`
            hours = 'Open 24 hours'
            cost = 'Free Entry'
            district = 'Sakhir Desert, Bahrain'
          } else if (/(mall|circuit|center|centre|avenue|city|plaza|shopping|race)/i.test(queryClean)) {
            category = 'modern'
            arabicName = `مجمع ${capitalizedQuery}`
            desc = `A modern, state-of-the-art retail and entertainment hub in Bahrain, showcasing the kingdom's rapid development and cosmopolitan lifestyle. It offers premium shopping, dining, and family-friendly activity centers.`
            simpleTerms = `What this offers: Luxury brand shopping, global culinary options, entertainment, and modern indoor leisure.`
            insider = `Excellent indoor climate control. Great for escaping the afternoon heat, and perfect for shopping high-end local and international brands.`
            hours = 'Open daily 10:00 AM - 10:00 PM'
            cost = 'Free Entry'
            district = 'Seef District, Manama'
          }

          // Generate realistic coordinates in Bahrain (offsetting slightly from a central point)
          // Let's place it near Adliya/Manama (lat 26.218, lon 50.591)
          const randomOffsetLat = (Math.random() - 0.5) * 0.04
          const randomOffsetLon = (Math.random() - 0.5) * 0.04
          const lat = (26.2185 + randomOffsetLat).toFixed(4)
          const lon = (50.5912 + randomOffsetLon).toFixed(4)
          const coords = `${lat}° N, ${lon}° E`

          parsed = {
            success: true,
            id: `custom-${queryClean.replace(/[^a-z0-9]/g, '-')}-${Math.floor(Math.random() * 1000)}`,
            name: capitalizedQuery,
            arabic: arabicName,
            desc: desc,
            simpleTerms: simpleTerms,
            where: district,
            coords: coords,
            hours: hours,
            cost: cost,
            modestyAlert: modestyAlert,
            safetyAlert: safetyAlert,
            insider: insider,
            category: category,
            period: category === 'fort' || category === 'desert' ? 'Historical Era' : 'Established Local Landmark',
            success: true
          }
        }
      }

      if (parsed && parsed.success) {
        setSearchResults(parsed)
      } else {
        setSearchError(parsed?.errorMsg || "Could not find any location by that name in Bahrain.")
      }
    } catch (e) {
      console.error("Search error:", e)
      setSearchError("An error occurred during search. Please verify your query.")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddSearchedSpot = (spot) => {
    const spotId = spot.id || `spot-${Math.random().toString(36).substr(2, 9)}`
    
    const CATEGORY_FALLBACK_IMAGES = {
      fort: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG',
      souq: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Manama_Bab_al-Bahrain_Souq_1.jpg',
      coast: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      modern: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Manama_Bahrain_World_Trade_Centre_04.jpg',
      desert: 'https://upload.wikimedia.org/wikipedia/commons/4/42/2010-03_Tree_of_Life_Bahrain.jpg',
      culture: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Manama_Bahrain_National_Museum_Exterior_1.jpg',
      default: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG'
    }

    const newSpot = {
      id: spotId,
      name: spot.name,
      arabic: spot.arabic || 'معلم بحريني',
      mood: spot.mood || 'culture',
      coords: spot.coords || '26.2° N, 50.6° E',
      period: spot.period || 'Modern Era',
      desc: spot.desc,
      simpleTerms: `What this offers: ${spot.desc}`,
      insider: spot.insider || 'Enjoy exploring this beautiful landmark.',
      pathGuide: `Directions: ${spot.where || spot.coords || 'Bahrain'}. Opening hours: ${spot.hours || 'Open daily'}`,
      pathCost: spot.cost || 'Free Entry',
      image: spot.image || CATEGORY_FALLBACK_IMAGES[spot.category?.toLowerCase()] || CATEGORY_FALLBACK_IMAGES.default,
      day: currentDayTab,
      category: spot.category || 'culture'
    }
    
    setItinerarySpots(prev => {
      // Find the airport departure if it is on the same day, and insert before it
      const departureIndex = prev.findIndex(s => s.id === 'airport-departure' && s.day === currentDayTab)
      if (departureIndex !== -1) {
        const next = [...prev]
        next.splice(departureIndex, 0, newSpot)
        return next
      }
      return [...prev, newSpot]
    })
    
    awardXP(20, `Added ${spot.name} to Route`)
    toast.success(`Successfully added ${spot.name} to Day ${currentDayTab} route!`)
  }

  const handleOptimizeRoute = () => {
    // 1. Get the spots for the current day
    const daySpots = itinerarySpots.filter(s => s.day === currentDayTab)
    if (daySpots.length < 2) {
      toast.error('Need at least 2 stops to optimize.')
      return
    }

    // 2. Identify if we have an arrival and/or departure on this day
    const arrivalSpot = daySpots.find(s => s.id === 'airport-arrival')
    const departureSpot = daySpots.find(s => s.id === 'airport-departure')
    
    // 3. Filter spots to sort (exclude airport-arrival and airport-departure)
    const spotsToSort = daySpots.filter(s => s.id !== 'airport-arrival' && s.id !== 'airport-departure')
    
    if (spotsToSort.length < 2) {
      toast.success('Route is already optimized! Pinned airport stops are in correct place.')
      return
    }

    // Helper to parse coordinate string into lat/lon object
    const parseLatLon = (str) => {
      if (!str) return { lat: 26.2, lon: 50.6 }
      try {
        const parts = str.split(',')
        if (parts.length < 2) return { lat: 26.2, lon: 50.6 }
        const lat = parseFloat(parts[0].replace(/[^\d.-]/g, ''))
        const lon = parseFloat(parts[1].replace(/[^\d.-]/g, ''))
        return isNaN(lat) || isNaN(lon) ? { lat: 26.2, lon: 50.6 } : { lat, lon }
      } catch {
        return { lat: 26.2, lon: 50.6 }
      }
    }

    // Helper to compute Euclidean distance
    const getDistance = (c1, c2) => {
      const dLat = c1.lat - c2.lat
      const dLon = c1.lon - c2.lon
      return Math.sqrt(dLat * dLat + dLon * dLon)
    }

    // 4. Determine starting point
    let startPos = null
    if (selectedHotel) {
      startPos = parseLatLon(selectedHotel.coords)
    } else if (arrivalSpot) {
      startPos = parseLatLon(arrivalSpot.coords)
    } else {
      // If no hotel or arrival, start from the first spot in the list
      startPos = parseLatLon(spotsToSort[0].coords)
    }

    // 5. Nearest-neighbor TSP sort
    const sorted = []
    const remaining = [...spotsToSort]
    let currentPos = startPos

    while (remaining.length > 0) {
      let bestIdx = -1
      let bestDist = Infinity

      for (let i = 0; i < remaining.length; i++) {
        const spotCoords = parseLatLon(remaining[i].coords)
        const dist = getDistance(currentPos, spotCoords)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = i
        }
      }

      if (bestIdx !== -1) {
        const nextSpot = remaining.splice(bestIdx, 1)[0]
        sorted.push(nextSpot)
        currentPos = parseLatLon(nextSpot.coords)
      } else {
        break
      }
    }

    // 6. Assemble the final day route
    const updatedDaySpots = [
      ...(arrivalSpot ? [arrivalSpot] : []),
      ...sorted,
      ...(departureSpot ? [departureSpot] : [])
    ]

    // 7. Reconstruct the global itinerary spots array
    const newItinerarySpots = []
    for (let d = 1; d <= duration; d++) {
      if (d === currentDayTab) {
        newItinerarySpots.push(...updatedDaySpots)
      } else {
        newItinerarySpots.push(...itinerarySpots.filter(s => s.day === d))
      }
    }

    // 8. Update state, award XP and play stamp sound
    setItinerarySpots(newItinerarySpots)
    setCurrentSpotIndex(0) // reset active timeline selection to first spot to prevent index out-of-bounds
    playCampStampSound(soundVolume, soundMuted)
    awardXP(50, 'Geographic Route Optimized')
    toast.success(`⚡ Magic Georoute optimized Day ${currentDayTab} route! +50 XP`)
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

  /* ── Spot Details Helpers ──────────────────────────────────────────────────── */
  const renderSpotAbout = () => {
    if (!activeSpot) return null
    return (
      <div className="space-y-5">
        <p className="jn-description">{activeSpot.desc}</p>

        {/* What You Can Find Here */}
        <div className="jn-insider-box" role="complementary" aria-label="What you can find here">
          <span className="jn-tag jn-tag--red">What to See</span>
          <p className="jn-insider-text">{activeSpot.simpleTerms}</p>
        </div>

        {/* Estimated Cost / Budget */}
        <div className="jn-insider-box" style={{ background: 'var(--jn-input-bg, #fffdf9)', border: '1px solid var(--jn-gold-muted)', padding: '15px' }} role="complementary" aria-label="Estimated Cost / Budget">
          <span className="jn-tag jn-tag--green">Estimated Cost</span>
          <p className="jn-insider-text" style={{ fontWeight: 'bold', marginTop: '5px' }}>
            {activeSpot.pathCost || activeSpot.budgetCost || 'Free Entry'}
          </p>
        </div>

        {/* Coastal / Island Pearl Searching */}
        {activeSpot.category === 'coast' && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 relative overflow-hidden select-none">
            <div className="flex justify-between items-center mb-2">
              <span className="font-sans text-[11px] tracking-widest uppercase text-blue-700 font-bold flex items-center gap-1">
                🌊 Pearl Diving Reef
              </span>
              {(pearlsCollected || []).includes(activeSpot.id) && (
                <span className="text-[11px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full">
                  ✓ Found Pearl (+30 XP)
                </span>
              )}
            </div>
            {(purchasedItems['pearl-hook'] || 0) > 0 ? (
              (pearlsCollected || []).includes(activeSpot.id) ? (
                <p className="font-serif text-[12px] text-blue-800 leading-relaxed font-medium italic">
                  You already cast your Generational Oyster Hook here and retrieved a rare Basra Pearl!
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-serif text-[12px] text-blue-900 leading-relaxed">
                    The warm Sitra reefs are home to wild pearl oysters. Cast your hook to search for hidden gems.
                  </p>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const startX = rect.left + rect.width / 2
                      const startY = rect.top + rect.height / 2
                      setPearlsCollected(prev => [...(prev || []), activeSpot.id])
                      awardXP(30, 'Harvested Basra Pearl')
                      setGoldFils(prev => prev + 100)
                      triggerCoinFlyout(startX, startY)
                      toast.success("Succesfully dived! Found a natural Basra Pearl! +100 Fils, +30 XP")
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-sans text-[11px] uppercase tracking-wider font-extrabold rounded-lg shadow-sm cursor-pointer transition-all active:scale-98"
                  >
                    Search for Pearls
                  </button>
                </div>
              )
            ) : (
              <div className="p-2.5 rounded-lg bg-blue-100/50 border border-blue-200 text-blue-800 font-sans text-[11px] font-bold flex items-center gap-2">
                🔒 Requires Generational Oyster Hook from Souq Shop.
              </div>
            )}
          </div>
        )}

        {/* Falconry Majlis Fort/Desert */}
        {(activeSpot.category === 'fort' || activeSpot.category === 'desert') && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 relative overflow-hidden select-none">
            <div className="flex justify-between items-center mb-2">
              <span className="font-sans text-[11px] tracking-widest uppercase text-amber-700 font-bold flex items-center gap-1">
                🦅 Falconry Training
              </span>
              {(falconsCalled || []).includes(activeSpot.id) && (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                  ✓ Falcon Called (+50 XP)
                </span>
              )}
            </div>
            {(purchasedItems['falcon-glove'] || 0) > 0 ? (
              (falconsCalled || []).includes(activeSpot.id) ? (
                <p className="font-serif text-[12px] text-amber-800 leading-relaxed font-medium italic">
                  A beautiful wild desert falcon has landed on your Falconer Glove here!
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="font-serif text-[12px] text-amber-900 leading-relaxed">
                    This location has open winds and thermal drafts. Equip your glove and whistle to call a wild falcon.
                  </p>
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const startX = rect.left + rect.width / 2
                      const startY = rect.top + rect.height / 2
                      setFalconsCalled(prev => [...(prev || []), activeSpot.id])
                      awardXP(50, 'Called Falcon to Glove')
                      setGoldFils(prev => prev + 100)
                      triggerCoinFlyout(startX, startY)
                      toast.success("A soaring falcon has landed on your glove! +100 Fils, +50 XP")
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[11px] uppercase tracking-wider font-extrabold rounded-lg shadow-sm cursor-pointer transition-all active:scale-98"
                  >
                    Call Falcon
                  </button>
                </div>
              )
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-100/50 border border-amber-200 text-amber-800 font-sans text-[11px] font-bold flex items-center gap-2">
                🔒 Requires Falconer Glove from Souq Shop.
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
            {currentSpotIndex === activeSpots.length - 1 ? 'Complete Day' : `Next Stop ${isRTL ? '←' : '→'}`}
          </button>
        </div>
      </div>
    )
  }

  const renderSpotSidebar = () => {
    if (!activeSpot) return null
    return (
      <div className="space-y-5">
        {/* Action buttons row — Lens capture, virtual tour */}
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
          {/* Writing Prompt Chips */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--jn-ink-faint)', alignSelf: 'center', marginRight: '4px' }}>Prompts:</span>
            <button
              type="button"
              onClick={() => {
                const header = "\n- Cardamom/Saffron scent: \n- Traditional flavors tasted: \n"
                const newVal = (localReflection ? localReflection + header : header).trim()
                setLocalReflection(newVal)
                saveJournalReflection(activeSpot.id, newVal)
                playTypewriterClick(1.2)
                toast.success("Appended Food & Aromas template!")
              }}
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '9999px',
                border: '1px solid var(--jn-border-color)',
                background: 'var(--jn-paper)',
                color: 'var(--jn-ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jn-crimson)'; e.currentTarget.style.background = 'rgba(186,12,47,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--jn-border-color)'; e.currentTarget.style.background = 'var(--jn-paper)' }}
            >
              Food & Aromas 🍯
            </button>
            <button
              type="button"
              onClick={() => {
                const header = "\n- Coral stone & wood details: \n- Geometry & structural design: \n"
                const newVal = (localReflection ? localReflection + header : header).trim()
                setLocalReflection(newVal)
                saveJournalReflection(activeSpot.id, newVal)
                playTypewriterClick(1.2)
                toast.success("Appended Architecture template!")
              }}
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '9999px',
                border: '1px solid var(--jn-border-color)',
                background: 'var(--jn-paper)',
                color: 'var(--jn-ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jn-crimson)'; e.currentTarget.style.background = 'rgba(186,12,47,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--jn-border-color)'; e.currentTarget.style.background = 'var(--jn-paper)' }}
            >
              Architecture 🏺
            </button>
            <button
              type="button"
              onClick={() => {
                const header = "\n- Sounds & street ambient: \n- Warmth of local greetings: \n"
                const newVal = (localReflection ? localReflection + header : header).trim()
                setLocalReflection(newVal)
                saveJournalReflection(activeSpot.id, newVal)
                playTypewriterClick(1.2)
                toast.success("Appended Local Vibe template!")
              }}
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '4px 8px',
                borderRadius: '9999px',
                border: '1px solid var(--jn-border-color)',
                background: 'var(--jn-paper)',
                color: 'var(--jn-ink)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jn-crimson)'; e.currentTarget.style.background = 'rgba(186,12,47,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--jn-border-color)'; e.currentTarget.style.background = 'var(--jn-paper)' }}
            >
              Local Vibe 📝
            </button>
          </div>
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
              background: 'var(--jn-input-bg, #fffdf9)',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', color: '#888', fontFamily: 'var(--jn-font-sans)', fontWeight: 'bold' }}>
            <span style={{ color: saveState === 'saved' ? 'var(--jn-green, #1C6B3A)' : 'var(--jn-crimson, #BA0C2F)' }}>
              {saveState === 'typing' && '✍️ Typing...'}
              {saveState === 'saving' && '⚡ Saving...'}
              {saveState === 'saved' && '✓ Saved'}
            </span>
            <span>{localReflection.length} chars</span>
          </div>
        </div>

        {/* Riddle Quest */}
        {RIDDLES[activeSpot.id] && (
          <div className="p-4 rounded-xl border border-red-500/10 shadow-sm relative overflow-hidden bg-white/70">
            <div className="flex justify-between items-center mb-2 select-none">
              <span className="font-sans text-[11px] tracking-widest uppercase text-bahrain-red font-bold flex items-center gap-1">
                Riddle
              </span>
              {solvedRiddles[activeSpot.id] ? (
                <span className="text-[11px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full">
                  ✓ Solved (+35 XP)
                </span>
              ) : (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full">
                  Unsolved (+35 XP)
                </span>
              )}
            </div>

            <p className="font-serif text-[14px] text-bronze-charcoal leading-relaxed font-bold mb-3">
              "{RIDDLES[activeSpot.id].question}"
            </p>

            {solvedRiddles[activeSpot.id] ? (
              <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/10 space-y-1">
                <p className="font-sans text-[11px] uppercase tracking-wider text-green-700 font-extrabold select-none">Insider Discovery Reveal:</p>
                <p className="font-serif text-[13px] text-bronze-charcoal leading-relaxed italic font-semibold">
                  {RIDDLES[activeSpot.id].insider}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {RIDDLES[activeSpot.id].options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerRiddle(oIdx)}
                    className="w-full p-2.5 text-left rounded-lg border border-red-500/10 hover:border-bahrain-red bg-white hover:bg-red-500/5 text-[13px] font-sans font-bold text-bronze-charcoal transition-all cursor-pointer active:scale-99"
                  >
                    {opt}
                  </button>
                ))}
                {riddleError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-sans text-[11px] font-bold animate-scaleIn select-none">
                    ❌ {riddleError}
                  </div>
                )}
                {/* Hint System */}
                <div style={{ marginTop: '10px' }}>
                  {riddleHints[activeSpot.id] ? (
                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      color: '#B45309',
                      fontSize: '12px',
                      fontFamily: 'var(--jn-font-serif)',
                      fontStyle: 'italic',
                      lineHeight: '1.4'
                    }}>
                      <strong>💡 Clue:</strong> {riddleHints[activeSpot.id]}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequestHint(activeSpot.id)}
                      disabled={hintLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--jn-crimson)',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        fontFamily: 'var(--jn-font-sans)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: hintLoading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 0',
                        opacity: hintLoading ? 0.6 : 1
                      }}
                    >
                      {hintLoading ? '🧙‍♂️ Consulting elders...' : (purchasedItems['riddle-hint'] || 0) > 0 ? `📜 Use Clue Scroll (${purchasedItems['riddle-hint']} left)` : '✨ Request Hint (150 Fils)'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const riddleCTAVisible = activeTab === 'info' && activeSpot && RIDDLES[activeSpot.id]
  const fabBottom = riddleCTAVisible ? '158px' : '90px'
  const panelBottom = riddleCTAVisible ? '222px' : '155px'
  const quickInfoBottom = riddleCTAVisible ? '228px' : '160px'

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

          <div className="jn-header-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="jn-utility-btn"
              title={soundMuted ? "Unmute Sounds" : "Mute Sounds"}
            >
              {soundMuted ? (
                <VolumeX className="w-[18px] h-[18px]" />
              ) : (
                <Volume2 className="w-[18px] h-[18px]" />
              )}
            </button>

            <LangToggle />

            {/* XP progress pill */}
            <div className="jn-xp-pill" aria-label={`${displayXP} XP earned`}>
              <span className="jn-xp-num">{displayXP} XP</span>
            </div>

            {/* Passport card trigger */}
            <button
              onClick={() => setShowPassportCard(true)}
              className="jn-utility-btn-rank"
              title="View Explorer Passport"
            >
              <span role="img" aria-label="Passport">📖</span>
              <span className="jn-rank-label">{rank.label}</span>
              {passportStamps && passportStamps.length > 0 && (
                <span className="jn-passport-stamp-badge">
                  {passportStamps.length}
                </span>
              )}
            </button>

            {/* Print / Export Travelogue */}
            <button
              onClick={() => {
                playTypewriterClick(1.1)
                window.print()
              }}
              className="jn-utility-btn jn-print-btn"
              title="Print / Export Travelogue"
            >
              <span className="text-[14px]">🖨️</span>
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
              Virtual Tour
            </button>
          )}
          {onBack && (
            <button className="jn-mob-nav-btn jn-mob-nav-btn--back" onClick={onBack}>
              {isRTL ? 'Edit Trip →' : '← Edit Trip'}
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
            {TABS.map(t => {
              const TabIcon = ({ id }) => {
                const size = 14;
                switch (id) {
                  case 'info': return <Calendar size={size} />;
                  case 'itinerary': return <MapPin size={size} />;
                  case 'map': return <Map size={size} />;
                  case 'hotels': return <Hotel size={size} />;
                  case 'search': return <Search size={size} />;
                  case 'souvenirs': return <Gift size={size} />;
                  case 'phrasebook': return <BookOpen size={size} />;
                  default: return null;
                }
              };
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  aria-selected={activeTab === t.id}
                  aria-controls={`panel-${t.id}`}
                  className={`jn-book-tab-pill ${activeTab === t.id ? 'active' : ''}`}
                  onClick={(e) => switchTab(t.id, e)}
                >
                  <span className="jn-tab-emoji" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TabIcon id={t.id} />
                  </span>
                  <span className="jn-tab-label">{t.label}</span>
                  {t.id === 'souvenirs' && collectedKeepsakes.length > 0 && (
                    <span className="jn-tab-badge">
                      {collectedKeepsakes.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <main className="jn-book relative">
          {/* Tactile Paper Grain Overlay */}
          <div className="paper-grain" style={{ opacity: 0.035 }} />
          
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
                <JournalSkeleton />
              ) : !hasSpots ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }} className="space-y-4">
                  <h3 className="jn-section-title" style={{ textAlign: 'center' }}>No stops on this route</h3>
                  <p className="jn-description" style={{ textAlign: 'center' }}>
                    Adjust your settings to build an itinerary matching your interests.
                  </p>
                  {onBack && (
                    <button className="jn-action-btn jn-action-btn--primary" onClick={onBack}>
                      Edit Trip Settings
                    </button>
                  )}
                </div>
              ) : isSealStep ? (
                /* ─── SEAL DAY PANEL ─── */
                <div className="space-y-6" style={{ padding: '10px 0' }}>
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Day Complete</h2>
                    <span className="jn-section-subtitle">Day {currentDayTab} Summary</span>
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
                          aria-hidden="true"
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
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '18px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Complete Day {currentDayTab}
                        </h4>
                        <p className="jn-description" style={{ textAlign: 'center', fontSize: '12px' }}>
                          You've visited all locations. Complete this day to earn the insider reward.
                        </p>
                        <button
                          onClick={handleSealDay}
                          className="jn-action-btn jn-action-btn--primary"
                        >
                           Complete Day
                        </button>
                      </div>
                    ) : (
                      <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span className="jn-tag jn-tag--green" style={{ display: 'inline-flex' }}>✓ Day {currentDayTab} Verified</span>
                        <h4 style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '16px', color: 'var(--jn-ink)', fontWeight: 'bold' }}>
                          Insider Tip:
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

                  {/* On desktop: hide description/cost details on left page (rendered on right page instead) */}
                  <div className="jn-desktop-hidden-details">
                    {renderSpotAbout()}
                  </div>
                  {/* Sidebar spot note/riddles/action row always visible on left page */}
                  <div className="jn-sidebar-spot-always">
                    {renderSpotSidebar()}
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
                      src={activeSpot.image || 'https://commons.wikimedia.org/wiki/Special:FilePath/Bahrain_Fort_March_2015.JPG'} 
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
                        <span className="jn-section-subtitle">Details</span>
                      </div>
                      <hr className="jn-divider" aria-hidden="true" />
                      {renderSpotAbout()}
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
                    <div className="jn-section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h2 className="jn-section-title">Today's Route</h2>
                        <span className="jn-section-subtitle">Your itinerary for this day</span>
                      </div>
                      {activeSpots.filter(s => s.id !== 'airport-arrival' && s.id !== 'airport-departure').length > 1 && (
                        <button
                          onClick={() => {
                            playTypewriterClick(1.1)
                            handleOptimizeRoute()
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--jn-crimson)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontFamily: 'var(--jn-font-sans)',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(186, 12, 47, 0.25)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#a00a18';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--jn-crimson)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                          title="Geographically optimize your route for shortest travel time starting from your hotel"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={11} strokeWidth={2} />
                            Optimize Route
                          </span>
                        </button>
                      )}
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
                            className={`jn-timeline-item ${isSelected ? 'jn-timeline-item--active' : ''} animate-fade-in-up stagger-${(idx % 5) + 1}`}
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
                    <h2 className="jn-section-title">Artifacts & Keepsakes</h2>
                    <span className="jn-section-subtitle">Your Curated Collection</span>
                  </div>

                  <hr className="jn-divider" aria-hidden="true" />

                  {/* Fils balance */}
                  <div className="jn-fils-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="jn-fils-label">Fils Balance</span>
                      <span className="jn-fils-amount">{(goldFils || 0).toLocaleString()} Fils</span>
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--jn-ink-faint)', alignSelf: 'flex-start', marginTop: '2px', fontFamily: 'var(--jn-font-sans)', fontWeight: 'bold' }}>
                      Note: 1,000 Fils = 1 BHD (Bahraini Dinar)
                    </span>
                  </div>

                  {/* Souq shop button */}
                  <button
                    className="jn-action-btn jn-action-btn--amber jn-action-btn--full"
                    onClick={() => { setShopOpen(true) }}
                    aria-label="Enter Heritage Kiosk"
                  >
                    Open Collector Kiosk
                  </button>

                  {/* Keepsake grid */}
                  <div className="jn-keepsake-cabinet">
                    <span className="jn-keepsake-cabinet-label">Cabinet of Heritage Keepsakes</span>
                    <div className="jn-keepsake-grid">
                      {spotsCatalog.map((spot, sIdx) => {
                        const unlocked = (collectedKeepsakes || []).includes(spot.id)
                        return (
                          <button
                            key={spot.id}
                            disabled={!unlocked}
                            onClick={() => unlocked && setSelectedKsake(spot)}
                            title={unlocked ? `${spot.keepsakeName}: ${spot.keepsakeDesc}` : 'Keepsake locked — explore the location or acquire to unlock.'}
                            className={`jn-keepsake-coin ${unlocked ? 'jn-keepsake-coin--unlocked gold-foil-bg' : 'jn-keepsake-coin--locked'} animate-fade-in-up stagger-${(sIdx % 5) + 1}`}
                            aria-label={unlocked ? `Keepsake: ${spot.keepsakeName}` : `Locked keepsake from ${spot.name}`}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {unlocked ? (
                              <span>{spot.keepsakeEmoji}</span>
                            ) : (
                              <Lock size={12} className="text-stone-400" strokeWidth={1.5} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {(collectedKeepsakes || []).length === 0 && (
                      <p className="jn-keepsake-empty">
                        Your cabinet is empty. Visit heritage spots or solve riddles to unlock keepsakes.
                      </p>
                    )}
                  </div>

                  {/* Travel Gear / Inventory Cabinet */}
                  <div className="jn-keepsake-cabinet" style={{ marginTop: '20px' }}>
                    <span className="jn-keepsake-cabinet-label">Traveler Equipment & Acquisitions</span>
                    <div className="space-y-2 mt-2">
                      {shopItems.filter(item => item.id !== 'keepsake-bag').map(item => {
                        const count = purchasedItems[item.id] || 0
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-red-500/10 bg-white/50"
                          >
                            <div className="flex items-center gap-2.5">
                                <span className="text-xl shrink-0">{item.emoji}</span>
                              <div className="text-left">
                                <h5 className="font-serif text-[11px] font-bold text-bronze-charcoal leading-tight">
                                  {item.name}
                                </h5>
                                <p className="font-sans text-[8.5px] text-bronze-muted leading-tight max-w-[180px] mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-mono text-[10px] font-bold bg-red-500/5 text-bahrain-red px-2 py-0.5 rounded border border-red-500/10">
                                x{count}
                              </span>
                              {item.id === 'saffron-halwa' && count > 0 && (
                                <button
                                  onClick={() => {
                                    setPurchasedItems(prev => {
                                      const next = { ...prev }
                                      if (next['saffron-halwa'] > 0) next['saffron-halwa']--
                                      return next
                                    })
                                    awardXP(25, "Consumed traditional Saffron Halwa")
                                    toast.success("Mmm! Cardamom, almonds and saffron threads! Delicious sweet halwa tasted. (+25 XP)")
                                  }}
                                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-sans text-[8px] uppercase tracking-wider font-extrabold cursor-pointer"
                                >
                                  Eat
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
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


              {/* ─── SUB-TAB: SEARCH ─── */}
              {activeTab === 'search' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="jn-section-heading">
                    <h2 className="jn-section-title">Spot Search</h2>
                    <span className="jn-section-subtitle">Find & explore any landmark in Bahrain</span>
                  </div>
                  
                  <hr className="jn-divider" aria-hidden="true" />



                  {/* Search input field */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchSubmit()
                      }}
                      placeholder="e.g. Al Fateh Grand Mosque, King Fahd Causeway..."
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--jn-border-color, #E7E5E4)',
                        fontFamily: 'var(--jn-font-sans)',
                        fontSize: '13px',
                        background: 'var(--jn-paper, #FCFBF8)',
                        color: 'var(--jn-ink, #1C1917)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleSearchSubmit}
                      disabled={searchLoading}
                      className="jn-action-btn jn-action-btn--primary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '12px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        borderRadius: '12px',
                        minWidth: '90px'
                      }}
                    >
                      {searchLoading ? 'Searching' : 'Search'}
                    </button>
                  </div>

                  {/* Suggestions list */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--jn-ink-faint, #A8A29E)' }}>Examples:</span>
                    {[
                      { label: '🕌 Al Fateh Mosque', val: 'Al Fateh Grand Mosque' },
                      { label: '🏎️ BIC Formula 1', val: 'Bahrain International Circuit' },
                      { label: '🌉 Causeway', val: 'King Fahd Causeway' },
                      { label: '🪵 Bu Maher Fort', val: 'Bu Maher Fort' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => {
                          setSearchQuery(item.val);
                          // Perform search right after setting state
                          setTimeout(() => {
                            const btn = document.querySelector('.jn-action-btn--primary');
                            if (btn) btn.click();
                          }, 50);
                        }}
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 'bold',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: '1px solid var(--jn-border-color, #E7E5E4)',
                          background: 'var(--jn-paper, #FCFBF8)',
                          color: 'var(--jn-ink, #1C1917)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--jn-crimson)'; e.currentTarget.style.background = 'rgba(186,12,47,0.05)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--jn-border-color)'; e.currentTarget.style.background = 'var(--jn-paper)' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Loading State */}
                  {searchLoading && (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }} className="space-y-3">
                      <div className="inline-block w-8 h-8 rounded-full border-2 border-dashed border-[#C1122F] animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />
                      <p style={{ fontFamily: 'var(--jn-font-serif)', fontSize: '13px', fontStyle: 'italic', color: 'var(--jn-ink-muted)' }}>
                        Consulting cultural archives for details...
                      </p>
                    </div>
                  )}

                  {/* Search Error State */}
                  {searchError && (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 font-sans text-xs text-center font-bold">
                      ⚠️ {searchError}
                    </div>
                  )}

                  {/* Search Result Display */}
                  {searchResults && (
                    <div className="glass-panel rounded-3xl p-5 border border-red-500/10 space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-start border-b border-red-500/10 pb-2">
                        <div className="flex flex-col text-left">
                          <span className="font-sans text-[9px] tracking-wider text-bahrain-red font-mono uppercase">
                            {searchResults.coords} • {searchResults.period || 'Modern Era'}
                          </span>
                          <h3 className="font-serif text-xl font-bold text-stone-900 mt-0.5 leading-tight">
                            {searchResults.name}
                          </h3>
                        </div>
                        <span className="font-serif text-base text-bahrain-red italic shrink-0">
                          {searchResults.arabic}
                        </span>
                      </div>
                      
                      <p className="font-sans text-xs text-stone-700 leading-relaxed text-left">
                        {searchResults.desc}
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="p-3 rounded-xl bg-stone-100/50 border border-stone-200">
                          <span className="font-sans text-[8px] uppercase tracking-widest text-[#B8860B] font-bold block">Opening Hours</span>
                          <span className="font-sans text-[11px] text-stone-800 font-semibold block mt-1 leading-snug">{searchResults.hours}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-stone-100/50 border border-stone-200">
                          <span className="font-sans text-[8px] uppercase tracking-widest text-[#B8860B] font-bold block">Estimated Cost</span>
                          <span className="font-sans text-[11px] text-stone-800 font-semibold block mt-1 leading-snug">{searchResults.cost}</span>
                        </div>
                      </div>

                      {/* Modesty or Safety Warning alerts */}
                      {(searchResults.modestyAlert || searchResults.safetyAlert) && (
                        <div className="space-y-1.5 text-left">
                          {searchResults.modestyAlert && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-900 text-[10px] font-sans font-bold select-none">
                              <span>🕌 Modesty Warning: {searchResults.modestyAlert}</span>
                            </div>
                          )}
                          {searchResults.safetyAlert && (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-red-500/10 border-red-500/20 text-red-900 text-[10px] font-sans font-bold select-none">
                              <span>⚠️ Tip: {searchResults.safetyAlert}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Insider Observation */}
                      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-left">
                        <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold block mb-1">Local Observation</span>
                        <p className="font-serif text-[11.5px] italic text-stone-800 leading-relaxed font-semibold">
                          "{searchResults.insider}"
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-red-500/10">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchResults.name + ', Bahrain')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/20 font-sans text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 text-center cursor-pointer pointer-events-auto"
                        >
                          Directions
                        </a>

                        <button
                          onClick={() => handleAddSearchedSpot(searchResults)}
                          className="px-4 py-2 rounded-xl bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer pointer-events-auto"
                        >
                          Add to Day {currentDayTab} Route
                        </button>
                      </div>
                    </div>
                  )}
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
                        className={`jn-phrase-card animate-fade-in-up stagger-${(idx % 5) + 1}`}
                        onClick={() => playPhrase(p.arabic, soundVolume, soundMuted)}
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
          className="jn-modal-overlay glass-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Heritage Collector Kiosk"
          onClick={(e) => { if (e.target === e.currentTarget) setShopOpen(false) }}
        >
          <div className="jn-shop-modal glass-card relative overflow-hidden">
            {/* Tactile Paper Grain Overlay */}
            <div className="paper-grain" style={{ opacity: 0.038 }} />
            <div className="jn-shop-header">
              <div>
                <span className="jn-shop-eyebrow">Manama Heritage Kiosk</span>
                <h3 className="jn-shop-title">Collector's Kiosk</h3>
              </div>
              <button className="jn-shop-close" onClick={() => setShopOpen(false)} aria-label="Close kiosk">✕ Close</button>
            </div>



            <div className="jn-shop-fils-bar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="flex justify-between w-full">
                <span>Your Fils Balance</span>
                <strong>{(goldFils || 0).toLocaleString()} Fils</strong>
              </div>
              <span style={{ fontSize: '9px', opacity: 0.65, fontFamily: 'var(--jn-font-sans)', marginTop: '2px', fontWeight: 'bold' }}>
                Note: 1,000 Fils = 1 BHD (Bahraini Dinar)
              </span>
            </div>


            <p className="jn-shop-intro">
              "Welcome to the Collector's Kiosk. Here you may exchange your earned Fils for traditional keepsakes, archival clue scrolls, or regional equipment."
            </p>

            <div className="jn-shop-items">
              {(shopItems || []).map((item, iIdx) => (
                <div key={item.id} className={`jn-shop-item animate-fade-in-up stagger-${(iIdx % 5) + 1}`}>
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
          className="jn-modal-overlay glass-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedKsake(null) }}
        >
          <div className="jn-ksake-modal glass-card relative" style={{
            maxWidth: '520px',
            padding: '24px',
          }}>
            {/* Tactile Paper Grain Overlay */}
            <div className="paper-grain" style={{ opacity: 0.035 }} />
            {/* Vintage borders inside */}
            <div style={{
              position: 'absolute',
              top: '8px', left: '8px', right: '8px', bottom: '8px',
              border: '1px dashed #D4C3A3',
              pointerEvents: 'none'
            }} />
            
            {/* Header: Kingdom of Bahrain visa header */}
            <div style={{
              textAlign: 'center',
              borderBottom: '2px solid #BA0C2F',
              paddingBottom: '10px',
              marginBottom: '18px',
              position: 'relative'
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#BA0C2F', fontWeight: '900', fontFamily: 'var(--jn-font-sans)' }}>
                Kingdom of Bahrain · Entry Visa
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--jn-font-serif)', color: '#1C1917', marginTop: '2px' }}>
                تأشيرة دخول دلمون الأثرية
              </div>
              <button 
                onClick={() => setSelectedKsake(null)} 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '4px',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  color: '#78716C',
                  cursor: 'pointer'
                }}
                aria-label="Close visa document"
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' }}>
              {/* Photo component */}
              <div style={{
                flex: '1 1 180px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  background: '#fff',
                  padding: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  border: '1px solid #E7E5E4',
                  borderRadius: '4px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    width: '100%',
                    height: '140px',
                    overflow: 'hidden',
                    borderRadius: '2px',
                    background: '#292524',
                    position: 'relative'
                  }}>
                    <img 
                      src={capturedPhotos[selectedKsake.id] || selectedKsake.image} 
                      alt={selectedKsake.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      fontSize: '8px',
                      fontFamily: 'var(--jn-font-sans)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      padding: '4px 6px',
                      textAlign: 'center'
                    }}>
                      Wayfarer Photo ID
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '9px', color: '#78716C', fontFamily: 'var(--jn-font-sans)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Serial: #BP-{selectedKsake.id?.slice(0,8).toUpperCase() || 'KSAKE'}
                  </div>
                </div>
              </div>

              {/* Visa details & stamp */}
              <div style={{
                flex: '1 2 240px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                    <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Souvenir:</span>
                    <span style={{ fontWeight: 'bold', color: '#1C1917' }}>{selectedKsake.keepsakeEmoji} {selectedKsake.keepsakeName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                    <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Site:</span>
                    <span style={{ fontWeight: 'bold', color: '#1C1917' }}>{selectedKsake.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                    <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Epoch/Period:</span>
                    <span style={{ fontWeight: 'bold', color: '#BA0C2F' }}>{selectedKsake.period}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                    <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Coordinates:</span>
                    <span style={{ fontWeight: 'bold', color: '#78716C', fontFamily: 'monospace' }}>{selectedKsake.coords}</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', color: '#A8A29E', fontWeight: 'bold', letterSpacing: '0.1em' }}>Cultural Description</span>
                  <p style={{ margin: '2px 0 0 0', fontFamily: 'var(--jn-font-serif)', fontSize: '11px', lineHeight: '1.4', color: '#44403C', fontStyle: 'italic' }}>
                    "{selectedKsake.keepsakeDesc}"
                  </p>
                </div>

                {/* Circular entry stamp */}
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  right: '-10px',
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  border: '2px double rgba(186, 12, 47, 0.45)',
                  color: 'rgba(186, 12, 47, 0.55)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  pointerEvents: 'none',
                  fontFamily: 'var(--jn-font-sans)',
                  fontSize: '8px',
                  fontWeight: '950',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '4px',
                  boxSizing: 'border-box',
                  background: 'rgba(253, 251, 247, 0.85)',
                  boxShadow: '0 0 8px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '6px', borderBottom: '1px solid rgba(186,12,47,0.3)', paddingBottom: '1px', marginBottom: '2px' }}>ENTRY SEAL</div>
                  <div style={{ fontSize: '7px', fontWeight: 'black' }}>APPROVED</div>
                  <div style={{ fontSize: '5px', marginTop: '1px', color: 'rgba(186,12,47,0.45)' }}>BP-PASSPORT</div>
                </div>
              </div>
            </div>
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
                    playCampStampSound(soundVolume, soundMuted)
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

                  {/* Hint System */}
                  <div style={{ marginTop: '12px' }}>
                    {riddleHints[activeSpot.id] ? (
                      <div className="jn-insider-reveal" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#B45309', margin: 0, padding: '12px', borderRadius: '8px' }}>
                        <strong style={{ color: '#D97706', display: 'block', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}>💡 Clue:</strong>
                        <p style={{ margin: 0, fontStyle: 'italic', fontSize: '12px', lineHeight: '1.4' }}>
                          {riddleHints[activeSpot.id]}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestHint(activeSpot.id)}
                        disabled={hintLoading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--jn-crimson)',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fontFamily: 'var(--jn-font-sans)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          cursor: hintLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 0',
                          opacity: hintLoading ? 0.6 : 1
                        }}
                      >
                        {hintLoading ? '🧙‍♂️ Consulting elders...' : (purchasedItems['riddle-hint'] || 0) > 0 ? `📜 Use Clue Scroll (${purchasedItems['riddle-hint']} left)` : '✨ Request Hint (150 Fils)'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* AI GUIDE CHATBOT — Floating Action Button + Panel */}
      <>
        <button
          onClick={() => setChatOpen(v => !v)}
          aria-label={chatOpen ? 'Close AI Guide' : 'Open AI Guide'}
          className="fixed z-[200] w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border backdrop-blur-md hover:scale-105 active:scale-95"
          style={{
            bottom: fabBottom,
            right: '20px',
            background: chatOpen
              ? 'var(--color-text)'
              : 'rgba(250, 250, 249, 0.75)',
            borderColor: chatOpen
              ? 'var(--color-border)'
              : 'rgba(193, 18, 47, 0.2)',
            color: chatOpen ? 'var(--color-surface)' : 'var(--color-primary)',
            boxShadow: chatOpen
              ? '0 10px 30px rgba(0,0,0,0.15)'
              : '0 10px 25px rgba(193, 18, 47, 0.15)',
          }}
        >
          {chatOpen ? '✕' : <MessageSquare size={20} />}
        </button>

        {/* Chatbot panel — slides up when open */}
        {chatOpen && (
          <div
            className="fixed z-[199] w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-2xl shadow-stone-900/10"
            style={{
              bottom: panelBottom,
              right: '16px',
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


      {/* ⚡ Quick Info FAB */}
      {!chatOpen && (
        <button
          id="quick-info-fab"
          onClick={() => setQuickInfoOpen(true)}
          aria-label="Quick map & current spot info"
          title="Quick Info"
          style={{
            position: 'fixed',
            bottom: quickInfoBottom,
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
          <Zap size={18} />
        </button>
      )}

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

      {/* ── Print / Export Travelogue Output (Hidden on screen) ── */}
      <div className="jn-print-layout hidden print:block bg-white text-stone-900 p-8 font-sans">
        <div className="border-b-2 border-stone-800 pb-4 mb-6 text-center">
          <h1 className="text-3xl font-serif font-bold text-stone-950 tracking-tight">Bahrain Passage</h1>
          <p className="text-xs uppercase tracking-widest text-stone-600 font-semibold mt-1">Official Explorer Travelogue</p>
          <div className="flex justify-between items-center text-xs text-stone-500 mt-4 px-4 font-mono">
            <span>Explorer Rank: {rank.label} ({rank.arabic})</span>
            <span>Total XP: {xp}</span>
            <span>Unlocks: {(collectedKeepsakes || []).length} Keepsakes</span>
          </div>
        </div>

        <div className="space-y-8">
          {Array.from({ length: duration }, (_, i) => i + 1).map(dNum => {
            const daySpots = locations.filter(s => s.day === dNum)
            if (daySpots.length === 0) return null
            return (
              <div key={dNum} className="space-y-6" style={{ pageBreakBefore: dNum > 1 ? 'always' : 'auto' }}>
                <h2 className="text-xl font-serif font-bold border-b border-stone-300 pb-2 text-stone-800 uppercase tracking-wider">
                  Day {dNum} Itinerary
                </h2>
                
                <div className="space-y-6">
                  {daySpots.map(spot => {
                    const photo = capturedPhotos[spot.id]
                    const reflection = journalReflections[spot.id] || ''
                    const hasRiddle = solvedRiddles[spot.id]
                    return (
                      <div key={spot.id} className="jn-print-spot-card border border-stone-200 rounded-lg p-4 bg-stone-50/50 space-y-4" style={{ pageBreakInside: 'avoid' }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-serif font-semibold text-stone-950">
                              {spot.name}
                            </h3>
                            <p className="text-xs text-stone-500 font-mono">{spot.coords}</p>
                          </div>
                          {hasRiddle && (
                            <span className="text-[10px] uppercase font-bold text-stone-600 px-2 py-0.5 border border-stone-300 rounded bg-white">
                              ✓ Riddle Solved
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-stone-700 font-serif leading-relaxed">
                          {spot.desc}
                        </p>

                        {/* Photo if captured */}
                        {photo && (
                          <div className="max-w-md mx-auto border border-stone-350 p-2 bg-white rounded shadow-sm">
                            <img src={photo} alt={spot.name} className="w-full h-48 object-cover rounded" />
                            <p className="text-center text-[10px] text-stone-500 italic mt-1.5 font-serif">Wayfarer Lens Snapshot</p>
                          </div>
                        )}

                        {/* Reflections */}
                        <div className="space-y-1.5 pt-2 border-t border-stone-200">
                          <h5 className="text-xs uppercase font-extrabold tracking-wider text-stone-600">Journal Reflections:</h5>
                          <p className="text-sm text-stone-800 font-serif leading-relaxed italic bg-white p-3 border border-stone-200 rounded min-h-[50px] whitespace-pre-wrap">
                            {reflection.trim() || 'No reflection recorded for this landmark.'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
