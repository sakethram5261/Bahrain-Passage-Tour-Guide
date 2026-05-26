import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const PHRASES = [
  { text: 'Bienvenue à Bahreïn', lang: 'fr' },
  { text: '巴林欢迎您', lang: 'zh' },
  { text: 'Bienvenido a Baréin', lang: 'es' },
  { text: 'Willkommen in Bahrain', lang: 'de' },
  { text: 'مرحباً بكم في البحرين', lang: 'ar' },
  { text: 'Welcome to Bahrain', lang: 'en' },
]

const DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*'
const ARABIC_CHARS = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'

function scrambleText(target, progress) {
  return target
    .split('')
    .map((char, i) => {
      if (char === ' ') return ' '
      const charProgress = Math.max(0, (progress * target.length - i) / 1)
      if (charProgress >= 1) return char
      const pool = /[\u0600-\u06FF]/.test(target) ? ARABIC_CHARS : DECODE_CHARS
      return pool[Math.floor(Math.random() * pool.length)]
    })
    .join('')
}

export default function WelcomeIntro({ onComplete }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const subtitleRef = useRef(null)
  const overlayRef = useRef(null)
  const [displayText, setDisplayText] = useState(PHRASES[0].text)
  const [isArabic, setIsArabic] = useState(false)
  const [isFinalEnglish, setIsFinalEnglish] = useState(false)
  const rafRef = useRef(null)

  useEffect(() => {
    let phraseIdx = 0
    let totalTime = 0
    const PHRASE_HOLD = 420   // ms each phrase is held fully resolved
    const DECODE_DUR = 380    // ms to decode each phrase
    const FINAL_HOLD = 1600   // ms for final "Welcome to Bahrain"
    const FADE_OUT = 800      // ms fade out

    function decodeTo(targetPhrase, duration, onDone) {
      const start = performance.now()
      setIsArabic(targetPhrase.lang === 'ar')
      function tick(now) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        setDisplayText(scrambleText(targetPhrase.text, progress))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setDisplayText(targetPhrase.text)
          onDone && onDone()
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    function showNextPhrase() {
      if (phraseIdx >= PHRASES.length) return

      const phrase = PHRASES[phraseIdx]
      const isFinal = phraseIdx === PHRASES.length - 1

      decodeTo(phrase, DECODE_DUR, () => {
        if (isFinal) {
          setIsFinalEnglish(true)
          // fade out after final hold
          setTimeout(() => {
            gsap.to(overlayRef.current, {
              opacity: 0,
              duration: FADE_OUT / 1000,
              ease: 'power2.inOut',
              onComplete: () => onComplete && onComplete(),
            })
          }, FINAL_HOLD)
        } else {
          setTimeout(() => {
            phraseIdx++
            showNextPhrase()
          }, PHRASE_HOLD)
        }
      })
    }

    // Small initial delay before starting
    const initTimer = setTimeout(showNextPhrase, 300)

    return () => {
      clearTimeout(initTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onComplete])

  // Entry fade-in
  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' }
    )
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(186,12,47,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Thin top red stripe — like the Bahraini flag */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #BA0C2F 0%, #e8163b 50%, #BA0C2F 100%)',
        }}
      />

      <div ref={containerRef} style={{ textAlign: 'center', padding: '0 2rem' }}>
        {/* Crescent / star decoration */}
        <div
          style={{
            marginBottom: '2rem',
            fontSize: '2rem',
            opacity: 0.25,
            color: '#BA0C2F',
            letterSpacing: '0.5rem',
          }}
        >
          ✦ ✦ ✦
        </div>

        {/* Main animated text */}
        <p
          ref={textRef}
          style={{
            fontFamily: isArabic
              ? '"Noto Sans Arabic", "Geeza Pro", sans-serif'
              : '"Inter", system-ui, sans-serif',
            direction: isArabic ? 'rtl' : 'ltr',
            fontSize: 'clamp(1.6rem, 6vw, 3.2rem)',
            fontWeight: isArabic ? 700 : 600,
            color: '#BA0C2F',
            letterSpacing: isArabic ? '0' : '0.04em',
            lineHeight: 1.25,
            margin: 0,
            minHeight: '4rem',
            transition: 'font-family 0.2s',
          }}
        >
          {displayText}
        </p>

        {/* Final subtitle */}
        {isFinalEnglish && (
          <p
            ref={subtitleRef}
            style={{
              marginTop: '1rem',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
              color: '#BA0C2F',
              opacity: 0.5,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              animation: 'fadeUpIn 0.6s ease forwards',
            }}
          >
            Your journey starts here
          </p>
        )}

        {/* Subtle dots loader */}
        {!isFinalEnglish && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#BA0C2F',
                  opacity: 0.4,
                  display: 'inline-block',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 0.5; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
