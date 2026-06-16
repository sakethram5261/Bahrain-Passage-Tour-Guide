import { useState, useEffect, useRef, useCallback } from 'react'
import { callLocalAI, buildBudgetAdvisorPrompt } from '../services/aiService'

export default function AIBudgetAdvisor({ goldFils, currentDay, totalDays, tier }) {
  const [tip, setTip] = useState('')
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  const prevDayRef = useRef(null)

  // Declare loadTip as a stable callback before the effect that calls it
  const loadTip = useCallback(async () => {
    setLoading(true)
    const { system, user } = buildBudgetAdvisorPrompt(goldFils, currentDay, totalDays, tier)
    const text = await callLocalAI(system, user,
      `You have ${goldFils.toLocaleString()} Gold Fils — enough for a couple of great experiences today!`,
      { cacheKey: `budget:${currentDay}:${Math.floor(goldFils/100)}`, maxTokens: 80 }
    )
    setTip(text)
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDay, goldFils, totalDays, tier])

  useEffect(() => {
    // Only refresh on day change
    if (prevDayRef.current === currentDay) return
    prevDayRef.current = currentDay
    loadTip()
  }, [currentDay, loadTip])

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)

    const hotelPrices = 'Muharraq Heritage Houses: 25 BHD, K Hotel: 35 BHD, Ramee Grand: 55 BHD, Gulf Hotel: 70 BHD, Merchant House: 80 BHD, Al Areen Palace: 110 BHD, Sofitel: 120 BHD, Four Seasons: 140 BHD.'
    const context = `Traveler has ${goldFils.toLocaleString()} Gold Fils. Budget tier: ${tier}. Day ${currentDay}/${totalDays}. Hotel prices for reference: ${hotelPrices}`

    const reply = await callLocalAI(
      `You are a friendly Bahrain travel budget assistant. Be concise, specific, and use Gold Fils as the currency. Context: ${context}`,
      msg,
      'That sounds like a great plan! Your budget looks healthy for the rest of the trip.',
      { useCache: false, maxTokens: 100 }
    )
    setChatMessages(prev => [...prev, { role: 'ai', text: reply }])
    setChatLoading(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const daysLeft = totalDays - currentDay
  const filsPerDayLeft = daysLeft > 0 ? Math.round(goldFils / daysLeft) : goldFils
  const budgetColor = goldFils > 500 ? 'emerald' : goldFils > 200 ? 'amber' : 'rose'

  return (
    <div className="rounded-2xl border border-red-500/10 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 bg-${budgetColor}-50 border-b border-${budgetColor}-200/30`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-sans text-[11px] tracking-widest uppercase text-bronze-muted/60 font-bold block">
              💰 Budget Pulse · Day {currentDay}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`font-mono text-lg font-black text-${budgetColor}-700`}>
                {goldFils.toLocaleString()}
              </span>
              <span className="font-sans text-[13px] text-bronze-muted/60 font-semibold">Gold Fils remaining</span>
            </div>
          </div>
          <button
            onClick={() => setShowChat(prev => !prev)}
            className="px-2.5 py-1.5 rounded-xl bg-bahrain-red/10 hover:bg-bahrain-red/20 text-bahrain-red text-[12.5px] font-extrabold uppercase tracking-wide cursor-pointer transition-all"
          >
            {showChat ? 'Close' : '🤖 Ask AI'}
          </button>
        </div>

        {/* Daily budget pill */}
        {daysLeft > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className={`h-1.5 flex-1 rounded-full bg-${budgetColor}-100`}>
              <div
                className={`h-1.5 rounded-full bg-${budgetColor}-500 transition-all`}
                style={{ width: `${Math.min(100, (currentDay / totalDays) * 100)}%` }}
              />
            </div>
            <span className="font-sans text-[11px] text-bronze-muted/50 shrink-0">
              ~{filsPerDayLeft.toLocaleString()} Fils/day left
            </span>
          </div>
        )}
      </div>

      {/* AI Tip */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <span className="text-base">💡</span>
            <div className="h-3 bg-bronze-muted/10 rounded flex-1" />
          </div>
        ) : (
          <p className="font-serif text-[13.5px] italic text-bronze-charcoal leading-relaxed">
            💡 {tip}
          </p>
        )}
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="border-t border-red-500/8">
          <div className="p-3 max-h-[160px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'none' }}>
            {chatMessages.length === 0 && (
              <p className="font-serif text-[13px] italic text-bronze-muted/50 text-center py-2">
                Ask me anything about your budget, hotel costs, or spending tips...
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[13.5px] leading-relaxed font-sans ${
                  msg.role === 'user'
                    ? 'bg-bahrain-red text-white rounded-br-sm'
                    : 'bg-amber-50 border border-amber-200/40 text-bronze-charcoal rounded-bl-sm font-serif italic'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/40 text-[12px] text-bronze-muted/50 italic animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 p-2 border-t border-red-500/8">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder='E.g. "Can I afford the Four Seasons?"'
              className="flex-1 px-3 py-2 text-[15px] font-serif rounded-xl border border-red-500/10 bg-[#FAFAF7] focus:outline-none focus:border-bahrain-red/30 text-bronze-charcoal placeholder-bronze-muted/30"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 rounded-xl bg-bahrain-red text-white text-[12px] font-extrabold cursor-pointer hover:bg-red-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
