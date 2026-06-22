import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { ArrowLeft } from 'lucide-react'

const MOODS = [
  {
    id: 'empires',
    label: 'Empires',
    arabic: 'الإمبراطوريات',
    tagline: 'Ancient forts, ruins & 5,000-year-old secrets',
    icon: '🏯',
    spots: ["Qal'at al-Bahrain", 'Barbar Temple', 'Arad Fort', 'Riffa Fort'],
  },
  {
    id: 'sea',
    label: 'Sea',
    arabic: 'البحر',
    tagline: 'Pearls, tides & vanishing sandbanks',
    icon: '🌊',
    spots: ['Pearling Path UNESCO', 'Jarada Sandbank', 'Al Dar Islands', 'Sea Ferry'],
  },
  {
    id: 'spice',
    label: 'Spice',
    arabic: 'التوابل',
    tagline: 'Souqs, karak tea & saffron halwa',
    icon: '☕',
    spots: ['Manama Souq', 'Muharraq Alleyways', "Haji's Cafe", "A'ali Pottery"],
  },
  {
    id: 'lights',
    label: 'Lights',
    arabic: 'الأضواء',
    tagline: 'Street art, rooftops & modern Manama',
    icon: '✨',
    spots: ['Block 338 Adliya', 'Reef Island', 'La Fontaine Arts', 'Night Skyline'],
  },
]

export default function MoodSelector({ onConfirm, onBack }) {
  const { selectedMoods, setSelectedMoods, duration, setDuration } = useVibe()

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
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.1 + i * 0.08, ease: 'power3.out' }
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
      opacity: 0, y: -12, duration: 0.4, ease: 'power2.in', onComplete: onConfirm,
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
    const angleX = (yc - y) / 7
    const angleY = (x - xc) / 7

    gsap.to(cardEl, {
      rotateX: angleX,
      rotateY: angleY,
      scale: 1.025,
      duration: 0.3,
      ease: 'power1.out',
    })
  }

  const handleMouseLeave = (cardEl, active) => {
    if (!cardEl) return
    gsap.to(cardEl, {
      rotateX: 0,
      rotateY: 0,
      scale: active ? 1.02 : 1.0,
      duration: 0.3,
      ease: 'power1.out',
    })
  }

  const allSelected = selectedMoods.length === 4
  const noneSelected = selectedMoods.length === 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto bg-[#FAF9F6] dark:bg-[#12100E] text-stone-900 dark:text-[#EDEBE6]"
      style={{ opacity: 0 }}
    >
      {/* Bahrain flag-inspired top banner (modestly adjusted) */}
      <div className="w-full relative overflow-hidden shrink-0" style={{ background: '#D11A38', minHeight: '145px' }}>
        {/* Serrated white edge at bottom — mimics the Bahrain flag's zigzag */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1200 35"
          preserveAspectRatio="none"
          style={{ height: '35px', display: 'block' }}
        >
          <path
            d="M0,0 L80,24 L160,0 L240,24 L320,0 L400,24 L480,0 L560,24 L640,0 L720,24 L800,0 L880,24 L960,0 L1040,24 L1120,0 L1200,24 L1200,35 L0,35 Z"
            fill="currentColor"
            className="text-[#FAF9F6] dark:text-[#12100E]"
          />
        </svg>

        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
        />

        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white cursor-pointer transition-all active:scale-90"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Decorative compass rose */}
        <svg viewBox="0 0 100 100" className="absolute right-6 top-3 opacity-10 w-24 h-24 md:w-32 md:h-32" fill="none" stroke="white" strokeWidth="0.6">
          <circle cx="50" cy="50" r="42" strokeDasharray="3,4" />
          <circle cx="50" cy="50" r="18" />
          <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
          <path d="M 50,50 L 46,20 L 50,5 L 54,20 Z" fill="rgba(255,255,255,0.1)" />
          <path d="M 50,50 L 80,46 L 95,50 L 80,54 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M 50,50 L 46,80 L 50,95 L 54,80 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M 50,50 L 20,46 L 5,50 L 20,54 Z" fill="rgba(255,255,255,0.05)" />
          <circle cx="50" cy="50" r="3" fill="white" />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-7 pb-10">
          <p className="font-sans text-[11.5px] tracking-[0.45em] uppercase font-bold text-white/65 mb-1.5">
            Kingdom of Bahrain · مملكة البحرين
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white leading-tight">
            What pulls you in?
          </h1>
          <p className="font-sans text-xs text-white/75 mt-1.5 max-w-sm leading-relaxed">
            Your personal local builds around your vibe — not a generic tour.
          </p>
        </div>
      </div>

      {/* Cards + CTA (fitted using spacing adjustments) */}
      <div className="w-full max-w-2xl px-4 pt-4 pb-6 flex flex-col gap-4 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {MOODS.map((mood, i) => {
            const active = selectedMoods.includes(mood.id)
            return (
              <button
                key={mood.id}
                ref={el => cardsRef.current[i] = el}
                onClick={() => toggle(mood.id)}
                onMouseMove={(e) => handleMouseMove(e, cardsRef.current[i])}
                onMouseLeave={() => handleMouseLeave(cardsRef.current[i], active)}
                aria-pressed={active}
                aria-label={`${mood.label} - ${mood.tagline}${active ? ' (selected)' : ''}`}
                className={`relative rounded-2xl p-4 text-left cursor-pointer group overflow-hidden jn-vibe-card ${
                  active ? 'jn-vibe-card--active' : 'jn-vibe-card--inactive'
                }`}
              >
                {/* Hover effect for inactive */}
                {!active && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: 'rgba(193,18,47,0.02)', border: '2px solid rgba(193,18,47,0.12)' }}
                  />
                )}

                <div className="relative z-10 flex flex-col gap-2" style={{ transform: 'translateZ(20px)' }}>
                  <div className="flex items-start justify-between">
                    {/* Stylized Badge Container for Emojis */}
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        active
                          ? 'bg-[#C5A880]/15 border-[#C5A880] shadow-[0_0_10px_rgba(197,168,128,0.4)]'
                          : 'bg-stone-200/20 dark:bg-stone-850/40 border-stone-300/60 dark:border-stone-700/60'
                      }`}
                    >
                      <span className="text-xl">{mood.icon}</span>
                    </div>

                    {/* Simple Checkmark Circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-200 border ${
                        active ? 'bg-[#C1122F] border-[#C1122F] text-white' : 'border-stone-300 dark:border-stone-700 text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-serif text-xl font-semibold ${
                        active ? 'text-white' : 'text-stone-900 dark:text-stone-100'
                      }`}>
                        {mood.label}
                      </span>
                      <span className={`font-sans text-[12px] ${
                        active ? 'text-white/75' : 'text-[#5C5451] dark:text-[#EDEBE6]/60'
                      }`}>
                        {mood.arabic}
                      </span>
                    </div>
                    <p className={`text-[13px] mt-0.5 leading-snug font-sans ${
                      active ? 'text-white/90' : 'text-stone-600 dark:text-stone-400'
                    }`}>
                      {mood.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mood.spots.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className={`text-[11.5px] px-1.5 py-0.5 rounded font-sans font-semibold border ${
                          active
                            ? 'bg-white/10 text-white/90 border-white/20'
                            : 'bg-red-500/5 dark:bg-red-900/10 text-[#D11A38] dark:text-[#E25C70] border-red-500/10 dark:border-red-500/20'
                        }`}
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
          className="bg-white dark:bg-[#1C1816] border border-stone-200 dark:border-[#2E2724] rounded-2xl p-4 shadow-sm select-none transition-all duration-300 animate-fadeIn"
          style={{
            boxShadow: '0 2px 12px rgba(42,35,33,0.04), 0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <label className="font-serif text-[14.5px] font-extrabold text-[#2A2321] dark:text-[#EDEBE6] flex items-center justify-center md:justify-start gap-1.5">
            How long is your stay?
          </label>
          
          <div className="relative mt-3 flex items-center gap-1">
            <button
              onClick={() => {
                const el = document.getElementById('duration-scroll')
                if (el) el.scrollBy({ left: -120, behavior: 'smooth' })
              }}
              aria-label="Scroll left"
              className="shrink-0 w-7 h-7 rounded-full bg-white dark:bg-[#12100E] border border-stone-200 dark:border-stone-850 flex items-center justify-center text-[#5C5451] dark:text-[#EDEBE6] hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-all"
            >
              ◀
            </button>
            <div 
              id="duration-scroll"
              className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory flex-1"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                overscrollBehaviorX: 'contain',
                scrollPadding: '0 12px',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                const active = duration === d
                return (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`snap-center flex-shrink-0 w-16 py-3 rounded-xl border text-center font-sans text-xs font-black transition-all duration-300 cursor-pointer ${
                      active
                        ? 'bg-[#C1122F] border-[#C5A880] text-white shadow-[0_4px_12px_rgba(193,18,47,0.3)] scale-[1.05]'
                        : 'bg-[#FCFBF8] dark:bg-[#12100E] border-stone-200 dark:border-stone-850 text-[#5C5451] dark:text-[#EDEBE6] hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
                    }`}
                    style={{
                      boxShadow: active ? '0 4px 12px rgba(193,18,47,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    <div className="text-[9px] uppercase opacity-75 font-medium">{d === 1 ? 'Day' : 'Days'}</div>
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
              className="shrink-0 w-7 h-7 rounded-full bg-white dark:bg-[#12100E] border border-stone-200 dark:border-stone-850 flex items-center justify-center text-[#5C5451] dark:text-[#EDEBE6] hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-all"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Action buttons (Stacked for Mobile Prominence) */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={handleConfirm}
            disabled={noneSelected}
            className={`w-full py-4 rounded-xl font-sans font-bold text-sm tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] h-[54px] border ${
              noneSelected
                ? 'bg-stone-100 dark:bg-stone-900/40 border-dashed border-stone-300 dark:border-stone-800 text-stone-400 dark:text-stone-600'
                : 'bg-gradient-to-r from-[#C1122F] to-[#8B0D22] text-white border-transparent shadow-md shadow-red-500/10'
            }`}
          >
            {noneSelected
              ? 'Pick at least one vibe'
              : 'Build my Bahrain Passage →'}
          </button>

          <button
            onClick={() => setSelectedMoods(allSelected ? [] : ['empires', 'sea', 'spice', 'lights'])}
            className="w-full text-[11px] tracking-widest uppercase font-bold py-2.5 transition-all duration-300 cursor-pointer text-center hover:underline text-[#C1122F] dark:text-[#C5A880] bg-transparent border-none"
          >
            {allSelected ? 'Clear All' : 'Select All'}
          </button>
        </div>
      </div>
    </div>
  )
}
