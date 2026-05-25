import { useContext } from 'react'
import { VibeContext } from '../context/VibeContext.js'

export function useVibe() {
  const context = useContext(VibeContext)
  if (!context) {
    throw new Error('useVibe must be used within a VibeProvider')
  }
  return context
}
