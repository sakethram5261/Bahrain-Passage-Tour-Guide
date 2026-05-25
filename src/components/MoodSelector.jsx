import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'

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

export default function MoodSelector({ onConfirm }) {
  const { selectedMoods, setSelectedMoods, duration } = useVibe()
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

  const allSelected = selectedMoods.length === 4
  const noneSelected = selectedMoods.length === 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: '#FAF9F6', opacity: 0 }}
    >
      {/* Bahrain flag-inspired top banner */}
      <div className="w-full relative overflow-hidden shrink-0" style={{ background: '#D11A38', minHeight: '180px' }}>
        {/* Serrated white edge at bottom — mimics the Bahrain flag's zigzag */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1200 40"
          preserveAspectRatio="none"
          style={{ height: '40px', display: 'block' }}
        >
          <path
            d="M0,0 L80,28 L160,0 L240,28 L320,0 L400,28 L480,0 L560,28 L640,0 L720,28 L800,0 L880,28 L960,0 L1040,28 L1120,0 L1200,28 L1200,40 L0,40 Z"
            fill="#FAF9F6"
          />
        </svg>

        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
        />

        {/* Decorative compass rose */}
        <svg viewBox="0 0 100 100" className="absolute right-6 top-4 opacity-10 w-28 h-28 md:w-36 md:h-36" fill="none" stroke="white" strokeWidth="0.6">
          <circle cx="50" cy="50" r="42" strokeDasharray="3,4" />
          <circle cx="50" cy="50" r="18" />
          <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
          <path d="M 50,50 L 46,20 L 50,5 L 54,20 Z" fill="rgba(255,255,255,0.1)" />
          <path d="M 50,50 L 80,46 L 95,50 L 80,54 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M 50,50 L 46,80 L 50,95 L 54,80 Z" fill="rgba(255,255,255,0.05)" />
          <path d="M 50,50 L 20,46 L 5,50 L 20,54 Z" fill="rgba(255,255,255,0.05)" />
          <circle cx="50" cy="50" r="3" fill="white" />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-10 pb-14">
          <p className="font-sans text-[9px] tracking-[0.45em] uppercase font-bold text-white/60 mb-2">
            Kingdom of Bahrain · مملكة البحرين
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight">
            What pulls you in?
          </h1>
          <p className="font-sans text-sm text-white/70 mt-2 max-w-sm leading-relaxed">
            Your personal local builds around your vibe — not a generic tour.
          </p>
        </div>
      </div>

      {/* Cards + CTA */}
      <div className="w-full max-w-2xl px-4 pt-8 pb-10 flex flex-col gap-5 mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((mood, i) => {
            const active = selectedMoods.includes(mood.id)
            return (
              <button
                key={mood.id}
                ref={el => cardsRef.current[i] = el}
                onClick={() => toggle(mood.id)}
                className="relative rounded-2xl p-4 text-left cursor-pointer group"
                style={{
                  background: active ? '#D11A38' : '#FFFFFF',
                  border: `2px solid ${active ? '#D11A38' : 'rgba(209,26,56,0.15)'}`,
                  boxShadow: active
                    ? '0 8px 32px rgba(209,26,56,0.3), 0 2px 8px rgba(0,0,0,0.1)'
                    : '0 2px 12px rgba(42,35,33,0.06), 0 1px 3px rgba(0,0,0,0.04)',
                  transform: active ? 'scale(1.02) translateY(-2px)' : 'scale(1)',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: 0,
                }}
              >
                {/* Hover effect for inactive */}
                {!active && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ background: 'rgba(209,26,56,0.03)', border: '2px solid rgba(209,26,56,0.3)' }}
                  />
                )}

                <div className="relative z-10 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{mood.icon}</span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-200"
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)' : 'rgba(209,26,56,0.08)',
                        color: active ? '#fff' : 'rgba(209,26,56,0.4)',
                        border: active ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid rgba(209,26,56,0.2)',
                      }}
                    >
                      {active ? '✓' : ''}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="font-serif text-xl font-semibold"
                        style={{ color: active ? '#fff' : '#2A2321' }}
                      >
                        {mood.label}
                      </span>
                      <span
                        className="font-sans text-[10px]"
                        style={{ color: active ? 'rgba(255,255,255,0.65)' : 'rgba(92,84,81,0.5)' }}
                      >
                        {mood.arabic}
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-0.5 leading-snug font-sans"
                      style={{ color: active ? 'rgba(255,255,255,0.8)' : '#5C5451' }}
                    >
                      {mood.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mood.spots.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.5 rounded font-sans font-semibold"
                        style={{
                          background: active ? 'rgba(255,255,255,0.18)' : 'rgba(209,26,56,0.06)',
                          color: active ? 'rgba(255,255,255,0.9)' : '#D11A38',
                          border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : 'rgba(209,26,56,0.15)'}`,
                        }}
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

        {/* Selection count indicator */}
        <div className="flex items-center gap-2 justify-center">
          {MOODS.map(m => (
            <div
              key={m.id}
              className="rounded-full transition-all duration-300"
              style={{
                width: selectedMoods.includes(m.id) ? '24px' : '8px',
                height: '8px',
                background: selectedMoods.includes(m.id) ? '#D11A38' : 'rgba(209,26,56,0.15)',
              }}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMoods(allSelected ? [] : ['empires', 'sea', 'spice', 'lights'])}
            className="text-[10px] tracking-wider uppercase font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
            style={{
              color: '#5C5451',
              border: '1.5px solid rgba(42,35,33,0.15)',
              background: '#fff',
            }}
          >
            {allSelected ? 'Clear' : 'All vibes'}
          </button>

          <button
            onClick={handleConfirm}
            disabled={noneSelected}
            className="flex-1 py-4 rounded-2xl font-sans font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: noneSelected ? 'rgba(209,26,56,0.15)' : '#D11A38',
              color: noneSelected ? '#D11A38' : '#fff',
              boxShadow: noneSelected ? 'none' : '0 8px 24px rgba(209,26,56,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {noneSelected
              ? 'Pick at least one vibe'
              : `Build my ${duration > 1 ? `${duration}-day ` : ''}Bahrain →`}
          </button>
        </div>

        <p className="text-[10px] text-center font-sans" style={{ color: 'rgba(92,84,81,0.45)' }}>
          AI-planned · 18 curated local spots · Kingdom of Bahrain 🇧🇭
        </p>
      </div>
    </div>
  )
}
