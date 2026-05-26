import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// Languages that fly past (slot machine)
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

const ARABIC_FINAL = 'مرحباً بكم في البحرين'
const ENGLISH_FINAL = 'Welcome to Bahrain'

const ARABIC_CHARS = 'أبتثجحخدذرزسشصضطظعغفقكلمنهويءآإ'
const LATIN_CHARS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function scramble(target, progress, charPool) {
  return target
    .split('')
    .map((char, i) => {
      if (char === ' ' || char === 'ً' || char === 'ّ') return char
      const revealed = progress * target.length > i
      if (revealed) return char
      return charPool[Math.floor(Math.random() * charPool.length)]
    })
    .join('')
}

export default function WelcomeIntro({ onComplete }) {
  const wrapRef    = useRef(null)
  const trackRef   = useRef(null)   // the scrolling slot track
  const textBoxRef = useRef(null)   // the locked-in text after slot stops
  const [phase, setPhase]         = useState('slot')  // 'slot' | 'arabic' | 'english' | 'done'
  const [liveText, setLiveText]   = useState('')
  const [isArabic, setIsArabic]   = useState(false)
  const rafRef = useRef(null)

  // ─── Phase 1: slot machine ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'slot') return

    // Fade container in
    gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 })

    const items = [...SLOT_PHRASES, ARABIC_FINAL]
    const ITEM_H = 80           // px per slot item
    const FAST_DUR = 0.08       // seconds per item while spinning fast
    const SLOW_DURS = [0.13, 0.18, 0.26, 0.38, 0.55]  // decelerate last few

    // Build slot items in DOM
    const track = trackRef.current
    track.innerHTML = ''
    items.forEach((txt) => {
      const el = document.createElement('div')
      el.style.cssText = `
        height:${ITEM_H}px; display:flex; align-items:center; justify-content:center;
        font-size: clamp(1.6rem,6vw,3rem); font-weight:700; color:#BA0C2F;
        letter-spacing:0.03em; white-space:nowrap; will-change:transform;
      `
      // Arabic gets its own font
      if (txt === ARABIC_FINAL) {
        el.style.fontFamily = '"Noto Sans Arabic","Geeza Pro",sans-serif'
        el.style.direction   = 'rtl'
      } else {
        el.style.fontFamily  = '"Inter",system-ui,sans-serif'
      }
      el.textContent = txt
      track.appendChild(el)
    })

    // Start at top, animate downward (translate Y negative = move content up = new items appear from top)
    // We move the track UP so items scroll into view from the top
    gsap.set(track, { y: 0 })

    const tl = gsap.timeline({
      onComplete: () => {
        // Slot has stopped on Arabic
        setPhase('arabic')
      }
    })

    // Fast spin through each phrase
    const fastItems = items.length - 1 - SLOW_DURS.length
    for (let i = 0; i < fastItems; i++) {
      tl.to(track, { y: `-=${ITEM_H}`, duration: FAST_DUR, ease: 'none' })
    }
    // Decelerate into arabic
    SLOW_DURS.forEach((dur) => {
      tl.to(track, { y: `-=${ITEM_H}`, duration: dur, ease: 'power2.out' })
    })

    return () => { tl.kill() }
  }, [phase])

  // ─── Phase 2: decode Arabic ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'arabic') return

    setIsArabic(true)
    setLiveText(ARABIC_FINAL)

    // First: slam the textBox in (scale punch)
    gsap.fromTo(textBoxRef.current,
      { scale: 1.15, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
    )

    // Brief pause then start decode
    const pause = setTimeout(() => {
      const DECODE_MS = 1100
      const start = performance.now()

      function tick(now) {
        const progress = Math.min((now - start) / DECODE_MS, 1)
        setLiveText(scramble(ARABIC_FINAL, progress, ARABIC_CHARS))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setLiveText(ARABIC_FINAL)
          // Hold Arabic a moment, then switch to English
          setTimeout(() => setPhase('english'), 900)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }, 300)

    return () => {
      clearTimeout(pause)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase])

  // ─── Phase 3: crossfade Arabic → English ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'english') return
    if (!textBoxRef.current) return

    setIsArabic(false)
    setLiveText(ENGLISH_FINAL)

    gsap.fromTo(textBoxRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    )

    // Fade out whole screen after hold
    const exit = setTimeout(() => {
      gsap.to(wrapRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut',
        onComplete: () => { setPhase('done'); onComplete && onComplete() }
      })
    }, 1500)

    return () => clearTimeout(exit)
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
      {/* Background radial blush */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 65% 45% at 50% 50%, rgba(186,12,47,0.07) 0%, transparent 70%)',
      }} />

      {/* Top flag stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg,#BA0C2F,#e8163b 50%,#BA0C2F)',
      }} />

      {/* Star decoration */}
      <div style={{
        marginBottom: '1.5rem', fontSize: '1.2rem',
        opacity: 0.2, color: '#BA0C2F', letterSpacing: '0.6rem',
      }}>✦ ✦ ✦</div>

      {/* ── SLOT WINDOW ── clipped viewport, only visible during 'slot' phase */}
      {phase === 'slot' && (
        <div style={{
          position: 'relative',
          height: 80, overflow: 'hidden',
          width: '100%', maxWidth: 600,
          // top+bottom fade masks
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
          maskImage:        'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
        }}>
          <div ref={trackRef} style={{ willChange: 'transform' }} />
        </div>
      )}

      {/* ── LOCKED TEXT (arabic + english) ── */}
      {(phase === 'arabic' || phase === 'english') && (
        <div
          ref={textBoxRef}
          style={{
            textAlign: 'center',
            padding: '0 2rem',
          }}
        >
          <p style={{
            fontFamily: isArabic
              ? '"Noto Sans Arabic","Geeza Pro",sans-serif'
              : '"Inter",system-ui,sans-serif',
            direction:   isArabic ? 'rtl' : 'ltr',
            fontSize:    'clamp(1.8rem,7vw,3.2rem)',
            fontWeight:  700,
            color:       '#BA0C2F',
            margin:      0,
            lineHeight:  1.3,
            minHeight:   '4rem',
          }}>
            {liveText}
          </p>

          {phase === 'english' && (
            <p style={{
              marginTop: '0.9rem',
              fontFamily: '"Inter",system-ui,sans-serif',
              fontSize:   'clamp(0.7rem,2.2vw,0.9rem)',
              color:      '#BA0C2F',
              opacity:    0.45,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              animation:  'fadeUp 0.6s ease forwards',
            }}>
              Your journey starts here
            </p>
          )}
        </div>
      )}

      {/* Pulsing dots while slot is spinning */}
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
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:0.45; transform:translateY(0); }
        }
      `}</style>
    </div>
  )
}
