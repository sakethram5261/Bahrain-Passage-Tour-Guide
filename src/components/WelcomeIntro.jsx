import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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
const MIXED_CHARS   = 'أبتثجحخدذرزWELCOMTBAHRINwelcomtbahrinطظعغfqklmnhو0123456789@#$%'

const ITEM_H = 88 // px — height of each slot strip item

// ─────────────────────────────────────────────────────────────────────────────
// ScrambleLetter
// Direct DOM mutation via useRef — zero useState, zero React re-renders at 60 fps.
// Blurs in with a damped-spring bounce from below.
// ─────────────────────────────────────────────────────────────────────────────
function ScrambleLetter({ char, delay, duration = 700 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (char === ' ') {
      el.style.cssText = 'display:inline-block;opacity:1;filter:blur(0px);transform:translateY(0px);white-space:pre;will-change:transform,filter,opacity'
      el.textContent = '\u00A0'
      return
    }

    el.style.cssText = 'display:inline-block;opacity:0;filter:blur(6px);transform:translateY(18px);will-change:transform,filter,opacity'
    el.textContent = MIXED_CHARS[0]

    let rafId
    const tid = setTimeout(() => {
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1)
        const e = 1 - Math.pow(1 - p, 3)                         // ease-out cubic
        const springY = 18 * (1 - e) * Math.cos(e * Math.PI * 1.4) // damped spring

        el.style.opacity   = String(Math.min(e * 1.12, 1))
        el.style.filter    = `blur(${(1 - e) * 6}px)`
        el.style.transform = `translateY(${springY}px)`

        if (p < 1) {
          el.textContent = MIXED_CHARS[Math.floor(Math.random() * MIXED_CHARS.length)]
          rafId = requestAnimationFrame(tick)
        } else {
          el.style.opacity   = '1'
          el.style.filter    = 'blur(0px)'
          el.style.transform = 'translateY(0px)'
          el.textContent     = char
        }
      }
      rafId = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(tid)
      cancelAnimationFrame(rafId)
    }
  }, [char, delay, duration])

  return (
    <span
      ref={ref}
      style={{
        display: 'inline-block',
        opacity: 0,
        filter: 'blur(6px)',
        transform: 'translateY(18px)',
        whiteSpace: 'normal',
        willChange: 'transform, filter, opacity',
        transition: 'none',
      }}
    >
      {char}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DissolvingLetter
// Direct DOM mutation — floats up and blurs out with accelerating ease.
// ─────────────────────────────────────────────────────────────────────────────
function DissolvingLetter({ char, delay, duration = 420 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.cssText = 'display:inline-block;opacity:1;filter:blur(0px);transform:translateY(0px);will-change:transform,filter,opacity'

    let rafId
    const tid = setTimeout(() => {
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1)
        const e = p * p * p // ease-in cubic — accelerates as it fades out

        el.style.opacity   = String(1 - p)
        el.style.filter    = `blur(${e * 14}px)`
        el.style.transform = `translateY(${-e * 16}px)`

        if (p < 1) rafId = requestAnimationFrame(tick)
      }
      rafId = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(tid)
      cancelAnimationFrame(rafId)
    }
  }, [char, delay, duration])

  return (
    <span
      ref={ref}
      style={{
        display: 'inline-block',
        opacity: 1,
        filter: 'blur(0px)',
        transform: 'translateY(0px)',
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        willChange: 'transform, filter, opacity',
        transition: 'none',
      }}
    >
      {char}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — detect script family for font selection
// ─────────────────────────────────────────────────────────────────────────────
function fontFor(txt) {
  if (txt === ARABIC_FINAL) return '"Noto Sans Arabic","Geeza Pro","Arial Unicode MS",sans-serif'
  if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(txt)) return 'system-ui,"Noto Sans CJK",sans-serif'
  if (/[\u0400-\u04FF]/.test(txt)) return 'system-ui,"Noto Sans",sans-serif'
  return '"Playfair Display","Georgia",serif'
}

// ─────────────────────────────────────────────────────────────────────────────
// WelcomeIntro
// ─────────────────────────────────────────────────────────────────────────────
export default function WelcomeIntro({ onComplete }) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const wrapRef        = useRef(null)
  const glowRef        = useRef(null)
  const trackRef       = useRef(null)
  const slotViewRef    = useRef(null)
  const arabicViewRef  = useRef(null)
  const morphViewRef   = useRef(null)
  const arabicLineRef  = useRef(null)
  const taglineRef     = useRef(null)
  const morphLineRef   = useRef(null)
  const slotTlRef      = useRef(null)
  const blurTlRef      = useRef(null)
  const timersRef      = useRef([])
  const skippedRef     = useRef(false)
  const onCompleteRef  = useRef(onComplete)

  // Whether morph letters are mounted (they mount when morph phase begins,
  // so their per-letter delays are relative to morph start — not component mount)
  const [showMorphLetters, setShowMorphLetters] = useState(false)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // ── Ambient mouse-reactive glow (pure GSAP, zero re-renders) ─────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!glowRef.current) return
      const x = (e.clientX / window.innerWidth)  * 100
      const y = (e.clientY / window.innerHeight) * 100
      gsap.to(glowRef.current, {
        background: `radial-gradient(ellipse 85% 65% at ${x}% ${y}%, rgba(186,12,47,0.07) 0%, transparent 72%)`,
        duration: 1.8,
        ease: 'power2.out',
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ── Exit / Skip ───────────────────────────────────────────────────────────
  const exitIntro = useCallback(() => {
    if (skippedRef.current) return
    skippedRef.current = true

    // Kill all running animations
    slotTlRef.current?.kill()
    blurTlRef.current?.kill()
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    gsap.killTweensOf([
      wrapRef.current, glowRef.current, trackRef.current,
      slotViewRef.current, arabicViewRef.current, morphViewRef.current,
      taglineRef.current, morphLineRef.current, arabicLineRef.current,
    ])

    // Elegant exit — slight scale gives a sense of "opening into" the app
    const el = wrapRef.current
    if (!el) { onCompleteRef.current?.(); return }
    gsap.to(el, {
      opacity: 0,
      scale: 1.014,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: () => onCompleteRef.current?.(),
    })
  }, [])

  // ── Main animation sequence ───────────────────────────────────────────────
  useEffect(() => {
    const wrap       = wrapRef.current
    const track      = trackRef.current
    const slotView   = slotViewRef.current
    const arabicView = arabicViewRef.current
    const morphView  = morphViewRef.current
    if (!wrap || !track || !slotView || !arabicView || !morphView) return

    // ── Initial state setup ──────────────────────────────────────────────────
    gsap.set(wrap,       { opacity: 0, scale: 1 })
    gsap.set(arabicView, { opacity: 0, y: 14, pointerEvents: 'none' })
    gsap.set(morphView,  { opacity: 0, pointerEvents: 'none' })
    gsap.set(slotView,   { opacity: 1 })
    if (taglineRef.current)   gsap.set(taglineRef.current,  { opacity: 0, y: 18, filter: 'blur(4px)' })
    if (morphLineRef.current) gsap.set(morphLineRef.current, { width: 0 })
    if (arabicLineRef.current) gsap.set(arabicLineRef.current, { width: 0 })

    // ── Screen fade-in ───────────────────────────────────────────────────────
    gsap.to(wrap, { opacity: 1, duration: 0.75, ease: 'power2.out' })

    // ── Build slot strip ─────────────────────────────────────────────────────
    const items = [...SLOT_PHRASES, ARABIC_FINAL]
    track.innerHTML = ''

    items.forEach((txt) => {
      const isArabic = txt === ARABIC_FINAL
      const el = document.createElement('div')
      el.style.cssText = `
        height:${ITEM_H}px; display:flex; align-items:center; justify-content:center;
        font-size:clamp(2rem,7vw,3.3rem); font-weight:800; color:#BA0C2F;
        letter-spacing:${isArabic ? '0.01em' : '0.025em'};
        white-space:nowrap;
        font-family:${fontFor(txt)};
        direction:${isArabic ? 'rtl' : 'ltr'};
        user-select:none;
      `
      el.textContent = txt
      track.appendChild(el)
    })

    const endY = -((items.length - 1) * ITEM_H) // final track position (Arabic centered)
    gsap.set(track, { y: 0, filter: 'blur(0px)' })

    // ── Slot machine — 3-phase mechanical physics ─────────────────────────────
    //  Phase A: Build momentum (slow → fast)       0.85s  power2.in
    //  Phase B: Peak velocity (linear)             1.05s  none
    //  Phase C: Snap to Arabic (fast → precise)    1.45s  power4.out
    // Total scroll duration: 3.35s  |  Timeline delay: 0.55s

    // Motion blur lives on the VIEWPORT CONTAINER (slotView), completely separate
    // from the track translation tween — no per-frame gsap.set conflicts.
    blurTlRef.current = gsap.timeline({ delay: 0.55 })
      .to(slotView, { filter: 'blur(9px)',  duration: 1.9, ease: 'power2.inOut' })
      .to(slotView, { filter: 'blur(0px)',  duration: 1.45, ease: 'power4.out' })

    slotTlRef.current = gsap.timeline({
      delay: 0.55,
      onComplete: onSlotComplete,
    })
      .to(track, { y: endY * 0.28, duration: 0.85, ease: 'power2.in'  })
      .to(track, { y: endY * 0.75, duration: 1.05, ease: 'none'       })
      .to(track, { y: endY,        duration: 1.45, ease: 'power4.out' })

    function onSlotComplete() {
      if (skippedRef.current) return
      gsap.set(slotView, { filter: 'blur(0px)' })

      // ── Cross-fade: slot → Arabic hold ──────────────────────────────────────
      gsap.to(slotView, { opacity: 0, duration: 0.5, ease: 'power2.inOut' })

      gsap.set(arabicView, { pointerEvents: 'auto' })
      gsap.to(arabicView, {
        opacity: 1, y: 0,
        duration: 0.65, delay: 0.2,
        ease: 'power3.out',
        onComplete: () => {
          // Decorative line expands under Arabic
          if (arabicLineRef.current) {
            gsap.to(arabicLineRef.current, { width: 80, duration: 0.7, ease: 'power3.out' })
          }

          // ── Hold Arabic, then transition to morph ────────────────────────────
          const holdTimer = setTimeout(() => {
            if (skippedRef.current) return

            gsap.to(arabicView, { opacity: 0, y: -10, duration: 0.42, ease: 'power2.in' })

            // Mount letters then fade in morphView
            setShowMorphLetters(true)
            gsap.set(morphView, { pointerEvents: 'auto' })
            gsap.to(morphView, {
              opacity: 1,
              duration: 0.38, delay: 0.18,
              ease: 'power2.out',
              onComplete: () => {
                if (skippedRef.current) return

                // Tagline + line appear after English letters finish settling
                // ENGLISH_FINAL.length=18, max delay = 180+(17*48) = 996ms, duration=700ms → settle≈1696ms
                const taglineTimer = setTimeout(() => {
                  if (skippedRef.current) return
                  if (taglineRef.current) {
                    gsap.to(taglineRef.current, {
                      opacity: 0.72, y: 0, filter: 'blur(0px)',
                      duration: 1.0, ease: 'power3.out',
                    })
                  }
                  if (morphLineRef.current) {
                    gsap.to(morphLineRef.current, { width: 110, duration: 0.9, delay: 0.4, ease: 'power3.out' })
                  }
                }, 1750)
                timersRef.current.push(taglineTimer)

                // ── Exit after tagline reads ──────────────────────────────────
                const exitTimer = setTimeout(() => {
                  if (!skippedRef.current) exitIntro()
                }, 1750 + 1800)
                timersRef.current.push(exitTimer)
              },
            })
          }, 1050)
          timersRef.current.push(holdTimer)
        },
      })
    }

    return () => {
      slotTlRef.current?.kill()
      blurTlRef.current?.kill()
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      gsap.killTweensOf([
        wrap, glowRef.current, track, slotView, arabicView, morphView,
        taglineRef.current, morphLineRef.current, arabicLineRef.current,
      ])
    }
  }, [exitIntro])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#FAF9F6',
        backgroundImage: [
          'radial-gradient(ellipse 80% 55% at 50% 42%, rgba(186,12,47,0.042) 0%, transparent 72%)',
          'repeating-linear-gradient(90deg, rgba(186,12,47,0.010) 0px, rgba(186,12,47,0.010) 1px, transparent 1px, transparent 24px)',
          'repeating-linear-gradient(0deg,  rgba(186,12,47,0.010) 0px, rgba(186,12,47,0.010) 1px, transparent 1px, transparent 24px)',
        ].join(','),
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: 0,
        willChange: 'opacity, transform',
      }}
    >
      {/* ── Ambient glow (mouse-reactive) ──────────────────────────────────── */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 85% 65% at 50% 42%, rgba(186,12,47,0.06) 0%, transparent 72%)',
        }}
      />

      {/* ── Bahrain flag: top serrated band ────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
        <div style={{
          height: 7,
          background: 'linear-gradient(90deg, #8c0820, #BA0C2F 28%, #d41737 52%, #BA0C2F 76%, #8c0820)',
          boxShadow: '0 2px 14px rgba(186,12,47,0.20)',
        }} />
        <svg viewBox="0 0 1200 14" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block' }}>
          <path
            d="M0,0 L50,11 L100,0 L150,11 L200,0 L250,11 L300,0 L350,11 L400,0 L450,11 L500,0 L550,11 L600,0 L650,11 L700,0 L750,11 L800,0 L850,11 L900,0 L950,11 L1000,0 L1050,11 L1100,0 L1150,11 L1200,0 L1200,14 L0,14 Z"
            fill="#FAF9F6"
          />
        </svg>
      </div>

      {/* ── Bahrain flag: bottom serrated band ─────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2 }}>
        <svg viewBox="0 0 1200 14" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block', transform: 'scaleY(-1)' }}>
          <path
            d="M0,0 L50,11 L100,0 L150,11 L200,0 L250,11 L300,0 L350,11 L400,0 L450,11 L500,0 L550,11 L600,0 L650,11 L700,0 L750,11 L800,0 L850,11 L900,0 L950,11 L1000,0 L1050,11 L1100,0 L1150,11 L1200,0 L1200,14 L0,14 Z"
            fill="#FAF9F6"
          />
        </svg>
        <div style={{
          height: 7,
          background: 'linear-gradient(90deg, #8c0820, #BA0C2F 28%, #d41737 52%, #BA0C2F 76%, #8c0820)',
          boxShadow: '0 -2px 14px rgba(186,12,47,0.20)',
        }} />
      </div>

      {/* ── Text stages container ───────────────────────────────────────────── */}
      {/*    All three stages are always mounted. GSAP controls their opacity.  */}
      {/*    This eliminates all DOM-swap flashes between phases.               */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}>

        {/* ── STAGE 1: Slot machine ─────────────────────────────────────────── */}
        <div
          ref={slotViewRef}
          style={{
            position: 'absolute',
            width: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Viewport window with fade masks top and bottom */}
          <div style={{
            height: ITEM_H,
            overflow: 'hidden',
            width: '100%', maxWidth: 780,
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
            maskImage:        'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
          }}>
            <div ref={trackRef} style={{ willChange: 'transform' }} />
          </div>

          {/* Loading dots */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#BA0C2F', display: 'inline-block',
                  animation: `introDot 1.3s ease-in-out ${i * 0.26}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* ── STAGE 2: Arabic hold ─────────────────────────────────────────── */}
        <div
          ref={arabicViewRef}
          style={{
            position: 'absolute',
            width: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <p style={{
            fontFamily: '"Noto Sans Arabic","Geeza Pro","Arial Unicode MS",sans-serif',
            direction: 'rtl',
            fontSize: 'clamp(2rem,7.2vw,3.4rem)',
            fontWeight: 800,
            color: '#BA0C2F',
            margin: 0,
            letterSpacing: '0.01em',
            lineHeight: 1.25,
            textShadow: '0 4px 28px rgba(186,12,47,0.10)',
            userSelect: 'none',
          }}>
            {ARABIC_FINAL}
          </p>
          {/* Decorative expanding underline — animated by GSAP */}
          <div
            ref={arabicLineRef}
            style={{
              marginTop: '1rem',
              height: 1.5,
              width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(186,12,47,0.42), transparent)',
              borderRadius: 1,
            }}
          />
        </div>

        {/* ── STAGE 3: Morph (Arabic dissolves, English scrambles in) ─────── */}
        <div
          ref={morphViewRef}
          style={{
            position: 'absolute',
            width: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            opacity: 0,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {/* Letter animations — only mount when morph phase begins so that    */}
          {/* per-letter delays are correctly relative to morph start, not mount */}
          {showMorphLetters && (
            <div style={{
              position: 'relative',
              height: ITEM_H,
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'visible',
            }}>
              {/* Arabic dissolving out */}
              <div style={{
                position: 'absolute',
                fontFamily: '"Noto Sans Arabic","Geeza Pro","Arial Unicode MS",sans-serif',
                direction: 'rtl',
                fontSize: 'clamp(2rem,7.2vw,3.4rem)',
                fontWeight: 800,
                color: '#BA0C2F',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textShadow: '0 4px 28px rgba(186,12,47,0.10)',
                userSelect: 'none',
              }}>
                {ARABIC_FINAL.split('').map((c, i) => (
                  <DissolvingLetter key={i} char={c} delay={i * 24} duration={420} />
                ))}
              </div>

              {/* English scrambling in */}
              <div style={{
                position: 'absolute',
                fontFamily: '"Playfair Display","Georgia",serif',
                fontSize: 'clamp(2rem,7.2vw,3.4rem)',
                fontWeight: 800,
                color: '#BA0C2F',
                letterSpacing: '0.025em',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textShadow: '0 4px 28px rgba(186,12,47,0.10)',
                userSelect: 'none',
              }}>
                {ENGLISH_FINAL.split('').map((c, i) => (
                  <ScrambleLetter key={i} char={c} delay={180 + i * 48} duration={700} />
                ))}
              </div>
            </div>
          )}

          {/* Tagline — always in morphView, GSAP animates opacity/y from initial set */}
          <p
            ref={taglineRef}
            style={{
              marginTop: '1.6rem',
              fontFamily: '"Playfair Display","Georgia",serif',
              fontStyle: 'italic',
              fontSize: 'clamp(0.68rem,1.85vw,0.82rem)',
              color: '#BA0C2F',
              opacity: 0,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              userSelect: 'none',
              margin: '1.6rem 0 0',
              padding: 0,
            }}
          >
            مرحباً &nbsp;·&nbsp; Your Journey Awaits
          </p>

          {/* Decorative expanding underline */}
          <div
            ref={morphLineRef}
            style={{
              marginTop: '0.75rem',
              height: 1,
              width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(186,12,47,0.38), transparent)',
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* ── Skip Intro — refined pill button ───────────────────────────────── */}
      <button
        onClick={exitIntro}
        style={{
          position: 'absolute',
          bottom: '2.4rem',
          right: '2.4rem',
          background: 'rgba(250,249,246,0.6)',
          border: '1px solid rgba(186,12,47,0.25)',
          borderRadius: '100px',
          color: '#BA0C2F',
          opacity: 0.55,
          fontSize: '0.72rem',
          fontFamily: '"Playfair Display","Georgia",serif',
          fontWeight: 700,
          fontStyle: 'italic',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '0.52rem 1.2rem',
          transition: 'opacity 0.22s ease, border-color 0.22s ease, background 0.22s ease, transform 0.22s ease',
          zIndex: 10000,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.opacity     = '1'
          e.currentTarget.style.borderColor = 'rgba(186,12,47,0.6)'
          e.currentTarget.style.background  = 'rgba(250,249,246,0.85)'
          e.currentTarget.style.transform   = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity     = '0.55'
          e.currentTarget.style.borderColor = 'rgba(186,12,47,0.25)'
          e.currentTarget.style.background  = 'rgba(250,249,246,0.6)'
          e.currentTarget.style.transform   = 'none'
        }}
      >
        Skip Intro →
      </button>

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes introDot {
          0%, 100% { opacity: 0.18; transform: scale(0.75) translateY(0);    }
          50%       { opacity: 0.80; transform: scale(1.25) translateY(-3px); }
        }
      `}</style>
    </div>
  )
}
