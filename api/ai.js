/* global process */
/**
 * api/ai.js — Vercel Serverless Proxy for AI API calls
 *
 * Accepts POST { systemPrompt, userPrompt, maxTokens, temperature, useJson }
 * Returns  { text } or { error }
 *
 * API keys are read from server-side environment variables ONLY.
 * They are never bundled into client JavaScript.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'
const PRIMARY_MODEL   = 'google/gemini-2.5-flash:free'
const FALLBACK_MODEL  = 'qwen/qwen-2.5-72b-instruct:free'

export default async function handler(req, res) {
  const origin = req.headers.origin || ''
  const isDev  = process.env.NODE_ENV !== 'production'

  // CORS — only allow same-origin in production
  if (isDev || origin.includes('localhost') || origin.includes('bahrain-passage') || origin.includes('vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-passage-client')

  // Request origin validation in production
  if (!isDev && origin) {
    const isAllowedOrigin = origin.includes('localhost') || origin.includes('bahrain-passage') || origin.includes('vercel.app')
    if (!isAllowedOrigin) {
      return res.status(403).json({ error: 'Access denied: Unauthorized origin' })
    }
  }

  // Client authentication token validation
  const clientHeader = req.headers['x-passage-client']
  if (!isDev && clientHeader !== 'bahrain-journey-ledger-v5') {
    return res.status(403).json({ error: 'Access denied: Invalid client token' })
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    systemPrompt = '',
    userPrompt   = '',
    maxTokens    = 150,
    temperature  = 0.75,
    useJson      = false,
  } = req.body || {}

  if (!userPrompt) {
    return res.status(400).json({ error: 'userPrompt is required' })
  }

  const GEMINI_KEY      = process.env.GEMINI_API_KEY || ''
  const GROQ_API_KEY    = process.env.GROQ_API_KEY || ''
  const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY || ''

  // ── 1. Try Gemini direct ────────────────────────────────────────────────────
  if (GEMINI_KEY) {
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

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_KEY}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(8000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) return res.status(200).json({ text })
      } else {
        const errText = await response.text().catch(() => '')
        console.warn(`[api/ai] Gemini HTTP ${response.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[api/ai] Gemini error:', err.message)
    }
  }

  // ── 2. Try Groq direct ──────────────────────────────────────────────────────
  if (GROQ_API_KEY) {
    try {
      const url = 'https://api.groq.com/openai/v1/chat/completions'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
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
        signal: AbortSignal.timeout(8000),
      })

      if (response.ok) {
        const data = await response.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) return res.status(200).json({ text })
      } else {
        const errText = await response.text().catch(() => '')
        console.warn(`[api/ai] Groq HTTP ${response.status}:`, errText.slice(0, 200))
      }
    } catch (err) {
      console.warn('[api/ai] Groq error:', err.message)
    }
  }

  // ── 3. Try OpenRouter ───────────────────────────────────────────────────────
  if (OPENROUTER_KEY) {
    const isDeepSeekKey = OPENROUTER_KEY.startsWith('sk-') && !OPENROUTER_KEY.startsWith('sk-or-v1-')
    const baseUrl = isDeepSeekKey ? 'https://api.deepseek.com/chat/completions' : OPENROUTER_BASE
    const models  = isDeepSeekKey ? ['deepseek-chat'] : [PRIMARY_MODEL, FALLBACK_MODEL]

    for (const model of models) {
      try {
        const headers = {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${OPENROUTER_KEY}`,
        }
        if (!isDeepSeekKey) {
          headers['HTTP-Referer'] = 'https://bahrain-passage.app'
          headers['X-Title']      = 'Bahrain Passage Tour Guide'
        }

        const requestBody = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }
        if (model.toLowerCase().includes('gemini')) {
          requestBody.reasoning = { effort: 'none' }
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(8000),
        })

        if (!response.ok) {
          const errText = await response.text().catch(() => '')
          console.warn(`[api/ai] ${model} HTTP ${response.status}:`, errText.slice(0, 200))
          if (response.status === 401 || response.status === 402) break
          continue
        }

        const data = await response.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        if (text) return res.status(200).json({ text })
      } catch (err) {
        console.warn(`[api/ai] ${model} error:`, err.message)
      }
    }
  }

  // ── 3. No key available — tell client to use its fallback text ──────────────
  return res.status(503).json({ error: 'AI service unavailable', fallback: true })
}
