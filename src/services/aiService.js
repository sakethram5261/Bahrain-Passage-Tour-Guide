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

  // 1. Check for client-side API keys to bypass backend proxy limits
  let clientGeminiKey = ''
  let clientGroqKey = ''
  
  if (typeof window !== 'undefined') {
    try {
      clientGeminiKey = localStorage.getItem('bp_user_gemini_key') || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || ''
      clientGroqKey = localStorage.getItem('bp_user_groq_key') || (import.meta.env && import.meta.env.VITE_GROQ_API_KEY) || ''
    } catch (e) {
      console.warn('[aiService] Failed to read client keys:', e)
    }
  }

  if (clientGeminiKey) {
    try {
      const bodyPayload = {
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }
      if (useJson) {
        bodyPayload.generationConfig.responseMimeType = 'application/json'
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${clientGeminiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(9000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) {
          if (useCache) responseCache.set(cacheKey, text)
          return text
        }
      } else {
        const errText = await response.text().catch(() => '')
        console.warn(`[aiService] Direct Gemini API returned HTTP ${response.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[aiService] Direct Gemini API call failed:', err.message)
    }
  }

  if (clientGroqKey) {
    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientGroqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          response_format: useJson ? { type: 'json_object' } : undefined,
        }),
        signal: AbortSignal.timeout(9000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) {
          if (useCache) responseCache.set(cacheKey, text)
          return text
        }
      } else {
        const errText = await response.text().catch(() => '')
        console.warn(`[aiService] Direct Groq API returned HTTP ${response.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[aiService] Direct Groq API call failed:', err.message)
    }
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

// ─── Vision / Multimodal ───────────────────────────────────────────────────────

/**
 * Send a base64-encoded image to Gemini's vision model and get a culturally-
 * aware description back. Requires a Gemini API key in localStorage or .env.
 *
 * @param {string} base64Image  — Pure base64 string (no data:image/... prefix)
 * @param {string} mimeType     — e.g. 'image/jpeg'
 * @param {string} prompt       — What to ask about the image
 * @param {string} fallbackText — Static text if AI unavailable
 */
export async function callGeminiVision(base64Image, mimeType = 'image/jpeg', prompt, fallbackText = '') {
  let key = ''
  if (typeof window !== 'undefined') {
    try {
      key = localStorage.getItem('bp_user_gemini_key')
        || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY)
        || ''
    } catch { /* ignore */ }
  }

  // 1. If client key is available, run direct API call (saves server load)
  if (key) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${key}`
      const body = {
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 160,
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) return text
      } else {
        const errText = await response.text().catch(() => '')
        console.warn(`[aiService] Gemini Vision returned HTTP ${response.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[aiService] Gemini Vision call failed:', err.message)
    }
  }

  // 2. If no client key, forward to the serverless proxy /api/ai
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-passage-client': 'bahrain-journey-ledger-v5'
      },
      body: JSON.stringify({
        userPrompt: prompt,
        image: base64Image,
        mimeType,
        maxTokens: 160
      }),
      signal: AbortSignal.timeout(14000),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.text) return data.text
      if (data.fallback) return fallbackText
    } else {
      const errText = await response.text().catch(() => '')
      console.warn(`[aiService] Vision proxy returned HTTP ${response.status}:`, errText.slice(0, 200))
    }
  } catch (err) {
    console.warn('[aiService] Vision proxy call failed, using static fallback:', err.message)
  }

  return fallbackText
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
  const escapedQuery = searchQuery.replace(/"/g, '\\"')
  return {
    system: `You are an extremely helpful and knowledgeable local Bahraini tour guide.
Provide detailed information about the location queried: "${escapedQuery}".

IMPORTANT CONTEXT FOR SEARCH:
- The search is specifically for locations within the Kingdom of Bahrain.
- If the user searches for any local business, establishment, restaurant, cafe, hotel, mall, street, park, or shop (even if the name is somewhat generic or popular globally, like "Cocos", "Alosra", "The Avenues", "Lost Paradise of Dilmun", "City Centre", "Starbucks", "McDonalds", "Clay Restaurant"), you must find or map the matching location or branch in Bahrain and return success: true.
- Do not be overly restrictive. If a place exists in Bahrain, describe that specific Bahraini location, its neighborhood (e.g., Adliya, Saar, Seef, Manama), and its local details.
- Only set success to false and return an error message in errorMsg if the place is explicitly and obviously completely outside of Bahrain and has no relevance to a Bahrain traveler (e.g., "Eiffel Tower", "London Eye", "Statue of Liberty", "Central Park NY").

You must reply with a valid JSON object. Do not wrap the JSON in markdown code blocks or backticks.
The JSON object must have the following keys:
- name: Official English name of the place
- arabic: Arabic script of the name (e.g. "جامع أحمد الفاتح" or "مطعم كوكوز")
- desc: A small paragraph describing the place, its local appeal, its significance, and what visitors do there (2-3 sentences)
- where: Precise description of where it is located in Bahrain (e.g., Block 338 Adliya, Seef District, Manama, Saar)
- coords: Approx GPS coordinates in Bahrain (e.g., "26.2185° N, 50.5912° E")
- hours: Standard opening hours (e.g., "Open daily 9:00 AM - 11:00 PM")
- cost: Estimated entry cost, fee, or average price tier (e.g., "Free Entry", "3-8 BHD per person", "2 BHD")
- modestyAlert: A string with modesty dress warning if it's a religious/governmental site, otherwise empty
- safetyAlert: Any heat, timing, or safety warnings, otherwise empty
- insider: One cool insider tip, signature dish, or local observation about it
- category: one of: fort, souq, coast, modern, desert, culture
- period: historical period or era (e.g. "Dilmun Era", "Modern Era", "Established 1998")
- success: boolean (true if the place is in Bahrain or has a matching branch/location in Bahrain, false otherwise)
- errorMsg: error message string if success is false`,
    user: `Provide details about this place in Bahrain: "${escapedQuery}".`
  }
}

