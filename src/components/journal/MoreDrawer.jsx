import { useState, useEffect, useRef, useTransition } from 'react'
import { 
  Hotel, 
  Search as SearchIcon, 
  Gift, 
  BookOpen, 
  ArrowLeft, 
  Lock, 
  Volume2, 
  VolumeX,
  Zap, 
  Loader,
  Settings
} from 'lucide-react'
import { useVibe } from '../../hooks/useVibe'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import { spotsCatalog } from '../../hooks/useItinerary'
import { callLocalAI, buildSpotSearchPrompt } from '../../services/aiService'
import AIHotelPanel from '../AIHotelPanel'
import { playTypewriterClick, playPhrase } from '../../services/audioUtils'
import { fetchDatasetRecords } from '../../services/openDataService'
import { PHRASES } from '../../data/phrases'
import LangToggle from '../LangToggle'

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
    setSoundMuted,
    currentDayTab,
    itinerarySpots,
    setItinerarySpots
  } = useVibe()

  const { toast } = useToast()
  const [subView, setSubView] = useState(null) // null | 'hotels' | 'search' | 'artifacts' | 'phrases'

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [searchResults, setSearchResults] = useState(null)

  // Phrase search state
  const [phraseSearch, setPhraseSearch] = useState('')
  const [playingPhraseIdx, setPlayingPhraseIdx] = useState(null)

  // Archives states (Bahrain Open Data Portal)
  const [activeArchive, setActiveArchive] = useState({ id: 'temperature', label: '🌡️ Temperature', dataset: '02-average-minimum-and-maximum-temperature' })
  const [records, setRecords] = useState([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [errorRecords, setErrorRecords] = useState(null)

  const loadArchiveRecords = async (datasetId) => {
    setLoadingRecords(true)
    setErrorRecords(null)
    try {
      let params = { limit: 40 }
      if (datasetId === '02-average-minimum-and-maximum-temperature') {
        params.order_by = 'year desc, n asc'
      } else if (datasetId === '07-rainfall-in-by-month') {
        params.order_by = 'year desc, n asc'
      } else if (datasetId === '17-public-postal-mailboxes-by-zone') {
        params.order_by = 'year desc, zone asc'
      } else if (datasetId === '06-quantity-of-fish-landing-type-quantity-metric-ton') {
        params.order_by = 'year desc, quantity desc'
      }
      
      const data = await fetchDatasetRecords(datasetId, params)
      setRecords(data.results || [])
    } catch (err) {
      console.error('[Archives] Failed to load dataset records:', err.message)
      setErrorRecords(err.message || 'Failed to query open data portal.')
    } finally {
      setLoadingRecords(false)
    }
  }

  useEffect(() => {
    if (subView === 'archives' && activeArchive?.dataset) {
      loadArchiveRecords(activeArchive.dataset)
    }
  }, [subView, activeArchive])

  const renderTableHeaders = () => {
    if (activeArchive.id === 'temperature') {
      return (
        <>
          <th className="p-3 border-b border-stone-200">Year</th>
          <th className="p-3 border-b border-stone-200">Month</th>
          <th className="p-3 border-b border-stone-200">Indicator</th>
          <th className="p-3 border-b border-stone-200">Type</th>
          <th className="p-3 border-b border-stone-200 text-right">Value</th>
        </>
      )
    }
    if (activeArchive.id === 'rainfall') {
      return (
        <>
          <th className="p-3 border-b border-stone-200">Year</th>
          <th className="p-3 border-b border-stone-200">Month</th>
          <th className="p-3 border-b border-stone-200 text-right">Amount (mm)</th>
        </>
      )
    }
    if (activeArchive.id === 'postboxes') {
      return (
        <>
          <th className="p-3 border-b border-stone-200">Year</th>
          <th className="p-3 border-b border-stone-200">Zone</th>
          <th className="p-3 border-b border-stone-200 text-right">Active Postboxes</th>
        </>
      )
    }
    if (activeArchive.id === 'fish') {
      return (
        <>
          <th className="p-3 border-b border-stone-200">Year</th>
          <th className="p-3 border-b border-stone-200">Marine Landing Type</th>
          <th className="p-3 border-b border-stone-200 text-right">Metric Tons</th>
        </>
      )
    }
    return null
  }

  const renderTableCells = (r) => {
    if (activeArchive.id === 'temperature') {
      return (
        <>
          <td className="p-3 border-b border-stone-100 font-mono">{r.year}</td>
          <td className="p-3 border-b border-stone-100">{r.month}</td>
          <td className="p-3 border-b border-stone-100">{r.indicator}</td>
          <td className="p-3 border-b border-stone-100 text-stone-500">{r.sub_indicator}</td>
          <td className="p-3 border-b border-stone-100 text-right font-serif font-bold text-[var(--bp-primary)]">{r.value} {r.unit}</td>
        </>
      )
    }
    if (activeArchive.id === 'rainfall') {
      return (
        <>
          <td className="p-3 border-b border-stone-100 font-mono">{r.year}</td>
          <td className="p-3 border-b border-stone-100">{r.month}</td>
          <td className="p-3 border-b border-stone-100 text-right font-serif font-bold text-blue-600">{r.value} {r.unit || 'mm'}</td>
        </>
      )
    }
    if (activeArchive.id === 'postboxes') {
      return (
        <>
          <td className="p-3 border-b border-stone-100 font-mono">{r.year}</td>
          <td className="p-3 border-b border-stone-100">{r.zone}</td>
          <td className="p-3 border-b border-stone-100 text-right font-serif font-bold text-amber-700">{r.number}</td>
        </>
      )
    }
    if (activeArchive.id === 'fish') {
      return (
        <>
          <td className="p-3 border-b border-stone-100 font-mono">{r.year}</td>
          <td className="p-3 border-b border-stone-100 capitalize">{r.type?.toLowerCase()}</td>
          <td className="p-3 border-b border-stone-100 text-right font-serif font-bold text-emerald-700">{Math.round(r.quantity || 0).toLocaleString()} t</td>
        </>
      )
    }
    return null
  }


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
          parsed = {
            success: false,
            errorMsg: "We couldn't find this spot in our guidebook!"
          }
        }
      }

      if (parsed && parsed.success) {
        setSearchResults(parsed)
      } else {
        setSearchError(parsed.errorMsg || "We couldn't find this spot in our guidebook!")
        setSearchResults(null)
      }
    } catch (e) {
      setSearchError("Failed to search. Please check your connection.")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleAddSearchedSpot = (spot) => {
    const spotId = spot.id || `spot-${Math.random().toString(36).substr(2, 9)}`
    
    const CATEGORY_FALLBACK_IMAGES = {
      fort: '/assets/images/fort.jpg',
      souq: '/assets/images/souq.jpg',
      coast: '/assets/images/coast.jpg',
      modern: '/assets/images/modern.jpg',
      desert: '/assets/images/desert.jpg',
      culture: '/assets/images/culture.jpg',
      default: '/assets/images/fort.jpg'
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

            <div className="jn-mobile-settings-row gap-2 justify-center items-center bg-stone-100 p-2 rounded-xl border border-stone-200">
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSoundMuted(!soundMuted) }}
                className="flex-1 py-1.5 px-3 bg-white hover:bg-stone-50 text-stone-700 font-sans text-[11px] uppercase tracking-wider font-extrabold rounded-lg transition-colors border border-stone-200 flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                {soundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                {soundMuted ? 'Unmute' : 'Mute'}
              </button>
              <div className="flex-1 flex justify-center py-1 bg-[#C41E3A] rounded-lg border border-[#C41E3A]/10">
                <LangToggle />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* stays */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('hotels') }}
                className="more-drawer-card more-card-stay w-full flex flex-row items-center gap-4 p-5 rounded-2xl text-left cursor-pointer group col-span-2 shadow-2xs"
              >
                <div className="p-3.5 bg-amber-500/10 text-amber-700 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Hotel size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="font-serif text-base font-bold text-stone-900 leading-tight">Stay & Hotels</h4>
                  <p className="font-sans text-[11px] text-stone-500 leading-relaxed mt-1">Explore custom lodging options fitted to your vibe.</p>
                </div>
              </button>

              {/* search */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('search') }}
                className="more-drawer-card more-card-search w-full flex flex-col items-start p-4 bg-white border border-stone-200 rounded-2xl text-left cursor-pointer transition-all group col-span-1 shadow-2xs"
              >
                <div className="p-3 bg-cyan-500/10 text-cyan-700 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
                  <SearchIcon size={18} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-3 leading-tight">Spot Search</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Search Dilmun's historical archive with custom AI.</p>
              </button>

              {/* artifacts */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('artifacts') }}
                className="more-drawer-card more-card-artifacts w-full flex flex-col items-start p-4 bg-white border border-stone-200 rounded-2xl text-left cursor-pointer transition-all group col-span-1 shadow-2xs"
              >
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
                  <Gift size={18} />
                </div>
                <h4 className="font-serif text-sm font-bold text-stone-900 mt-3 leading-tight">Artifacts & Shop</h4>
                <p className="font-sans text-[10px] text-stone-500 leading-relaxed mt-1">Review keepsakes or exchange earned Fils for items.</p>
              </button>

              {/* phrasebook */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('phrases') }}
                className="more-drawer-card more-card-phrasebook w-full flex flex-row items-center gap-4 p-5 rounded-2xl text-left cursor-pointer group col-span-2 shadow-2xs"
              >
                <div className="p-3.5 bg-teal-500/10 text-teal-700 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
                  <BookOpen size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="font-serif text-base font-bold text-stone-900 leading-tight">Phrasebook</h4>
                  <p className="font-sans text-[11px] text-stone-500 leading-relaxed mt-1">Hear and learn traditional travel Arabic greetings.</p>
                </div>
              </button>

              {/* national archives */}
              <button 
                onClick={() => { playTypewriterClick(1.0, soundVolume, soundMuted); setSubView('archives') }}
                className="more-drawer-card more-card-archives w-full flex flex-row items-center gap-4 p-5 rounded-2xl text-left cursor-pointer group col-span-2 shadow-2xs"
              >
                <div className="p-3.5 bg-yellow-500/10 text-amber-800 rounded-xl group-hover:scale-105 transition-transform flex items-center justify-center">
                  <BookOpen size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-base font-bold text-stone-900 leading-tight">National Archives</h4>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full">
                      <span className="live-pulse-dot" />
                      Open Gateway
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-stone-500 leading-relaxed mt-1">Explore real-time data catalogs (Temperature, Rainfall, Mailboxes, Marine landings) directly from Bahrain's open portal.</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════ VIEW: HOTELS ════════════════════ */}
        {subView === 'hotels' && (
          <div className="subview-slide-in">
            {renderHeader('Stay & Hotels', 'الإقامة والفنادق')}
            <div className="space-y-4 pt-2">
              <AIHotelPanel moods={selectedMoods} tier={tier} duration={duration} autoLoad={true} />
            </div>
          </div>
        )}

        {/* ════════════════════ VIEW: SEARCH ════════════════════ */}
        {subView === 'search' && (
          <div className="subview-slide-in">
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
          <div className="subview-slide-in">
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
                    { id: 'saffron-halwa', name: 'Saffron Halwa Platters', emoji: '🍯', desc: 'Edible traditional sweet. Consume to earn XP.' },
                    { id: 'pearl-hook', name: 'Generational Oyster Hook', emoji: '🪝', desc: 'Historic diving tool for harvesting Basra Pearls.' },
                    { id: 'falcon-glove', name: 'Falconer Leather Glove', emoji: '🧤', desc: 'Premium leather glove for calling desert falcons.' }
                  ].map(item => {
                    const count = purchasedItems[item.id] || 0
                    if (count === 0) return null // Hide from inventory if not owned
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
          <div className="subview-slide-in">
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
                        onClick={() => {
                          setPlayingPhraseIdx(idx);
                          playPhrase(p.arabic, soundVolume, soundMuted, null, () => {
                            setPlayingPhraseIdx(null);
                          });
                        }}
                        className="w-full p-4 bg-white hover:bg-stone-50 border border-stone-200/60 rounded-xl text-left cursor-pointer flex justify-between items-center transition-colors group"
                      >
                        <div>
                          <h4 className="font-serif text-sm font-bold text-stone-900">
                            {p.label} <span className="font-sans text-xs text-[var(--bp-primary)] block md:inline font-normal mt-1 md:mt-0 md:ml-1.5" lang="ar">({p.arabic})</span>
                          </h4>
                          <p className="font-sans text-[11px] text-stone-500 mt-1">{p.desc}</p>
                        </div>
                        {playingPhraseIdx === idx ? (
                          <div className="phrase-wave-container">
                            <span className="phrase-wave-bar" />
                            <span className="phrase-wave-bar" />
                            <span className="phrase-wave-bar" />
                          </div>
                        ) : (
                          <Volume2 size={16} className="text-stone-400 group-hover:text-[var(--bp-primary)] transition-colors" />
                        )}
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

        {/* ════════════════════ VIEW: NATIONAL ARCHIVES ════════════════════ */}
        {subView === 'archives' && (
          <div className="subview-slide-in">
            {renderHeader('National Archives', 'الأرشيف الوطني والمؤشرات')}
            
            <div className="space-y-4">
              {/* Archive Selector (Segmented Slider Control) */}
              {(() => {
                const ARCHIVES_TABS = [
                  { id: 'temperature', label: '🌡️ Temp', dataset: '02-average-minimum-and-maximum-temperature' },
                  { id: 'rainfall', label: '🌧️ Rain', dataset: '07-rainfall-in-by-month' },
                  { id: 'postboxes', label: '📮 Post', dataset: '17-public-postal-mailboxes-by-zone' },
                  { id: 'fish', label: '🐟 Fish', dataset: '06-quantity-of-fish-landing-type-quantity-metric-ton' }
                ]
                const activeIdx = ARCHIVES_TABS.findIndex(t => t.id === activeArchive.id)

                return (
                  <div className="segmented-control-container mb-4">
                    <div 
                      className="segmented-control-slider" 
                      style={{
                        left: `calc(3px + ${(activeIdx * 100) / ARCHIVES_TABS.length}%)`,
                        width: `calc(${100 / ARCHIVES_TABS.length}% - 6px)`
                      }}
                    />
                    {ARCHIVES_TABS.map(arch => (
                      <button
                        key={arch.id}
                        onClick={() => {
                          playTypewriterClick(1.0, soundVolume, soundMuted);
                          setActiveArchive(arch);
                        }}
                        className={`segmented-control-btn ${activeArchive.id === arch.id ? 'active' : ''}`}
                      >
                        {arch.label}
                      </button>
                    ))}
                  </div>
                )
              })()}

              {/* Live Record List */}
              {loadingRecords ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <Loader className="w-6 h-6 animate-spin text-[var(--bp-primary)]" />
                  <p className="font-serif text-xs italic text-stone-500">Querying data.gov.bh gateway...</p>
                </div>
              ) : errorRecords ? (
                <div className="p-4 bg-red-50 text-red-800 text-xs rounded-2xl text-center font-bold">
                  Failed to fetch: {errorRecords}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-100/50 rounded-xl flex justify-between text-[10px] text-stone-500 font-sans border border-stone-200/40">
                    <span>Source: Open Data Portal (data.gov.bh)</span>
                    <span>{records.length} Records Loaded</span>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto border border-stone-200/80 rounded-2xl bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="bg-stone-50 text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider text-[9px]">
                          {renderTableHeaders()}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/30 text-stone-700">
                            {renderTableCells(r)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}



      </div>
    </div>
  )
}
