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

  const headerBg = {
    emerald: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20',
    amber: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/20',
    rose: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/20',
  }[budgetColor]

  const textColor = {
    emerald: 'text-emerald-700 dark:text-emerald-450',
    amber: 'text-amber-700 dark:text-amber-450',
    rose: 'text-rose-700 dark:text-rose-450',
  }[budgetColor]

  const progressBg = {
    emerald: 'bg-emerald-500 dark:bg-emerald-600',
    amber: 'bg-amber-500 dark:bg-amber-655',
    rose: 'bg-rose-500 dark:bg-rose-600',
  }[budgetColor]

  const railBg = {
    emerald: 'bg-emerald-100 dark:bg-emerald-950/30',
    amber: 'bg-amber-100 dark:bg-amber-950/30',
    rose: 'bg-rose-100 dark:bg-rose-950/30',
  }[budgetColor]

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-sans text-[10px] tracking-widest uppercase text-stone-500 dark:text-stone-450 font-bold block">
              Budget · Day {currentDay}
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`font-mono text-lg font-black ${textColor}`}>
                {goldFils.toLocaleString()}
              </span>
              <span className="font-sans text-[11px] text-stone-500 dark:text-stone-450 font-semibold uppercase tracking-wider">Gold Fils remaining</span>
            </div>
          </div>
          <button
            onClick={() => setShowChat(prev => !prev)}
            className="px-3 py-1.5 rounded-xl bg-[#C1122F]/5 dark:bg-[#C5A880]/10 border border-[#C1122F]/15 dark:border-[#C5A880]/20 text-[#C1122F] dark:text-[#C5A880] hover:bg-[#C1122F]/10 dark:hover:bg-[#C5A880]/20 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all font-sans"
          >
            {showChat ? 'Close' : 'Ask Guide'}
          </button>
        </div>

        {/* Daily budget pill */}
        {daysLeft > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className={`h-1.5 flex-1 rounded-full ${railBg}`}>
              <div
                className={`h-1.5 rounded-full transition-all ${progressBg}`}
                style={{ width: `${Math.min(100, (currentDay / totalDays) * 100)}%` }}
              />
            </div>
            <span className="font-sans text-[10px] text-stone-400 dark:text-stone-550 shrink-0 font-medium">
              ~{filsPerDayLeft.toLocaleString()} Fils/day left
            </span>
          </div>
        )}
      </div>

      {/* AI Tip */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded flex-1" />
          </div>
        ) : (
          <p className="font-serif text-xs italic text-stone-850 dark:text-stone-200 leading-relaxed text-left m-0">
            {tip}
          </p>
        )}
      </div>

      {/* AI Chat Panel */}
      {showChat && (
        <div className="border-t border-stone-200 dark:border-stone-850 bg-stone-50 dark:bg-[#12100E]">
          <div className="p-3 max-h-[160px] overflow-y-auto space-y-2 no-scrollbar">
            {chatMessages.length === 0 && (
              <p className="font-serif text-[12px] italic text-stone-400 dark:text-stone-550 text-center py-2">
                Ask me anything about your budget, hotel costs, or spending tips...
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed font-sans ${
                  msg.role === 'user'
                    ? 'bg-[#C1122F] dark:bg-[#C5A880] text-white dark:text-stone-950 rounded-br-sm'
                    : 'bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-750 text-stone-800 dark:text-stone-200 rounded-bl-sm font-serif italic'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl bg-white dark:bg-stone-850 border border-stone-200/80 dark:border-stone-750 text-[12px] text-stone-400 dark:text-stone-500 italic animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2 p-2 border-t border-stone-200 dark:border-stone-850 bg-white dark:bg-[#1C1816]">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder='E.g. "Can I afford the Four Seasons?"'
              className="flex-1 px-3 py-2 text-xs font-sans rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:border-[#C1122F]/40 dark:focus:border-[#C5A880]/40 text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-600"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-2 rounded-xl bg-[#C1122F] dark:bg-[#C5A880] text-white dark:text-stone-950 text-xs font-bold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed border-none font-sans uppercase tracking-wider"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
