import { useContext } from 'react'
import { JourneyContext } from '../context/JourneyContext.js'

export function useJourney() {
  const context = useContext(JourneyContext)
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider')
  }
  return context
}

// Alias for backward compat during migration
export const useVibe = useJourney
