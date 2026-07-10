import { Compass, Map, Sparkles, Navigation, Plus, Check, X } from 'lucide-react'
import { useVibe } from '../../hooks/useVibe'
import { useToast } from '../../context/ToastContext'

const CATEGORY_FALLBACK_IMAGES = {
  fort: '/assets/images/fort.jpg',
  souq: '/assets/images/souq.jpg',
  coast: '/assets/images/coast.jpg',
  modern: '/assets/images/modern.jpg',
  desert: '/assets/images/desert.jpg',
  culture: '/assets/images/culture.jpg',
  default: '/assets/images/fort.jpg'
}

const CATEGORY_ACCENT_COLORS = {
  fort: '#BA0C2F',      // Deep Red
  souq: '#C4A265',      // Oud Amber/Gold
  coast: '#0D9488',     // Teal Coast
  modern: '#0E7490',    // Cyan Modern
  desert: '#D97706',    // Desert Amber
  culture: '#8B5A4B'    // Terracotta
}

export default function QuickInfoSheet({
  quickInfoOpen,
  activeSpot,
  currentDayTab,
  lang,
  setQuickInfoOpen,
  setMapOpen
}) {
  if (!quickInfoOpen || !activeSpot) return null

  const {
    itinerarySpots,
    setItinerarySpots,
    awardXP,
    soundVolume,
    soundMuted
  } = useVibe()

  const { toast } = useToast()

  const category = activeSpot.category?.toLowerCase() || 'culture'
  const accentColor = CATEGORY_ACCENT_COLORS[category] || CATEGORY_ACCENT_COLORS.culture

  const isOnRoute = (itinerarySpots || []).some(
    s => s.name === activeSpot.name && s.day === currentDayTab
  )

  const handleAddSpotToRoute = () => {
    if (isOnRoute) return

    const spotId = activeSpot.id || `spot-${Math.random().toString(36).substr(2, 9)}`
    const newSpot = {
      id: spotId,
      name: activeSpot.name,
      arabic: activeSpot.arabic || 'معلم بحريني',
      mood: activeSpot.mood || category,
      coords: activeSpot.coords || '26.2° N, 50.6° E',
      period: activeSpot.period || 'Modern Era',
      desc: activeSpot.desc || activeSpot.simpleTerms || '',
      simpleTerms: activeSpot.simpleTerms || `What this offers: ${activeSpot.desc}`,
      insider: activeSpot.insider || 'Enjoy exploring this beautiful landmark.',
      pathGuide: `Directions: ${activeSpot.coords || 'Bahrain'}. Opening hours: Open daily`,
      pathCost: activeSpot.pathCost || activeSpot.budgetCost || 'Free Entry',
      image: activeSpot.image || CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.default,
      day: currentDayTab,
      category: category
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

    awardXP(20, `Added ${activeSpot.name} to Route`)
    toast.success(`Successfully added ${activeSpot.name} to Day ${currentDayTab} route!`)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick info: ${activeSpot.name}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) setQuickInfoOpen(false) }}
      className="p-0 sm:p-4"
    >
      {/* Backdrop scrim */}
      <div 
        style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,11,0.7)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }} 
        onClick={() => setQuickInfoOpen(false)}
      />

      {/* Sheet Container */}
      <div 
        className="relative z-10 w-full sm:max-w-[480px] bg-[#FAF9F6] sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden border border-stone-200/80 animate-slideUpFade"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 -10px 50px rgba(0,0,0,0.22)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Paper Grain Background Texture */}
        <div className="absolute inset-0 paper-grain pointer-events-none opacity-[0.035] mix-blend-multiply" />

        {/* Hero Banner Image */}
        <div className="relative h-[210px] w-full overflow-hidden shrink-0">
          <img 
            src={activeSpot.image || CATEGORY_FALLBACK_IMAGES[category] || CATEGORY_FALLBACK_IMAGES.default}
            alt={activeSpot.name}
            className="w-full h-full object-cover filter brightness-[0.82] sepia-[0.10]"
          />
          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          {/* Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accentColor }} />

          {/* Close FAB */}
          <button
            onClick={() => setQuickInfoOpen(false)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/65 text-white transition-colors cursor-pointer border border-white/10 z-20"
            aria-label="Close details"
          >
            <X size={14} />
          </button>

          {/* Overlaid Title & Eyebrow */}
          <div className="absolute bottom-4 left-5 right-5 text-left text-white">
            <span 
              className="inline-block px-2.5 py-0.5 rounded text-[8px] uppercase tracking-[0.2em] font-extrabold mb-1.5"
              style={{ backgroundColor: `${accentColor}d0`, color: '#fff' }}
            >
              {category}
            </span>
            <h2 className="font-serif text-2xl font-black leading-tight tracking-wide drop-shadow-sm">
              {lang === 'ar' && activeSpot.arabic ? activeSpot.arabic : activeSpot.name}
            </h2>
            {lang === 'ar' && activeSpot.arabic && (
              <p className="text-[10px] text-stone-300 font-sans tracking-wide mt-0.5">
                {activeSpot.name}
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-left flex-1" style={{ scrollbarWidth: 'thin' }}>
          
          {/* Metric Grid Cards */}
          <div className="grid grid-cols-2 gap-3">
            {activeSpot.coords && (
              <div className="p-3 rounded-xl bg-stone-100/60 border border-stone-200/50 flex items-center gap-2.5">
                <Navigation size={12} className="text-stone-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] uppercase tracking-wider text-stone-400 font-bold block">Coordinates</span>
                  <span className="text-[10px] font-mono font-bold text-stone-700 block truncate">{activeSpot.coords}</span>
                </div>
              </div>
            )}

            {(activeSpot.pathCost || activeSpot.budgetCost) && (
              <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/65 flex items-center gap-2.5">
                <Plus size={12} className="text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[8px] uppercase tracking-wider text-emerald-600/80 font-bold block">Admission Fee</span>
                  <span className="text-[10px] font-sans font-bold text-emerald-800 block truncate">
                    {activeSpot.pathCost || activeSpot.budgetCost}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Simple Glance Description */}
          {activeSpot.simpleTerms && (
            <div className="space-y-1">
              <span className="text-[8px] uppercase tracking-widest text-[#C4A265] font-bold block">Glance Overview</span>
              <p className="font-serif text-sm leading-relaxed text-stone-850 italic border-l-2 pl-3" style={{ borderColor: accentColor }}>
                {activeSpot.simpleTerms}
              </p>
            </div>
          )}

          {/* Vintage Insider Secret Note */}
          {activeSpot.insider && (
            <div 
              className="p-4 rounded-xl border border-dashed border-amber-600/30 bg-[#FFFBEB] relative overflow-hidden"
              style={{
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.02)'
              }}
            >
              <div className="absolute -bottom-3 -right-3 text-amber-700/10 pointer-events-none select-none">
                <Sparkles size={64} />
              </div>

              <div className="flex gap-3 relative z-10">
                <div className="mt-0.5 text-amber-700 shrink-0">
                  <Sparkles size={14} />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-900 block mb-1">
                    Heritage Insider Secret
                  </span>
                  <p className="font-serif text-xs italic text-amber-950 leading-relaxed">
                    {activeSpot.insider}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/50 flex gap-2.5 shrink-0 rounded-b-3xl">
          {activeSpot.coords && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(activeSpot.name + ' Bahrain')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-[var(--bp-primary)] to-[var(--bp-primary-dark)] text-white text-[10px] font-bold uppercase tracking-wider text-center no-underline hover:opacity-95 active:scale-98 transition-all shadow-md shadow-red-900/10"
            >
              <Navigation size={12} />
              Directions
            </a>
          )}
          
          <button
            onClick={() => { setMapOpen(true); setQuickInfoOpen(false) }}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer active:scale-98 transition-all border-solid"
          >
            <Map size={12} className="text-stone-500" />
            Open Map
          </button>

          <button
            onClick={handleAddSpotToRoute}
            disabled={isOnRoute}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center transition-all ${
              isOnRoute 
                ? 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98 shadow-md shadow-emerald-900/10 border-none'
            }`}
          >
            {isOnRoute ? <Check size={12} /> : <Plus size={12} />}
            {isOnRoute ? 'On Route' : 'Add to Route'}
          </button>
        </div>

      </div>
    </div>
  )
}
