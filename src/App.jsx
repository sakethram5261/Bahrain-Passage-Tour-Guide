import { useState, lazy, Suspense } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import { LangProvider } from './context/LangContext'
import { ToastProvider } from './context/ToastContext'
import SensoryHero from './components/SensoryHero'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import OnboardingProgress from './components/OnboardingProgress'
import JournalSkeleton from './components/skeletons/JournalSkeleton'
import { getRank } from './components/DashboardData'

// Heavy components — code-split so they're not in the initial bundle
const JournalNotebook = lazy(() => import('./components/JournalNotebook'))

function MainContent() {
  const { step, setStep, selectedMoods, xp } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)

  // Determine the onboarding step number for the progress bar
  // 0=intro, 1=vibes, 2=preview, 3=journal
  const progressStep = !introComplete ? 0 : step < 4 ? 1 : step === 4 ? 2 : 3

  // Show welcome intro animation on first load
  if (!introComplete) {
    return (
      <>
        <OnboardingProgress step={progressStep} />
        <WelcomeIntro onComplete={() => setIntroComplete(true)} />
      </>
    )
  }

  // Step 1-3 or no moods → onboarding (MoodSelector)
  if (step < 4 || selectedMoods.length === 0) {
    return (
      <>
        <OnboardingProgress step={progressStep} />
        <MoodSelector onConfirm={() => setStep(4)} />
      </>
    )
  }

  // Step 4 → itinerary preview + carousel (SensoryHero)
  if (step === 4) {
    return (
      <>
        <OnboardingProgress step={progressStep} />
        <SensoryHero onBack={() => setStep(1)} />
      </>
    )
  }

  // Step 5+ → full Journal (lazy-loaded)
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalNotebook
        xp={xp}
        level={getRank(xp).label}
        onBack={() => setStep(1)}
      />
    </Suspense>
  )
}

export default function App() {
  return (
    <LangProvider>
      <ToastProvider>
        <VibeProvider>
          <MainContent />
        </VibeProvider>
      </ToastProvider>
    </LangProvider>
  )
}
