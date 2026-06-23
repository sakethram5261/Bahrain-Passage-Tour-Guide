import { useState, useCallback, lazy, Suspense } from 'react'
import { JourneyProvider } from './context/JourneyProvider'
import { useVibe } from './hooks/useVibe'
import { LangProvider } from './context/LangContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import SensoryHero from './components/SensoryHero'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import JournalSkeleton from './components/skeletons/JournalSkeleton'
import LangToggle from './components/LangToggle'
import PassportCard from './components/PassportCard'

const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#5C5451' },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#aa7c11' },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#c07b2a' },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#D11A38' },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#2563eb' },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#7c3aed' },
]

function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

const JournalNotebook = lazy(() => import('./components/JournalNotebook'))

function MainContent() {
  const { step, setStep, selectedMoods, xp, showPassportCard, setShowPassportCard } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)
  const [sensoryKey, setSensoryKey] = useState(0)

  const handleMoodConfirm = useCallback(() => {
    setSensoryKey(k => k + 1)
    setStep(4)
  }, [setStep])

  let childView

  if (!introComplete) {
    childView = <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  } else if (step < 4 || selectedMoods.length === 0) {
    childView = <MoodSelector onConfirm={handleMoodConfirm} onBack={() => { setStep(1); setIntroComplete(false) }} />
  } else if (step === 4) {
    childView = <SensoryHero key={sensoryKey} onBack={() => setStep(1)} />
  } else {
    childView = (
      <ErrorBoundary>
        <Suspense fallback={<JournalSkeleton />}>
          <JournalNotebook
            xp={xp}
            level={getRank(xp).label}
            onBack={() => setStep(1)}
          />
        </Suspense>
      </ErrorBoundary>
    )
  }

  const showFloatingHeader = introComplete && step < 5

  return (
    <div className="relative min-h-screen">
      {showFloatingHeader && (
        <div 
          className="floating-header"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'auto'
          }}
        >
          {xp > 0 && (
            <button
              onClick={() => setShowPassportCard(true)}
              className="passport-trigger-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              aria-label="View Explorer Passport"
            >
              <span role="img" aria-label="Passport">📖</span>
              <span>Passport ({getRank(xp).label})</span>
            </button>
          )}
          <LangToggle className="border-white/20 bg-black/40 backdrop-blur hover:bg-black/60" />
        </div>
      )}
      {showPassportCard && step < 5 && (
        <PassportCard onClose={() => setShowPassportCard(false)} />
      )}
      {childView}
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <ToastProvider>
        <JourneyProvider>
          <>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <div id="main-content">
              <MainContent />
            </div>
          </>
        </JourneyProvider>
      </ToastProvider>
    </LangProvider>
  )
}
