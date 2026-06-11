import { useState, useRef, useEffect } from 'react'

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
  'barbar temple': {
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
  xp: "XP (Experience Points) are earned by visiting spots, capturing Lens photos, solving riddles, and completing a day's itinerary. Earn enough to climb through ranks: Wanderer → Nomad → Merchant → Chronicler → Pearl Diver → Dilmun Pearl.",
  rank: "Your rank is shown in the top-right of the header. Tap it to open your Explorer Passport which shows your full progress. The higher your rank, the deeper your cultural insider knowledge grows.",
  keepsake: "Keepsakes are traditional souvenir relics unlocked by using the Capture Lens at each landmark. Open the Souvenirs tab (right side tabs) to see your collection. You can also buy keepsakes from Jafar's Souq Shop using Gold Fils.",
  lens: "The Capture Lens is a camera-style tool for each location. Tap '📷 Capture Lens Stamp' on any spot card to open it. You can take a photo or capture the landmark image — this earns XP, Gold Fils, and unlocks a Keepsake.",
  riddle: "Each landmark has a hidden riddle that tests your local knowledge. Solve it correctly for +35 XP and an insider tip that reveals a local secret. If you're stuck, you can buy a Riddle Scroll Clue from Jafar's Souq Shop.",
  day: "Complete all spots in a day's itinerary, then hit 'Seal Day' on the final page to stamp your passport. This unlocks the next day's chapter and gives you an exclusive insider passkey tip.",
  unlock: "To unlock the next day, you need to seal the current day first. Navigate through all the spots using the Prev/Next buttons at the bottom, then reach the final 'Seal Ledger' step and press Authenticate Stamp.",
  map: "The interactive Wayfarer Map shows all your itinerary spots on a Bahrain map with pulsing location markers. Open it from the Map tab. Tap any marker to jump to that spot's chronicle entry.",
  shop: "Jafar's Souq Shop is in the Souvenirs tab. Spend Gold Fils (earned from Lens captures and day completions) on riddle hints, reputation boosters with local characters, and instant keepsake unlocks.",
  fils: "Gold Fils are the in-game currency. You earn them by capturing Lens photos and completing day itineraries. Spend them at Jafar's Souq Shop in the Souvenirs tab.",
  guide: "Three historical guides comment on each spot: Merchant Jafar (1920s pearling era), Priestess Ninsun (2000 BCE Dilmun era), and Architect Al-Farsi (1400s military era). Switch between them using the buttons in the guide panel.",
  passport: "Your Explorer Passport shows your XP, rank, collected passport stamps for completed days, and all earned keepsakes. Tap the XP badge in the top-right header to open it.",
  journal: "The open-book journal is your main dashboard. The left page shows spot details, guide commentary, your personal notes, and riddles. The right page shows the spot postcard, your itinerary list, and lens capture.",
  tab: "The four tabs (Today's Spots, Map, Souvenirs, Phrasebook) let you switch between different sections. On desktop they appear as leather tabs on the right side. On mobile they appear as a row at the top.",
  phrasebook: "The Phrasebook tab teaches you Bahraini Arabic words. Tap any word card to hear the pronunciation via your device's speech system — it also plays a traditional Oud acoustic tone. Great for greeting locals.",
  almanac: "The Almanac in the Map tab shows themed atmospheric data for each day's locations — tide times, temperature, stargazing windows, and more. It adds context to when and how to visit each spot.",
  mood: "Your vibes (Empires, Sea, Spice, Lights) set at the start determine which of Bahrain's 18 landmarks appear in your personal itinerary. You can edit your selections any time from the 'Edit Trip' button in the header.",
}

const QUICK_QUESTIONS = [
  { label: "How do I unlock the next day?", key: 'unlock' },
  { label: "What is the Capture Lens?", key: 'lens' },
  { label: "How do I earn Gold Fils?", key: 'fils' },
  { label: "What are keepsakes?", key: 'keepsake' },
  { label: "Tell me about the Bahrain Fort", key: 'bahrain fort' },
  { label: "What's the Tree of Life?", key: 'tree of life' },
]

// ─── Response engine ─────────────────────────────────────────────────────────
function getResponse(input, activeSpotName) {
  const q = input.toLowerCase().trim()

  // Contextual — ask about current spot
  if ((q.includes('current') || q.includes('this spot') || q.includes('here') || q.includes('where am i')) && activeSpotName) {
    const key = Object.keys(DESTINATIONS).find(k => activeSpotName.toLowerCase().includes(k))
    if (key) {
      const d = DESTINATIONS[key]
      return { text: `You're at **${d.name}** ${d.emoji}\n\n${d.tip}`, type: 'spot' }
    }
  }

  // Mechanics
  for (const [key, answer] of Object.entries(MECHANICS)) {
    if (q.includes(key)) {
      return { text: answer, type: 'mechanic' }
    }
  }

  // Destination match
  for (const [key, dest] of Object.entries(DESTINATIONS)) {
    if (q.includes(key)) {
      return { text: `**${dest.name}** ${dest.emoji}\n\n${dest.tip}`, type: 'spot' }
    }
  }

  // Greetings
  if (q.match(/^(hi|hello|hey|marhaba|salam)/)) {
    return { text: "Marhaba! 👋 I'm your Bahrain Passage guide. Ask me about any destination, or how the app works — riddles, keepsakes, Gold Fils, unlocking days, you name it.", type: 'greeting' }
  }

  // Karak / food
  if (q.includes('karak') || q.includes('tea') || q.includes('coffee') || q.includes('food') || q.includes('eat')) {
    return { text: "For the best karak tea experience, head to Haji's Cafe inside Manama Souq — established 1950, no menu, pure generational cooking. For cardamom coffee (gahwa), any traditional souq vendor will serve you in a small brass dallah pot. 🍵", type: 'tip' }
  }

  // Help catch-all
  if (q.includes('help') || q.includes('lost') || q.includes('confused') || q.includes('what do i do') || q.includes('how does')) {
    return { text: "No worries! Here's the flow:\n\n1. **Browse spots** on the left page — tap Prev/Next to move between them\n2. **Capture a photo** using the Lens button on the right page\n3. **Solve the riddle** for +35 XP and a secret insider tip\n4. **Seal the day** at the final step to stamp your passport & unlock day 2\n\nTap any quick question below or just ask me anything!", type: 'help' }
  }

  // Default
  return {
    text: "Hmm, I don't have a specific answer for that — but I know every corner of Bahrain! Try asking about a destination (\"tell me about Barbar Temple\") or how something works (\"what is XP?\", \"how do I unlock the next day?\").",
    type: 'default'
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
        fontSize: 12.5,
        lineHeight: 1.55,
        fontFamily: '"Outfit", sans-serif',
        border: isUser ? 'none' : '1px solid rgba(209,26,56,0.1)',
        boxShadow: isUser
          ? '0 4px 12px rgba(209,26,56,0.25)'
          : '0 1px 4px rgba(42,35,33,0.06)',
      }}>
        {renderText(msg.text)}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TourChatbot({ activeSpotName }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Marhaba! I'm your local guide — ask me about any Bahrain destination, how to earn XP, unlock days, or anything else you need. 🇧🇭",
    },
  ])
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

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const response = getResponse(text, activeSpotName)
      setMessages(prev => [...prev, { role: 'bot', text: response.text }])
      setTyping(false)
    }, 600 + Math.random() * 400)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Ask your local guide"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 500,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open
            ? '#2A2321'
            : 'linear-gradient(135deg, #D11A38, #A81028)',
          border: open ? '2px solid rgba(209,26,56,0.3)' : '2px solid rgba(255,255,255,0.2)',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.25)'
            : '0 6px 24px rgba(209,26,56,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 20,
          transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
          transform: open ? 'scale(0.92)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.transform = 'scale(1)' }}
      >
        {open ? '✕' : '🏛️'}
      </button>

      {/* Chat panel — journal cream palette */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '24px',
            zIndex: 499,
            width: 'min(360px, calc(100vw - 48px))',
            height: 'min(520px, calc(100vh - 120px))',
            borderRadius: '20px',
            background: '#FAF9F6',
            border: '1.5px solid rgba(209,26,56,0.18)',
            boxShadow: '0 20px 60px rgba(42,35,33,0.2), 0 4px 16px rgba(209,26,56,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'chatPanelUp 0.35s cubic-bezier(0.16,1,0.3,1) both',
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
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, border: '1.5px solid rgba(255,255,255,0.3)',
            }}>🏛️</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, fontFamily: '"Outfit", sans-serif', letterSpacing: 0.2 }}>
                Bahrain Passage Guide
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5, fontFamily: '"Outfit", sans-serif', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 1 }}>
                مرحباً · Your local companion
              </div>
            </div>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#4ade80',
              boxShadow: '0 0 5px rgba(74,222,128,0.7)',
            }} />
          </div>

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
                  fontSize: 10,
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
            padding: '10px 12px',
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
              placeholder="Ask about any destination or feature..."
              style={{
                flex: 1,
                background: '#FAF9F6',
                border: '1px solid rgba(209,26,56,0.15)',
                borderRadius: 12,
                padding: '9px 13px',
                color: '#2A2321',
                fontSize: 12.5,
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
