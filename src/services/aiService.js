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
      // Server said fallback: true — use static text
      if (data.fallback) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ai-fallback-triggered'))
        }
        return fallbackText
      }
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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ai-fallback-triggered'))
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
    system: `You are a knowledgeable Bahraini cultural guide who speaks with vivid, authentic detail about every place in Bahrain.
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

export function buildSpotSearchPrompt(searchQuery) {
  return {
    system: `You are a helpful Bahraini tour guide.
Provide detailed information about the location queried: "${searchQuery}".
The location must be in Bahrain. If the queried place is not in Bahrain, set success to false and write an error message in errorMsg.
You must reply with a valid JSON object. Do not wrap the JSON in markdown code blocks or backticks.
The JSON object must have the following keys:
- name: Official English name of the place
- arabic: Arabic script of the name (e.g. "جامع أحمد الفاتح")
- desc: A small paragraph describing the place, its historical/cultural significance, and what visitors do there (2-3 sentences)
- where: Precise description of where it is located in Bahrain (e.g., Al Juffair, Manama, Muharraq)
- coords: Approx GPS coordinates (e.g., "26.2185° N, 50.5912° E")
- hours: Standard opening hours (e.g., "Open daily 9:00 AM - 5:00 PM, closed Fridays")
- cost: Estimated entry cost / fee (e.g., "Free Entry", "2 BHD")
- modestyAlert: A string with modesty dress warning if it's a religious/governmental site, otherwise empty
- safetyAlert: Any heat, timing, or safety warnings, otherwise empty
- insider: One cool insider tip or local observation about it
- category: one of: fort, souq, coast, modern, desert, culture
- period: historical period or era (e.g. "Dilmun Era" or "Modern Era")
- success: boolean (true if the place is in Bahrain, false otherwise)
- errorMsg: error message string if success is false`,
    user: `Provide details about this place in Bahrain: "${searchQuery}".`
  }
}

