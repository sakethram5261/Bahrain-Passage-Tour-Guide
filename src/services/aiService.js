/**
 * aiService.js — Shared AI utility for Bahrain Passage Tour Guide
 * Primary: OpenRouter API (free tier, publicly deployed)
 * Fallback: static text strings (works even with no internet)
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

// Model to use via OpenRouter — qwen/qwen-2.5-72b-instruct is free and excellent
// for narrative/storytelling tasks. Fallback to a smaller free model if needed.
const PRIMARY_MODEL = 'qwen/qwen-2.5-72b-instruct'
const FALLBACK_MODEL = 'mistralai/mistral-7b-instruct'

// In-memory response cache to avoid duplicate API calls
const responseCache = new Map()

function hashKey(systemPrompt, userPrompt) {
  return `${systemPrompt.slice(0, 40)}||${userPrompt.slice(0, 80)}`
}

/**
 * Call OpenRouter AI with system + user prompts.
 * Returns AI response string, or fallbackText if the call fails.
 *
 * @param {string} systemPrompt  — Role/instructions for the model
 * @param {string} userPrompt    — The actual user query
 * @param {string} fallbackText  — Static text to return if AI unavailable
 * @param {object} options       — { maxTokens, temperature, cacheKey, useCache }
 */
export async function callLocalAI(systemPrompt, userPrompt, fallbackText = '', options = {}) {
  const {
    maxTokens = 150,
    temperature = 0.75,
    useCache = true,
  } = options

  const cacheKey = options.cacheKey || hashKey(systemPrompt, userPrompt)

  if (useCache && responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)
  }

  // Priority 1: Gemini Direct (if key available)
  if (GEMINI_KEY) {
    try {
      const isJson = systemPrompt.toLowerCase().includes('json')
      const bodyPayload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: maxTokens
        }
      }
      if (isJson) {
        bodyPayload.generationConfig.responseMimeType = "application/json"
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(15000)
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          if (useCache) responseCache.set(cacheKey, text)
          return text
        }
      } else {
        const errText = await res.text().catch(() => '')
        console.warn(`[aiService] Gemini returned HTTP ${res.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn(`[aiService] Gemini error:`, err.message)
    }
  }

  // Priority 2: DeepSeek / OpenRouter
  if (OPENROUTER_KEY) {
    // Auto-detect key type: OpenRouter vs direct DeepSeek
    const isDeepSeekKey = OPENROUTER_KEY.startsWith('sk-') && !OPENROUTER_KEY.startsWith('sk-or-v1-')
    const baseUrl = isDeepSeekKey ? 'https://api.deepseek.com/chat/completions' : OPENROUTER_BASE
    const models = isDeepSeekKey ? ['deepseek-chat'] : [PRIMARY_MODEL, FALLBACK_MODEL]

    // Try primary model, then fallback model
    for (const model of models) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
        }

        // OpenRouter specific headers
        if (!isDeepSeekKey) {
          headers['HTTP-Referer'] = 'https://bahrain-passage.app'
          headers['X-Title'] = 'Bahrain Passage Tour Guide'
        }

        const res = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature,
            max_tokens: maxTokens,
          }),
          signal: AbortSignal.timeout(15000), // 15s max
        })

        if (!res.ok) {
          const errText = await res.text().catch(() => '')
          console.warn(`[aiService] ${model} returned HTTP ${res.status}:`, errText.slice(0, 200))
          
          // Handle out of balance (402) or unauthorized (401)
          if (res.status === 402) {
            return `*(Notice: The configured DeepSeek key has run out of funds/balance. Please add credits to your DeepSeek account.)*`
          }
          if (res.status === 401) {
            return `*(Notice: The configured API key is invalid or unauthorized.)*`
          }

          // If 402 (payment required) or 401 (auth), no point retrying other model
          if (res.status === 401 || res.status === 402) break
          continue // try fallback model
        }

        const data = await res.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (!text) continue

        if (useCache) responseCache.set(cacheKey, text)
        return text
      } catch (err) {
        if (err.name === 'TimeoutError') {
          console.warn(`[aiService] ${model} timed out`)
        } else {
          console.warn(`[aiService] ${model} error:`, err.message)
        }
      }
    }
  } else {
    console.warn('[aiService] No API key found — returning static fallback')
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
  const moodList = Array.isArray(moods) ? moods.join(', ') : moods
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
