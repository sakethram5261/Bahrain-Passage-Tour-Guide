import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import Lenis from 'lenis'
import { BookOpen } from 'lucide-react'
import { JourneyProvider } from './context/JourneyProvider'
import { useVibe } from './hooks/useVibe'
import { LangProvider } from './context/LangContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import Onboarding from './components/Onboarding'
import JournalSkeleton from './components/skeletons/JournalSkeleton'
import LangToggle from './components/LangToggle'
import PassportCard from './components/PassportCard'
import { getRank } from './data/ranks'

const JournalNotebook = lazy(() => import('./components/JournalNotebook'))

function MainContent() {
  const { step, setStep, selectedMoods, xp, showPassportCard, setShowPassportCard } = useVibe()

  let childView

  if (step < 5) {
    childView = <Onboarding />
  } else {
    childView = (
      <Suspense fallback={<JournalSkeleton />}>
        <JournalNotebook
          xp={xp}
          level={getRank(xp).label}
          onBack={() => setStep(1)}
        />
      </Suspense>
    )
  }

  // Only show floating header during onboarding hero step (step === 1 only), not during setup or loading
  const showFloatingHeader = false

  return (
    <div className="relative min-h-screen">
      {showFloatingHeader && (
        <div className="floating-header absolute top-4 right-4 z-[100] flex items-center gap-2 pointer-events-auto">
          {xp > 0 && step >= 4 && (
            <button
              onClick={() => setShowPassportCard(true)}
              className="passport-trigger-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white text-overline cursor-pointer transition-all hover:bg-black/60 active:scale-95"
              aria-label="View Explorer Passport"
            >
              <BookOpen size={12} className="shrink-0" strokeWidth={2} />
              <span>Passport ({getRank(xp).label})</span>
            </button>
          )}
          <LangToggle className="border-white/20 bg-black/40 backdrop-blur hover:bg-black/60" />
        </div>
      )}
      {showPassportCard && step < 5 && (
        <PassportCard onClose={() => setShowPassportCard(false)} />
      )}
      <ErrorBoundary>
        {/* data-lenis-prevent stops Lenis hijacking scroll inside Onboarding's own snap container */}
        <div data-lenis-prevent={step < 5 ? true : undefined}>
          {childView}
        </div>
      </ErrorBoundary>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // standard expo easing
      smoothWheel: true
    })
    
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    
    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <LangProvider>
      <ToastProvider>
        <JourneyProvider>
          <>
            <a href="#main-content" className="skip-to-content">
              Skip to content
            </a>
            <div id="main-content">
              <MainContent />
            </div>
          </>
        </JourneyProvider>
      </ToastProvider>
    </LangProvider>
  )
}
