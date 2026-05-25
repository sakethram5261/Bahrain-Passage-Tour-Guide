import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import Dashboard from './components/Dashboard'
import { Skiper39 } from './components/v1/skiper39'

function MainContent() {
  const { aligned } = useVibe()
  return (
    <>
      {!aligned ? <SensoryHero /> : <Dashboard />}
      <Skiper39 />
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
