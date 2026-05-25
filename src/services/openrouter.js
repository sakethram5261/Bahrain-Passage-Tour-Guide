const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''

export async function fetchAICuratedItinerary(selectedMoods, tier, duration, pace) {
  try {
    const prompt = `You are a world-class travel curator for the Kingdom of Bahrain. Custom-compile a highly personalized travel itinerary for a visitor with this profile:
- Experiential Moods: ${selectedMoods.join(', ')}
- Stay Duration: ${duration} Days
- Budget Tier: ${tier === 'Wandering' ? 'Budget-friendly (Wandering Explorer)' : 'Premium/Luxury (Exquisite Curator)'}
- Travel Pace: ${pace}

You MUST ONLY select and schedule spot objects using the valid IDs in this exact list:
1. qal-at-al-bahrain (Qal'at al-Bahrain Fort)
2. muharraq-souq (Muharraq Souq & Siyadi House)
3. pearling-path (The Pearling Path UNESCO Trail)
4. block-338 (Block 338 Adliya)
5. jarada-island (Jarada Island Sandbank)
6. tree-of-life (The Tree of Life)
7. haji-cafe (Haji's Traditional Cafe)
8. aali-pottery (A'ali Pottery Hamlet)
9. arad-fort (Arad Fort)
10. national-museum (Bahrain National Museum)
11. al-dar-islands (Al Dar Islands Sitra)
12. reef-island (Reef Island Promenade)
13. riffa-fort (Riffa Fort)
14. barbar-temple (Barbar Dilmun Temple)
15. al-jasra-house (Al Jasra Handicrafts & House)
16. khalaf-house (Khalaf House Pearling)
17. manama-souq (Bab Al Bahrain & Manama Souq)
18. al-areen (Al Areen Wildlife Sakhir Park)

Do NOT invent or include any other IDs. Distribute these spots beautifully across Day 1 to Day ${duration}. 

Return a strictly structured JSON object containing:
1. "itinerary": An array of objects distributed chronologically from Day 1 to Day ${duration}. Each object must contain:
   - "id": The EXACT string ID matching one of the 18 valid spots above (e.g. "qal-at-al-bahrain")
   - "day": The day integer (1 to ${duration})
   - "pathGuide": Actionable details on what to do here, customized strictly to the user's budget tier (${tier === 'Wandering' ? 'budget-friendly explorer guide' : 'luxury curator premium guide'}).
   - "pathCost": A short cost tag string (e.g. "Free Entry" or "1 BHD water taxi" or "45 BHD private charter").
2. "daySummaries": An object where keys are day numbers (1 to ${duration}) and values are a concise, 1-sentence poetic theme for that day's passage.

Format the output strictly as a single JSON code block. Do not include any markdown comments outside the JSON.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://bahrainpassage.app',
        'X-Title': 'Bahrain Passage Travel Guide'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error('API fetch failed')
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    return JSON.parse(content)
  } catch (error) {
    console.error('Failed to fetch AI itinerary:', error)
    return null
  }
}

export async function fetchAISpotStory(spot, selectedMoods, tier, activeGuide = 'jafar') {
  try {
    const guidePrompts = {
      ninsun: "Ninsun, an ancient Dilmun priestess from c. 2000 BCE. Speak of freshwater springs rising from the ocean, sacred limestone temple rituals, copper metallurgy, and mystical tree spirits of Dilmun. Use words like 'sacred waters', 'blessed clay', 'merchant ships of Meluhha', 'altars'.",
      'al-farsi': "Master Al-Farsi, an expert military architect from the 15th Century. Speak of defensive limestone battlements, sea moats, military towers, coastal winds, and structural geometries. Use words like 'limestone masonry', 'defensive moat', 'parapets', 'tactical watch', 'ramparts'.",
      jafar: "Jafar, a wise pearling merchant from Manama in the 1920s. Speak of oyster fleets, coastal woodcrafts, bustling market lanes, coffee brews, wind-towers, and traditional Oud music. Use words like 'oyster fleets', 'karak brew', 'wind-catchers', 'pearl luster', 'bazaar alleys'."
    }

    const chosenPrompt = guidePrompts[activeGuide] || guidePrompts.jafar

    const prompt = `You are a legendary local storyteller in the Kingdom of Bahrain. For this scan, you must strictly roleplay as: ${chosenPrompt}

A traveler with a style of "${tier} Explorer" and focus of "${selectedMoods.join(', ')}" has aligned their brass Wayfarer Lens onto the landmark: "${spot.name}" (${spot.coords}, Epoch: ${spot.period}).

Write a beautiful, evocative, and deeply personal 2-sentence journal entry for this traveler in your character's voice.
- Speak directly in the first person of your historical character. 
- Lyrically explain what they are seeing, feeling, or sensing at this exact spot.
- Reveal one highly specific "secret local tip" or hidden detail that an ordinary tourist would miss, themed around your character's background.
- Speak with the warm, handwritten tone of an ancient diary.
- Keep the entire response under 70 words and return ONLY the storytelling text without any quotes or introductions.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://bahrainpassage.app',
        'X-Title': 'Bahrain Passage Travel Guide'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error('API fetch failed')
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
  } catch (error) {
    console.error('Failed to fetch AI spot story:', error)
    return null
  }
}
