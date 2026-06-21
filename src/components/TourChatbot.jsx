import { useState, useRef, useEffect } from 'react'
import { useVibe } from '../hooks/useVibe'

// ─── Knowledge base ────────────────────────────────────────────────────────────
const DESTINATIONS = {
  'bahrain fort': {
    name: "Qal'at al-Bahrain (Bahrain Fort)",
    tip: "A UNESCO World Heritage Site dating back 4,000 years to the Dilmun civilisation. The fort sits right on the sea — arrive at 5:45 PM to catch the Manama skyline catching golden light. Look for the ancient freshwater spring channels along the northern perimeter.",
    emoji: '🏯',
  },
  "qal'at": {
    name: "Qal'at al-Bahrain",
    tip: "The archaeological layers here span the Dilmun, Assyrian, Greek, and Portuguese eras. Walk the excavated corridors to see how each civilisation built on top of the last.",
    emoji: '🏯',
  },
  'barbar temple':      {
    name: 'Barbar Temple',
    tip: "Built around 2200 BCE, this is one of the oldest temples in the Arabian Gulf. The central well still shows natural groundwater rising from below — ancient Sumerians believed it was the mouth of the god Enki's freshwater kingdom.",
    emoji: '🏺',
  },
  'pearling path': {
    name: 'Pearling Path',
    tip: "Walk the UNESCO-listed alleys of Muharraq where pearl merchants once weighed fortunes in brass. The Bu Maher Fort at the end of the path marks where divers departed for the oyster beds. Best experienced at dusk when the sea breeze picks up.",
    emoji: '🦪',
  },
  'tree of life': {
    name: 'Tree of Life',
    tip: "A lone mesquite tree that has survived 400+ years in the Sakhir desert with no visible water source. Botanists believe its roots descend over 50 metres to reach subterranean aquifers. Best visited near sunset when the light is incredible.",
    emoji: '🌳',
  },
  'manama souq': {
    name: 'Manama Souq & Bab Al Bahrain',
    tip: "Enter through the 1949 stone archway of Bab Al Bahrain and head left into the spice alleyways. Around 7 PM vendors sell fresh jasmine flower strings. Look for Haji's Cafe tucked inside — no menu, they just bring you whatever's cooking.",
    emoji: '🏪',
  },
  'haji': {
    name: "Haji's Cafe",
    tip: "Founded in 1950, it has no printed menu. Sit on the wooden benches and the kitchen decides — usually fresh tomato eggs, warm khubz flatbread from the clay oven, and cardamom karak tea. A proper local experience.",
    emoji: '☕',
  },
  'jarada': {
    name: 'Jarada Sandbank',
    tip: "An ephemeral white sandbar that completely disappears under the turquoise sea twice a day. The low-tide window is roughly 11:30 AM–2:30 PM. Book a speedboat in advance and bring a pearl-opener — you might find a natural pearl in the shallows.",
    emoji: '🏖️',
  },
  'block 338': {
    name: 'Block 338, Adliya',
    tip: "Bahrain's creative quarter. Dozens of galleries and restaurants fill former Bahraini family homes. The hidden gem: walk the narrow alleys behind La Fontaine to find local printshops and courtyard art spaces that don't appear on maps.",
    emoji: '🎨',
  },
  'arad fort': {
    name: 'Arad Fort',
    tip: "A compact 15th-century fort with a rare square layout and cylindrical corner towers. The dry moat around it is still intact. Evening visits are stunning when the fort is lit up and reflected in the surrounding water.",
    emoji: '🏰',
  },
  'riffa fort': {
    name: 'Riffa Fort',
    tip: "Perched on a cliff overlooking the Haniniya Valley. The valley wind rushes up at sunset creating a natural desert cooling draft. The fort's terrace cafe serves cardamom coffee with an unbeatable view of the valley below.",
    emoji: '🏰',
  },
  'al areen': {
    name: 'Al Areen Wildlife Park',
    tip: "Home to the Arabian Oryx — saved from extinction in the 1970s through local breeding programmes. Book the early shuttle at 9 AM for the best chance to see the Oryx herds feeding before the heat sets in.",
    emoji: '🦌',
  },
  'national museum': {
    name: 'Bahrain National Museum',
    tip: "The waterfront museum holds a full-sized traditional pearling dhow and original Dilmun clay tablets inscribed with parts of the Epic of Gilgamesh. The Dilmun gallery on the ground floor is not to be missed.",
    emoji: '🏛️',
  },
  'al dar islands': {
    name: 'Al Dar Islands',
    tip: "Shallow clear waters perfect for kayaking over seagrass beds. You'll spot blue swimming crabs, orange starfish, and native clams in the warm shallows. Rent a beach cabana for the afternoon.",
    emoji: '🏝️',
  },
  'reef island': {
    name: 'Reef Island',
    tip: "A modern man-made island on Manama's northern shore with the best evening promenade in the city. Walk along the marina at 7:15 PM when the skyline neon lights begin to reflect on the calm sea.",
    emoji: '🌆',
  },
  'al jasra': {
    name: 'Al Jasra Heritage House',
    tip: "Built in 1907 from sea coral and palm trunks — traditional Bahraini building materials. The courtyard weavers demonstrate palm frond basket-weaving using techniques unchanged for centuries. You can buy hand-woven pieces directly.",
    emoji: '🏡',
  },
  'khalaf house': {
    name: 'Khalaf Al Mulla House',
    tip: "A grand Muharraq merchant home where pearl fortunes were weighed on brass scales. The high-ceilinged Majlis room uses carved wooden screens and a central courtyard arch to circulate sea breezes naturally — no air conditioning needed.",
    emoji: '🏛️',
  },
  'muharraq souq': {
    name: 'Muharraq Alleyways',
    tip: "The older, quieter sister to Manama Souq. Slip into the spice-grinder courtyards to smell fresh saffron pods being ground. The halwa shops along the main lane use original copper vats — Showaiter's is the oldest.",
    emoji: '🌶️',
  },
  'aali pottery': {
    name: "A'ali Pottery Village",
    tip: "The potters here use foot-kick wheels that mimic designs seen on ancient Dilmun tablets. The workshops sit alongside Bronze Age burial mounds. Buy a small terracotta water pot — it keeps water naturally cool without electricity.",
    emoji: '🏺',
  },
}

const MECHANICS = {
  xp: "XP (Experience Points) are earned by exploring landmarks, capturing Lens photos, solving riddles, and completing a day's itinerary. Earn enough to climb through ranks: Wanderer → Nomad → Merchant → Chronicler → Pearl Diver → Dilmun Pearl.",
  rank: "Your rank is shown in the top-right of the header. Tap it to open your Explorer Passport which shows your full progress. The higher your rank, the deeper your cultural insider knowledge grows.",
  keepsake: "Keepsakes are traditional souvenir relics unlocked by using the Capture Lens at each landmark. Open the Souvenirs tab (right side tabs) to see your collection.",
  lens: "The Capture Lens is a camera-style tool for each location. Tap '📷 Capture Lens Stamp' on any spot card to open it. You can take a photo or capture the landmark image — this earns XP, Gold Fils, and unlocks a Keepsake.",
  riddle: "Each landmark has a hidden riddle that tests your local knowledge. Solve it correctly for +35 XP and an insider tip that reveals a local secret. If you're stuck, you can buy a Riddle Scroll Clue from the Souq Shop.",
  day: "Complete all spots in a day's itinerary, then hit 'Seal Day' on the final page to stamp your passport. This unlocks the next day's chapter and gives you an exclusive insider passkey tip.",
  unlock: "To unlock the next day, you need to seal the current day first. Navigate through all the spots using the Prev/Next buttons at the bottom, then reach the final 'Seal Ledger' step and press Authenticate Stamp.",
  map: "The interactive Wayfarer Map shows all your itinerary spots on a Bahrain map with pulsing location markers. Open it from the Map tab. Tap any marker to jump to that spot's chronicle entry.",
  shop: "The Souq Shop is in the Souvenirs tab. Spend Gold Fils (earned from Lens captures and day completions) on riddle hints, and instant keepsake unlocks.",
  fils: "Gold Fils are the in-game currency. You earn them by capturing Lens photos and completing day itineraries. Spend them at the Souq Shop in the Souvenirs tab.",
  passport: "Your Explorer Passport shows your XP, rank, collected passport stamps for completed days, and all earned keepsakes. Tap the XP badge in the top-right header to open it.",
  journal: "The open-book journal is your main dashboard. The left page shows spot details, your personal notes, and riddles. The right page shows the spot postcard, your itinerary list, and lens capture.",
  tab: "The tabs (Info, Itinerary, Map, Hotels, Souvenirs, Phrases) let you switch between different sections. On desktop they appear as leather tabs on the right side. On mobile they appear as a row at the top.",
  phrasebook: "The Phrases tab teaches you Bahraini Arabic words. Tap any word card to hear the pronunciation via your device's speech system — it also plays a traditional Oud acoustic tone. Great for greeting locals.",
  mood: "Your vibes (Empires, Sea, Spice, Lights) set at the start determine which of Bahrain's 18 landmarks appear in your personal itinerary. You can edit your selections any time from the 'Edit Trip' button in the header.",
}

const QUICK_QUESTIONS = [
  { label: "Change budget to Luxury", key: 'luxury' },
  { label: "Make my trip 5 days", key: '5 days' },
  { label: "How do I earn Gold Fils?", key: 'fils' },
  { label: "Tell me about Bahrain Fort", key: 'bahrain fort' },
  { label: "What is the Capture Lens?", key: 'lens' },
  { label: "How do I unlock the next day?", key: 'unlock' },
]

// ─── Local Fallback Parser (Offline / Mismatch Keys) ──────────────────────────
function getLocalResponseAndActions(input, activeSpotName, currentMoods) {
  const q = input.toLowerCase().trim()
  const actions = []
  const actionsApplied = []

  // Check for budget tier change
  if (q.includes('budget') || q.includes('tier') || q.includes('wandering') || q.includes('curated') || q.includes('luxury')) {
    if (q.includes('luxury')) {
      actions.push({ type: 'SET_TIER', value: 'Luxury' })
      actionsApplied.push('Changed budget tier to Luxury')
    } else if (q.includes('curated')) {
      actions.push({ type: 'SET_TIER', value: 'Curated' })
      actionsApplied.push('Changed budget tier to Curated')
    } else if (q.includes('wandering') || q.includes('budget') || q.includes('basic') || q.includes('budget')) {
      actions.push({ type: 'SET_TIER', value: 'Wandering' })
      actionsApplied.push('Changed budget tier to Wandering')
    }
  }

  // Check for duration change
  const durationMatch = q.match(/(?:duration|days?|stay|trip|length)\s*(?:to|for)?\s*(\d+)/i) || q.match(/(\d+)\s*(?:days?|nights?)/i)
  if (durationMatch) {
    const val = parseInt(durationMatch[1], 10)
    if (val >= 1 && val <= 10) {
      actions.push({ type: 'SET_DURATION', value: val })
      actionsApplied.push(`Set stay duration to ${val} days`)
    }
  }

  // Check for mood / vibe changes
  const moodsList = []
  if (q.includes('empires') || q.includes('empire') || q.includes('ancient') || q.includes('fort')) moodsList.push('empires')
  if (q.includes('sea') || q.includes('ocean') || q.includes('pearl')) moodsList.push('sea')
  if (q.includes('spice') || q.includes('food') || q.includes('souq') || q.includes('tea')) moodsList.push('spice')
  if (q.includes('lights') || q.includes('light') || q.includes('modern') || q.includes('art')) moodsList.push('lights')

  if (moodsList.length > 0 && (q.includes('vibe') || q.includes('mood') || q.includes('change') || q.includes('set') || q.includes('add') || q.includes('remove'))) {
    if (q.includes('remove') || q.includes('delete')) {
      const remaining = currentMoods.filter(m => !moodsList.includes(m))
      actions.push({ type: 'SET_MOODS', value: remaining })
      actionsApplied.push(`Removed vibes: ${moodsList.join(', ')}`)
    } else if (q.includes('add') || q.includes('append')) {
      const merged = Array.from(new Set([...currentMoods, ...moodsList]))
      actions.push({ type: 'SET_MOODS', value: merged })
      actionsApplied.push(`Added vibes: ${moodsList.join(', ')}`)
    } else {
      actions.push({ type: 'SET_MOODS', value: moodsList })
      actionsApplied.push(`Set vibes to: ${moodsList.join(', ')}`)
    }
  }

  // Check for day change
  const dayMatch = q.match(/(?:go to|navigate to|show|view|day)\s*(\d+)/i)
  if (dayMatch) {
    const val = parseInt(dayMatch[1], 10)
    actions.push({ type: 'SET_DAY', value: val })
    actionsApplied.push(`Navigated to Day ${val}`)
  }

  // Check for money / fils cheat
  const filsMatch = q.match(/(?:give|add|grant|cheat|gain)\s+(?:me\s+)?(\d+)\s+(?:gold\s+)?(?:fils|coins|gold|money)/i) || q.match(/(\d+)\s+(?:gold\s+)?(?:fils|coins|gold)/i)
  if (filsMatch) {
    const val = parseInt(filsMatch[1], 10)
    actions.push({ type: 'ADD_FILS', value: val })
    actionsApplied.push(`Granted +${val} Gold Fils`)
  } else if (q.includes('give me coins') || q.includes('free money') || q.includes('infinite money')) {
    actions.push({ type: 'ADD_FILS', value: 1000 })
    actionsApplied.push('Granted +1000 Gold Fils')
  }

  // Check for XP cheat
  if (q.includes('give me xp') || q.includes('add xp') || q.includes('level up')) {
    actions.push({ type: 'ADD_XP', value: 300 })
    actionsApplied.push('Awarded +300 XP')
  }

  // Check for reset
  if (q.includes('reset') || q.includes('restart')) {
    actions.push({ type: 'RESET' })
    actionsApplied.push('Reset travel chronicle')
  }

  // Return local response if actions matched
  if (actions.length > 0) {
    return {
      text: `I've updated your trip parameters as requested! Let me know if you want to make further adjustments.`,
      actions,
      actionsApplied
    }
  }

  // Contextual — ask about current spot
  if ((q.includes('current') || q.includes('this spot') || q.includes('here') || q.includes('where am i')) && activeSpotName) {
    const key = Object.keys(DESTINATIONS).find(k => activeSpotName.toLowerCase().includes(k))
    if (key) {
      const d = DESTINATIONS[key]
      return { text: `You're at **${d.name}** ${d.emoji}\n\n${d.tip}`, actions: [], actionsApplied: [] }
    }
  }

  // Mechanics
  for (const [key, answer] of Object.entries(MECHANICS)) {
    if (q.includes(key)) {
      return { text: answer, actions: [], actionsApplied: [] }
    }
  }

  // Destination match
  for (const [key, dest] of Object.entries(DESTINATIONS)) {
    if (q.includes(key)) {
      return { text: `**${dest.name}** ${dest.emoji}\n\n${dest.tip}`, actions: [], actionsApplied: [] }
    }
  }

  // Greetings
  if (q.match(/^(hi|hello|hey|marhaba|salam)/)) {
    return { text: "Marhaba! 👋 I'm your Bahrain Passage guide. Ask me to change budget level, stay duration, or add/remove vibes, or ask about any local destinations or how the app works.", actions: [], actionsApplied: [] }
  }

  // Karak / food
  if (q.includes('karak') || q.includes('tea') || q.includes('coffee') || q.includes('food') || q.includes('eat')) {
    return { text: "For the best karak tea experience, head to Haji's Cafe inside Manama Souq — established 1950, no menu, pure cooking. For cardamom coffee (gahwa), any traditional souq vendor will serve you in a small brass dallah pot. 🍵", actions: [], actionsApplied: [] }
  }

  // Default
  return {
    text: "Hmm, I don't have a specific answer for that. But I know every corner of Bahrain! Try asking me to \"change budget to luxury\" or \"set duration to 7 days\" or \"tell me about Bahrain Fort\".",
    actions: [],
    actionsApplied: []
  }
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user'

  // Bold markdown parser
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ fontWeight: 700 }}>{part}</strong>
              : <span key={j}>{part}</span>
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '10px',
      animation: 'chatMsgIn 0.25s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #D11A38, #A81028)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, marginRight: 8, flexShrink: 0, marginTop: 2,
          boxShadow: '0 2px 6px rgba(209,26,56,0.35)',
        }}>
          🏛️
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        padding: '9px 13px',
        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: isUser
          ? 'linear-gradient(135deg, #D11A38, #A81028)'
          : '#fff',
        color: isUser ? '#fff' : '#2A2321',
        fontSize: 14,
        lineHeight: 1.55,
        fontFamily: '"Outfit", sans-serif',
        border: isUser ? 'none' : '1px solid rgba(209,26,56,0.1)',
        boxShadow: isUser
          ? '0 4px 12px rgba(209,26,56,0.25)'
          : '0 1px 4px rgba(42,35,33,0.06)',
      }}>
        <div>{renderText(msg.text)}</div>
        
        {/* Applied actions badge */}
        {msg.actionsApplied && msg.actionsApplied.length > 0 && (
          <div style={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            borderTop: isUser ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(209,26,56,0.12)',
            paddingTop: 6,
          }}>
            {msg.actionsApplied.map((act, i) => (
              <div key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                background: isUser ? 'rgba(255,255,255,0.18)' : 'rgba(209,26,56,0.08)',
                color: isUser ? '#fff' : '#D11A38',
                padding: '2px 6px',
                borderRadius: 6,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}>
                ⚙️ {act}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TourChatbot({ activeSpotName, embedded = false, onClose }) {
  const {
    step,
    setStep,
    selectedMoods,
    setSelectedMoods,
    tier,
    setTier,
    duration,
    setDuration,
    currentDayTab,
    setCurrentDayTab,
    goldFils,
    setGoldFils,
    xp,
    awardXP,
    itinerarySpots = [],
    resetChronicle
  } = useVibe()

  const [open, setOpen] = useState(false)
  const rawDeepSeekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  const rawOpenRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || ''
  
  const isOpenRouter = (key) => key.startsWith('sk-or-v1-')
  const isDeepSeek = (key) => key.startsWith('sk-') && !key.startsWith('sk-or-v1-')

  const openRouterKey = isOpenRouter(rawOpenRouterKey) ? rawOpenRouterKey : ''
  const deepSeekKey = isDeepSeek(rawDeepSeekKey) 
    ? rawDeepSeekKey 
    : (isDeepSeek(rawOpenRouterKey) ? rawOpenRouterKey : '')
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  const [provider, setProvider] = useState(() => {
    if (apiKey) return 'gemini'
    if (deepSeekKey) return 'deepseek'
    if (openRouterKey) return 'openrouter'
    return 'fallback'
  })

  const [apiError, setApiError] = useState(null)
  const [ollamaAvailable, setOllamaAvailable] = useState(false)

  useEffect(() => {
    // Still detect Ollama for the dropdown option, but don't auto-switch if we have an API key
    const checkOllama = async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags')
        if (res.ok) setOllamaAvailable(true)
      } catch { /* ignore */ }
    }
    checkOllama()
  }, [])

  const apiProviderName = provider === 'deepseek' ? 'DeepSeek' : provider === 'openrouter' ? 'OpenRouter' : provider === 'gemini' ? 'Gemini' : provider === 'ollama' ? 'Ollama' : 'Offline Mode'

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Marhaba! I'm your local guide — ask me about any Bahrain destination, or ask me to change budget level, stay duration, or vibes directly in chat!`
    },
  ])

  useEffect(() => {
    if (ollamaAvailable) {
      queueMicrotask(() => {
        setMessages(prev => {
          if (prev.some(m => m.text.includes("Ollama"))) return prev
          return [
            ...prev,
            {
              role: 'bot',
              text: `💡 **Tip:** Local Ollama was detected running on your computer! If you experience DeepSeek API errors (like Insufficient Balance), you can select **Local Ollama (qwen2.5-coder)** from the dropdown at the top of this chat box to run completely offline/free.`
            }
          ]
        })
      })
    }
  }, [ollamaAvailable])
  
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  // Execute structural state modifications
  const executeActions = (actions) => {
    if (!actions || !Array.isArray(actions)) return []
    const applied = []

    actions.forEach(action => {
      try {
        switch (action.type) {
          case 'SET_TIER': {
            const val = action.value
            if (['Wandering', 'Curated', 'Luxury'].includes(val)) {
              setTier(val)
              applied.push(`Budget tier set to: ${val}`)
            }
            break
          }
          case 'SET_DURATION': {
            const val = Number(action.value)
            if (val >= 1 && val <= 10) {
              setDuration(val)
              applied.push(`Stay duration set to: ${val} Days`)
            }
            break
          }
          case 'SET_STEP': {
            const val = Number(action.value)
            if (val >= 1 && val <= 6) {
              setStep(val)
              applied.push(`App screen step set to: ${val}`)
            }
            break
          }
          case 'SET_DAY': {
            const val = Number(action.value)
            if (val >= 1 && val <= duration) {
              setCurrentDayTab(val)
              applied.push(`Active day tab set to: Day ${val}`)
            }
            break
          }
          case 'SET_MOODS': {
            const val = action.value
            if (Array.isArray(val)) {
              const valid = val.filter(m => ['empires', 'sea', 'spice', 'lights'].includes(m))
              setSelectedMoods(valid)
              applied.push(`Vibes set to: ${valid.join(', ')}`)
            }
            break
          }
          case 'ADD_FILS': {
            const val = Number(action.value)
            if (!isNaN(val)) {
              setGoldFils(prev => Math.max(0, prev + val))
              applied.push(`Gold Fils adjusted by: ${val > 0 ? '+' : ''}${val}`)
            }
            break
          }
          case 'ADD_XP': {
            const val = Number(action.value)
            if (!isNaN(val)) {
              awardXP(val, "AI Companion Reward")
              applied.push(`XP adjusted by: +${val}`)
            }
            break
          }
          case 'RESET': {
            resetChronicle()
            applied.push(`Reset travel chronicles`)
            break
          }
          default:
            console.warn(`[Chatbot] Unknown action type: ${action.type}`)
        }
      } catch (err) {
        console.error(`[Chatbot] Error executing action`, action, err)
      }
    })
    return applied
  }

  // Generative API fetch logic for DeepSeek
  const callDeepSeekAPI = async (userText, chatHistory) => {
    const messagesPayload = [
      {
        role: 'system',
        content: `You are the Bahrain Passage Digital Travel Companion, a wise, warm, and highly knowledgeable local guide. 
You are embedded in a premium interactive travel journal app.
The user can talk to you to get recommendations, ask about landmarks, or instruct you to update their trip parameters directly.

Here is the current state of the user's trip:
- Step in App: ${step} (1=Mood Selection, 4=Itinerary Generation/Sensory Hero, 5=Journal Left Page/Seal Day, 6=Full Journal)
- Selected Vibes: ${JSON.stringify(selectedMoods)} (Possible: empires, sea, spice, lights)
- Stay Duration: ${duration} days (Max 10)
- Budget Level: ${tier} (Possible: Wandering, Curated, Luxury)
- Current Day Viewed: ${currentDayTab}
- Coins (Gold Fils): ${goldFils}
- XP (Experience Points): ${xp}
- Active Spot: ${activeSpotName || 'None'}
- Current Itinerary Locations: ${JSON.stringify(itinerarySpots.map(s => ({ id: s.id, name: s.name, day: s.day })))}

LANDMARK KNOWLEDGE BASE:
${JSON.stringify(DESTINATIONS, null, 2)}

DIRECTIONS:
1. Speak in a warm, welcoming, local Bahraini tone. Use brief markdown for styling (bolding, lists). Keep responses concise (under 3-4 sentences if possible) but rich in atmosphere.
2. If the user asks to change or update their trip parameters (e.g., "change budget to luxury", "make my trip 5 days", "add empires vibe", "go to day 2", "give me 500 gold fils", "reset trip"), you MUST include the corresponding state change actions in your JSON response.
3. You MUST respond with a valid JSON object matching the following structure:
{
  "text": "Your markdown-formatted message to the user here. Acknowledge the actions you are taking.",
  "actions": [
    { "type": "SET_TIER", "value": "Luxury" },
    { "type": "SET_DURATION", "value": 5 },
    { "type": "SET_STEP", "value": 5 },
    { "type": "SET_DAY", "value": 2 },
    { "type": "SET_MOODS", "value": ["empires", "sea"] },
    { "type": "ADD_FILS", "value": 500 },
    { "type": "ADD_XP", "value": 100 },
    { "type": "RESET" }
  ]
}

ACTIONS SPECIFICATION:
- SET_TIER: value must be one of: "Wandering", "Curated", "Luxury".
- SET_DURATION: value must be an integer between 1 and 10.
- SET_STEP: value must be an integer between 1 and 6.
- SET_DAY: value must be an integer between 1 and duration.
- SET_MOODS: value must be an array containing subset of: "empires", "sea", "spice", "lights".
- ADD_FILS: value must be an integer (positive or negative) to add to user's coins.
- ADD_XP: value must be an integer to add to user's XP.
- RESET: no value, resets progress.

If no actions are requested, return an empty actions array: "actions": [].
Always make sure the response is a valid JSON object. Do not include markdown code block formatting in your JSON output. Just output raw JSON.`
      }
    ]

    chatHistory.forEach(msg => {
      messagesPayload.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })
    })

    messagesPayload.push({
      role: 'user',
      content: userText
    })

    const url = 'https://api.deepseek.com/chat/completions'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepSeekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messagesPayload,
        response_format: {
          type: 'json_object'
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`DeepSeek API_ERROR: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const textResult = data.choices?.[0]?.message?.content
    if (!textResult) {
      throw new Error("EMPTY_RESPONSE_FROM_DEEPSEEK")
    }

    try {
      const parsed = JSON.parse(textResult.trim())
      return {
        text: parsed.text || "Processed request.",
        actions: parsed.actions || []
      }
    } catch {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0].trim())
          return {
            text: parsed.text || "Processed request.",
            actions: parsed.actions || []
          }
        } catch {
          // ignore
        }
      }
      return {
        text: textResult,
        actions: []
      }
    }
  }

  // Generative API fetch logic for Ollama
  const callOllamaAPI = async (userText, chatHistory) => {
    const messagesPayload = [
      {
        role: 'system',
        content: `You are the Bahrain Passage Digital Travel Companion, a wise, warm, and highly knowledgeable local guide. 
You are embedded in a premium interactive travel journal app.
The user can talk to you to get recommendations, ask about landmarks, or instruct you to update their trip parameters directly.

Here is the current state of the user's trip:
- Step in App: ${step} (1=Mood Selection, 4=Itinerary Generation/Sensory Hero, 5=Journal Left Page/Seal Day, 6=Full Journal)
- Selected Vibes: ${JSON.stringify(selectedMoods)} (Possible: empires, sea, spice, lights)
- Stay Duration: ${duration} days (Max 10)
- Budget Level: ${tier} (Possible: Wandering, Curated, Luxury)
- Current Day Viewed: ${currentDayTab}
- Coins (Gold Fils): ${goldFils}
- XP (Experience Points): ${xp}
- Active Spot: ${activeSpotName || 'None'}
- Current Itinerary Locations: ${JSON.stringify(itinerarySpots.map(s => ({ id: s.id, name: s.name, day: s.day })))}

LANDMARK KNOWLEDGE BASE:
${JSON.stringify(DESTINATIONS, null, 2)}

DIRECTIONS:
1. Speak in a warm, welcoming, local Bahraini tone. Use brief markdown for styling (bolding, lists). Keep responses concise (under 3-4 sentences if possible) but rich in atmosphere.
2. If the user asks to change or update their trip parameters (e.g., "change budget to luxury", "make my trip 5 days", "add empires vibe", "go to day 2", "give me 500 gold fils", "reset trip"), you MUST include the corresponding state change actions in your JSON response.
3. You MUST respond with a valid JSON object matching the following structure:
{
  "text": "Your markdown-formatted message to the user here. Acknowledge the actions you are taking.",
  "actions": [
    { "type": "SET_TIER", "value": "Luxury" },
    { "type": "SET_DURATION", "value": 5 },
    { "type": "SET_STEP", "value": 5 },
    { "type": "SET_DAY", "value": 2 },
    { "type": "SET_MOODS", "value": ["empires", "sea"] },
    { "type": "ADD_FILS", "value": 500 },
    { "type": "ADD_XP", "value": 100 },
    { "type": "RESET" }
  ]
}

ACTIONS SPECIFICATION:
- SET_TIER: value must be one of: "Wandering", "Curated", "Luxury".
- SET_DURATION: value must be an integer between 1 and 10.
- SET_STEP: value must be an integer between 1 and 6.
- SET_DAY: value must be an integer between 1 and duration.
- SET_MOODS: value must be an array containing subset of: "empires", "sea", "spice", "lights".
- ADD_FILS: value must be an integer (positive or negative) to add to user's coins.
- ADD_XP: value must be an integer to add to user's XP.
- RESET: no value, resets progress.

If no actions are requested, return an empty actions array: "actions": [].
Always make sure the response is a valid JSON object. Do not include markdown code block formatting in your JSON output. Just output raw JSON.`
      }
    ]

    chatHistory.forEach(msg => {
      messagesPayload.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })
    })

    messagesPayload.push({
      role: 'user',
      content: userText
    })

    const url = 'http://localhost:11434/v1/chat/completions'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen2.5-coder:7b',
        messages: messagesPayload,
        response_format: {
          type: 'json_object'
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Ollama API_ERROR: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const textResult = data.choices?.[0]?.message?.content
    if (!textResult) {
      throw new Error("EMPTY_RESPONSE_FROM_OLLAMA")
    }

    try {
      const parsed = JSON.parse(textResult.trim())
      return {
        text: parsed.text || "Processed request.",
        actions: parsed.actions || []
      }
    } catch {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0].trim())
          return {
            text: parsed.text || "Processed request.",
            actions: parsed.actions || []
          }
        } catch {
          // ignore
        }
      }
      return {
        text: textResult,
        actions: []
      }
    }
  }

  // Generative API fetch logic for OpenRouter
  const callOpenRouterAPI = async (userText, chatHistory) => {
    const messagesPayload = [
      {
        role: 'system',
        content: `You are the Bahrain Passage Digital Travel Companion, a wise, warm, and highly knowledgeable local guide. 
You are embedded in a premium interactive travel journal app.
The user can talk to you to get recommendations, ask about landmarks, or instruct you to update their trip parameters directly.

Here is the current state of the user's trip:
- Step in App: ${step} (1=Mood Selection, 4=Itinerary Generation/Sensory Hero, 5=Journal Left Page/Seal Day, 6=Full Journal)
- Selected Vibes: ${JSON.stringify(selectedMoods)} (Possible: empires, sea, spice, lights)
- Stay Duration: ${duration} days (Max 10)
- Budget Level: ${tier} (Possible: Wandering, Curated, Luxury)
- Current Day Viewed: ${currentDayTab}
- Coins (Gold Fils): ${goldFils}
- XP (Experience Points): ${xp}
- Active Spot: ${activeSpotName || 'None'}
- Current Itinerary Locations: ${JSON.stringify(itinerarySpots.map(s => ({ id: s.id, name: s.name, day: s.day })))}

LANDMARK KNOWLEDGE BASE:
${JSON.stringify(DESTINATIONS, null, 2)}

DIRECTIONS:
1. Speak in a warm, welcoming, local Bahraini tone. Use brief markdown for styling (bolding, lists). Keep responses concise (under 3-4 sentences if possible) but rich in atmosphere.
2. If the user asks to change or update their trip parameters (e.g., "change budget to luxury", "make my trip 5 days", "add empires vibe", "go to day 2", "give me 500 gold fils", "reset trip"), you MUST include the corresponding state change actions in your JSON response.
3. You MUST respond with a valid JSON object matching the following structure:
{
  "text": "Your markdown-formatted message to the user here. Acknowledge the actions you are taking.",
  "actions": [
    { "type": "SET_TIER", "value": "Luxury" },
    { "type": "SET_DURATION", "value": 5 },
    { "type": "SET_STEP", "value": 5 },
    { "type": "SET_DAY", "value": 2 },
    { "type": "SET_MOODS", "value": ["empires", "sea"] },
    { "type": "ADD_FILS", "value": 500 },
    { "type": "ADD_XP", "value": 100 },
    { "type": "RESET" }
  ]
}

ACTIONS SPECIFICATION:
- SET_TIER: value must be one of: "Wandering", "Curated", "Luxury".
- SET_DURATION: value must be an integer between 1 and 10.
- SET_STEP: value must be an integer between 1 and 6.
- SET_DAY: value must be an integer between 1 and duration.
- SET_MOODS: value must be an array containing subset of: "empires", "sea", "spice", "lights".
- ADD_FILS: value must be an integer (positive or negative) to add to user's coins.
- ADD_XP: value must be an integer to add to user's XP.
- RESET: no value, resets progress.

If no actions are requested, return an empty actions array: "actions": [].
Always make sure the response is a valid JSON object. Do not include markdown code block formatting in your JSON output. Just output raw JSON.`
      }
    ]

    chatHistory.forEach(msg => {
      messagesPayload.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })
    })

    messagesPayload.push({
      role: 'user',
      content: userText
    })

    const url = 'https://openrouter.ai/api/v1/chat/completions'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://github.com/sakethram5261/Bahrain-Passage-Tour-Guide',
        'X-Title': 'Bahrain Passage'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash:free',
        messages: messagesPayload,
        response_format: {
          type: 'json_object'
        },
        reasoning: {
          effort: 'none'
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter API_ERROR: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const textResult = data.choices?.[0]?.message?.content
    if (!textResult) {
      throw new Error("EMPTY_RESPONSE_FROM_OPENROUTER")
    }

    try {
      const parsed = JSON.parse(textResult.trim())
      return {
        text: parsed.text || "Processed request.",
        actions: parsed.actions || []
      }
    } catch {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0].trim())
          return {
            text: parsed.text || "Processed request.",
            actions: parsed.actions || []
          }
        } catch {
          // ignore
        }
      }
      return {
        text: textResult,
        actions: []
      }
    }
  }

  // Generative API fetch logic
  const callGeminiAPI = async (userText, chatHistory) => {
    // Gemini requires the first message in the contents to be from user.
    // We filter chatHistory to start at the first message sent by the user.
    const contents = []
    let foundUser = false
    for (const msg of chatHistory) {
      if (msg.role === 'user') {
        foundUser = true
      }
      if (foundUser) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })
      }
    }
    
    contents.push({
      role: 'user',
      parts: [{ text: userText }]
    })

    const systemInstructionText = `You are the Bahrain Passage Digital Travel Companion, a wise, warm, and highly knowledgeable local guide. 
You are embedded in a premium interactive travel journal app.
The user can talk to you to get recommendations, ask about landmarks, or instruct you to update their trip parameters directly.

Here is the current state of the user's trip:
- Step in App: ${step} (1=Mood Selection, 4=Itinerary Generation/Sensory Hero, 5=Journal Left Page/Seal Day, 6=Full Journal)
- Selected Vibes: ${JSON.stringify(selectedMoods)} (Possible: empires, sea, spice, lights)
- Stay Duration: ${duration} days (Max 10)
- Budget Level: ${tier} (Possible: Wandering, Curated, Luxury)
- Current Day Viewed: ${currentDayTab}
- Coins (Gold Fils): ${goldFils}
- XP (Experience Points): ${xp}
- Active Spot: ${activeSpotName || 'None'}
- Current Itinerary Locations: ${JSON.stringify(itinerarySpots.map(s => ({ id: s.id, name: s.name, day: s.day })))}

LANDMARK KNOWLEDGE BASE:
${JSON.stringify(DESTINATIONS, null, 2)}

DIRECTIONS:
1. Speak in a warm, welcoming, local Bahraini tone. Use brief markdown for styling (bolding, lists). Keep responses concise (under 3-4 sentences if possible) but rich in atmosphere.
2. If the user asks to change or update their trip parameters (e.g., "change budget to luxury", "make my trip 5 days", "add empires vibe", "go to day 2", "give me 500 gold fils", "reset trip"), you MUST include the corresponding state change actions in your JSON response.
3. You MUST respond with a valid JSON object matching the following structure:
{
  "text": "Your markdown-formatted message to the user here. Acknowledge the actions you are taking.",
  "actions": [
    { "type": "SET_TIER", "value": "Luxury" },
    { "type": "SET_DURATION", "value": 5 },
    { "type": "SET_STEP", "value": 5 },
    { "type": "SET_DAY", "value": 2 },
    { "type": "SET_MOODS", "value": ["empires", "sea"] },
    { "type": "ADD_FILS", "value": 500 },
    { "type": "ADD_XP", "value": 100 },
    { "type": "RESET" }
  ]
}

ACTIONS SPECIFICATION:
- SET_TIER: value must be one of: "Wandering", "Curated", "Luxury".
- SET_DURATION: value must be an integer between 1 and 10.
- SET_STEP: value must be an integer between 1 and 6.
- SET_DAY: value must be an integer between 1 and duration.
- SET_MOODS: value must be an array containing subset of: "empires", "sea", "spice", "lights".
- ADD_FILS: value must be an integer (positive or negative) to add to user's coins.
- ADD_XP: value must be an integer to add to user's XP.
- RESET: no value, resets progress.

If no actions are requested, return an empty actions array: "actions": [].
Always make sure the response is a valid JSON object. Do not include markdown code block formatting in your JSON output. Just output raw JSON.`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`API_ERROR: ${response.status} - ${errText}`)
    }

    const data = await response.json()
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!textResult) {
      throw new Error("EMPTY_RESPONSE")
    }

    try {
      const parsed = JSON.parse(textResult.trim())
      return {
        text: parsed.text || "Processed request.",
        actions: parsed.actions || []
      }
    } catch {
      // JSON block fallback search
      const jsonMatch = textResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0].trim())
          return {
            text: parsed.text || "Processed request.",
            actions: parsed.actions || []
          }
        } catch {
          // ignore
        }
      }
      return {
        text: textResult,
        actions: []
      }
    }
  }

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text }
    
    // Add user message to state
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    try {
      let apiResponse
      if (provider === 'deepseek') {
        apiResponse = await callDeepSeekAPI(text, messages)
      } else if (provider === 'openrouter') {
        apiResponse = await callOpenRouterAPI(text, messages)
      } else if (provider === 'gemini') {
        apiResponse = await callGeminiAPI(text, messages)
      } else if (provider === 'ollama') {
        apiResponse = await callOllamaAPI(text, messages)
      } else {
        throw new Error("LOCAL_FALLBACK_TRIGGERED")
      }

      setApiError(null)

      const appliedLabels = executeActions(apiResponse.actions)
      setMessages(prev => [...prev, {
        role: 'bot',
        text: apiResponse.text,
        actionsApplied: appliedLabels
      }])
    } catch (err) {
      console.error("Chatbot processing error", err)
      // Fallback on error
      const local = getLocalResponseAndActions(text, activeSpotName, selectedMoods)
      const appliedLabels = executeActions(local.actions)
      
      let errorFriendlyName
      if (err.message && err.message.includes("402")) {
        errorFriendlyName = "Insufficient Balance (402)"
      } else if (err.message && err.message.includes("401")) {
        errorFriendlyName = "Invalid API Key / Unauthorized (401)"
      } else {
        errorFriendlyName = err.message || "Connection Error"
      }

      setApiError({
        provider: apiProviderName,
        message: errorFriendlyName
      })

      // Auto-switch provider to fallback so the user is not stuck on a broken API key
      setProvider('fallback')

      setMessages(prev => [...prev, {
        role: 'bot',
        text: local.text,
        actionsApplied: appliedLabels.length > 0 ? appliedLabels : local.actionsApplied
      }])
    } finally {
      setTyping(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating trigger button — only in standalone (non-embedded) mode */}
      {!embedded && (
        <button
          onClick={() => setOpen(o => !o)}
          title="Ask your local guide"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 10000,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: open
              ? '#2A2321'
              : 'radial-gradient(circle, #e6b800 0%, #b38600 100%)',
            border: open ? '2px solid rgba(212,175,55,0.4)' : '2.5px double #ffffff',
            boxShadow: open
              ? '0 10px 30px rgba(0,0,0,0.35)'
              : '0 10px 30px rgba(179,134,0,0.5), inset 0 2px 2px rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 20,
            color: '#fff',
            transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
            transform: open ? 'scale(0.92)' : 'scale(1)',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.transform = 'scale(1)' }}
        >
          {open ? '✕' : '🏛️'}
        </button>
      )}

      {/* Chat panel — shown always in embedded mode, or when open in standalone mode */}
      {(embedded || open) && (
        <div
          style={{
            ...(embedded ? {
              // Embedded: fill the parent container (no position:fixed, full height)
              position: 'relative',
              width: '100%',
              height: 'min(480px, calc(100vh - 220px))',
            } : {
              // Standalone: floating fixed panel
              position: 'fixed',
              bottom: '88px',
              right: '24px',
              zIndex: 249,
              width: 'min(370px, calc(100vw - 48px))',
              height: 'min(540px, calc(100vh - 120px))',
              animation: 'chatPanelUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
            }),
            borderRadius: '24px',
            background: '#FCFBF8',
            border: '4px double rgba(193,18,47,0.3)',
            boxShadow: '0 20px 50px rgba(42,35,33,0.25), inset 0 0 0 1px rgba(193,18,47,0.05)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #D11A38 0%, #A81028 100%)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, border: '1.5px solid rgba(255,255,255,0.3)',
            }}>🏛️</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: '"Outfit", sans-serif', letterSpacing: 0.2 }}>
                Bahrain Passage Guide
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 500, fontFamily: '"Outfit", sans-serif', marginTop: '2px' }}>
                Local travel assistant
              </div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: provider === 'fallback' ? '#fca5a5' : '#4ade80',
              boxShadow: provider === 'fallback' ? '0 0 6px rgba(252,165,165,0.8)' : '0 0 6px rgba(74,222,128,0.8)',
              flexShrink: 0,
            }} />
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '8px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'}
              >
                ✕
              </button>
            )}
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div style={{
              background: '#FEE2E2',
              borderBottom: '1px solid #FCA5A5',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '11.5px',
              color: '#991B1B',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 500,
              animation: 'chatMsgIn 0.2s ease-out',
            }}>
              <span style={{ fontSize: 13 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <strong>{apiError.provider} error:</strong> {apiError.message}. Auto-switched to Offline Fallback.
              </div>
              <button 
                onClick={() => setApiError(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991B1B',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 12,
                  padding: '2px 4px',
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex',
            flexDirection: 'column',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(209,26,56,0.2) transparent',
            background: '#FAF9F6',
          }}>
            {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D11A38, #A81028)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, boxShadow: '0 2px 6px rgba(209,26,56,0.3)',
                }}>🏛️</div>
                <div style={{
                  display: 'flex', gap: 4, padding: '9px 13px',
                  background: '#fff',
                  borderRadius: '4px 14px 14px 14px',
                  border: '1px solid rgba(209,26,56,0.12)',
                  boxShadow: '0 1px 4px rgba(42,35,33,0.06)',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#D11A38',
                      opacity: 0.5,
                      animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          <div style={{
            padding: '6px 12px',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            flexShrink: 0,
            borderTop: '1px solid rgba(209,26,56,0.1)',
            background: '#FAF9F6',
            scrollbarWidth: 'none',
          }}>
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q.label)}
                style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: 'rgba(209,26,56,0.06)',
                  border: '1px solid rgba(209,26,56,0.2)',
                  color: '#D11A38',
                  fontSize: 12,
                  fontFamily: '"Outfit", sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(209,26,56,0.12)'
                  e.currentTarget.style.borderColor = 'rgba(209,26,56,0.35)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(209,26,56,0.06)'
                  e.currentTarget.style.borderColor = 'rgba(209,26,56,0.2)'
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px 4px',
            borderTop: '1px solid rgba(209,26,56,0.1)',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
            background: '#fff',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me to set budget, change duration, etc..."
              style={{
                flex: 1,
                background: '#FAF9F6',
                border: '1px solid rgba(209,26,56,0.15)',
                borderRadius: 12,
                padding: '9px 13px',
                color: '#2A2321',
                fontSize: 16,
                fontFamily: '"Outfit", sans-serif',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(209,26,56,0.45)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(209,26,56,0.15)' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              style={{
                width: 38, height: 38,
                borderRadius: 12,
                background: input.trim()
                  ? 'linear-gradient(135deg, #D11A38, #A81028)'
                  : 'rgba(209,26,56,0.08)',
                border: 'none',
                color: input.trim() ? '#fff' : 'rgba(209,26,56,0.35)',
                fontSize: 15,
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s',
                boxShadow: input.trim() ? '0 3px 10px rgba(209,26,56,0.3)' : 'none',
              }}
            >
              ↑
            </button>
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(92,84,81,0.5)',
            textAlign: 'center',
            background: '#fff',
            paddingBottom: '8px',
            fontFamily: '"Outfit", sans-serif',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            Powered by {apiProviderName}
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPanelUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%           { opacity: 1;   transform: scale(1.15); }
        }
      `}</style>
    </>
  )
}
