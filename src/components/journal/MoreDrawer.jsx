import { useState, useEffect, useRef, useTransition } from 'react'
import { 
  Hotel, 
  Search as SearchIcon, 
  Gift, 
  BookOpen, 
  ArrowLeft, 
  Lock, 
  Volume2, 
  Zap, 
  Loader 
} from 'lucide-react'
import { useVibe } from '../../hooks/useVibe'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { spotsCatalog } from '../../hooks/useItinerary'
import { callLocalAI, buildSpotSearchPrompt } from '../../services/aiService'
import AIHotelPanel from '../AIHotelPanel'
import { playTypewriterClick } from '../../services/audioUtils'

// Traditional Oud pluck synthesizer
function playOudPluck(soundVolume = 0.5, soundMuted = false) {
  if (soundMuted || soundVolume === 0) return
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    osc1.type = 'sawtooth'
    osc2.type = 'triangle'
    
    const baseFreq = 146.83 // D3 note, warm Oud string course
    osc1.frequency.value = baseFreq
    osc2.frequency.value = baseFreq + 1.5
    
    filter.type = 'lowpass'
    filter.frequency.value = 800
    filter.Q.value = 2.5
    
    const now = ctx.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(soundVolume * 0.38, now + 0.008)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.1)
    
    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 1.2)
    osc2.stop(now + 1.2)
  } catch (e) {
    console.error('Failed to play synthesized Oud pluck:', e)
  }
}

function playPhrase(phraseText, soundVolume = 0.5, soundMuted = false) {
  playOudPluck(soundVolume, soundMuted)
  setTimeout(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(phraseText)
        utterance.lang = 'ar-BH'
        
        const voices = window.speechSynthesis.getVoices()
        const arabicVoice = voices.find(v => v.lang.startsWith('ar'))
        if (arabicVoice) {
          utterance.voice = arabicVoice
        }
        utterance.volume = soundVolume
        window.speechSynthesis.speak(utterance)
      }
    } catch (e) {
      console.error('Phrase TTS speech synthesis error:', e)
    }
  }, 120)
}

const PHRASES = [
  { label: 'Karak',  arabic: 'كَرَّكْ',  desc: "Bahrain's signature robust spiced condensed-milk tea." },
  { label: 'Halwa',  arabic: 'حَلْوَى', desc: 'Saffron sweet jelly cooked in copper vats with almonds.' },
  { label: 'Souq',   arabic: 'سُوقْ',   desc: 'Ancient maze-like merchant alleyways of Old Manama.' },
  { label: 'Dallah', arabic: 'دَلَّهْ', desc: 'Long-beaked brass coffee pot used to brew Arabic coffee.' },
  { label: 'Marhaba',arabic: 'مَرْحَبَاً',desc: 'Welcome / Hello — the warmest Bahraini greeting.' },
  { label: 'Shukran',arabic: 'شُكْرَاً', desc: 'Thank you — essential courtesy in any market.' },
]

export default function MoreDrawer({ isOpen, onClose, onOpenKiosk, onOpenKeepsake }) {
  const { 
    selectedMoods, 
    tier, 
    duration, 
    goldFils, 
    collectedKeepsakes, 
    purchasedItems, 
    setPurchasedItems, 
    awardXP, 
    soundVolume, 
    soundMuted,
    currentDayTab,
    itinerarySpots,
    setItinerarySpots
  } = useVibe()

  const toast = useToast()
  const [subView, setSubView] = useState(null) // null | 'hotels' | 'search' | 'artifacts' | 'phrases'

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)

  // Phrase search state
  const [phraseSearch, setPhraseSearch] = useState('')

  if (!isOpen) return null

  // Search submit
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    setSearchResults(null)
    playTypewriterClick(1.0, soundVolume, soundMuted)

    try {
      const { system, user } = buildSpotSearchPrompt(searchQuery)
      let responseText = null
      try {
        responseText = await callLocalAI(system, user, '', { maxTokens: 800, useJson: true })
      } catch (err) {
        console.warn("AI search offline, falling back to local catalog:", err)
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

      if (!parsed || !parsed.success) {
        const queryClean = searchQuery.toLowerCase().trim()
        let matchedSpot = spotsCatalog.find(s => 
          s.name.toLowerCase().includes(queryClean) || 
          s.arabic.includes(queryClean)
        )
        if (!matchedSpot) {
          matchedSpot = spotsCatalog.find(s => s.desc.toLowerCase().includes(queryClean))
        }

        if (matchedSpot) {
          parsed = {
            success: true,
            id: matchedSpot.id,
            name: matchedSpot.name,
            arabic: matchedSpot.arabic,
            desc: matchedSpot.desc,
            coords: matchedSpot.coords,
            hours: 'Open daily 9:00 AM - 6:00 PM',
            cost: matchedSpot.budgetCost || 'Free Entry',
            insider: matchedSpot.insider,
            category: matchedSpot.category,
            period: matchedSpot.period
          }
        } else {
          // Dynamic Local Spot Generator
          parsed = {
            success: true,
            name: searchQuery.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            arabic: 'معلم محلي',
            desc: 'A notable landmark in Bahrain, appreciated for its cultural representation and local interest.',
            coords: '26.2285° N, 50.5860° E',
            hours: 'Open daily 9:00 AM - 7:00 PM',
            cost: 'Free Entry',
            insider: 'Great site to visit around sunset for beautiful photography.',
            category: 'culture',
            period: 'Modern Era'
          }
        }
      }

      setSearchResults(parsed)
    } catch (e) {
      setSearchError("Failed to search. Please check your connection.")
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
      simpleTerms: spot.simpleTerms || `What this offers: ${spot.desc}`,
      insider: spot.insider || 'Enjoy exploring this beautiful landmark.',
      pathGuide: `Directions: ${spot.where || spot.coords || 'Bahrain'}. Opening hours: ${spot.hours || 'Open daily'}`,
      pathCost: spot.cost || 'Free Entry',
      image: spot.image || CATEGORY_FALLBACK_IMAGES[spot.category?.toLowerCase()] || CATEGORY_FALLBACK_IMAGES.default,
      day: currentDayTab,
      category: spot.category || 'culture'
    }
    
    setItinerarySpots(prev => {
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

  // Render sub-view header
  const renderHeader = (title, arabicTitle) => (
    <div className="flex items-center gap-3 border-b border-stone-200/80 pb-4 mb-4">
      <button 
        onClick={() => {
          playTypewriterClick(0.9, soundVolume, soundMuted)
          setSubView(null)
        }}
        className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
        aria-label="Back to More Menu"
      >
        <ArrowLeft size={16} />
      </button>
      <div>
        <span className="text-[10px] uppercase tracking-wider text-[var(--bp-primary)] font-bold">{arabicTitle}</span>
        <h3 className="font-serif text-lg font-bold text-stone-900 leading-tight">{title}</h3>
      </div>
    </div>
  )

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop scrim */}
      <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity duration-300" />

      {/* Frosted Glass Bottom Sheet */}
      <div 
        className="relative z-10 w-full max-w-lg bg-[#FAF9F6] rounded-t-3xl shadow-2xl p-6 pb-12 animate-slideUpFade"
        style={{ maxHeight: '82vh', overflowY: 'auto' }}
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-5" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-sm font-bold p-1 bg-stone-100 rounded-full w-6 h-6 flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* ════════════════════ VIEW: MENU ════════════════════ */}
        {subView === null && (
          <div className="space-y-6">
            <div className="text-center md:text-left border-b border-stone-200/80 pb-4">
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#C4A265]">المزيد من الخدمات</span>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-0.5">Explore More</h2>
              <p className="text-xs text-stone-500 mt-1">Access AI stays, spot search, regional keepsakes and local phrasebook</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* stays */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('hotels') }}
                className="flex flex-col items-start p-4 bg-white hover:bg-stone-50 border border-stone-200/60 hover:border-stone-300 rounded-2xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div className="p-3 bg-red-50 text-[var(--bp-primary)] rounded-xl group-hover:scale-105 transition-transform">
                  <Hotel size={20} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-4">Stay & Hotels</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Explore custom lodging options fitted to your vibe.</p>
              </button>

              {/* search */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('search') }}
                className="flex flex-col items-start p-4 bg-white hover:bg-stone-50 border border-stone-200/60 hover:border-stone-300 rounded-2xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div className="p-3 bg-red-50 text-[var(--bp-primary)] rounded-xl group-hover:scale-105 transition-transform">
                  <SearchIcon size={20} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-4">Spot Search</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Search Dilmun's historical archive with custom AI.</p>
              </button>

              {/* artifacts */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('artifacts') }}
                className="flex flex-col items-start p-4 bg-white hover:bg-stone-50 border border-stone-200/60 hover:border-stone-300 rounded-2xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div className="p-3 bg-red-50 text-[var(--bp-primary)] rounded-xl group-hover:scale-105 transition-transform">
                  <Gift size={20} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-4">Artifacts & Shop</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Review keepsakes or exchange earned Fils for equipment.</p>
              </button>

              {/* phrasebook */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('phrases') }}
                className="flex flex-col items-start p-4 bg-white hover:bg-stone-50 border border-stone-200/60 hover:border-stone-300 rounded-2xl text-left cursor-pointer transition-all duration-200 group"
              >
                <div className="p-3 bg-red-50 text-[var(--bp-primary)] rounded-xl group-hover:scale-105 transition-transform">
                  <BookOpen size={20} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-4">Phrasebook</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Hear and learn traditional travel Arabic greetings.</p>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ VIEW: HOTELS ════════════════════ */}
        {subView === 'hotels' && (
          <div>
            {renderHeader('Stay & Hotels', 'الإقامة والفنادق')}
            <div className="space-y-4 pt-2">
              <AIHotelPanel moods={selectedMoods} tier={tier} duration={duration} autoLoad={true} />
            </div>
          </div>
        )}

        {/* ════════════════════ VIEW: SEARCH ════════════════════ */}
        {subView === 'search' && (
          <div>
            {renderHeader('Spot Search', 'البحث عن معالم')}
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit() }}
                  placeholder="Search landmark (e.g. Al Fateh Mosque, Bu Maher Fort)..."
                  className="flex-1 px-4 py-2.5 text-xs font-sans bg-white border border-stone-200 focus:border-red-500 rounded-xl text-stone-900 outline-none placeholder-stone-400 shadow-2xs"
                />
                <button
                  onClick={handleSearchSubmit}
                  disabled={searchLoading}
                  className="px-5 bg-gradient-to-r from-[var(--bp-primary)] to-[var(--bp-primary-dark)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {searchLoading ? 'Searching' : 'Search'}
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex gap-1.5 flex-wrap items-center">
                <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Examples:</span>
                {[
                  { label: '🕌 Al Fateh Mosque', val: 'Al Fateh Grand Mosque' },
                  { label: '🏎️ BIC Formula 1', val: 'Bahrain International Circuit' },
                  { label: '🪵 Bu Maher Fort', val: 'Bu Maher Fort' }
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => {
                      setSearchQuery(item.val)
                      // Small delay to auto trigger click
                      setTimeout(() => { handleSearchSubmit() }, 100)
                    }}
                    className="text-[10px] font-bold px-3 py-1 rounded-full border border-stone-200/80 bg-white text-stone-800 hover:border-red-500 hover:bg-red-50/30 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {searchLoading && (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <Loader className="w-6 h-6 animate-spin text-[var(--bp-primary)]" />
                  <p className="font-serif text-xs italic text-stone-500">Consulting cultural archives for details...</p>
                </div>
              )}

              {/* Error */}
              {searchError && (
                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-100 text-center font-bold">
                  ⚠️ {searchError}
                </div>
              )}

              {/* Results */}
              {searchResults && (
                <div className="glass-card rounded-2xl p-5 space-y-3 shadow-2xs">
                  <div className="border-b border-stone-100 pb-2">
                    <span className="font-mono text-[9px] text-[var(--bp-primary)] uppercase tracking-wider block">
                      {searchResults.coords} • {searchResults.period || 'Ancient Era'}
                    </span>
                    <h4 className="font-serif text-lg font-bold text-stone-900 mt-1">{searchResults.name}</h4>
                  </div>
                  <p className="font-serif text-xs italic text-stone-700 leading-relaxed">"{searchResults.desc}"</p>
                  {searchResults.insider && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider text-amber-700 font-bold block">Insider Secret:</span>
                      <p className="font-sans text-xs text-stone-800 mt-0.5">{searchResults.insider}</p>
                    </div>
                  )}
                  {searchResults.coords && (
                    <div className="flex flex-col gap-2">
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(searchResults.name + ' Bahrain')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--bp-primary)] to-[var(--bp-primary-dark)] text-white text-xs font-bold uppercase tracking-wider justify-center"
                      >
                        Get Directions
                      </a>
                      <button
                        onClick={() => handleAddSearchedSpot(searchResults)}
                        className="w-full py-2.5 rounded-xl bg-[var(--bp-primary)] hover:bg-[#a3162c] text-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                      >
                        Add to Day {currentDayTab} Route
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ VIEW: ARTIFACTS ════════════════════ */}
        {subView === 'artifacts' && (
          <div>
            {renderHeader('Artifacts & Shop', 'التحف والمعرض')}
            
            <div className="space-y-5">
              {/* Fils bar */}
              <div className="p-4 bg-white border border-stone-200/80 rounded-2xl flex justify-between items-center shadow-2xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold block">Your Balance</span>
                  <span className="font-serif text-lg font-bold text-stone-900 mt-0.5">{(goldFils || 0).toLocaleString()} Fils</span>
                </div>
                <button 
                  onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); onOpenKiosk() }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Enter Shop Kiosk
                </button>
              </div>

              {/* Keepsakes cabinet */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C4A265] font-bold block mb-3">Cabinet of Heritage Keepsakes</span>
                <div className="grid grid-cols-5 gap-3">
                  {spotsCatalog.map((spot, sIdx) => {
                    const unlocked = (collectedKeepsakes || []).includes(spot.id)
                    return (
                      <button
                        key={spot.id}
                        disabled={!unlocked}
                        onClick={() => {
                          if (unlocked) {
                            playTypewriterClick(1.0, soundVolume, soundMuted)
                            onOpenKeepsake(spot)
                          }
                        }}
                        title={unlocked ? spot.keepsakeName : 'Locked'}
                        className={`aspect-square rounded-2xl flex items-center justify-center border cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          unlocked 
                            ? 'border-amber-400 bg-amber-50 text-2xl shadow-2xs' 
                            : 'border-stone-200 bg-stone-100/50 text-stone-400'
                        }`}
                      >
                        {unlocked ? (
                          <span>{spot.keepsakeEmoji}</span>
                        ) : (
                          <Lock size={14} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Equipment list */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C4A265] font-bold block mb-3">Purchased Equipment</span>
                <div className="space-y-2">
                  {[
                    { id: 'riddle-hint', name: 'Riddle Scroll Clue', emoji: '📜', desc: 'Exchanges for a cryptic hint on localized challenges.' },
                    { id: 'saffron-halwa', name: 'Saffron Halwa Platters', emoji: '🍬', desc: 'Edible traditional sweet. Consume to earn XP.' }
                  ].map(item => {
                    const count = purchasedItems[item.id] || 0
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-stone-200/60 rounded-xl shadow-3xs">
                        <div className="flex gap-3">
                          <span className="text-xl">{item.emoji}</span>
                          <div className="text-left">
                            <h5 className="font-serif text-xs font-bold text-stone-900">{item.name}</h5>
                            <p className="font-sans text-[10px] text-stone-500 max-w-[200px] mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-lg border border-stone-200">
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
                                toast.success("Mmm! Sweet cardamom and saffron halwa consumed! (+25 XP)")
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-sans text-[10px] uppercase font-bold rounded-lg cursor-pointer transition-colors"
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
          </div>
        )}

        {/* ════════════════════ VIEW: PHRASEBOOK ════════════════════ */}
        {subView === 'phrases' && (
          <div>
            {renderHeader('Phrasebook', 'المصطلحات والعبارات')}

            <div className="space-y-4">
              {/* Phrase search bar */}
              <input
                type="text"
                value={phraseSearch}
                onChange={(e) => setPhraseSearch(e.target.value)}
                placeholder="Search phrases (e.g. karak, hello, halwa)..."
                className="w-full px-4 py-2.5 text-xs font-sans bg-white border border-stone-200 focus:border-red-500 rounded-xl text-stone-900 outline-none placeholder-stone-400 shadow-2xs"
              />

              {/* Phrase list */}
              {(() => {
                const query = phraseSearch.toLowerCase().trim()
                const filtered = PHRASES.filter(p => 
                  !query || 
                  p.label.toLowerCase().includes(query) ||
                  p.arabic.includes(query)
                )

                if (filtered.length === 0) {
                  return <div className="text-center py-6 text-stone-400 font-sans text-xs italic">No phrases found.</div>
                }

                return (
                  <div className="space-y-2">
                    {filtered.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => playPhrase(p.arabic, soundVolume, soundMuted)}
                        className="w-full p-4 bg-white hover:bg-stone-50 border border-stone-200/60 rounded-xl text-left cursor-pointer flex justify-between items-center transition-colors group"
                      >
                        <div>
                          <h4 className="font-serif text-sm font-bold text-stone-900">
                            {p.label} <span className="font-sans text-xs text-[var(--bp-primary)] block md:inline font-normal mt-1 md:mt-0 md:ml-1.5" lang="ar">({p.arabic})</span>
                          </h4>
                          <p className="font-sans text-[11px] text-stone-500 mt-1">{p.desc}</p>
                        </div>
                        <Volume2 size={16} className="text-stone-400 group-hover:text-[var(--bp-primary)] transition-colors" />
                      </button>
                    ))}
                  </div>
                )
              })()}

              {/* Pronunciation guide */}
              <div className="p-4 bg-stone-100/50 border border-stone-200/60 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[#C4A265] font-bold block">🗣️ Pronunciation Rules</span>
                
                <div className="text-xs space-y-2 text-stone-600">
                  <p><strong>The "Kh" (خ):</strong> Soft raspy throat sound, like the Scottish "loch". Example: <em>Khubz</em> (bread).</p>
                  <p><strong>The "G" (ق):</strong> Gulf dialect pronounces "Qaf" as a hard "G". Example: <em>Qal'at</em> → <em>Gal-at</em>.</p>
                  <p><strong>Double Vowels:</strong> Elongate vowel sounds organically. Example: <em>Habeebee</em> flows.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
