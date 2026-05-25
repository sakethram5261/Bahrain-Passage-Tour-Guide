import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import SensoryHero from './components/SensoryHero'
import Dashboard from './components/Dashboard'

function MainContent() {
  const { aligned } = useVibe()
  return (
    <>
      {!aligned ? <SensoryHero /> : <Dashboard />}
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
