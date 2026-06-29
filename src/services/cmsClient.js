import { spotStories } from './itinerary-database'
import { HOTELS_DB } from '../components/AIHotelPanel'

// Local cache to avoid re-evaluating queries
const queryCache = new Map()

/**
 * Execute a GROQ-like CMS query to fetch structured tourist guides and reviews.
 * Allows seamless hot-swapping to a live Sanity.io or Contentful database by
 * replacing this client's fetch implementation with a standard live Sanity fetch.
 *
 * @param {string} query — A GROQ query, e.g. "*[_type == 'spot' && mood == 'spice']"
 * @param {object} params — Optional query parameters
 */
export async function fetchCmsContent(query, params = {}) {
  const cacheKey = `${query}||${JSON.stringify(params)}`
  if (queryCache.has(cacheKey)) {
    return queryCache.get(cacheKey)
  }

  // Artificial short delay to simulate serverless latency
  await new Promise(resolve => setTimeout(resolve, 60))

  let result = null

  try {
    // 1. Query for active spots/stories
    if (query.includes("type == 'spot'") || query.includes("_type == 'spot'")) {
      const match = query.match(/id\s*==\s*['"]([^'"]+)['"]/)
      if (match) {
        const spotId = match[1]
        result = spotStories[spotId] || { id: spotId, story: null }
      } else {
        result = Object.values(spotStories)
      }
    } 
    // 2. Query for accommodation / hotel database
    else if (query.includes("type == 'hotel'") || query.includes("_type == 'hotel'")) {
      const match = query.match(/tier\s*==\s*['"]([^'"]+)['"]/)
      if (match) {
        const tier = match[1]
        result = HOTELS_DB.filter(h => h.tier?.toLowerCase() === tier.toLowerCase())
      } else {
        result = HOTELS_DB
      }
    } 
    // 3. Query for predefined itineraries
    else if (query.includes("type == 'itinerary'") || query.includes("_type == 'itinerary'")) {
      result = []
    } 
    // 4. Default fallback matching GROQ queries
    else {
      result = {
        _projectId: 'bahrain-passage-cms',
        _dataset: 'production',
        _query: query,
        status: 'mock_cms_fallback',
        items: []
      }
    }
  } catch (err) {
    console.error('[cmsClient] Failed to execute GROQ query:', err)
  }

  queryCache.set(cacheKey, result)
  return result
}

/**
 * Clear client cache (useful on language toggle or session reset)
 */
export function clearCmsCache() {
  queryCache.clear()
}
