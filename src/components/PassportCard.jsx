import { useRef } from 'react'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'
import { Compass, Map, Anchor, BookOpen, Waves, Gem, X } from 'lucide-react'

const MOOD_LABELS = { empires: 'Empires', sea: 'Sea', spice: 'Spice', lights: 'Lights' }

const RANKS = [
  { id: 'wanderer', label: 'Wanderer', arabic: 'مسافر', minXP: 0, color: '#78716C' },
  { id: 'nomad', label: 'Nomad', arabic: 'بدوي', minXP: 75, color: '#B8860B' },
  { id: 'merchant', label: 'Merchant', arabic: 'تاجر', minXP: 250, color: '#C27D38' },
  { id: 'chronicler', label: 'Chronicler', arabic: 'مؤرخ', minXP: 600, color: '#C1122F' },
  { id: 'pearldiver', label: 'Pearl Diver', arabic: 'غواص لؤلؤ', minXP: 1200, color: '#1E40AF' },
  { id: 'dilmun', label: 'Dilmun Pearl', arabic: 'لؤلؤة دلمون', minXP: 2200, color: '#6D28D9' },
]

const RANK_ICONS = {
  wanderer: Compass,
  nomad: Map,
  merchant: Anchor,
  chronicler: BookOpen,
  pearldiver: Waves,
  dilmun: Gem,
}

function getRank(xp) {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r
  }
  return rank
}

function getNextRank(xp) {
  for (const r of RANKS) {
    if (xp < r.minXP) return r
  }
  return null
}

export default function PassportCard({ onClose }) {
  const {
    xp, selectedMoods, duration,
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

  const RankIcon = RANK_ICONS[rank.id] || Compass

  const handleShare = async () => {
    const text = `My Bahrain Passage Journey | Status: ${rank.label} (${rank.arabic})\n\nRecord: ${xp.toLocaleString()} Prestige · ${goldFils} Fils · ${completedDays.length}/${duration} Chapters Completed\nVibe Profile: ${selectedMoods.map(m => MOOD_LABELS[m]).join(' · ')}\n\nExplore Bahrain: bahrain-passage-tour-guide.vercel.app #BahrainPassage #CuratedTravel`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Bahrain Passage', text })
      } catch { /* ignore */ }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Passport profile copied to clipboard!')
      } catch { /* ignore */ }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 glass-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Premium Leather/Gold Foiled Archivist Card Container */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 p-6 space-y-5 glass-card gold-foil-border"
        style={{ color: 'var(--color-text)' }}
      >
        {/* Tactile Paper Grain Overlay */}
        <div className="paper-grain" style={{ opacity: 0.035 }} />

        {/* Header Title */}
        <div className="flex items-start justify-between border-b border-stone-200/50 pb-3.5 relative z-10">
          <div>
            <p className="text-[10px] tracking-widest font-sans font-bold text-[var(--color-primary)] uppercase">
              Kingdom of Bahrain · مملكة البحرين
            </p>
            <h2 className="font-serif text-2xl font-semibold mt-0.5">Explorer Passport</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Rank Block */}
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-stone-200/60 shadow-xs space-y-3 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Minimalist Rank Badge */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-md shrink-0 gold-foil-bg thin-icon-heavy rank-badge-pulse"
              role="img"
              aria-label={`${rank.label} rank badge`}
            >
              <RankIcon size={22} strokeWidth={1.35} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-base font-bold gold-foil-text">{rank.label}</span>
                  <span className="text-[10.5px] text-[var(--color-primary)] font-semibold">({rank.arabic})</span>
                </div>
                <span className="font-mono text-xs font-bold text-stone-700">
                  {goldFils} Fils
                </span>
              </div>
              <p className="font-mono text-[9.5px] text-stone-500 font-bold mt-0.5">
                {xp.toLocaleString()} PRESTIGE
              </p>
            </div>
          </div>

          {nextRank && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                <span>Next rank: {nextRank.label}</span>
                <span className="text-[var(--color-primary)] font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {[
            { label: 'Chapters', value: `${completedDays.length}/${duration}` },
            { label: 'Keepsakes', value: `${keepsakesCollected}/${totalKeepsakes}` },
            { label: 'Snaps', value: spotsVisited },
            { label: 'Reflections', value: reflectionsWritten },
          ].map(stat => (
            <div key={stat.label} className="text-center bg-white/70 backdrop-blur-md p-2 rounded-lg border border-stone-200/50 shadow-2xs">
              <div className="font-mono font-bold text-xs text-stone-950">{stat.value}</div>
              <div className="text-[8px] uppercase tracking-widest text-stone-400 mt-1 font-sans font-bold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Visa Stamps list (simplified modern outline badges) */}
        {passportStamps && passportStamps.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-xl border border-stone-200/60 space-y-2.5 relative z-10">
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Visa Endorsements</p>
            <div className="flex flex-wrap gap-2 max-h-[90px] overflow-y-auto pr-1">
              {passportStamps.map(spotId => {
                const spot = spotsCatalog.find(s => s.id === spotId)
                if (!spot) return null
                return (
                  <span 
                    key={spotId} 
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-200 bg-stone-50/80 backdrop-blur-xs text-[10px] font-mono font-bold text-stone-700 shadow-3xs"
                  >
                    <span role="img" aria-label={spot.keepsakeName} className="text-xs shrink-0">{spot.keepsakeEmoji}</span>
                    <span className="truncate">{spot.name.split(' ')[0].toUpperCase()}</span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Active vibes */}
        {selectedMoods.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center relative z-10">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Active Layers:</span>
            {selectedMoods.map(m => (
              <span
                key={m}
                className="text-[9px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider"
                style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderColor: 'rgba(193, 18, 47, 0.08)' }}
              >
                {MOOD_LABELS[m]}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex gap-2 pt-2 relative z-10">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-sans font-bold text-xs tracking-widest uppercase transition-all cursor-pointer shadow-sm active:scale-98"
          >
            Share Profile
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-sans font-bold text-xs tracking-widest uppercase transition-all cursor-pointer active:scale-98"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
