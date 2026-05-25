import { useRef } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'

const MOODS = [
  {
    id: 'empires',
    label: 'Empires',
    arabic: 'الإمبراطوريات',
    tagline: 'Forts, ruins & 5,000-year-old secrets',
    icon: '🏯',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #3b1a06 50%, #5c2e10 100%)',
    accent: '#d4af37',
    glow: 'rgba(212,175,55,0.35)',
    highlights: ["Qal'at al-Bahrain Fort", 'Barbar Dilmun Temple'],
  },
  {
    id: 'sea',
    label: 'Sea',
    arabic: 'البحر',
    tagline: 'Pearls, tides & vanishing islands',
    icon: '🌊',
    bg: 'linear-gradient(135deg, #001a2c 0%, #063352 50%, #0a4a70 100%)',
    accent: '#38bdf8',
    glow: 'rgba(56,189,248,0.35)',
    highlights: ['Pearling Path UNESCO', 'Jarada Sandbank'],
  },
  {
    id: 'spice',
    label: 'Spice',
    arabic: 'التوابل',
    tagline: 'Souqs, karak & saffron halwa',
    icon: '🫚',
    bg: 'linear-gradient(135deg, #1a0d00 0%, #3d1f00 50%, #6b3810 100%)',
    accent: '#f97316',
    glow: 'rgba(249,115,22,0.35)',
    highlights: ['Manama Souq', 'Muharraq Alleyways'],
  },
  {
    id: 'lights',
    label: 'Lights',
    arabic: 'الأضواء',
    tagline: 'Street art, neon & rooftop culture',
    icon: '✨',
    bg: 'linear-gradient(135deg, #0d001a 0%, #200030 50%, #350050 100%)',
    accent: '#c084fc',
    glow: 'rgba(192,132,252,0.35)',
    highlights: ['Block 338 Adliya', 'Reef Island Promenade'],
  },
]

export default function MoodSelector({ onConfirm }) {
  const { selectedMoods, setSelectedMoods, duration } = useVibe()
  const containerRef = useRef(null)

  const toggle = (id) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleConfirm = () => {
    if (selectedMoods.length === 0) return
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        y: -16,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: onConfirm,
      })
    } else {
      onConfirm()
    }
  }

  const allSelected = selectedMoods.length === 4
  const noneSelected = selectedMoods.length === 0

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at 50% -10%, rgba(209,26,56,0.12) 0%, #0a0604 55%, #060302 100%)',
      }}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-5">

        <div className="text-center space-y-2 mb-1">
          <p className="text-[10px] tracking-[0.4em] uppercase font-bold" style={{ color: '#D11A38' }}>
            Bahrain Passage
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-white font-semibold leading-tight">
            What pulls you in?
          </h1>
          <p className="text-sm text-white/40 font-sans max-w-xs mx-auto leading-relaxed">
            Pick your vibes. Your personal local builds around them.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {MOODS.map((mood, i) => {
            const active = selectedMoods.includes(mood.id)
            return (
              <button
                key={mood.id}
                onClick={() => toggle(mood.id)}
                className="relative rounded-2xl p-4 text-left overflow-hidden cursor-pointer"
                style={{
                  background: active
                    ? mood.bg
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${active ? mood.accent + '50' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: active
                    ? `0 0 28px ${mood.glow}, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${mood.accent}20`
                    : '0 4px 16px rgba(0,0,0,0.3)',
                  transform: active ? 'scale(1.025)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  animationDelay: `${i * 80}ms`,
                }}
              >
                {active && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at 20% 20%, ${mood.glow.replace('0.35', '0.25')} 0%, transparent 60%)`,
                    }}
                  />
                )}

                <div className="relative z-10 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{mood.icon}</span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200"
                      style={{
                        background: active ? mood.accent : 'rgba(255,255,255,0.08)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.2)',
                        border: active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {active ? '✓' : ''}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className="font-serif text-xl font-semibold"
                        style={{ color: active ? mood.accent : 'rgba(255,255,255,0.9)' }}
                      >
                        {mood.label}
                      </span>
                      <span
                        className="font-sans text-[10px]"
                        style={{ color: active ? `${mood.accent}aa` : 'rgba(255,255,255,0.25)' }}
                      >
                        {mood.arabic}
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-0.5 leading-snug"
                      style={{ color: active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)' }}
                    >
                      {mood.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {mood.highlights.map(h => (
                      <span
                        key={h}
                        className="text-[9px] px-1.5 py-0.5 rounded-md font-sans"
                        style={{
                          background: active ? `${mood.accent}15` : 'rgba(255,255,255,0.05)',
                          color: active ? mood.accent : 'rgba(255,255,255,0.22)',
                          border: `1px solid ${active ? mood.accent + '28' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => setSelectedMoods(allSelected ? [] : ['empires', 'sea', 'spice', 'lights'])}
            className="text-[10px] tracking-wider uppercase font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0"
            style={{
              color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {allSelected ? 'Clear' : 'All vibes'}
          </button>

          <button
            onClick={handleConfirm}
            disabled={noneSelected}
            className="flex-1 py-3.5 rounded-2xl font-sans font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: noneSelected
                ? 'rgba(209,26,56,0.15)'
                : 'linear-gradient(135deg, #D11A38 0%, #a81028 100%)',
              color: 'white',
              boxShadow: noneSelected ? 'none' : '0 0 24px rgba(209,26,56,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            {noneSelected
              ? 'Pick at least one vibe'
              : `Build my ${duration > 1 ? `${duration}-day ` : ''}Bahrain — ${selectedMoods.length} vibe${selectedMoods.length > 1 ? 's' : ''} →`}
          </button>
        </div>

        <p className="text-[10px] text-white/18 text-center font-sans">
          AI-powered local planning · 18 curated spots · Kingdom of Bahrain 🇧🇭
        </p>
      </div>
    </div>
  )
}
