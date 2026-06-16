/**
 * aiService.js — Shared AI utility for Bahrain Passage Tour Guide
 *
 * All external AI API calls go through the server-side proxy at /api/ai.
 * No API keys are read or bundled here — the proxy holds them securely.
 *
 * Fallback: static text strings (works even with no internet / no server)
 */

// In-memory response cache to avoid duplicate API calls
const responseCache = new Map()

function hashKey(systemPrompt, userPrompt) {
  return `${systemPrompt.slice(0, 40)}||${userPrompt.slice(0, 80)}`
}

/**
 * Call the server-side AI proxy with system + user prompts.
 * Returns AI response string, or fallbackText if the call fails.
 *
 * @param {string} systemPrompt  — Role/instructions for the model
 * @param {string} userPrompt    — The actual user query
 * @param {string} fallbackText  — Static text to return if AI unavailable
 * @param {object} options       — { maxTokens, temperature, cacheKey, useCache, useJson }
 */
export async function callLocalAI(systemPrompt, userPrompt, fallbackText = '', options = {}) {
  const {
    maxTokens   = 150,
    temperature = 0.75,
    useCache    = true,
    useJson     = false,
  } = options

  const cacheKey = options.cacheKey || hashKey(systemPrompt, userPrompt)

  if (useCache && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)
  }

  try {
    const response = await fetch('/api/ai', {
      method:  'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-passage-client': 'bahrain-journey-ledger-v5'
      },
      body: JSON.stringify({ systemPrompt, userPrompt, maxTokens, temperature, useJson }),
      signal: AbortSignal.timeout(9000), // slightly longer than server timeout
    })

    if (response.ok) {
      const data = await response.json()
      if (data.text) {
        if (useCache) responseCache.set(cacheKey, data.text)
        return data.text
      }
      // Server said fallback: true — use static text silently
      if (data.fallback) return fallbackText
    } else {
      const errText = await response.text().catch(() => '')
      console.warn(`[aiService] Proxy returned HTTP ${response.status}:`, errText.slice(0, 200))
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.warn('[aiService] Proxy request timed out')
    } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // Dev mode without a server — silently fall through to static content
      console.warn('[aiService] Proxy not available (dev mode?) — using static fallback')
    } else {
      console.warn('[aiService] Proxy error:', err.message)
    }
  }

  return fallbackText
}

/**
 * Clear AI response cache (e.g., on day change)
 */
export function clearAICache() {
  responseCache.clear()
}

// ─── Pre-built prompt factories ───────────────────────────────────────────────

export function buildSpotNarratorPrompt(spotName, spotDesc) {
  return {
    system: `You are Jafar Al-Sayyed, an elderly Bahraini pearl merchant and storyteller.
You speak in first person with vivid, warm, authentic detail about places in Bahrain you have personally visited many times.
Keep responses to exactly 2 sentences. Never use generic tourist language.`,
    user: `Tell me a personal memory or vivid observation about ${spotName}. Context about the place: ${spotDesc}`,
  }
}

export function buildHotelAdvisorPrompt(moods, tier, duration, hotels) {
  const tierLabel = { budget: 'budget-conscious', Wandering: 'budget-conscious', curated: 'mid-range', Curated: 'mid-range', luxury: 'luxury-seeking', Luxury: 'luxury-seeking' }[tier] || 'balanced'
  const moodList  = Array.isArray(moods) ? moods.join(', ') : moods
  const hotelList = hotels.map((h, i) => `${i + 1}. ${h.name} (${h.tier}, ${h.cost}): ${h.desc}`).join('\n')

  return {
    system: `You are a Bahrain travel consultant who recommends hotels based on traveler personality.
Be specific, warm, and honest. Match accommodation to the traveler's actual vibe.
Reply with ONLY a JSON array of 3 hotel objects: [{"name": "...", "reason": "..."}] where reason is exactly 1 sentence.
No extra text, no markdown, just valid JSON.`,
    user: `Traveler profile: ${tierLabel} budget, interested in ${moodList}, staying ${duration} days.
Available hotels:\n${hotelList}\nRecommend the 3 best matches with personal reasons.`,
  }
}

export function buildBudgetAdvisorPrompt(goldFils, currentDay, totalDays, tier) {
  return {
    system: `You are a friendly Bahraini travel budget advisor. Give practical, specific advice in 1 concise sentence.
Use Fils (local currency) naturally. Be encouraging but honest about spending.`,
    user: `Traveler has ${goldFils.toLocaleString()} Gold Fils remaining on Day ${currentDay} of ${totalDays}. Budget tier: ${tier}. Give one spending tip.`,
  }
}

export function buildRiddleHintPrompt(question, options) {
  return {
    system: `You are a cryptic but fair puzzle guide for Bahrain heritage riddles.
Give ONE helpful hint that guides without directly revealing the answer. Maximum 2 sentences. Be poetic and historical.`,
    user: `Riddle: "${question}"\nOptions: ${options.join(' / ')}\nProvide a hint that helps the traveler without stating the answer.`,
  }
}

export function buildLocationNavPrompt(spotName) {
  return {
    system: `You are a local Bahraini guide giving practical navigation tips.
Be specific — name actual streets, districts, or nearby landmarks. 1 sentence only.`,
    user: `How do travelers get to ${spotName} in Bahrain? Give a specific local navigation tip with a nearby street or landmark.`,
  }
}

export function buildHiddenGemPrompt(moods, tier, existingSpotNames) {
  const moodList = Array.isArray(moods) ? moods.join(', ') : moods
  const existing = existingSpotNames.join(', ')

  return {
    system: `You are an insider Bahrain travel expert who knows hidden gems beyond the tourist trail.
Recommend ONE specific Bahrain attraction not already in the traveler's itinerary.
Reply in this exact format: "PLACE: [name] | REASON: [1 sentence why they'd love it]"`,
    user: `Traveler loves: ${moodList}. Budget tier: ${tier}. Already visiting: ${existing}. Suggest one hidden gem they'd genuinely love.`,
  }
}
