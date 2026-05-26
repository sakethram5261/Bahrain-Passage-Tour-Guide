import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const SLOT_PHRASES = [
  'Bienvenue à Bahreïn',
  '巴林欢迎您',
  'Bienvenido a Baréin',
  'Willkommen in Bahrain',
  'Benvenuti in Bahrein',
  'Добро пожаловать в Бахрейн',
  'バーレーنへようこそ',
  '바레인에 오신 것을 환영합니다',
]

const ARABIC_FINAL  = 'مرحباً بكم في البحرين'
const ENGLISH_FINAL = 'Welcome to Bahrain'
const MIXED_CHARS   = 'أبتثجحخدذرزسشصضWELCOMTBAHRINwelcomtbahrinطظعغfqklmnhو0123456789@#$%'

// Gorgeous reactive letter that scrambles, blurs in, and springs up into place
function ScrambleLetter({ char, delay, duration = 750 }) {
  const [display, setDisplay] = useState(char === ' ' ? ' ' : '')
  const [opacity, setOpacity] = useState(0)
  const [blur, setBlur] = useState(12)
  const [y, setY] = useState(20)

  useEffect(() => {
    if (char === ' ') {
      setOpacity(1)
      setBlur(0)
      setY(0)
      return
    }

    const startTimeout = setTimeout(() => {
      const startTime = performance.now()
      let raf;

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1)
        
        // Custom elastic/spring-like ease-out for the position bounce
        // p = progress. Elastic overshoot formula:
        const p = progress;
        const springY = 20 * (1 - p) * Math.cos(p * Math.PI * 1.5)

        setOpacity(progress)
        setBlur((1 - progress) * 12)
        setY(springY)

        if (progress < 1) {
          setDisplay(MIXED_CHARS[Math.floor(Math.random() * MIXED_CHARS.length)])
          raf = requestAnimationFrame(tick)
        } else {
          setDisplay(char)
        }
      }
      raf = requestAnimationFrame(tick)

      return () => cancelAnimationFrame(raf)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [char, delay, duration])

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: opacity,
        filter: `blur(${blur}px)`,
        transform: `translateY(${y}px)`,
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        willChange: 'transform, filter, opacity',
      }}
    >
      {display}
    </span>
  )
}

// Dissolves, blurs out, and floats up gracefully
function DissolvingLetter({ char, delay, duration = 500 }) {
  const [opacity, setOpacity] = useState(1)
  const [blur, setBlur] = useState(0)
  const [y, setY] = useState(0)

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      const startTime = performance.now()
      let raf;

      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1)
        const easeIn = progress * progress * progress

        setOpacity(1 - progress)
        setBlur(progress * 14)
        setY(-easeIn * 20)

        if (progress < 1) {
          raf = requestAnimationFrame(tick)
        }
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)

    return () => clearTimeout(startTimeout)
  }, [delay, duration])

  return (
    <span
      style={{
        display: 'inline-block',
        opacity: opacity,
        filter: `blur(${blur}px)`,
        transform: `translateY(${y}px)`,
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        willChange: 'transform, filter, opacity',
      }}
    >
      {char}
    </span>
  )
}

export default function WelcomeIntro({ onComplete }) {
  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const [phase, setPhase] = useState('slot') // 'slot' | 'hold-arabic' | 'morph' | 'done'
  const [ambientX, setAmbientX] = useState(50)
  const [ambientY, setAmbientY] = useState(50)

  // Subtle ambient mouse/float reaction
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      gsap.to({ x: ambientX, y: ambientY }, {
        x, y,
        duration: 2,
        ease: 'power2.out',
        onUpdate: function() {
          setAmbientX(this.targets()[0].x)
          setAmbientY(this.targets()[0].y)
        }
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [ambientX, ambientY])

  // ── Phase 1: Slot machine with velocity-based motion blur & elastic rebound ──
  useEffect(() => {
    if (phase !== 'slot') return

    // Gentle backdrop fade in
    gsap.fromTo(wrapRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })

    const items = [...SLOT_PHRASES, ARABIC_FINAL]
    const ITEM_H = 80
    const VIEWPORT_H = 180
    const CENTER_OFFSET = (VIEWPORT_H - ITEM_H) / 2 // 50px clearance top & bottom
    const track = trackRef.current
    track.innerHTML = ''

    items.forEach((txt) => {
      const el = document.createElement('div')
      el.style.cssText = `
        height:${ITEM_H}px; display:flex; align-items:center; justify-content:center;
        font-size:clamp(1.8rem,7vw,3.3rem); font-weight:800; color:#BA0C2F;
        letter-spacing:0.02em; white-space:nowrap;
        font-family:${txt === ARABIC_FINAL ? '"Noto Sans Arabic","Geeza Pro",sans-serif' : '"Inter",system-ui,sans-serif'};
        direction:${txt === ARABIC_FINAL ? 'rtl' : 'ltr'};
      `
      el.textContent = txt
      track.appendChild(el)
    })

    // Setup initial position centered in viewport
    gsap.set(track, { y: CENTER_OFFSET, filter: 'blur(0px)' })

    const totalDistance = CENTER_OFFSET - ((items.length - 1) * ITEM_H)

    // Spin animation with elastic snap-back at the end
    gsap.to(track, {
      y: totalDistance,
      duration: 3.4,
      ease: 'back.out(1.15)', // spring rebound
      onUpdate: function() {
        const progress = this.progress()
        let currentBlur = 0
        if (progress < 0.75) {
          currentBlur = Math.sin(progress * Math.PI) * 10 * (1 - progress)
        }
        gsap.set(track, { filter: `blur(${currentBlur}px)` })
      },
      onComplete: () => {
        setPhase('hold-arabic')
      }
    })
  }, [phase])

  // ── Phase 2: Switch from hold-arabic to morph ──
  useEffect(() => {
    if (phase !== 'hold-arabic') return
    const timer = setTimeout(() => {
      setPhase('morph')
    }, 950) // hold the settled Arabic clearly
    return () => clearTimeout(timer)
  }, [phase])

  // ── Phase 3: Exit trigger after English settles ──
  useEffect(() => {
    if (phase !== 'morph') return

    const totalMorphTime = 800 + (ENGLISH_FINAL.length * 40)
    const exitTimer = setTimeout(() => {
      gsap.to(wrapRef.current, {
        opacity: 0,
        duration: 0.9,
        ease: 'power3.inOut',
        onComplete: () => {
          setPhase('done')
          onComplete?.()
        }
      })
    }, totalMorphTime + 1300)

    return () => clearTimeout(exitTimer)
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
      {/* Living Ambient Glow - reacts to mouse */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 70% 50% at ${ambientX}% ${ambientY}%, rgba(186,12,47,0.065) 0%, transparent 70%)`,
        transition: 'background 0.1s ease',
      }} />

      {/* Top flag stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: 'linear-gradient(90deg,#BA0C2F,#e8163b 50%,#BA0C2F)',
      }} />

      {/* Elegant Crown Element */}
      <div style={{
        marginBottom: '1rem', fontSize: '1.2rem',
        opacity: 0.18, color: '#BA0C2F', letterSpacing: '0.65rem',
        animation: 'pulseGlow 3s ease-in-out infinite',
      }}>✦ ✦ ✦</div>

      {/* ── STAGE 1: SLOT SPIN VIEWPORT (180px height gives massive clearance for vertical bounces) ── */}
      {phase === 'slot' && (
        <div style={{
          height: 180, overflow: 'hidden',
          width: '100%', maxWidth: 700,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          maskImage:        'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
        }}>
          <div ref={trackRef} style={{ willChange: 'transform, filter' }} />
        </div>
      )}

      {/* ── STAGE 2: SETTLED ARABIC STATE (Hold - no scale jump keyframe to prevent clips) ── */}
      {phase === 'hold-arabic' && (
        <div style={{
          textAlign: 'center', padding: '0 2rem',
          height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: '"Noto Sans Arabic","Geeza Pro",sans-serif',
            direction: 'rtl',
            fontSize: 'clamp(2rem,7.5vw,3.5rem)',
            fontWeight: 800,
            color: '#BA0C2F',
            margin: 0,
            lineHeight: 1.3,
          }}>
            {ARABIC_FINAL}
          </p>
        </div>
      )}

      {/* ── STAGE 3: THE DESTRUCTIVE MORPH (Arabic melts away, English scrambles up) ── */}
      {phase === 'morph' && (
        <div style={{ 
          position: 'relative', textAlign: 'center', padding: '0 2rem',
          height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'visible'
        }}>
          {/* Overlapping container to keep height stable */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
            
            {/* Arabic melting away */}
            <div style={{
              position: 'absolute',
              fontFamily: '"Noto Sans Arabic","Geeza Pro",sans-serif',
              direction: 'rtl',
              fontSize: 'clamp(2rem,7.5vw,3.5rem)',
              fontWeight: 800,
              color: '#BA0C2F',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}>
              {ARABIC_FINAL.split('').map((c, idx) => (
                <DissolvingLetter key={idx} char={c} delay={idx * 28} />
              ))}
            </div>

            {/* English scrambling and taking its place */}
            <div style={{
              fontFamily: '"Inter",system-ui,sans-serif',
              fontSize: 'clamp(2rem,7.5vw,3.5rem)',
              fontWeight: 800,
              color: '#BA0C2F',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}>
              {ENGLISH_FINAL.split('').map((c, idx) => (
                <ScrambleLetter key={idx} char={c} delay={220 + idx * 45} />
              ))}
            </div>

            {/* Premium tag rises under English */}
            <p style={{
              marginTop: '1.2rem',
              fontFamily: '"Inter",system-ui,sans-serif',
              fontSize:   'clamp(0.7rem,2.2vw,0.85rem)',
              color:      '#BA0C2F',
              opacity:    0,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              animation:  'fadeUpPremium 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards',
            }}>
              Your journey starts here
            </p>

          </div>
        </div>
      )}

      {/* Pulsing visual cues */}
      {phase === 'slot' && (
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#BA0C2F', opacity: 0.3, display: 'inline-block',
              animation: `dotFade 1.1s ease-in-out ${i * 0.18}s infinite`,
            }} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.05); }
        }
        @keyframes dotFade {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50%      { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes fadeUpPremium {
          from { opacity: 0; transform: translateY(12px); filter: blur(2px); }
          to   { opacity: 0.45; transform: translateY(0); filter: blur(0); }
        }
      `}</style>
    </div>
  )
}
