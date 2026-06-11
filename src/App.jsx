import { useState } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import Dashboard from './components/Dashboard'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import JournalNotebook from './components/JournalNotebook'
import { getRank } from './components/DashboardData'

function MainContent() {
  const { step, setStep, selectedMoods, xp } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)

  if (!introComplete) return <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  // Step 5 & 6 = Dynamic Journal Notebook view
  if (step === 5 || step === 6) {
    const rank = getRank(xp)
    return (
      <JournalNotebook
        xp={xp}
        level={rank.label}
        onBack={() => setStep(1)}
      />
    )
  }
  if (step < 4 || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={() => setStep(4)} />
  }
  return <SensoryHero />
}

export default function App() {
  return (
    <VibeProvider>
      <MainContent />
    </VibeProvider>
  )
}
