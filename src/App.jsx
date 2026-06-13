import { useState } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import MoodSelector from './components/MoodSelector'
import WelcomeIntro from './components/WelcomeIntro'
import JournalNotebook from './components/JournalNotebook'
import TourChatbot from './components/TourChatbot'
import { getRank } from './components/DashboardData'

function MainContent() {
  const { step, setStep, selectedMoods, xp, itinerarySpots, currentSpotIndex } = useVibe()
  const [introComplete, setIntroComplete] = useState(false)

  if (!introComplete) return <WelcomeIntro onComplete={() => setIntroComplete(true)} />
  
  const activeSpot = itinerarySpots?.[currentSpotIndex]

  return (
    <>
      {step === 5 || step === 6 ? (
        <JournalNotebook
          xp={xp}
          level={getRank(xp).label}
          onBack={() => setStep(1)}
        />
      ) : step < 4 || selectedMoods.length === 0 ? (
        <MoodSelector onConfirm={() => setStep(4)} />
      ) : (
        <SensoryHero />
      )}
      {step >= 4 && <TourChatbot activeSpotName={activeSpot?.name} />}
    </>
  )
}

export default function App() {
  return (
    <VibeProvider>
      <MainContent />
    </VibeProvider>
  )
}
