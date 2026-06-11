import { useState, useEffect, useCallback } from 'react'

// ─── Curated destination tour clips ─────────────────────────────────────────
// Using official Bahrain Tourism, UNESCO, and National Geographic footage
const TOURS = [
  {
    id: 'qal-at-al-bahrain',
    name: "Qal'at al-Bahrain",
    arabic: 'قلعة البحرين',
    subtitle: 'Bahrain Fort — UNESCO World Heritage Site',
    period: '2300 BCE – Present',
    videoId: 'KQe5Cf5-I6s',
    description: "The ancient capital of Dilmun civilisation. Walk the 4,000-year-old archaeological strata revealing Dilmun, Assyrian, Achaemenid, Greek, Parthian, and Portuguese occupation layers.",
    highlight: "Look for the ancient freshwater spring channels along the northern wall — they're over 4,000 years old.",
    emoji: '🏯',
    color: '#8B4513',
  },
  {
    id: 'manama-souq',
    name: 'Bab Al Bahrain & Manama Souq',
    arabic: 'باب البحرين',
    subtitle: 'The Gateway of Bahrain — est. 1949',
    period: '1949 – Present',
    videoId: 'B8Mq_OXVDkU',
    description: "Pass through the iconic stone archway of Bab Al Bahrain into the labyrinthine merchant alleys of old Manama. The air is thick with cardamom, saffron, and frankincense.",
    highlight: "Turn left at the gate at 7 PM — vendors sell fresh jasmine flower strings in the spice alley.",
    emoji: '🏪',
    color: '#8B6914',
  },
  {
    id: 'pearling-path',
    name: 'Pearling Path',
    arabic: 'مسار اللؤلؤ',
    subtitle: 'UNESCO World Heritage — Pearl Civilisation',
    period: '19th century pearling era',
    videoId: 'KGiVeA5Xbwg',
    description: "Walk the alleyways of Muharraq where generations of pearl merchants and divers shaped the global pearl trade. The route ends at Bu Maher Fort, where divers departed for the oyster beds.",
    highlight: "Look for mother-of-pearl flakes embedded in the plaster of the oldest doorposts along the path.",
    emoji: '🦪',
    color: '#1a5276',
  },
  {
    id: 'tree-of-life',
    name: 'Tree of Life',
    arabic: 'شجرة الحياة',
    subtitle: 'The Desert Miracle — 400+ years old',
    period: '1582 – Present',
    videoId: 'pKr6obBEsJY',
    description: "A solitary mesquite tree standing in the Sakhir desert with no visible water source. Its roots descend over 50 metres to reach subterranean aquifers, defying the hyper-saline desert sands.",
    highlight: "The Sakhir Bedouins say the tree's roots tap into the mythical underground rivers of Dilmun.",
    emoji: '🌳',
    color: '#1a5e2a',
  },
  {
    id: 'al-fateh-mosque',
    name: 'Al Fateh Grand Mosque',
    arabic: 'مسجد الفاتح الكبير',
    subtitle: 'One of the world\'s largest mosques',
    period: '1988 – Present',
    videoId: 'x8LCKhTHBn8',
    description: "The Grand Mosque of Bahrain, one of the largest mosques in the world. Its white fiberglass dome (66m wide, 26,000 worshippers) is an architectural marvel visible across the capital.",
    highlight: "Non-Muslim visitors can join guided tours — the library inside holds an original handwritten Quran on deer skin.",
    emoji: '🕌',
    color: '#1a3a5c',
  },
  {
    id: 'barbar-temple',
    name: 'Barbar Temple',
    arabic: 'معبد بربر',
    subtitle: 'Sanctuary of Enki — 2200 BCE',
    period: 'c. 2200 – 2000 BCE',
    videoId: 'hBKtS6XAXRI',
    description: "Three successive Bronze Age temples stacked on the same sacred site, dedicated to Enki, the Sumerian god of freshwater and wisdom. Groundwater still bubbles up through the ancient central well.",
    highlight: "Peer into the ancient central well — natural freshwater still rises from the earth, just as it did 4,200 years ago.",
    emoji: '🏺',
    color: '#4a2c0a',
  },
  {
    id: 'jarada-island',
    name: 'Jarada Sandbank',
    arabic: 'جزيرة جرادة',
    subtitle: 'The Disappearing Island',
    period: 'Tidal phenomenon',
    videoId: 'JQz5R56HkxQ',
    description: "An ephemeral white sandbar that rises from the turquoise Gulf at low tide and completely vanishes under the sea twice daily. During the 3-hour low-tide window, the sand is pure white and utterly empty.",
    highlight: "Bring a pearl-opener and try the shallows — the sandy bottom hosts wild oysters and you might find a natural pearl.",
    emoji: '🏖️',
    color: '#0e5f7a',
  },
  {
    id: 'al-areen',
    name: 'Al Areen Wildlife Park',
    arabic: 'منتزه العرين للحياة البرية',
    subtitle: 'Home of the Arabian Oryx',
    period: 'Est. 1976',
    videoId: 'TRjdDsq-c9Q',
    description: "A protected desert reserve that saved the Arabian Oryx from extinction in the 1970s. Herds of white Oryx with their distinctive long straight horns now roam the Sakhir landscape freely.",
    highlight: "Book the 9 AM shuttle cart — the Oryx herds feed in the morning before the desert heat sets in.",
    emoji: '🦌',
    color: '#3a5e1a',
  },
]

// ─── Spot to tour map (for triggering from Dashboard) ────────────────────────
export const SPOT_TO_TOUR = {
  'qal-at-al-bahrain': 0,
  'manama-souq': 1,
  'pearling-path': 2,
  'tree-of-life': 3,
  'barbar-temple': 5,
  'jarada-island': 6,
  'al-areen': 7,
}

export function hasVirtualTour(spotId) {
  return spotId in SPOT_TO_TOUR
}

export function getTourIndexForSpot(spotId) {
  return SPOT_TO_TOUR[spotId] ?? 0
}

// ─── Video embed ──────────────────────────────────────────────────────────────
function VideoEmbed({ videoId, title }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    const timer = setTimeout(() => setLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [videoId])

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      background: '#0e0606',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0e0606',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(209,26,56,0.3)',
            borderTopColor: '#D11A38',
            animation: 'tourSpinner 0.8s linear infinite',
          }} />
        </div>
      )}
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&cc_load_policy=0&color=red`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VirtualTour({ initialIndex = 0, onClose }) {
  const [current, setCurrent] = useState(initialIndex)
  const [transitioning, setTransitioning] = useState(false)

  const tour = TOURS[current]

  const goTo = useCallback((idx) => {
    if (transitioning || idx === current) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(idx)
      setTransitioning(false)
    }, 280)
  }, [current, transitioning])

  const prev = () => goTo((current - 1 + TOURS.length) % TOURS.length)
  const next = () => goTo((current + 1) % TOURS.length)

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current, transitioning])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        zIndex: 600,
        background: 'rgba(5,0,0,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'tourFadeIn 0.35s ease both',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 860,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          animation: 'tourSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
          scrollbarWidth: 'none',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'rgba(209,26,56,0.92)',
          borderRadius: '16px 16px 0 0',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🎬</span>
            <div>
              <div style={{
                color: '#fff', fontWeight: 700, fontSize: 13,
                fontFamily: '"Outfit", sans-serif', letterSpacing: 0.3,
              }}>
                Virtual Destination Tour
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.65)', fontSize: 10,
                fontFamily: '"Outfit", sans-serif',
                letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1,
              }}>
                {current + 1} / {TOURS.length} — Kingdom of Bahrain
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
          >
            ✕
          </button>
        </div>

        {/* Main content */}
        <div style={{
          background: 'linear-gradient(160deg, #1C1210 0%, #0e0606 100%)',
          borderRadius: '0 0 16px 16px',
          overflow: 'hidden',
          border: '1px solid rgba(209,26,56,0.15)',
          borderTop: 'none',
        }}>

          {/* Title card */}
          <div style={{
            padding: '24px 28px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.25s, transform 0.25s',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: `linear-gradient(135deg, ${tour.color}40, ${tour.color}20)`,
                border: `1.5px solid ${tour.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>
                {tour.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: 10, letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(209,26,56,0.8)',
                  fontWeight: 700, marginBottom: 4,
                }}>
                  {tour.subtitle}
                </div>
                <h2 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(18px, 3vw, 24px)',
                  fontWeight: 700, color: '#FAF9F6',
                  margin: 0, lineHeight: 1.2,
                }}>
                  {tour.name}
                </h2>
                <div style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 14, fontStyle: 'italic',
                  color: 'rgba(209,26,56,0.7)', marginTop: 2,
                  direction: 'rtl',
                }}>
                  {tour.arabic}
                </div>
                <div style={{
                  fontFamily: '"Outfit", sans-serif',
                  fontSize: 10, color: 'rgba(255,255,255,0.35)',
                  marginTop: 4, letterSpacing: '0.1em',
                }}>
                  {tour.period}
                </div>
              </div>
            </div>
          </div>

          {/* Video */}
          <div style={{
            padding: '20px 28px 0',
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.25s',
          }}>
            <VideoEmbed videoId={tour.videoId} title={tour.name} />
          </div>

          {/* Description */}
          <div style={{
            padding: '18px 28px',
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.25s 0.05s',
          }}>
            <p style={{
              fontFamily: '"Outfit", sans-serif',
              fontSize: 13, lineHeight: 1.7,
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 14px',
            }}>
              {tour.description}
            </p>

            <div style={{
              padding: '12px 16px',
              background: 'rgba(209,26,56,0.08)',
              border: '1px solid rgba(209,26,56,0.2)',
              borderRadius: 10,
            }}>
              <div style={{
                fontSize: 10, fontFamily: '"Outfit", sans-serif',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#D11A38', fontWeight: 700, marginBottom: 5,
              }}>
                ✨ Local Insider Tip
              </div>
              <p style={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: 'italic', fontSize: 12.5,
                color: 'rgba(255,255,255,0.75)', margin: 0,
                lineHeight: 1.6,
              }}>
                "{tour.highlight}"
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            padding: '0 28px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <button
              onClick={prev}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 12, fontFamily: '"Outfit", sans-serif',
                fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
              }}
            >
              ← Previous
            </button>

            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {TOURS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === current ? 20 : 7,
                    height: 7,
                    borderRadius: 4,
                    background: i === current ? '#D11A38' : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10,
                background: 'linear-gradient(135deg, #D11A38, #A81028)',
                border: 'none',
                color: '#fff',
                fontSize: 12, fontFamily: '"Outfit", sans-serif',
                fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(209,26,56,0.35)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(209,26,56,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(209,26,56,0.35)'
              }}
            >
              Next Destination →
            </button>
          </div>

          {/* Thumbnail strip */}
          <div style={{
            padding: '0 28px 24px',
            display: 'flex', gap: 8, overflowX: 'auto',
            scrollbarWidth: 'none',
          }}>
            {TOURS.map((t, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  flexShrink: 0,
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: i === current
                    ? 'rgba(209,26,56,0.2)'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === current ? 'rgba(209,26,56,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  color: i === current ? '#FAF9F6' : 'rgba(255,255,255,0.45)',
                  fontSize: 11, fontFamily: '"Outfit", sans-serif',
                  fontWeight: i === current ? 700 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                onMouseEnter={e => {
                  if (i !== current) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
                  }
                }}
                onMouseLeave={e => {
                  if (i !== current) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                  }
                }}
              >
                <span style={{ fontSize: 13 }}>{t.emoji}</span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tourSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes tourSpinner {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
