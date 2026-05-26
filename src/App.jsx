import { useState, Suspense, lazy } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'

// LAZY LOADING: This forces Vite to split these files apart. 
// They will not execute until the exact moment they are needed, 
// completely destroying the circular dependency loop causing the white screen!
const SensoryHero = lazy(() => import('./components/SensoryHero'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const MoodSelector = lazy(() => import('./components/MoodSelector'))
const WelcomeIntro = lazy(() => import('./components/WelcomeIntro'))

function MainContent() {
  const { step, setStep, selectedMoods } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)

  if (!introComplete) return <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  if (step === 5) return <Dashboard />
  if (step < 4 || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={() => setStep(4)} />
  }
  return <SensoryHero />
}

export default function App() {
  return (
    <VibeProvider>
      {/* Suspense catches the app while the split files load safely in the background */}
      <Suspense 
        fallback={
          <div className="fixed inset-0 bg-[#FAF9F6] flex items-center justify-center">
            <span className="text-[#A80D27] font-mono text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse">
              Initializing Passage...
            </span>
          </div>
        }
      >
        <MainContent />
      </Suspense>
    </VibeProvider>
  )
}
