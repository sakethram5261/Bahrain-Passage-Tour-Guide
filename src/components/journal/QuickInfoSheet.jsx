import { Compass, Map, Sparkles, Navigation, Plus, Check, X } from 'lucide-react'
import { useVibe } from '../../hooks/useVibe'
import { useToast } from '../../context/ToastContext'

const CATEGORY_FALLBACK_IMAGES = {
  fort: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG',
  souq: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Manama_Bab_al-Bahrain_Souq_1.jpg',
  coast: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  modern: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Manama_Bahrain_World_Trade_Centre_04.jpg',
  desert: 'https://upload.wikimedia.org/wikipedia/commons/4/42/2010-03_Tree_of_Life_Bahrain.jpg',
  culture: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Manama_Bahrain_National_Museum_Exterior_1.jpg',
  default: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Bahrain_Fort_March_2015.JPG'
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

  const toast = useToast()

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
        zIndex: 900,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) setQuickInfoOpen(false) }}
    >
      {/* Backdrop scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,11,0.65)', backdropFilter: 'blur(5px)' }} />

      {/* Sheet */}
      <div 
        className="glass-sheet-content relative z-10 w-full max-w-[560px] bg-[#FAF9F6e0] rounded-t-3xl p-6 pb-10 shadow-2xl animate-slideUpFade"
        style={{
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category top accent line */}
        <div className="quick-info-accent" style={{ backgroundColor: accentColor }} />

        {/* Drag Handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300/80 mx-auto mb-5" />

        {/* Close Button */}
        <button
          onClick={() => setQuickInfoOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-stone-200/50 hover:bg-stone-200/80 text-stone-600 cursor-pointer transition-colors border border-stone-300/20"
          aria-label="Close details"
        >
          <X size={15} />
        </button>

        {/* Header Block */}
        <div className="animate-fade-up mb-4 text-left" style={{ animationDelay: '0s' }}>
          <p style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accentColor, fontWeight: 800, margin: '0 0 6px' }}>
            Quick Info · Day {currentDayTab}
          </p>
          <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 24, fontWeight: 800, color: '#2A2321', margin: 0, lineHeight: 1.25 }}>
            {lang === 'ar' && activeSpot.arabic ? activeSpot.arabic : activeSpot.name}
          </h2>
          {lang === 'ar' && activeSpot.arabic && (
            <p style={{ fontFamily: 'sans-serif', fontSize: 13, color: 'rgba(92,84,81,0.6)', margin: '4px 0 0' }}>
              {activeSpot.name}
            </p>
          )}
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-2 mb-5 animate-fade-up text-left" style={{ animationDelay: '0.08s' }}>
          {activeSpot.coords && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] font-sans font-bold text-stone-700">
              <Navigation size={10} className="text-stone-500" />
              {activeSpot.coords}
            </span>
          )}
          {(activeSpot.pathCost || activeSpot.budgetCost) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-sans font-bold text-emerald-800">
              {activeSpot.pathCost || activeSpot.budgetCost}
            </span>
          )}
          {activeSpot.category && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-sans font-bold capitalize" style={{ backgroundColor: `${accentColor}12`, border: `1px solid ${accentColor}25`, color: accentColor }}>
              {activeSpot.category}
            </span>
          )}
        </div>

        {/* Description Text */}
        {activeSpot.simpleTerms && (
          <div className="animate-fade-up text-left mb-5" style={{ animationDelay: '0.16s' }}>
            <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 14, fontStyle: 'italic', color: '#5C5451', lineHeight: 1.7, margin: 0 }}>
              {activeSpot.simpleTerms}
            </p>
          </div>
        )}

        {/* Premium Insider Tip Section */}
        {activeSpot.insider && (
          <div 
            className="p-4 rounded-xl border-l-[4px] bg-amber-500/5 mb-6 text-left flex gap-3 animate-fade-up"
            style={{ 
              borderColor: '#D4AF37',
              animationDelay: '0.24s'
            }}
          >
            <div className="mt-0.5 text-amber-600">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block mb-1">
                Insider Secret
              </span>
              <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontStyle: 'italic', color: '#3A3230', lineHeight: 1.6, margin: 0 }}>
                {activeSpot.insider}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons Block */}
        <div className="flex gap-3 animate-fade-up" style={{ animationDelay: '0.32s' }}>
          {activeSpot.coords && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(activeSpot.name + ' Bahrain')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--bp-primary)] to-[var(--bp-primary-dark)] text-white text-xs font-bold uppercase tracking-wider text-center no-underline hover:opacity-95 active:scale-98 transition-all shadow-md shadow-red-900/10"
            >
              <Navigation size={13} />
              Directions
            </a>
          )}
          
          <button
            onClick={() => { setMapOpen(true); setQuickInfoOpen(false) }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 text-xs font-bold uppercase tracking-wider text-center cursor-pointer active:scale-98 transition-all"
          >
            <Map size={13} className="text-stone-500" />
            Open Map
          </button>

          <button
            onClick={handleAddSpotToRoute}
            disabled={isOnRoute}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all ${
              isOnRoute 
                ? 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98 shadow-md shadow-emerald-900/10'
            }`}
          >
            {isOnRoute ? <Check size={13} /> : <Plus size={13} />}
            {isOnRoute ? 'On Route' : 'Add to Route'}
          </button>
        </div>
      </div>
    </div>
  )
}
