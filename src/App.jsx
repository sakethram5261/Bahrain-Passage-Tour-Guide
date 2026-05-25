import { useState } from 'react'
import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import Dashboard from './components/Dashboard'
import MoodSelector from './components/MoodSelector'

function MainContent() {
  const { aligned, selectedMoods } = useVibe()
  const [moodsConfirmed, setMoodsConfirmed] = useState(false)

  if (aligned) return <Dashboard />
  if (!moodsConfirmed || selectedMoods.length === 0) {
    return <MoodSelector onConfirm={() => setMoodsConfirmed(true)} />
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
