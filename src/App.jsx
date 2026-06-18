import { useState, useCallback, lazy, Suspense } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import { LangProvider } from './context/LangContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import SensoryHero from './components/SensoryHero'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import JournalSkeleton from './components/skeletons/JournalSkeleton'
import { getRank } from './components/DashboardData'

// Heavy components — code-split so they're not in the initial bundle
const JournalNotebook = lazy(() => import('./components/JournalNotebook'))

function MainContent() {
  const { step, setStep, selectedMoods, xp } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)
  const [sensoryKey, setSensoryKey] = useState(0)

  const handleMoodConfirm = useCallback(() => {
    setSensoryKey(k => k + 1)
    setStep(4)
  }, [setStep])

  // Show welcome intro animation on first load
  if (!introComplete) {
    return <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  }

  // Step 1-3 or no moods → onboarding (MoodSelector)
  if (step < 4 || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={handleMoodConfirm} onBack={() => { setStep(1); setIntroComplete(false) }} />
  }

  // Step 4 → itinerary preview + carousel (SensoryHero)
  if (step === 4) {
    return <SensoryHero key={sensoryKey} onBack={() => setStep(1)} />
  }

  // Step 5+ → full Journal (lazy-loaded)
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
        <VibeProvider>
          <>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <div id="main-content">
              <MainContent />
            </div>
          </>
        </VibeProvider>
      </ToastProvider>
    </LangProvider>
  )
}
