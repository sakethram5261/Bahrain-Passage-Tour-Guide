import { spotStories, compileLocalItinerary } from './itinerary-database'

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

export async function fetchSpotStory(spot, selectedMoods, tier, activeGuide = 'jafar') {
  try {
    // Artificial short delay for sensory transition state
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const spotId = spot?.id
    const storiesForSpot = spotStories[spotId]
    
    if (storiesForSpot) {
      const story = storiesForSpot[activeGuide]
      if (story) return story
    }
    
    return `Looking upon the ruins of ${spot?.name || 'this landmark'}, one feels the quiet heartbeat of history that spans centuries.`
  } catch (error) {
    console.error('Failed to compile spot story:', error)
    return null
  }
}
