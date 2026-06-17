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
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: '#FAF9F6', opacity: 0 }}
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
            fill="#FAF9F6"
          />
        </svg>

        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
        />

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
        <div className="grid grid-cols-2 gap-3.5">
          {MOODS.map((mood, i) => {
            const active = selectedMoods.includes(mood.id)
            return (
              <button
                key={mood.id}
                ref={el => cardsRef.current[i] = el}
                onClick={() => toggle(mood.id)}
                onMouseMove={(e) => handleMouseMove(e, cardsRef.current[i])}
                onMouseLeave={() => handleMouseLeave(cardsRef.current[i], active)}
                className={`relative rounded-2xl p-4 text-left cursor-pointer group overflow-hidden ${
                  active ? 'jn-vibe-card-active-glow' : 'jn-vibe-card-glow'
                }`}
                style={{
                  perspective: '1000px',
                  transformStyle: 'preserve-3d',
                  background: active 
                    ? 'linear-gradient(135deg, #BA0C2F 0%, #8A0A22 100%)' 
                    : 'linear-gradient(135deg, #FCFBF8 0%, #EFEBE4 100%)',
                  border: `2px solid ${active ? '#BA0C2F' : 'rgba(139,90,75,0.15)'}`,
                  boxShadow: active
                    ? '0 12px 36px rgba(138,10,34,0.38), 0 2px 8px rgba(0,0,0,0.12)'
                    : '0 4px 20px rgba(42,35,33,0.06), 0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'border 0.25s, box-shadow 0.25s, background 0.25s',
                }}
              >
                {/* Inner stitch-border for antique travel ledger feel */}
                <div
                  className="absolute inset-1.5 rounded-[12px] pointer-events-none"
                  style={{
                    border: `1.2px dashed ${active ? 'rgba(255,255,255,0.25)' : 'rgba(193,18,47,0.15)'}`,
                    transform: 'translateZ(10px)',
                  }}
                />

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
                      className="w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300"
                      style={{
                        background: active ? 'rgba(212, 175, 55, 0.15)' : 'rgba(139, 90, 75, 0.05)',
                        borderColor: active ? '#D4AF37' : 'rgba(139, 90, 75, 0.25)',
                        boxShadow: active ? '0 0 10px rgba(212, 175, 55, 0.4)' : 'none',
                      }}
                    >
                      <span className="text-xl">{mood.icon}</span>
                    </div>

                    {/* Glowing Gold Stamp / Badge Selector */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all duration-300"
                      style={{
                        background: active 
                          ? 'linear-gradient(135deg, #FFE082 0%, #D4AF37 50%, #B38F24 100%)' 
                          : 'rgba(139,90,75,0.08)',
                        color: active ? '#2A2321' : 'transparent',
                        border: `1.5px solid ${active ? '#FAF9F6' : 'rgba(139,90,75,0.2)'}`,
                        boxShadow: active 
                          ? '0 0 8px #D4AF37, inset 0 1px 0 rgba(255,255,255,0.3)' 
                          : 'none',
                      }}
                    >
                      ★
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
                        className="font-sans text-[12px]"
                        style={{ color: active ? 'rgba(255,255,255,0.65)' : 'rgba(92,84,81,0.5)' }}
                      >
                        {mood.arabic}
                      </span>
                    </div>
                    <p
                      className="text-[13px] mt-0.5 leading-snug font-sans"
                      style={{ color: active ? 'rgba(255,255,255,0.8)' : '#5C5451' }}
                    >
                      {mood.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mood.spots.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className="text-[11.5px] px-1.5 py-0.5 rounded font-sans font-semibold"
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
        <div className="flex items-center gap-2 justify-center py-0.5">
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

        {/* Stay Duration Selector */}
        <div 
          className="bg-white border border-red-500/10 rounded-2xl p-4 shadow-sm select-none transition-all duration-300 animate-fadeIn"
          style={{
            boxShadow: '0 2px 12px rgba(42,35,33,0.04), 0 1px 3px rgba(0,0,0,0.02)'
          }}
        >
          <label className="font-serif text-[14.5px] font-extrabold text-[#2A2321] flex items-center justify-center md:justify-start gap-1.5">
            ⏳ How long is your Bahrain stay?
          </label>
          
          <div className="relative mt-3">
            <div 
              className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
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
                        ? 'bg-[#D11A38] border-[#D4AF37] text-white shadow-[0_4px_12px_rgba(209,26,56,0.3)] scale-[1.05]'
                        : 'bg-[#FCFBF8] border-red-500/10 text-[#5C5451] hover:border-red-500/30 hover:shadow-sm'
                    }`}
                    style={{
                      boxShadow: active ? '0 4px 12px rgba(209,26,56,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    <div className="text-[9px] uppercase opacity-75 font-medium">{d === 1 ? 'Day' : 'Days'}</div>
                    <div className="text-sm font-bold mt-0.5">{d}</div>
                  </button>
                )
              })}
            </div>
            {/* Scroll fade overlays */}
            <div className="absolute top-0 bottom-2 left-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none opacity-60" />
            <div className="absolute top-0 bottom-2 right-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none opacity-80" />
          </div>
        </div>

        {/* Action buttons (Stacked for Mobile Prominence) */}
        <div className="flex flex-col gap-3 mt-1">
          <button
            onClick={handleConfirm}
            disabled={noneSelected}
            className={`w-full py-4 rounded-xl font-sans font-bold text-sm tracking-widest uppercase transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] ${
              !noneSelected ? 'jn-pulse-gold-btn' : ''
            }`}
            style={{
              height: '54px',
              background: noneSelected
                ? 'rgba(209,26,56,0.1)'
                : 'linear-gradient(135deg, #BA0C2F 0%, #8A0A22 100%)',
              color: noneSelected ? 'rgba(209,26,56,0.45)' : '#fff',
              border: noneSelected 
                ? '1.5px dashed rgba(209,26,56,0.25)' 
                : '2px solid #D4AF37',
              boxShadow: noneSelected
                ? 'none'
                : '0 8px 24px rgba(138,10,34,0.4), 0 2px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {noneSelected
              ? 'Pick at least one vibe'
              : 'Build my Bahrain Passage →'}
          </button>

          <button
            onClick={() => setSelectedMoods(allSelected ? [] : ['empires', 'sea', 'spice', 'lights'])}
            className="w-full text-[11px] tracking-widest uppercase font-bold py-3.5 rounded-xl transition-all duration-300 cursor-pointer text-center"
            style={{
              color: '#C1122F',
              border: '1.5px solid rgba(193, 18, 47, 0.25)',
              background: 'rgba(193, 18, 47, 0.03)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(193, 18, 47, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(193, 18, 47, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(193, 18, 47, 0.03)'
              e.currentTarget.style.borderColor = 'rgba(193, 18, 47, 0.25)'
            }}
          >
            {allSelected ? '✕ Clear All Vibes' : '✨ Select All Vibes'}
          </button>
        </div>

        <p className="text-[12px] text-center font-sans" style={{ color: 'rgba(92,84,81,0.45)' }}>
          Expertly curated · 18 local spots · Kingdom of Bahrain 🇧🇭
        </p>
      </div>
    </div>
  )
}
