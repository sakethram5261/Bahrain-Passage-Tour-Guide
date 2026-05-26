import { useState } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import Dashboard from './components/Dashboard'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'

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
      <MainContent />
    </VibeProvider>
  )
}
