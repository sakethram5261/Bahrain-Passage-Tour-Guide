import { VibeProvider } from './context/VibeProvider'
import { useVibe } from './hooks/useVibe'
import OnboardingQuestionnaire from './components/OnboardingQuestionnaire'
import Dashboard from './components/Dashboard'

function MainContent() {
  const { aligned } = useVibe()
  return (
    <>
      {!aligned ? <OnboardingQuestionnaire /> : <Dashboard />}
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
