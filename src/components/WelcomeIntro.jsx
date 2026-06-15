import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SLOT_PHRASES = [
  'Bienvenue à Bahreïn',       // French
  '巴林欢迎您',                 // Chinese
  'Bienvenido a Baréin',       // Spanish
  'Willkommen in Bahrain',     // German
  'Benvenuti in Bahrein',      // Italian
  'Добро пожаловать в Бахрейн', // Russian
  'バーレーンへようこそ',       // Japanese
  '바레인에 오신 것을 환영합니다', // Korean
  'Bem-vindo ao Bahrein',      // Portuguese
  'Bahreyn\'e hoş geldiniz',   // Turkish
  'به بحرین خوش آمدید',       // Persian
  'बहरीन में आपका स्वागत है',    // Hindi
  'Καλώς ήρθατε στο Μπαχρέιν',  // Greek
  'Welkom in Bahrein',         // Dutch
  'Välkommen till Bahrain',    // Swedish
  'Witamy w Bahrajnie',        // Polish
  'Chào mừng đến với Bahrain',  // Vietnamese
  'Selamat datang ke Bahrain', // Malay/Indonesian
]

const ARABIC_FINAL  = 'مرحباً بكم في البحرين'
const ENGLISH_FINAL = 'Welcome to Bahrain'
const MIXED_CHARS   = 'أبتثجحخدذرزWELCOMTBAHRINwelcomtbahrinطظعغfqklmnhو0123456789@#$%'

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
// Helper — detect script family for font selection
// ─────────────────────────────────────────────────────────────────────────────
function fontFor(txt) {
  if (txt === ARABIC_FINAL || /[\u0600-\u06FF]/.test(txt)) return '"Noto Sans Arabic","Geeza Pro","Arial Unicode MS",sans-serif'
  if (/[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/.test(txt)) return 'system-ui,"Noto Sans CJK",sans-serif'
  if (/[\u0400-\u04FF]/.test(txt)) return 'system-ui,"Noto Sans",sans-serif'
  if (/[\u0900-\u097F]/.test(txt)) return '"Noto Sans Devanagari",sans-serif'
  return '"Playfair Display","Georgia",serif'
}

// ─────────────────────────────────────────────────────────────────────────────
// WelcomeIntro
// ─────────────────────────────────────────────────────────────────────────────
export default function WelcomeIntro({ onComplete }) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const wrapRef        = useRef(null)
  const glowRef        = useRef(null)
  const compassRef     = useRef(null)
  const slotTextRef    = useRef(null)
  const loadingDotsRef = useRef(null)
  const slotViewRef    = useRef(null)
  const morphViewRef   = useRef(null)
  const arabicLineRef  = useRef(null)
  const taglineRef     = useRef(null)
  const morphLineRef   = useRef(null)
  const slotTlRef      = useRef(null)
  const timersRef      = useRef([])
  const skippedRef     = useRef(false)
  const onCompleteRef  = useRef(onComplete)

  const [showMorphLetters, setShowMorphLetters] = useState(false)

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  // ── Ambient rotating compass watermark ───────────────────────────────────
  useEffect(() => {
    if (!compassRef.current) return
    const tween = gsap.to(compassRef.current, {
      rotation: 360,
      duration: 120,
      repeat: -1,
      ease: 'none',
    })
    return () => tween.kill()
  }, [])

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
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    gsap.killTweensOf([
      wrapRef.current, glowRef.current,
      slotViewRef.current, morphViewRef.current, slotTextRef.current,
      taglineRef.current, morphLineRef.current, arabicLineRef.current,
    ])

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
    const wrap        = wrapRef.current
    const slotView    = slotViewRef.current
    const morphView   = morphViewRef.current
    const slotText    = slotTextRef.current
    const loadingDots = loadingDotsRef.current

    if (!wrap || !slotView || !morphView || !slotText) {
      return
    }

    // ── Initial state setup ──────────────────────────────────────────────────
    gsap.set(wrap,       { opacity: 0, scale: 1 })
    gsap.set(morphView,  { opacity: 0, pointerEvents: 'none' })
    gsap.set(slotView,   { opacity: 1 })
    gsap.set(slotText,   { opacity: 1, scale: 1, filter: 'blur(0px)' })
    if (loadingDots)          gsap.set(loadingDots,         { opacity: 1 })
    if (taglineRef.current)   gsap.set(taglineRef.current,  { opacity: 0, y: 18, filter: 'blur(4px)' })
    if (morphLineRef.current) gsap.set(morphLineRef.current, { width: 0 })
    if (arabicLineRef.current) gsap.set(arabicLineRef.current, { width: 0, opacity: 1 })

    // ── Screen fade-in ───────────────────────────────────────────────────────
    gsap.to(wrap, { opacity: 1, duration: 0.75, ease: 'power2.out' })

    // ── Phase 1: Fly-through of languages (centered and still) ────────────────
    const flyObj = { index: 0 }
    
    const startTimer = setTimeout(() => {
      if (skippedRef.current) return

      if (loadingDots) {
        gsap.to(loadingDots, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' })
      }

      slotTlRef.current = gsap.to(flyObj, {
        index: SLOT_PHRASES.length,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (skippedRef.current) return
          const idx = Math.floor(flyObj.index)
          const phrase = SLOT_PHRASES[Math.min(idx, SLOT_PHRASES.length - 1)]
          if (slotText.textContent !== phrase) {
            slotText.textContent = phrase
            slotText.style.fontFamily = fontFor(phrase)
            
            if (/[\u0600-\u06FF]/.test(phrase)) {
              slotText.style.direction = 'rtl'
            } else {
              slotText.style.direction = 'ltr'
            }
            
            // Pop effect in-place
            gsap.fromTo(slotText,
              { scale: 0.95, filter: 'blur(3px)', opacity: 0.8 },
              { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.08, ease: 'power1.out' }
            )
          }
        },
        onComplete: () => {
          if (skippedRef.current) return
          // Land on Arabic!
          slotText.textContent = ARABIC_FINAL
          slotText.style.fontFamily = fontFor(ARABIC_FINAL)
          slotText.style.direction = 'rtl'
          
          gsap.fromTo(slotText,
            { scale: 0.94, filter: 'blur(5px)', opacity: 0.7 },
            { 
              scale: 1, filter: 'blur(0px)', opacity: 1, 
              duration: 0.45, ease: 'power2.out',
              onComplete: onArabicLand
            }
          )
        }
      })
    }, 350)
    timersRef.current.push(startTimer)

    function onArabicLand() {
      if (skippedRef.current) return

      // Expand decorative line under Arabic
      if (arabicLineRef.current) {
        gsap.to(arabicLineRef.current, { width: 80, duration: 0.5, ease: 'power3.out' })
      }

      // Hold Arabic, then morph transition
      const holdTimer = setTimeout(() => {
        if (skippedRef.current) return

        // Fade out Arabic in-place with a smooth blur and scale-down
        gsap.to(slotText, {
          opacity: 0,
          filter: 'blur(10px)',
          scale: 0.96,
          duration: 0.35,
          ease: 'power2.inOut',
          onComplete: () => {
            if (skippedRef.current) return
            gsap.set(slotView, { opacity: 0 })
          }
        })

        if (arabicLineRef.current) {
          gsap.to(arabicLineRef.current, { opacity: 0, duration: 0.35, ease: 'power2.inOut' })
        }

        // Mount and fade in English scrambling text
        setShowMorphLetters(true)
        gsap.set(morphView, { pointerEvents: 'auto' })
        gsap.to(morphView, {
          opacity: 1,
          duration: 0.35,
          delay: 0.05,
          ease: 'power2.out',
          onComplete: () => {
            if (skippedRef.current) return

            // Tagline + line fade in after scramble settles
            const taglineTimer = setTimeout(() => {
              if (skippedRef.current) return
              if (taglineRef.current) {
                gsap.to(taglineRef.current, {
                  opacity: 0.8, y: 0, filter: 'blur(0px)',
                  duration: 0.6, ease: 'power3.out',
                })
              }
              if (morphLineRef.current) {
                gsap.to(morphLineRef.current, { width: 110, duration: 0.6, delay: 0.2, ease: 'power3.out' })
              }
            }, 800)
            timersRef.current.push(taglineTimer)

            // Exit intro to start app
            const exitTimer = setTimeout(() => {
              if (!skippedRef.current) exitIntro()
            }, 800 + 1000)
            timersRef.current.push(exitTimer)
          }
        })
      }, 500)
      timersRef.current.push(holdTimer)
    }

    return () => {
      slotTlRef.current?.kill()
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      gsap.killTweensOf([
        wrap, slotView, morphView, slotText, loadingDots,
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
        background: '#0F0C0B',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: 0,
        willChange: 'opacity, transform',
      }}
    >
      {/* ── Background Video / Image Fallback ─────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
        poster="/assets/images/bahrain_skyline.png"
      >
        <source src="/assets/videos/bahrain_timelapse.mp4" type="video/mp4" />
      </video>

      {/* ── Cinematic Dark Overlay ─────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(15, 12, 11, 0.72), rgba(15, 12, 11, 0.85))',
          zIndex: 1,
        }}
      />

      {/* ── Ambient glow (mouse-reactive, gold) ────────────────────────────── */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 85% 65% at 50% 42%, rgba(212,175,55,0.06) 0%, transparent 72%)',
          zIndex: 2,
        }}
      />

      {/* ── Centered Vintage Compass Rose Watermark (Subtle Gold/White) ─────── */}
      <svg
        ref={compassRef}
        viewBox="0 0 100 100"
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(280px, 55vw, 400px)',
          height: 'clamp(280px, 55vw, 400px)',
          opacity: 0.06,
          pointerEvents: 'none',
          color: '#D4AF37',
          zIndex: 2,
          willChange: 'transform',
        }}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        <circle cx="50" cy="50" r="45" strokeDasharray="2,2" />
        <circle cx="50" cy="50" r="38" />
        <circle cx="50" cy="50" r="12" strokeDasharray="1,1" />
        <circle cx="50" cy="50" r="4" />
        <path d="M 50,5 L 50,95 M 5,50 L 95,50" strokeWidth="0.8" />
        <path d="M 18.2,18.2 L 81.8,81.8 M 18.2,81.8 L 81.8,18.2" strokeWidth="0.4" />
        <path d="M 50,50 L 47,15 L 50,5 L 53,15 Z" fill="rgba(212,175,55,0.2)" />
        <path d="M 50,50 L 85,47 L 95,50 L 85,53 Z" fill="rgba(212,175,55,0.2)" />
        <path d="M 50,50 L 47,85 L 50,95 L 53,85 Z" fill="rgba(212,175,55,0.2)" />
        <path d="M 50,50 L 15,47 L 5,50 L 15,53 Z" fill="rgba(212,175,55,0.2)" />
        <path d="M 50,50 L 58,28 L 75,25 L 72,32 Z" fill="rgba(212,175,55,0.1)" strokeWidth="0.3" />
        <path d="M 50,50 L 72,68 L 75,75 L 58,72 Z" fill="rgba(212,175,55,0.1)" strokeWidth="0.3" />
        <path d="M 50,50 L 42,72 L 25,75 L 28,68 Z" fill="rgba(212,175,55,0.1)" strokeWidth="0.3" />
        <path d="M 50,50 L 28,32 L 25,25 L 42,28 Z" fill="rgba(212,175,55,0.1)" strokeWidth="0.3" />
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10
          const rad = (angle * Math.PI) / 180
          const x1 = 50 + 38 * Math.cos(rad)
          const y1 = 50 + 38 * Math.sin(rad)
          const x2 = 50 + (i % 3 === 0 ? 34 : 36) * Math.cos(rad)
          const y2 = 50 + (i % 3 === 0 ? 34 : 36) * Math.sin(rad)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 3 === 0 ? 0.6 : 0.3} />
        })}
      </svg>

      {/* ── Bahrain flag: top serrated band ────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
        <div style={{
          height: 7,
          background: 'linear-gradient(90deg, #8c0820, #BA0C2F 28%, #d41737 52%, #BA0C2F 76%, #8c0820)',
          boxShadow: '0 2px 14px rgba(186,12,47,0.20)',
        }} />
        <svg viewBox="0 0 1200 14" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block' }}>
          <path
            d="M0,0 L50,11 L100,0 L150,11 L200,0 L250,11 L300,0 L350,11 L400,0 L450,11 L500,0 L550,11 L600,0 L650,11 L700,0 L750,11 L800,0 L850,11 L900,0 L950,11 L1000,0 L1050,11 L1100,0 L1150,11 L1200,0 L1200,14 L0,14 Z"
            fill="url(#goldGrad)"
          />
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C1816" />
              <stop offset="100%" stopColor="#0F0C0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ── Bahrain flag: bottom serrated band ─────────────────────────────── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3 }}>
        <svg viewBox="0 0 1200 14" preserveAspectRatio="none" style={{ width: '100%', height: 14, display: 'block', transform: 'scaleY(-1)' }}>
          <path
            d="M0,0 L50,11 L100,0 L150,11 L200,0 L250,11 L300,0 L350,11 L400,0 L450,11 L500,0 L550,11 L600,0 L650,11 L700,0 L750,11 L800,0 L850,11 L900,0 L950,11 L1000,0 L1050,11 L1100,0 L1150,11 L1200,0 L1200,14 L0,14 Z"
            fill="url(#goldGradBottom)"
          />
          <defs>
            <linearGradient id="goldGradBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C1816" />
              <stop offset="100%" stopColor="#0F0C0B" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          height: 7,
          background: 'linear-gradient(90deg, #8c0820, #BA0C2F 28%, #d41737 52%, #BA0C2F 76%, #8c0820)',
          boxShadow: '0 -2px 14px rgba(186,12,47,0.20)',
        }} />
      </div>

      {/* ── Text stages container ───────────────────────────────────────────── */}
      <div 
        className="jn-intro-text-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          overflow: 'visible',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {/* 1. Main Text Container - perfectly still */}
        <div 
          className="jn-intro-main-text-box"
          style={{
            position: 'relative',
            height: 110,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          }}
        >
          {/* Stage 1 & 2: Slot Text / Arabic */}
          <div
            ref={slotViewRef}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              willChange: 'opacity, transform',
            }}
          >
            <div
              ref={slotTextRef}
              style={{
                fontSize: 'clamp(2rem,7.2vw,3.4rem)',
                fontWeight: 800,
                color: '#FAF9F6',
                textAlign: 'center',
                userSelect: 'none',
                fontFamily: '"Playfair Display","Georgia",serif',
                textShadow: '0 4px 28px rgba(255, 255, 255, 0.15)',
                willChange: 'transform, filter, opacity',
              }}
            >
              {SLOT_PHRASES[0]}
            </div>
          </div>

          {/* Stage 3: English Scramble Text */}
          <div
            ref={morphViewRef}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              willChange: 'opacity, transform',
            }}
          >
            {showMorphLetters && (
              <div style={{
                position: 'absolute',
                fontFamily: '"Playfair Display","Georgia",serif',
                fontSize: 'clamp(2rem,7.2vw,3.4rem)',
                fontWeight: 800,
                color: '#FAF9F6',
                letterSpacing: '0.025em',
                whiteSpace: 'nowrap',
                textShadow: '0 4px 28px rgba(255, 255, 255, 0.15)',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {ENGLISH_FINAL.split('').map((c, i) => (
                  <ScrambleLetter key={i} char={c} delay={80 + i * 20} duration={400} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Middle Stable Area: Lines */}
        <div style={{
          position: 'relative',
          height: 20,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '0.5rem',
        }}>
          {/* Arabic Underline */}
          <div
            ref={arabicLineRef}
            style={{
              position: 'absolute',
              height: 1.5,
              width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent)',
              borderRadius: 1,
            }}
          />
          
          {/* Morph Underline */}
          <div
            ref={morphLineRef}
            style={{
              position: 'absolute',
              height: 1,
              width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent)',
              borderRadius: 1,
            }}
          />
        </div>

        {/* 3. Bottom Stable Area: Loading Dots / Tagline */}
        <div 
          className="jn-intro-bottom-stable"
          style={{
            position: 'relative',
            height: 60,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '0.5rem',
          }}
        >
          {/* Loading dots */}
          <div
            ref={loadingDotsRef}
            style={{
              position: 'absolute',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              willChange: 'opacity, transform',
            }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#D4AF37', display: 'inline-block',
                  animation: `introDot 1.3s ease-in-out ${i * 0.26}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            style={{
              position: 'absolute',
              fontFamily: '"Playfair Display","Georgia",serif',
              fontStyle: 'italic',
              fontSize: 'clamp(0.68rem,1.85vw,0.82rem)',
              color: '#FAF9F6',
              opacity: 0,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              userSelect: 'none',
              margin: 0,
              padding: 0,
              transform: 'translateY(18px)',
              filter: 'blur(4px)',
            }}
          >
            مرحباً &nbsp;·&nbsp; Your Journey Awaits
          </p>
        </div>
      </div>

      {/* ── Skip Intro — refined pill button ───────────────────────────────── */}
      <button
        onClick={exitIntro}
        style={{
          position: 'absolute',
          bottom: '2.4rem',
          right: '2.4rem',
          background: 'rgba(15, 12, 11, 0.4)',
          border: '1px solid rgba(250, 249, 246, 0.25)',
          borderRadius: '100px',
          color: '#FAF9F6',
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
          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.6)'
          e.currentTarget.style.background  = 'rgba(15, 12, 11, 0.75)'
          e.currentTarget.style.transform   = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity     = '0.55'
          e.currentTarget.style.borderColor = 'rgba(250, 249, 246, 0.25)'
          e.currentTarget.style.background  = 'rgba(15, 12, 11, 0.4)'
          e.currentTarget.style.transform   = 'none'
        }}
      >
        Skip Intro →
      </button>

      {/* ── Keyframes ──────────────────────────────────────────────────────── */}
      <style>{`
        .jn-intro-text-container {
          transform: translateY(-10px);
        }
        @media (max-width: 768px) {
          .jn-intro-text-container {
            transform: translateY(-50px) !important;
          }
          .jn-intro-main-text-box {
            height: 80px !important;
          }
          .jn-intro-bottom-stable {
            margin-top: 0.1rem !important;
            height: 50px !important;
          }
        }
        @keyframes introDot {
          0%, 100% { opacity: 0.18; transform: scale(0.75) translateY(0);    }
          50%       { opacity: 0.80; transform: scale(1.25) translateY(-3px); }
        }
        @keyframes kenBurnsIntro {
          0% {
            transform: scale(1) translate(0, 0);
          }
          50% {
            transform: scale(1.08) translate(-1%, -0.5%);
          }
          100% {
            transform: scale(1) translate(0, 0);
          }
        }
      `}</style>
    </div>
  )
}

