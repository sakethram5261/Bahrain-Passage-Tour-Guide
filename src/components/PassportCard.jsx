import { useRef, useEffect } from 'react'
import { useVibe } from '../hooks/useVibe'
import { getRank, getNextRank, RANKS } from '../context/VibeProvider'
import { spotsCatalog } from '../hooks/useItinerary'

const MOOD_LABELS = { empires: 'Empires', sea: 'Sea', spice: 'Spice', lights: 'Lights' }

export default function PassportCard({ onClose }) {
  const {
    xp, xpLog, selectedMoods, tier, duration,
    completedDays, collectedKeepsakes, capturedPhotos,
    journalReflections,
  } = useVibe()

  const cardRef = useRef(null)
  const rank = getRank(xp)
  const nextRank = getNextRank(xp)
  const progress = nextRank ? Math.round(((xp - rank.minXP) / (nextRank.minXP - rank.minXP)) * 100) : 100
  const spotsVisited = Object.keys(capturedPhotos).length
  const reflectionsWritten = Object.values(journalReflections).filter(r => r && r.trim().length > 5).length
  const keepsakesCollected = collectedKeepsakes.length
  const totalKeepsakes = spotsCatalog.length

  const rankColors = {
    wanderer: '#5C5451',
    nomad: '#aa7c11',
    merchant: '#c07b2a',
    chronicler: '#D11A38',
    pearldiver: '#2563eb',
    dilmun: '#7c3aed',
  }

  const rankGlows = {
    wanderer: 'rgba(92,84,81,0.3)',
    nomad: 'rgba(170,124,17,0.4)',
    merchant: 'rgba(192,123,42,0.4)',
    chronicler: 'rgba(209,26,56,0.4)',
    pearldiver: 'rgba(37,99,235,0.4)',
    dilmun: 'rgba(124,58,237,0.5)',
  }

  const rankEmoji = {
    wanderer: '🧭',
    nomad: '🏕️',
    merchant: '⛵',
    chronicler: '📖',
    pearldiver: '🦪',
    dilmun: '💎',
  }

  const color = rankColors[rank.id] || '#D11A38'
  const glow = rankGlows[rank.id] || 'rgba(209,26,56,0.4)'
  const emoji = rankEmoji[rank.id] || '🧭'

  const handleShare = async () => {
    const text = `Just explored Bahrain as a ${rank.label} on Bahrain Passage!\n\n🏆 ${xp} XP · ${completedDays.length}/${duration} days sealed · ${keepsakesCollected} keepsakes\nVibes: ${selectedMoods.map(m => MOOD_LABELS[m]).join(' · ')}\n\n#BahrainPassage #VisitBahrain`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Bahrain Passage', text })
      } catch (_) {}
    } else {
      try {
        await navigator.clipboard.writeText(text)
        alert('Copied to clipboard!')
      } catch (_) {}
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0806 0%, #140a07 40%, #0a0605 100%)',
          border: `1.5px solid ${color}40`,
          boxShadow: `0 0 60px ${glow}, 0 30px 60px rgba(0,0,0,0.8)`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow} 0%, transparent 60%)` }}
        />

        <div className="relative z-10 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color }}>
                Bahrain Passage
              </p>
              <p className="text-white/30 text-[10px] font-sans mt-0.5">Explorer Passport</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 font-sans">Kingdom of</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 font-sans">Bahrain · مملكة البحرين</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{
                background: `radial-gradient(ellipse at center, ${color}25 0%, ${color}08 100%)`,
                border: `1.5px solid ${color}50`,
                boxShadow: `0 0 20px ${glow}`,
              }}
            >
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-semibold text-white">{rank.label}</span>
                <span className="text-xs" style={{ color: `${color}cc` }}>{rank.arabic}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono font-bold text-sm" style={{ color }}>{xp.toLocaleString()} XP</span>
              </div>

              {nextRank && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-white/30 font-sans">→ {nextRank.label}</span>
                    <span className="text-[9px] font-bold" style={{ color: `${color}99` }}>{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
                    />
                  </div>
                </div>
              )}
              {!nextRank && (
                <p className="text-[10px] font-bold mt-1" style={{ color }}>Max rank achieved ✦</p>
              )}
            </div>
          </div>

          <div
            className="h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }}
          />

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Days', value: `${completedDays.length}/${duration}`, icon: '📅' },
              { label: 'Keepsakes', value: `${keepsakesCollected}/${totalKeepsakes}`, icon: '🪙' },
              { label: 'Snaps', value: spotsVisited, icon: '📸' },
              { label: 'Notes', value: reflectionsWritten, icon: '✍️' },
            ].map(stat => (
              <div key={stat.label} className="text-center space-y-1">
                <div className="text-lg">{stat.icon}</div>
                <div className="font-mono font-bold text-sm text-white">{stat.value}</div>
                <div className="text-[9px] text-white/30 font-sans">{stat.label}</div>
              </div>
            ))}
          </div>

          {selectedMoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMoods.map(m => (
                <span
                  key={m}
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold font-sans"
                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                >
                  {MOOD_LABELS[m]}
                </span>
              ))}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-sans"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {tier === 'Wandering' ? 'Budget' : tier === 'Curated' ? 'Curated' : 'Luxury'} · {duration}d
              </span>
            </div>
          )}

          {collectedKeepsakes.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 font-sans mb-2">Collected</p>
              <div className="flex flex-wrap gap-1.5">
                {collectedKeepsakes.slice(0, 8).map(ksId => {
                  const spot = spotsCatalog.find(s => s.keepsakeId === ksId || s.id === ksId)
                  return spot ? (
                    <span key={ksId} className="text-base" title={spot.keepsakeName}>
                      {spot.keepsakeEmoji}
                    </span>
                  ) : null
                })}
                {collectedKeepsakes.length > 8 && (
                  <span className="text-[10px] text-white/30 self-center">+{collectedKeepsakes.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          <div
            className="h-px w-full"
            style={{ background: `linear-gradient(90deg, transparent, ${color}20, transparent)` }}
          />

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                color: 'white',
                boxShadow: `0 0 16px ${glow}`,
              }}
            >
              Share Passport ↗
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-0.5 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      </div>
    </div>
  )
}
