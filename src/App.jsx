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
import { getRank } from './components/DashboardData'

const JournalNotebook = lazy(() => import('./components/JournalNotebook'))

function MainContent() {
  const { step, setStep, selectedMoods, xp } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)
  const [sensoryKey, setSensoryKey] = useState(0)

  const handleMoodConfirm = useCallback(() => {
    setSensoryKey(k => k + 1)
    setStep(4)
  }, [setStep])

  if (!introComplete) {
    return <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  }

  if (step < 4 || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={handleMoodConfirm} onBack={() => { setStep(1); setIntroComplete(false) }} />
  }

  if (step === 4) {
    return <SensoryHero key={sensoryKey} onBack={() => setStep(1)} />
  }

  return (
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
