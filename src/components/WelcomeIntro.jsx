import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'

import fortImg   from '../assets/cinematic/fort.png'
import pearlImg  from '../assets/cinematic/pearl.png'
import souqImg   from '../assets/cinematic/souq.png'

// ─────────────────────────────────────────────────────────────────────────────
// WelcomeIntro — "The Chronicle of a Wayfarer"
//
// 6-stage cinematic sequence:
//   Stage 0 → Black. Wax seal pulses at center.
//   Stage 1 → Seal cracks open with light burst.
//   Stage 2 → Parchment panel unfolds (CSS 3D scaleY).
//   Stage 3 → Three flavor images slide in via clip-path reveal.
//   Stage 4 → Arabic calligraphy ink-bleeds in from top.
//   Stage 5 → English subtitle typewriters in.
//   Stage 6 → CTA button materializes with gold shimmer.
// ─────────────────────────────────────────────────────────────────────────────

const ARABIC_HEADLINE = 'مرحباً بكم في البحرين'
const ENGLISH_SUBTITLE = 'A Chronicle for the Wayfarer'

// Characters to scramble through for English typewriter effect
const SCRAMBLE_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function TypewriterChar({ char, delay, duration = 350 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (char === ' ') {
      el.style.cssText = 'display:inline-block;opacity:1;white-space:pre'
      el.textContent = '\u00A0'
      return
    }

    el.style.cssText = 'display:inline-block;opacity:0'
    el.textContent = char

    let rafId
    const tid = setTimeout(() => {
      const t0 = performance.now()
      let scrambleCount = 0
      const maxScrambles = 6

      const tick = (now) => {
        const p = Math.min((now - t0) / duration, 1)

        if (p < 0.6 && scrambleCount < maxScrambles) {
          el.textContent = SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)]
          el.style.opacity = String(p * 1.2)
          scrambleCount++
        } else {
          el.textContent = char
          el.style.opacity = '1'
        }

        if (p < 1) {
          rafId = requestAnimationFrame(tick)
        } else {
          el.style.opacity = '1'
          el.textContent = char
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
        whiteSpace: char === ' ' ? 'pre' : 'normal',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  )
}

export default function WelcomeIntro({ onComplete }) {
  const wrapRef       = useRef(null)
  const sealRef       = useRef(null)
  const sealCrackRef  = useRef(null)
  const burstRef      = useRef(null)
  const parchRef      = useRef(null)
  const img1Ref       = useRef(null)
  const img2Ref       = useRef(null)
  const img3Ref       = useRef(null)
  const arabicRef     = useRef(null)
  const subtitleRef   = useRef(null)
  const ctaRef        = useRef(null)
  const overlineRef   = useRef(null)

  const skippedRef    = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const timersRef     = useRef([])

  const [showSubtitle, setShowSubtitle] = useState(false)

  const { quickStart } = useVibe()

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const exitIntro = useCallback(() => {
    if (skippedRef.current) return
    skippedRef.current = true
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    gsap.killTweensOf(wrapRef.current)
    const el = wrapRef.current
    if (!el) { onCompleteRef.current?.(); return }
    gsap.to(el, {
      opacity: 0,
      duration: 0.7,
      ease: 'power2.inOut',
      onComplete: () => onCompleteRef.current?.(),
    })
  }, [])

  useEffect(() => {
    const wrap     = wrapRef.current
    const seal     = sealRef.current
    const burst    = burstRef.current
    const parch    = parchRef.current
    const img1     = img1Ref.current
    const img2     = img2Ref.current
    const img3     = img3Ref.current
    const arabic   = arabicRef.current
    const subtitle = subtitleRef.current
    const cta      = ctaRef.current
    const overline = overlineRef.current

    if (!wrap || !seal) return

    // ── Initial states ────────────────────────────────────────────────────
    gsap.set(wrap,     { opacity: 0 })
    gsap.set(seal,     { opacity: 1, scale: 0.85 })
    gsap.set(burst,    { opacity: 0, scale: 0.5 })
    gsap.set(parch,    { scaleY: 0, transformOrigin: 'top center', opacity: 0 })
    gsap.set([img1, img2, img3], { clipPath: 'inset(0 100% 0 0)', opacity: 0 })
    gsap.set(arabic,   { opacity: 0, y: -12 })
    gsap.set(subtitle, { opacity: 0 })
    gsap.set(cta,      { opacity: 0, y: 16, filter: 'blur(4px)' })
    gsap.set(overline, { opacity: 0, y: -8 })

    // ── Stage 0: Fade-in + Seal pulse ────────────────────────────────────
    gsap.to(wrap, { opacity: 1, duration: 0.6, ease: 'power2.out' })
    gsap.to(seal, {
      scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.6)',
      onComplete: () => gsap.to(seal, {
        scale: 1.04, duration: 1.8, yoyo: true, repeat: -1, ease: 'power1.inOut'
      })
    })

    // ── Stage 1: Seal crack + burst (t=1.8s) ─────────────────────────────
    const t1 = setTimeout(() => {
      if (skippedRef.current) return
      gsap.killTweensOf(seal)
      // Shake
      gsap.to(seal, { x: -4, duration: 0.05, yoyo: true, repeat: 7, ease: 'none',
        onComplete: () => {
          // Burst
          gsap.to(burst, { opacity: 1, scale: 2.5, duration: 0.35, ease: 'power2.out',
            onComplete: () => {
              gsap.to(burst, { opacity: 0, duration: 0.4, ease: 'power2.in' })
            }
          })
          // Seal fades out
          gsap.to(seal, { opacity: 0, scale: 1.6, duration: 0.35, ease: 'power2.in' })

          // Stage 2: Parchment unfolds (t+0.2s)
          const t2 = setTimeout(() => {
            if (skippedRef.current) return
            gsap.to(parch, {
              scaleY: 1, opacity: 1, duration: 0.7, ease: 'power3.out',
              onComplete: () => {
                // Stage 3: Images slide in
                const t3 = setTimeout(() => {
                  if (skippedRef.current) return

                  // Overline fades in
                  gsap.to(overline, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })

                  // Images reveal via clip-path
                  gsap.to(img1, {
                    clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.6,
                    ease: 'power3.out', delay: 0
                  })
                  gsap.to(img2, {
                    clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.6,
                    ease: 'power3.out', delay: 0.12
                  })
                  gsap.to(img3, {
                    clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: 0.6,
                    ease: 'power3.out', delay: 0.24
                  })

                  // Stage 4: Arabic ink bleed (t+0.5s)
                  const t4 = setTimeout(() => {
                    if (skippedRef.current) return
                    gsap.to(arabic, {
                      opacity: 1, y: 0, duration: 0.9,
                      ease: 'power3.out',
                    })

                    // Stage 5: Subtitle typewriter (t+0.9s)
                    const t5 = setTimeout(() => {
                      if (skippedRef.current) return
                      setShowSubtitle(true)
                      gsap.to(subtitle, { opacity: 1, duration: 0.3 })

                      // Stage 6: CTA materializes (t+1.1s)
                      const t6 = setTimeout(() => {
                        if (skippedRef.current) return
                        gsap.to(cta, {
                          opacity: 1, y: 0, filter: 'blur(0px)',
                          duration: 0.6, ease: 'back.out(1.5)',
                        })

                        // Auto-exit after dwelling
                        const tExit = setTimeout(() => {
                          if (!skippedRef.current) exitIntro()
                        }, 3500)
                        timersRef.current.push(tExit)
                      }, 1100)
                      timersRef.current.push(t6)
                    }, 900)
                    timersRef.current.push(t5)
                  }, 500)
                  timersRef.current.push(t4)
                }, 150)
                timersRef.current.push(t3)
              }
            })
          }, 200)
          timersRef.current.push(t2)
        }
      })
    }, 1800)
    timersRef.current.push(t1)

    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
      gsap.killTweensOf([wrap, seal, burst, parch, img1, img2, img3, arabic, subtitle, cta, overline])
    }
  }, [exitIntro])

  return (
    <div
      ref={wrapRef}
      onClick={exitIntro}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0A0807',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: 0,
        cursor: 'pointer',
      }}
    >
      {/* ── Paper grain ── */}
      <div className="paper-grain" style={{ opacity: 0.06, zIndex: 1 }} />

      {/* ── Ambient vignette ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(10,8,7,0.85) 100%)',
      }} />

      {/* ─────────────────────────────────────────────────────────────
          SEAL STAGE — centered on black
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={sealRef}
        style={{
          position: 'absolute',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Wax seal SVG */}
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="waxGrad" cx="42%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#E8263D" />
              <stop offset="55%" stopColor="#C1122F" />
              <stop offset="100%" stopColor="#7A0B1E" />
            </radialGradient>
            <filter id="sealShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#C1122F" floodOpacity="0.55" />
            </filter>
          </defs>
          {/* Seal body — 14-point starburst */}
          <path
            d="M60,4 L65,22 L80,14 L76,32 L93,30 L83,45 L100,50 L83,55 L93,70 L76,68 L80,86 L65,84 L60,102 L55,84 L40,86 L44,68 L27,70 L37,55 L20,50 L37,45 L27,30 L44,32 L40,14 L55,22 Z"
            fill="url(#waxGrad)"
            filter="url(#sealShadow)"
          />
          {/* Inner ring */}
          <circle cx="60" cy="50" r="22" fill="none" stroke="rgba(255,200,180,0.25)" strokeWidth="1.2" />
          {/* Center diamond */}
          <path d="M60,34 L69,50 L60,66 L51,50 Z" fill="rgba(255,220,210,0.18)" stroke="rgba(255,210,200,0.35)" strokeWidth="0.8" />
          {/* Arabic ب character hint */}
          <text x="60" y="54" textAnchor="middle" fontFamily="serif" fontSize="14" fill="rgba(255,230,220,0.85)" fontWeight="bold">ب</text>
        </svg>
      </div>

      {/* Light burst on crack */}
      <div
        ref={burstRef}
        style={{
          position: 'absolute', zIndex: 9, pointerEvents: 'none',
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(193,18,47,0.6) 0%, rgba(212,175,55,0.3) 40%, transparent 70%)',
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          PARCHMENT STAGE — unfolds after seal breaks
      ───────────────────────────────────────────────────────────── */}
      <div
        ref={parchRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 8,
          width: '100%', maxWidth: 860,
          padding: '0 20px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 0,
        }}
      >
        {/* Overline label */}
        <div
          ref={overlineRef}
          style={{
            fontFamily: '"Outfit", system-ui, sans-serif',
            fontSize: 10,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.75)',
            marginBottom: 20,
            opacity: 0,
          }}
        >
          Kingdom of Bahrain · A Digital Chronicle
        </div>

        {/* ── Image triptych ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr 1fr',
          gap: 8,
          width: '100%',
          marginBottom: 32,
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div
            ref={img1Ref}
            style={{
              height: 'clamp(120px, 22vw, 210px)',
              borderRadius: 10,
              overflow: 'hidden',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <img
              src={pearlImg}
              alt="Bahraini pearl on ancient rope"
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                filter: 'sepia(0.15) contrast(1.08) brightness(0.92)' }}
            />
          </div>

          <div
            ref={img2Ref}
            style={{
              height: 'clamp(120px, 22vw, 210px)',
              borderRadius: 10,
              overflow: 'hidden',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <img
              src={fortImg}
              alt="Bahrain Fort at sunset"
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                filter: 'sepia(0.15) contrast(1.08) brightness(0.92)' }}
            />
          </div>

          <div
            ref={img3Ref}
            style={{
              height: 'clamp(120px, 22vw, 210px)',
              borderRadius: 10,
              overflow: 'hidden',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            <img
              src={souqImg}
              alt="Bahraini spice souq"
              style={{ width: '100%', height: '100%', objectFit: 'cover',
                filter: 'sepia(0.15) contrast(1.08) brightness(0.92)' }}
            />
          </div>
        </div>

        {/* ── Arabic headline ── */}
        <div
          ref={arabicRef}
          style={{
            fontFamily: '"Noto Sans Arabic", "Geeza Pro", "Arial Unicode MS", serif',
            fontSize: 'clamp(2rem, 6.5vw, 3.4rem)',
            fontWeight: 700,
            color: '#FAF6EE',
            textAlign: 'center',
            direction: 'rtl',
            letterSpacing: '0.02em',
            textShadow: '0 2px 20px rgba(193,18,47,0.35), 0 1px 4px rgba(10,8,7,0.9)',
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          {ARABIC_HEADLINE}
        </div>

        {/* Gold rule */}
        <div style={{
          width: 80, height: 1.5, marginBottom: 14,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
        }} />

        {/* ── English subtitle ── */}
        <div
          ref={subtitleRef}
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 'clamp(0.9rem, 2.2vw, 1.15rem)',
            color: 'rgba(250,246,238,0.75)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textAlign: 'center',
            marginBottom: 36,
            opacity: 0,
          }}
        >
          {showSubtitle
            ? ENGLISH_SUBTITLE.split('').map((c, i) => (
                <TypewriterChar key={i} char={c} delay={i * 38} duration={280} />
              ))
            : ENGLISH_SUBTITLE
          }
        </div>

        {/* ── CTA button ── */}
        <div
          ref={ctaRef}
          onClick={(e) => { e.stopPropagation(); exitIntro() }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 36px',
            background: 'linear-gradient(135deg, #C1122F 0%, #8B0D22 100%)',
            border: '1px solid rgba(212,175,55,0.45)',
            borderRadius: 100,
            color: '#FAF6EE',
            fontFamily: '"Outfit", system-ui, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 6px 28px rgba(193,18,47,0.4), 0 2px 8px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
            userSelect: 'none',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 36px rgba(193,18,47,0.5), 0 4px 12px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(193,18,47,0.4), 0 2px 8px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.12)'
          }}
          role="button"
          aria-label="Begin your Bahrain Chronicle"
        >
          <span style={{ fontSize: 14 }}>📜</span>
          Begin Your Chronicle
        </div>

        {/* Quick start underlink */}
        <button
          onClick={(e) => { e.stopPropagation(); quickStart() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            marginTop: 16,
            fontFamily: '"Outfit", system-ui, sans-serif',
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(250,246,238,0.4)',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            transition: 'color 0.15s',
            padding: '4px 8px',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(250,246,238,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,246,238,0.4)' }}
          aria-label="Quick start, skip setup"
        >
          ⚡ Quick start
        </button>
      </div>

      {/* ── Brand mark (top-left) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 20, left: 24,
          zIndex: 12,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            className="gold-foil-text"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 16, fontWeight: 700 }}
          >
            Bahrain Passage
          </span>
          <span style={{
            fontFamily: '"Noto Sans Arabic", sans-serif',
            fontSize: 10, color: 'rgba(212,175,55,0.65)',
            direction: 'rtl', letterSpacing: '0.04em',
          }}>
            ممر البحرين
          </span>
        </div>
      </div>
    </div>
  )
}
