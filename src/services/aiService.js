/**
 * aiService.js — Shared AI utility for Bahrain Passage Tour Guide
 * Routes calls to local Ollama (qwen2.5-coder:7b) with static fallback.
 */

const OLLAMA_BASE = 'http://localhost:11434'
const OLLAMA_CHAT = `${OLLAMA_BASE}/v1/chat/completions`
const DEFAULT_MODEL = 'qwen2.5-coder:7b'

// In-memory cache keyed by prompt hash to avoid duplicate calls
const responseCache = new Map()

function hashKey(systemPrompt, userPrompt) {
  return `${systemPrompt.slice(0, 40)}||${userPrompt.slice(0, 80)}`
}

/**
 * Call local Ollama AI with a system + user prompt.
 * Returns the AI response string, or fallbackText if the call fails.
 *
 * @param {string} systemPrompt  — Role/instructions for the model
 * @param {string} userPrompt    — The actual user query
 * @param {string} fallbackText  — Static text to return if AI is unavailable
 * @param {object} options       — Optional overrides: { model, maxTokens, temperature, cacheKey }
 */
export async function callLocalAI(systemPrompt, userPrompt, fallbackText = '', options = {}) {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 140,
    temperature = 0.75,
    useCache = true,
  } = options

  const cacheKey = options.cacheKey || hashKey(systemPrompt, userPrompt)

  if (useCache && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)
  }

  try {
    const res = await fetch(OLLAMA_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(12000), // 12s max wait
    })

    if (!res.ok) {
      console.warn(`[aiService] HTTP ${res.status} from Ollama`)
      return fallbackText
    }

    const data = await res.json()
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) return fallbackText

    if (useCache) responseCache.set(cacheKey, text)
    return text
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.warn('[aiService] Ollama request timed out')
    } else {
      console.warn('[aiService] Ollama unavailable:', err.message)
    }
    return fallbackText
  }
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
  const tierLabel = { budget: 'budget-conscious', curated: 'mid-range', luxury: 'luxury-seeking' }[tier] || 'balanced'
  const moodList = Array.isArray(moods) ? moods.join(', ') : moods
  const hotelList = hotels.map((h, i) => `${i + 1}. ${h.name} (${h.tier}, ${h.cost}): ${h.desc}`).join('\n')

  return {
    system: `You are a Bahrain travel consultant who recommends hotels based on traveler personality.
Be specific, warm, and honest. Match accommodation to the traveler's actual vibe.
Reply with ONLY a JSON array of 3 hotel objects: [{name, reason}] where reason is exactly 1 sentence.
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
