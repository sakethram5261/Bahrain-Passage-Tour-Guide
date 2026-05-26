import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const SLOT_PHRASES = [
  'Bienvenue à Bahreïn',
  '巴林欢迎您',
  'Bienvenido a Baréin',
  'Willkommen in Bahrain',
  'Benvenuti in Bahrein',
  'Добро пожаловать в Бахрейн',
  'バーレーンへようこそ',
  '바레인에 오신 것을 환영합니다',
]

const ARABIC_FINAL  = 'مرحباً بكم في البحرين'
const ENGLISH_FINAL = 'Welcome to Bahrain'

// Mixed pool: Arabic glyphs + Latin — gives a "language morphing" feel during scramble
const MIXED_CHARS = 'أبتثجحخدذرزسشصضWELCOMTBAHRINwelcomtbahrinطظعغfqklmnhو0123456789@#$%'

export default function WelcomeIntro({ onComplete }) {
  const wrapRef    = useRef(null)
  const trackRef   = useRef(null)
  const textBoxRef = useRef(null)
  const [phase, setPhase]       = useState('slot')   // 'slot' | 'decode' | 'done'
  const [liveText, setLiveText] = useState('')
  const [isArabic, setIsArabic] = useState(false)
  const [showSub, setShowSub]   = useState(false)
  const rafRef = useRef(null)

  // ── Phase 1: slot machine ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'slot') return

    gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })

    const items = [...SLOT_PHRASES, ARABIC_FINAL]
    const ITEM_H   = 80
    const FAST_DUR = 0.07
    const SLOW_DURS = [0.12, 0.17, 0.25, 0.36, 0.52]

    const track = trackRef.current
    track.innerHTML = ''
    items.forEach((txt) => {
      const el = document.createElement('div')
      el.style.cssText = `
        height:${ITEM_H}px; display:flex; align-items:center; justify-content:center;
        font-size:clamp(1.6rem,6vw,3rem); font-weight:700; color:#BA0C2F;
        letter-spacing:0.03em; white-space:nowrap;
        font-family:${txt === ARABIC_FINAL ? '"Noto Sans Arabic","Geeza Pro",sans-serif' : '"Inter",system-ui,sans-serif'};
        direction:${txt === ARABIC_FINAL ? 'rtl' : 'ltr'};
      `
      el.textContent = txt
      track.appendChild(el)
    })

    gsap.set(track, { y: 0 })

    const tl = gsap.timeline({ onComplete: () => setPhase('decode') })
    const fastItems = items.length - 1 - SLOW_DURS.length
    for (let i = 0; i < fastItems; i++) {
      tl.to(track, { y: `-=${ITEM_H}`, duration: FAST_DUR, ease: 'none' })
    }
    SLOW_DURS.forEach((dur) => {
      tl.to(track, { y: `-=${ITEM_H}`, duration: dur, ease: 'power2.out' })
    })

    return () => tl.kill()
  }, [phase])

  // ── Phase 2: Arabic slam-in → scramble → resolve to English ─────────────
  useEffect(() => {
    if (phase !== 'decode') return

    // Show Arabic first
    setIsArabic(true)
    setLiveText(ARABIC_FINAL)

    // Punch in
    gsap.fromTo(textBoxRef.current,
      { scale: 1.12, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.32, ease: 'back.out(2)' }
    )

    // Hold Arabic clearly, THEN scramble-decode into English
    const holdTimer = setTimeout(() => {
      setIsArabic(false)   // switch to LTR font mid-animation

      const DECODE_MS   = 1400   // total decode duration
      const REVEAL_LAG  = 0.35   // head start before chars are revealed (0→1)
      const start = performance.now()

      function tick(now) {
        const t = Math.min((now - start) / DECODE_MS, 1)

        // Reveal progress: starts after lag, finishes at 1
        const revealProgress = Math.max(0, (t - REVEAL_LAG) / (1 - REVEAL_LAG))

        const result = ENGLISH_FINAL
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            const charThreshold = i / ENGLISH_FINAL.length
            // Character is locked in once revealProgress passes its threshold
            if (revealProgress >= charThreshold + 0.08) return char
            // Otherwise show a random char from the mixed pool
            return MIXED_CHARS[Math.floor(Math.random() * MIXED_CHARS.length)]
          })
          .join('')

        setLiveText(result)

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setLiveText(ENGLISH_FINAL)
          setShowSub(true)

          // Exit fade
          setTimeout(() => {
            gsap.to(wrapRef.current, {
              opacity: 0,
              duration: 0.8,
              ease: 'power2.inOut',
              onComplete: () => { setPhase('done'); onComplete?.() }
            })
          }, 1400)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }, 700)  // hold Arabic for 700ms before scramble starts

    return () => {
      clearTimeout(holdTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, onComplete])

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#fafafa',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Radial blush */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(186,12,47,0.07) 0%, transparent 70%)',
      }} />

      {/* Top flag stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg,#BA0C2F,#e8163b 50%,#BA0C2F)',
      }} />

      {/* Stars */}
      <div style={{
        marginBottom: '1.5rem', fontSize: '1.2rem',
        opacity: 0.2, color: '#BA0C2F', letterSpacing: '0.6rem',
      }}>✦ ✦ ✦</div>

      {/* Slot window */}
      {phase === 'slot' && (
        <div style={{
          height: 80, overflow: 'hidden',
          width: '100%', maxWidth: 640,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
          maskImage:        'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
        }}>
          <div ref={trackRef} />
        </div>
      )}

      {/* Decode text */}
      {phase === 'decode' && (
        <div ref={textBoxRef} style={{ textAlign: 'center', padding: '0 2rem' }}>
          <p style={{
            fontFamily: isArabic
              ? '"Noto Sans Arabic","Geeza Pro",sans-serif'
              : '"Inter",system-ui,sans-serif',
            direction:   isArabic ? 'rtl' : 'ltr',
            fontSize:    'clamp(1.8rem,7vw,3.4rem)',
            fontWeight:  700,
            color:       '#BA0C2F',
            margin:      0,
            lineHeight:  1.3,
            minHeight:   '4.5rem',
            letterSpacing: isArabic ? '0' : '0.02em',
          }}>
            {liveText}
          </p>

          {showSub && (
            <p style={{
              marginTop: '1rem',
              fontFamily: '"Inter",system-ui,sans-serif',
              fontSize:   'clamp(0.7rem,2.2vw,0.9rem)',
              color:      '#BA0C2F',
              opacity:    0,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              animation:  'fadeUp 0.7s ease 0.1s forwards',
            }}>
              Your journey starts here
            </p>
          )}
        </div>
      )}

      {/* Pulsing dots during slot */}
      {phase === 'slot' && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.4rem' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#BA0C2F', opacity: 0.35, display: 'inline-block',
              animation: `dot 1.1s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes dot {
          0%,100% { opacity:0.15; transform:scale(0.8); }
          50%      { opacity:0.55; transform:scale(1.2); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:0.45; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}
