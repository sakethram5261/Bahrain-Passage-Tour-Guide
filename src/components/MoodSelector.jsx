import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { ArrowLeft, Landmark, Waves, Coffee, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'

const MOODS = [
  {
    id: 'empires',
    label: 'Empires',
    arabic: 'الإمبراطوريات',
    tagline: 'Ancient archaeological forts, temples & 5,000-year history',
    icon: Landmark,
    spots: ["Qal'at al-Bahrain", 'Barbar Temple', 'Arad Fort', 'Riffa Fort'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M0,30 L30,0 L60,30 L30,60 Z' stroke='%238B5A4B' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M0,30 L30,0 L60,30 L30,60 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'sea',
    label: 'Sea',
    arabic: 'البحر',
    tagline: 'Refined pearls, coastal tides & disappearing sandbanks',
    icon: Waves,
    spots: ['Pearling Path UNESCO', 'Jarada Sandbank', 'Al Dar Islands', 'Sea Ferry'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'><path d='M0,20 Q15,5 30,20 T60,20 M0,30 Q15,15 30,30 T60,30' stroke='%231a5276' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'><path d='M0,20 Q15,5 30,20 T60,20 M0,30 Q15,15 30,30 T60,30' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'spice',
    label: 'Spice',
    arabic: 'التوابل',
    tagline: 'Authentic souqs, traditional karak & saffron delicacies',
    icon: Coffee,
    spots: ['Manama Souq', 'Muharraq Alleyways', "Haji's Cafe", "A'ali Pottery"],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><path d='M25,2 C38,2 48,12 48,25 L48,48 L2,48 L2,25 C2,12 12,2 25,2 Z' stroke='%238B6914' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><path d='M25,2 C38,2 48,12 48,25 L48,48 L2,48 L2,25 C2,12 12,2 25,2 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'lights',
    label: 'Lights',
    arabic: 'الأضواء',
    tagline: 'Sophisticated arts, dining & modern cityscape',
    icon: Sparkles,
    spots: ['Block 338 Adliya', 'Reef Island', 'La Fontaine Arts', 'Night Skyline'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20,2 L23,15 L38,18 L23,21 L20,38 L17,21 L2,18 L17,15 Z' stroke='%231a3a5c' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20,2 L23,15 L38,18 L23,21 L20,38 L17,21 L2,18 L17,15 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
]

export default function MoodSelector({ onConfirm, onBack }) {
  const { selectedMoods, setSelectedMoods, duration, setDuration, quickStart } = useVibe()

  const containerRef = useRef(null)
  const cardsRef = useRef([])

  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
    cardsRef.current.forEach((el, i) => {
      if (!el) return
      gsap.fromTo(el,
        { opacity: 0, y: 28, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, delay: 0.15 + i * 0.1, ease: 'power3.out' }
      )
    })
  }, [])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape' && onBack) onBack() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onBack])

  const toggle = (id) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleConfirm = () => {
    if (selectedMoods.length === 0) return
    gsap.to(containerRef.current, {
      opacity: 0, y: -8, duration: 0.4, ease: 'power2.in', onComplete: onConfirm,
    })
  }

  const handleMouseMove = (e, cardEl) => {
    if (!cardEl) return
    const rect = cardEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    cardEl.style.setProperty('--x', `${x}px`)
    cardEl.style.setProperty('--y', `${y}px`)

    const xc = rect.width / 2
    const yc = rect.height / 2
    const angleX = (yc - y) / 12
    const angleY = (x - xc) / 12

    gsap.to(cardEl, {
      rotateX: angleX,
      rotateY: angleY,
      scale: 1.015,
      duration: 0.3,
      ease: 'power1.out',
    })
  }

  const handleMouseLeave = (cardEl, active) => {
    if (!cardEl) return
    gsap.to(cardEl, {
      rotateX: 0,
      rotateY: 0,
      scale: active ? 1.01 : 1.0,
      duration: 0.3,
      ease: 'power1.out',
    })
  }

  const allSelected = selectedMoods.length === 4
  const noneSelected = selectedMoods.length === 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-[var(--color-surface)] text-stone-900"
      style={{ opacity: 0 }}
    >
      {/* Editorial Header Banner */}
      <div 
        className="w-full relative overflow-hidden shrink-0 border-b border-stone-200" 
        style={{ 
          background: 'var(--color-primary)', 
          minHeight: '125px',
          boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.08)'
        }}
      >
        {/* Elegant Gold Divider Line at bottom */}
        <div 
          className="absolute bottom-0 left-0 w-full" 
          style={{ height: '3px', background: 'var(--color-accent)' }} 
        />

        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
        />

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Decorative compass rose */}
        <svg viewBox="0 0 100 100" className="absolute right-6 top-3 opacity-10 w-20 h-20 md:w-24 md:h-24" fill="none" stroke="white" strokeWidth="0.5">
          <circle cx="50" cy="50" r="42" strokeDasharray="2,3" />
          <circle cx="50" cy="50" r="18" />
          <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
          <path d="M 50,50 L 46,20 L 50,5 L 54,20 Z" fill="rgba(255,255,255,0.08)" />
          <path d="M 50,50 L 80,46 L 95,50 L 80,54 Z" fill="rgba(255,255,255,0.04)" />
          <circle cx="50" cy="50" r="3" fill="white" />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-6 pb-6">
          <p className="text-overline tracking-widest text-white/70 mb-1 font-sans font-semibold text-[9px] uppercase">
            Kingdom of Bahrain · مملكة البحرين
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-medium text-white leading-tight">
            Curate Your Journey
          </h1>
          <p className="font-sans text-[11.5px] text-white/80 mt-1 max-w-xs leading-normal">
            Select the cultural focus layers for your personalized travel ledger.
          </p>
        </div>
      </div>

      {/* Cards + CTA */}
      <div className="w-full max-w-2xl px-4 pt-5 pb-8 flex flex-col gap-5 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MOODS.map((mood, i) => {
            const active = selectedMoods.includes(mood.id)
            const MoodIcon = mood.icon
            return (
              <button
                key={mood.id}
                ref={el => cardsRef.current[i] = el}
                onClick={() => toggle(mood.id)}
                onMouseMove={(e) => handleMouseMove(e, cardsRef.current[i])}
                onMouseLeave={() => handleMouseLeave(cardsRef.current[i], active)}
                aria-pressed={active}
                aria-label={`${mood.label} - ${mood.tagline}${active ? ' (selected)' : ''}`}
                className={`relative rounded-xl p-4 text-left cursor-pointer group overflow-hidden jn-vibe-card ${
                  active ? 'jn-vibe-card--active gold-foil-border' : 'jn-vibe-card--inactive'
                }`}
                style={{
                  borderWidth: '1px',
                  transition: 'all 0.25s var(--ease-out)'
                }}
              >
                {/* Tactile Paper Grain Overlay */}
                <div className="paper-grain opacity-[0.03] pointer-events-none" />

                {/* Thematic Background Pattern Overlay */}
                <div 
                  className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none"
                  style={{
                    backgroundImage: active ? mood.bgPatternActive : mood.bgPatternInactive,
                    backgroundSize: 'auto',
                    backgroundPosition: 'center',
                  }}
                />

                {/* Hover effect border */}
                {!active && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: 'rgba(193,18,47,0.01)', border: '1.5px solid rgba(193,18,47,0.08)' }}
                  />
                )}

                <div className="relative z-10 flex flex-col gap-3.5">
                  <div className="flex items-start justify-between">
                    {/* Clean Icon Container (No emoji) */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 thin-icon ${
                        active
                          ? 'border-white/30 bg-white/10'
                          : 'bg-stone-200/30 border-stone-300/40'
                      }`}
                    >
                      <MoodIcon 
                        size={18} 
                        className={active ? 'text-white' : 'text-[var(--color-primary)]'} 
                        strokeWidth={1.35}
                      />
                    </div>

                    {/* Checkmark indicator */}
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all duration-200 border ${
                        active ? 'gold-foil-bg border-transparent text-[#1a1210]' : 'border-stone-300 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-serif text-lg font-semibold ${
                        active ? 'text-white' : 'text-stone-900'
                      }`}>
                        {mood.label}
                      </span>
                      <span className={`font-sans text-[11px] font-medium ${
                        active ? 'text-white/70' : 'text-[var(--color-text-muted)]'
                      }`}>
                        {mood.arabic}
                      </span>
                    </div>
                    <p className={`text-[12.5px] mt-0.5 leading-snug font-sans ${
                      active ? 'text-white/85' : 'text-stone-600'
                    }`}>
                      {mood.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mood.spots.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className={`text-[10.5px] px-1.5 py-0.5 rounded font-sans font-semibold border ${
                          active
                            ? 'bg-white/10 text-white/90 border-white/15'
                            : 'border-transparent'
                        }`}
                        style={!active ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderColor: 'rgba(193, 18, 47, 0.08)' } : {}}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Stay Duration Selector */}
        <div 
          className="bg-white border border-stone-200/80 rounded-xl p-4 shadow-xs select-none transition-all duration-300 animate-fadeIn"
        >
          <label className="font-serif text-[14px] font-semibold text-[var(--color-text)] flex items-center justify-center md:justify-start gap-1.5">
            Duration of Itinerary
          </label>
          
          <div className="relative mt-3 flex items-center gap-1.5">
            <button
              onClick={() => {
                const el = document.getElementById('duration-scroll')
                if (el) el.scrollBy({ left: -120, behavior: 'smooth' })
              }}
              aria-label="Scroll left"
              className="shrink-0 w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-stone-50 cursor-pointer transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <div 
              id="duration-scroll"
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory flex-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                overscrollBehaviorX: 'contain',
                scrollPadding: '0 12px',
                paddingLeft: '2px',
                paddingRight: '2px',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                const active = duration === d
                return (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`snap-center flex-shrink-0 w-15 py-2.5 rounded-lg border text-center font-sans text-xs font-semibold transition-all duration-300 cursor-pointer ${
                      active
                        ? 'text-white scale-[1.03]'
                        : 'bg-[var(--color-surface-2)] border-stone-200 text-[var(--color-text-muted)] hover:border-stone-300 hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: active ? 'var(--color-primary)' : '',
                      borderColor: active ? 'var(--color-accent)' : '',
                      boxShadow: active ? '0 3px 8px rgba(193,18,47,0.12), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                    }}
                  >
                    <div className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">{d === 1 ? 'Day' : 'Days'}</div>
                    <div className="text-sm font-bold mt-0.5">{d}</div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('duration-scroll')
                if (el) el.scrollBy({ left: 120, behavior: 'smooth' })
              }}
              aria-label="Scroll right"
              className="shrink-0 w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[var(--color-text-muted)] hover:bg-stone-50 cursor-pointer transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={handleConfirm}
            disabled={noneSelected}
            className={`w-full py-4 rounded-xl font-sans font-semibold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed hover:scale-[1.005] active:scale-[0.995] h-[52px] border ${
              noneSelected
                ? 'bg-stone-100 border-dashed border-stone-300 text-stone-400'
                : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white border-transparent shadow-sm'
            }`}
          >
            {noneSelected
              ? 'Pick at least one vibe'
              : 'Generate Travel Ledger →'}
          </button>

          <button
            onClick={quickStart}
            className="w-full py-3 rounded-xl font-sans font-semibold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer border hover:bg-[var(--color-primary)] hover:text-white hover:scale-[1.005] active:scale-[0.995] h-[46px] flex items-center justify-center gap-1 shadow-xs"
            style={{ borderColor: 'rgba(193, 18, 47, 0.15)', backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
          >
            Standard Route (Quick Start)
          </button>

          <button
            onClick={() => setSelectedMoods(allSelected ? [] : ['empires', 'sea', 'spice', 'lights'])}
            className="w-full text-[10px] tracking-widest uppercase font-semibold py-2.5 transition-all duration-300 cursor-pointer text-center hover:underline text-[var(--color-primary)] bg-transparent border-none"
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
        </div>

      </div>
    </div>
  )
}
