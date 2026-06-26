import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'


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
      el.style.cssText = 'display:inline-block;opacity:1;filter:blur(0px);transform:translateY(0px);white-space:pre'
      el.textContent = '\u00A0'
      return
    }

    el.style.cssText = 'display:inline-block;opacity:0;filter:blur(6px);transform:translateY(18px)'
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
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        transition: 'none',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
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
  const overlineRef    = useRef(null)

  const [showMorphLetters, setShowMorphLetters] = useState(false)
  const { quickStart } = useVibe()


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
      overlineRef.current,
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
    if (overlineRef.current)  gsap.set(overlineRef.current, { opacity: 0 })

    // ── Screen fade-in ───────────────────────────────────────────────────────
    gsap.to(wrap, { opacity: 1, duration: 0.75, ease: 'power2.out' })

    // ── Phase 1: Fly-through of languages (centered and still) ────────────────
    const flyObj = { index: 0 }
    
    const startTimer = setTimeout(() => {
      if (skippedRef.current) return

      if (loadingDots) {
        gsap.to(loadingDots, { opacity: 0, y: 10, duration: 0.4, ease: 'power2.in' })
      }

      // Fade in the overline label when language cycling begins
      if (overlineRef.current) {
        gsap.to(overlineRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' })
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

      // Fade out overline when Arabic lands — it has done its job
      if (overlineRef.current) {
        gsap.to(overlineRef.current, { opacity: 0, duration: 0.4, ease: 'power2.in' })
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
        overlineRef.current,
      ])
    }
  }, [exitIntro])

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      onClick={exitIntro}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0F0C0B',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        opacity: 0, cursor: 'pointer',
      }}
    >
      {/* ── Background video ──────────────────────────────────────────── */}
      <video
        autoPlay muted loop playsInline
        className="jn-welcome-video"
        poster="/assets/images/bahrain_skyline.png"
      >
        <source src="/assets/videos/bahrain_timelapse.mp4" type="video/mp4" />
      </video>

      {/* ── Dark vignette — heavier than before ──────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(15,12,11,0.48) 0%, rgba(15,12,11,0.94) 100%)',
      }} />

      {/* ── Mouse-reactive ambient glow ──────────────────────────────── */}
      <div
        ref={glowRef}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
          background: 'radial-gradient(ellipse 85% 65% at 50% 42%, rgba(212,175,55,0.06) 0%, transparent 72%)',
        }}
      />

      {/* ── Cinematic Color Grading Overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'linear-gradient(135deg, rgba(193, 18, 47, 0.05) 0%, rgba(184, 134, 11, 0.08) 100%)',
        mixBlendMode: 'overlay',
        pointerEvents: 'none'
      }} />

      {/* ── Premium Double Gold Frame around the screen ── */}
      <div style={{
        position: 'absolute',
        top: '16px', bottom: '16px', left: '16px', right: '16px',
        border: '1px solid rgba(197, 168, 128, 0.25)',
        pointerEvents: 'none',
        zIndex: 4,
        borderRadius: '8px',
      }} />
      <div style={{
        position: 'absolute',
        top: '20px', bottom: '20px', left: '20px', right: '20px',
        border: '0.5px dashed rgba(197, 168, 128, 0.12)',
        pointerEvents: 'none',
        zIndex: 4,
        borderRadius: '6px',
      }} />

      {/* ── Paper grain texture overlay ── */}
      <div className="paper-grain" style={{ opacity: 0.05, mixBlendMode: 'overlay', zIndex: 3 }} />

      {/* ── Centerpiece Gold Crests on the Borders ── */}
      {/* Top Gold Crest centerpiece */}
      <div style={{
        position: 'absolute',
        top: '11px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <svg width="70" height="11" viewBox="0 0 100 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 15 L10 2 L20 15 L30 2 L40 15 L50 2 L60 15 L70 2 L80 15 L90 2 L100 15 Z"
            fill="url(#goldFoilGradientCrest)"
          />
          <defs>
            <linearGradient id="goldFoilGradientCrest" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A880" />
              <stop offset="30%" stopColor="#E5C79E" />
              <stop offset="50%" stopColor="#F5D7AE" />
              <stop offset="70%" stopColor="#E5C79E" />
              <stop offset="100%" stopColor="#C5A880" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Gold Crest centerpiece */}
      <div style={{
        position: 'absolute',
        bottom: '11px',
        left: '50%',
        transform: 'translateX(-50%) scaleY(-1)',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <svg width="70" height="11" viewBox="0 0 100 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 15 L10 2 L20 15 L30 2 L40 15 L50 2 L60 15 L70 2 L80 15 L90 2 L100 15 Z"
            fill="url(#goldFoilGradientCrest)"
          />
        </svg>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ZONE 1 — Top brand bar
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="jn-intro-brand-bar"
        style={{ position: 'relative', zIndex: 5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="jn-intro-brand-inner">
          <div className="jn-intro-brand-text">
            <span className="jn-intro-brand-name gold-foil-text">Bahrain Passage</span>
            <span className="jn-intro-brand-arabic">ممر البحرين</span>
          </div>
          <div className="jn-intro-brand-divider" />
          <span className="jn-intro-brand-tagline">Your Digital Travel Chronicle</span>
        </div>
      </div>

      {/* ════════════════════ ZONE 2 — Center animation stage ════════════════════ */}
      <div
        className="jn-intro-text-container"
        style={{ position: 'relative', zIndex: 5 }}
      >

        {/* Main text box — keep all existing refs */}
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
          {/* Stage 1 & 2: Slot text / Arabic */}
          <div
            ref={slotViewRef}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              ref={slotTextRef}
              style={{
                fontSize: 'clamp(2.3rem, 7.8vw, 4rem)',
                fontWeight: 700,
                color: '#FAF9F6',
                textAlign: 'center',
                userSelect: 'none',
                fontFamily: '"Playfair Display","Georgia",serif',
                textShadow: '0 4px 28px rgba(15, 12, 11, 0.9), 0 1px 3px rgba(15, 12, 11, 0.95)',
                letterSpacing: '0.025em',
              }}
            >
              {SLOT_PHRASES[0]}
            </div>
          </div>

          {/* Stage 3: English scramble */}
          <div
            ref={morphViewRef}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: 0, pointerEvents: 'none', overflow: 'visible',
            }}
          >
            {showMorphLetters && (
              <div style={{
                fontFamily: '"Playfair Display","Georgia",serif',
                fontSize: 'clamp(2.3rem, 7.8vw, 4rem)',
                fontWeight: 700,
                color: '#FAF9F6',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                textShadow: '0 4px 28px rgba(15, 12, 11, 0.9), 0 1px 3px rgba(15, 12, 11, 0.95)',
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

        {/* Underlines — keep existing refs */}
        <div style={{
          position: 'relative', height: 20, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: '0.5rem',
        }}>
          <div
            ref={arabicLineRef}
            style={{
              position: 'absolute', height: 1.5, width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
              borderRadius: 1,
            }}
          />
          <div
            ref={morphLineRef}
            style={{
              position: 'absolute', height: 1, width: 0,
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
              borderRadius: 1,
            }}
          />
        </div>

        {/* Loading dots / tagline — keep existing refs */}
        <div
          className="jn-intro-bottom-stable"
          style={{
            position: 'relative', height: 60, width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: '0.5rem',
          }}
        >
          <div
            ref={loadingDotsRef}
            style={{
              position: 'absolute',
              display: 'flex', gap: '0.6rem', alignItems: 'center',
            }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--color-accent)',
                  display: 'inline-block',
                  animation: `introDot 1.3s ease-in-out ${i * 0.26}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            ref={taglineRef}
            style={{
              position: 'absolute',
              fontFamily: '"Playfair Display","Georgia",serif',
              fontStyle: 'italic',
              fontSize: 'clamp(0.68rem, 1.85vw, 0.82rem)',
              color: '#FAF9F6',
              opacity: 0,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              userSelect: 'none',
              margin: 0, padding: 0,
              transform: 'translateY(18px)',
              filter: 'blur(4px)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            مرحباً &nbsp;·&nbsp; Your Journey Awaits
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ZONE 3 — Bottom action panel (frosted glass, anchored to bottom)
      ════════════════════════════════════════════════════════════════ */}
      <div
        className="jn-intro-action-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <button
          onClick={exitIntro}
          className="jn-intro-skip-btn"
          aria-label="Skip intro"
        >
          Skip intro
        </button>
        <div className="jn-intro-action-divider" aria-hidden="true" />
        <button
          onClick={(e) => { e.stopPropagation(); quickStart() }}
          className="jn-intro-quick-btn"
          aria-label="Quick start — skip setup"
        >
          ⚡ Quick start
        </button>
      </div>

      {/* ── Injected keyframes ───────────────────────────────────────── */}
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1.03) translate(0, 0); }
          50% { transform: scale(1.08) translate(-1%, -0.5%); }
          100% { transform: scale(1.03) translate(0, 0); }
        }
        .jn-welcome-video {
          position: absolute;
          top: -4%; left: -4%;
          width: 108% !important; height: 108% !important;
          max-width: none !important; max-height: none !important;
          object-fit: cover;
          z-index: 0;
          object-position: center;
          animation: kenBurns 45s ease-in-out infinite;
        }

        /* Zone 1: brand bar */
        .jn-intro-brand-bar {
          width: 100%;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(197, 168, 128, 0.08);
          flex-shrink: 0;
        }
        .jn-intro-brand-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 900px;
          margin: 0 auto;
        }
        .jn-intro-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .jn-intro-brand-name {
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(14px, 2.5vw, 18px);
          font-weight: 700;
          color: #FAF9F6;
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .jn-intro-brand-arabic {
          font-family: "Playfair Display", Georgia, serif;
          font-size: 11px;
          color: rgba(212,175,55,0.7);
          line-height: 1;
          direction: rtl;
          letter-spacing: 0.05em;
        }
        .jn-intro-brand-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .jn-intro-brand-tagline {
          font-family: "Outfit", system-ui, sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: rgba(250,249,246,0.45);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* Zone 2: center animation container */
        .jn-intro-text-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          overflow: visible;
        }

        /* Zone 3: bottom action panel */
        .jn-intro-action-panel {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 24px 24px 44px;
          background: transparent;
          border-top: none;
          flex-shrink: 0;
        }
        .jn-intro-action-divider {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.12);
          margin: 0 20px;
          flex-shrink: 0;
        }

        /* Skip button — understated */
        .jn-intro-skip-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 24px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 100px;
          color: rgba(250,249,246,0.7);
          font-family: "Outfit", sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          user-select: none;
        }
        .jn-intro-skip-btn:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(255,255,255,0.25);
          color: rgba(250,249,246,0.95);
          transform: translateY(-1px);
        }
        .jn-intro-skip-btn:active {
          transform: translateY(0) scale(0.98);
        }

        /* Quick start button — primary action */
        .jn-intro-quick-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 44px;
          padding: 0 28px;
          background: linear-gradient(135deg, #C1122F 0%, #8B0D22 100%);
          border: 1.5px solid #C5A880;
          border-radius: 100px;
          color: #ffffff;
          font-family: "Outfit", sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(193, 18, 47, 0.4), 0 2px 8px rgba(197, 168, 128, 0.2);
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          user-select: none;
        }
        .jn-intro-quick-btn:hover {
          background: linear-gradient(135deg, #D4142F 0%, #A00F26 100%);
          box-shadow: 0 6px 28px rgba(193,18,47,0.45);
          transform: translateY(-1px);
        }
        .jn-intro-quick-btn:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 10px rgba(193,18,47,0.2);
        }

        /* Intro bottom stable area */
        .jn-intro-bottom-stable {
          margin-top: 0.5rem !important;
          height: 60px !important;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .jn-welcome-video {
            object-position: 30% center !important;
          }
          .jn-intro-brand-bar {
            padding: 16px 20px 12px;
          }
          .jn-intro-brand-tagline {
            display: none;
          }
          .jn-intro-brand-divider {
            display: none;
          }
          .jn-intro-main-text-box {
            height: 80px !important;
          }
          .jn-intro-bottom-stable {
            height: 50px !important;
          }
          .jn-intro-action-panel {
            padding: 16px 20px 24px;
          }
          .jn-intro-overline {
            font-size: 9px;
            margin-bottom: 14px;
          }
        }

        @keyframes introDot {
          0%, 100% { opacity: 0.18; transform: scale(0.75) translateY(0); }
          50%       { opacity: 0.80; transform: scale(1.25) translateY(-3px); }
        }
      `}</style>
    </div>
  )
}


