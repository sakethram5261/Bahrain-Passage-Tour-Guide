import { spotStories, compileLocalItinerary } from './itinerary-database'
import { callLocalAI, buildSpotNarratorPrompt } from './aiService'

export async function fetchCuratedItinerary(selectedMoods, tier, duration, pace) {
  try {
    // Artificial short delay to maintain the visual transition states in the UI
    await new Promise(resolve => setTimeout(resolve, 800))
    return compileLocalItinerary(selectedMoods, tier, duration, pace)
  } catch (error) {
    console.error('Failed to compile itinerary:', error)
    return null
  }
}

export async function fetchSpotStory(spot) {
  if (!spot) return null
  try {
    const { system, user } = buildSpotNarratorPrompt(spot.name, spot.desc || '')
    const fallbackText = spotStories[spot.id]?.story || `Looking upon the majestic site of ${spot.name}, one feels the profound legacy of Dilmun and Islamic history that shaped this coast over millennia.`
    
    // Call the real local AI (which connects to Gemini via Vercel proxy, or uses client keys, or falls back to static content if offline)
    const storyText = await callLocalAI(system, user, fallbackText, { maxTokens: 120 })
    return storyText
  } catch (error) {
    console.error('Failed to compile spot story via AI:', error)
    return spotStories[spot?.id]?.story || `Looking upon the majestic site of ${spot?.name || 'this landmark'}, one feels the profound legacy of Dilmun and Islamic history that shaped this coast over millennia.`
  }
}

