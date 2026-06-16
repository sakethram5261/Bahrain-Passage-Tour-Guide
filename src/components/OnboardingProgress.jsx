/**
 * OnboardingProgress.jsx
 * A slim progress indicator for the 4-step onboarding flow.
 * step: 0=Intro, 1=Vibes, 2=Preview, 3=Journey (journal)
 */
const STEPS = [
  { label: 'Intro',   labelAr: 'البداية' },
  { label: 'Vibes',   labelAr: 'أجواؤك' },
  { label: 'Preview', labelAr: 'معاينة'  },
  { label: 'Journey', labelAr: 'رحلتك'  },
]

import { useState, useEffect } from 'react'

export default function OnboardingProgress({ step = 0 }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [hide, setHide] = useState(false)

  useEffect(() => {
    if (step === 3) {
      const fadeTimer = setTimeout(() => setFadeOut(true), 2000)
      const hideTimer = setTimeout(() => setHide(true), 2800)
      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    } else {
      queueMicrotask(() => {
        setFadeOut(false)
        setHide(false)
      })
    }
  }, [step])

  if (hide) return null

  const pct = (step / (STEPS.length - 1)) * 100

  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={0}
      aria-valuemax={STEPS.length - 1}
      aria-label={`Onboarding progress: step ${step + 1} of ${STEPS.length} — ${STEPS[step]?.label}`}
      className="onboarding-progress-container"
      style={{
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Thin progress rail */}
      <div className="onboarding-progress-rail">
        <div 
          className="onboarding-progress-fill" 
          style={{ width: `${pct}%` }} 
        />
      </div>

      {/* Step dots */}
      <div className="onboarding-progress-badge">
        {STEPS.map((s, i) => {
          const done    = i < step
          const active  = i === step
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {i > 0 && (
                <div 
                  className="onboarding-progress-line"
                  style={{ background: done ? '#D4AF37' : 'rgba(42,35,33,0.12)' }}
                />
              )}
              <div 
                className="onboarding-progress-dot"
                style={{
                  width: active ? 8 : 6,
                  height: active ? 8 : 6,
                  background: done ? '#D4AF37' : active ? '#BA0C2F' : 'rgba(42,35,33,0.15)',
                  boxShadow: active ? '0 0 0 2px rgba(186,12,47,0.25)' : 'none',
                }} 
              />
            </div>
          )
        })}

        <span className="onboarding-progress-label">
          {STEPS[step]?.label}
        </span>
      </div>
    </div>
  )
}
