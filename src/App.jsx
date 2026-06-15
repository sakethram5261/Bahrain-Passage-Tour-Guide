import { useState } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import JournalNotebook from './components/JournalNotebook'
import { getRank } from './components/DashboardData'

function MainContent() {
  const { step, setStep, selectedMoods, xp } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)

  // Show welcome intro animation on first load
  if (!introComplete) return <WelcomeIntro onComplete={() => setIntroComplete(true)} />

  // Step 1-3 or no moods → onboarding (MoodSelector)
  if (step < 4 || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={() => setStep(4)} />
  }

  // Step 4 → itinerary preview + carousel (SensoryHero)
  // SensoryHero calls setStep(5) internally when user clicks "Proceed"
  if (step === 4) {
    return <SensoryHero />
  }

  // Step 5+ → full Journal / Dashboard (TourChatbot is embedded inside JournalNotebook)
  return (
    <JournalNotebook
      xp={xp}
      level={getRank(xp).label}
      onBack={() => setStep(1)}
    />
  )
}

export default function App() {
  return (
    <VibeProvider>
      <MainContent />
    </VibeProvider>
  )
}
