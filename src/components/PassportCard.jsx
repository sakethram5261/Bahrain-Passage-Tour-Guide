import { useRef } from 'react'
import { useVibe } from '../hooks/useVibe'
import { getRank, getNextRank } from './DashboardData'
import { spotsCatalog } from '../hooks/useItinerary'

const MOOD_LABELS = { empires: 'Empires', sea: 'Sea', spice: 'Spice', lights: 'Lights' }

export default function PassportCard({ onClose }) {
  const {
    xp, selectedMoods, tier, duration,
    completedDays, collectedKeepsakes, capturedPhotos,
    journalReflections, goldFils, passportStamps
  } = useVibe()

  const cardRef = useRef(null)
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank ? Math.round(((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100) : 100
  const spotsVisited = Object.keys(capturedPhotos).length
  const reflectionsWritten = Object.values(journalReflections).filter(r => r && r.trim().length > 5).length
  const keepsakesCollected = collectedKeepsakes.length
  const totalKeepsakes = spotsCatalog.length

  const rankEmoji = {
    wanderer: '🧭',
    nomad: '🏕️',
    merchant: '⛵',
    chronicler: '📖',
    pearldiver: '🦪',
    dilmun: '💎',
  }

  const emoji = rankEmoji[rank.id] || '🧭'

  const handleShare = async () => {
    const text = `Just explored Bahrain as a ${rank.label} on Bahrain Passage!\n\n🏆 ${xp} XP · 🪙 ${goldFils} Fils · ${completedDays.length}/${duration} days sealed\nVibes: ${selectedMoods.map(m => MOOD_LABELS[m]).join(' · ')}\n\n#BahrainPassage #VisitBahrain`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Bahrain Passage', text })
      } catch { /* ignore */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Copied to clipboard!')
      } catch { /* ignore */ }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(28, 25, 23, 0.65)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Clean Stats Card Container */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-[#FAFAF9] border border-neutral-200 shadow-xl transition-all duration-300 p-6 space-y-5 text-neutral-900"
      >
        {/* Header Title */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-3">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#C1122F]">
              Kingdom of Bahrain
            </p>
            <h2 className="font-serif text-lg font-bold text-neutral-900 mt-0.5">Explorer Passport</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-400 hover:text-neutral-600 text-sm p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* User Rank Block */}
        <div className="bg-white p-4 rounded-xl border border-neutral-100 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-neutral-50 border border-neutral-200 shadow-sm shrink-0">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-base font-bold text-neutral-900">{rank.label}</span>
                  <span className="text-[11px] text-[#C1122F] font-bold">({rank.arabic})</span>
                </div>
                <span className="font-mono text-xs font-bold text-neutral-600">
                  {goldFils} Fils
                </span>
              </div>
              <p className="font-mono text-[10px] text-neutral-500 font-semibold mt-1">
                {xp.toLocaleString()} XP Total
              </p>
            </div>
          </div>

          {nextRank && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10.5px] font-bold text-neutral-500">
                <span>Next Rank: {nextRank.label}</span>
                <span className="text-[#C1122F] font-mono">{progress}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#C1122F] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Chapters', value: `${completedDays.length}/${duration}` },
            { label: 'Keepsakes', value: `${keepsakesCollected}/${totalKeepsakes}` },
            { label: 'Snaps', value: spotsVisited },
            { label: 'Reflections', value: reflectionsWritten },
          ].map(stat => (
            <div key={stat.label} className="text-center bg-white p-2.5 rounded-xl border border-neutral-100 shadow-xs">
              <div className="font-mono font-bold text-[13px] text-neutral-900">{stat.value}</div>
              <div className="text-[9px] text-neutral-400 font-sans font-bold mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Visa Stamps list (simplified modern outline badges) */}
        {passportStamps && passportStamps.length > 0 && (
          <div className="bg-white p-3 rounded-xl border border-neutral-100 space-y-2">
            <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-400 font-sans font-bold">Visa Stamps</p>
            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
              {passportStamps.map(spotId => {
                const spot = spotsCatalog.find(s => s.id === spotId)
                if (!spot) return null
                return (
                  <span 
                    key={spotId} 
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-medium text-neutral-700"
                  >
                    <span>{spot.keepsakeEmoji}</span>
                    <span>{spot.name.split(' ')[0]}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Active vibes */}
        {selectedMoods.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">Vibes:</span>
            {selectedMoods.map(m => (
              <span
                key={m}
                className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#C1122F]/5 text-[#C1122F] border border-[#C1122F]/10"
              >
                {MOOD_LABELS[m]}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 rounded-xl bg-[#C1122F] hover:bg-[#8B0D22] text-white font-bold text-xs tracking-wider transition-all cursor-pointer shadow-md shadow-[#C1122F]/10 active:scale-98"
          >
            Share Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-bold text-xs transition-all cursor-pointer active:scale-98"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
