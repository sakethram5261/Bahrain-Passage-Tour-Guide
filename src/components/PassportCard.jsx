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
      style={{ background: 'rgba(26,10,12,0.85)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* 3D Passport Booklet Cover (Bahrain Red leather texture with white stitching) */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-[32px] overflow-hidden p-3.5 stitch-border transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #D11A38 0%, #B0102A 50%, #8A081D 100%)',
          boxShadow: `
            0 30px 70px rgba(209, 26, 56, 0.35),
            0 10px 30px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2)
          `,
        }}
      >
        {/* Stitched White Boundary */}
        <div className="absolute inset-2 border border-dashed border-white/20 rounded-[28px] pointer-events-none z-10" />

        {/* Bahrain Flag Serrated Stripe down the left edge inside the cover */}
        <div className="absolute top-3.5 bottom-3.5 left-3.5 w-6 pointer-events-none z-10 overflow-hidden flex flex-col items-stretch">
          <div className="w-full h-full bg-[#FAF9F6]/95 relative rounded-l-2xl">
            {/* 5 Points Zigzag divider */}
            <svg viewBox="0 0 20 100" preserveAspectRatio="none" className="absolute top-0 bottom-0 right-[-9px] w-[10px] h-full z-20">
              <path d="M0,0 L10,10 L0,20 L10,30 L0,40 L10,50 L0,60 L10,70 L0,80 L10,90 L0,100 Z" fill="#FAF9F6" />
            </svg>
          </div>
        </div>

        {/* Dynamic Pearl-White Opened Security Paper Page (Beautiful, High Contrast, clean) */}
        <div
          className="relative z-10 bg-[#FAF9F6] rounded-[24px] p-5 pl-10 space-y-4 text-bronze-charcoal shadow-inner"
          style={{
            backgroundImage: `
              radial-gradient(circle at 100% 50%, rgba(209, 26, 56, 0.015) 0%, transparent 100%),
              repeating-linear-gradient(rgba(209, 26, 56, 0.006) 1px, transparent 1px, transparent 18px)
            `,
          }}
        >
          {/* Header Title */}
          <div className="flex items-start justify-between border-b border-red-500/10 pb-2">
            <div>
              <p className="text-[13px] tracking-[0.25em] uppercase font-bold text-bahrain-red">
                Bahrain Passage
              </p>
              <p className="text-bronze-muted/60 text-[12px] font-sans mt-0.5 uppercase tracking-wider font-bold">Explorer Passport</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] tracking-[0.2em] uppercase text-bronze-muted/70 font-sans font-bold">Kingdom of</p>
              <p className="text-[11px] tracking-[0.15em] uppercase text-bahrain-red font-sans font-bold">Bahrain · مملكة البحرين</p>
            </div>
          </div>

          {/* User Rank Block & Wallet Balance */}
          <div className="flex items-center gap-4 bg-white/60 p-3 rounded-xl border border-red-500/5 shadow-sm">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 bg-[#FAF9F6] border border-red-500/10 shadow-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-bahrain-red/5 pointer-events-none" />
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-base font-bold text-bronze-charcoal leading-none">{rank.label}</span>
                  <span className="text-[12px] text-bahrain-red font-bold font-sans">({rank.arabic})</span>
                </div>
                <span className="font-sans text-[12px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none shrink-0">
                  🪙 {goldFils} fils
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono font-bold text-xs bg-bahrain-red/10 text-bahrain-red px-2 py-0.5 rounded-full select-none">
                  🏆 {xp.toLocaleString()} XP
                </span>
              </div>

              {nextRank && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[12px] font-bold">
                    <span className="text-bronze-muted/60 font-sans">Next: {nextRank.label}</span>
                    <span className="text-bahrain-red font-mono">{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-red-500/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-bahrain-red"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {!nextRank && (
                <p className="text-[12px] font-bold mt-1.5 text-bahrain-red">✦ Absolute Legend Rank Achieved ✦</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />

          {/* Passport Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Chapters', value: `${completedDays.length}/${duration}`, icon: '📅' },
              { label: 'Keepsakes', value: `${keepsakesCollected}/${totalKeepsakes}`, icon: '🪙' },
              { label: 'Snaps', value: spotsVisited, icon: '📸' },
              { label: 'Reflexes', value: reflectionsWritten, icon: '✍️' },
            ].map(stat => (
              <div key={stat.label} className="text-center bg-white/60 p-2 rounded-xl border border-red-500/5 shadow-xs">
                <div className="text-base select-none">{stat.icon}</div>
                <div className="font-mono font-bold text-[11px] text-bronze-charcoal mt-1 leading-none">{stat.value}</div>
                <div className="text-[11px] text-bronze-muted/50 font-sans font-bold mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Authentic Ink Passport Stamps (Visual Trophies) */}
          <div className="bg-white/40 p-3 rounded-xl border border-red-500/5 space-y-1.5">
            <p className="text-[12px] tracking-[0.2em] uppercase text-bronze-muted/50 font-sans font-extrabold">Official Visa Seals</p>
            {passportStamps && passportStamps.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {passportStamps.map(spotId => {
                  const spot = spotsCatalog.find(s => s.id === spotId)
                  if (!spot) return null
                  
                  // Custom gorgeous styles based on spotId for distinct visual stamp varieties
                  const stampStyles = {
                    'qal-at-al-bahrain': { color: 'border-rose-700 text-rose-800 bg-rose-50/40', shape: 'rounded-full rotate-6' },
                    'muharraq-souq': { color: 'border-emerald-600 text-emerald-700 bg-emerald-50/40', shape: 'rounded-xl -rotate-6' },
                    'pearling-path': { color: 'border-blue-600 text-blue-700 bg-blue-50/40', shape: 'rounded-full border-double border-4 rotate-12' },
                    'block-338': { color: 'border-amber-600 text-amber-700 bg-amber-50/40', shape: 'rounded-[12px] rotate-[-8deg] border-dashed' },
                    'jarada-island': { color: 'border-cyan-600 text-cyan-700 bg-cyan-50/40', shape: 'rounded-full border-[3px] border-dotted rotate-45' },
                    'sakhir-desert': { color: 'border-orange-600 text-orange-700 bg-orange-50/40', shape: 'rounded-xl border-[2px] -rotate-12' },
                  }

                  const style = stampStyles[spotId] || { color: 'border-red-700 text-red-800 bg-red-50/40', shape: 'rounded-full rotate-3' }

                  return (
                    <div 
                      key={spotId} 
                      className={`aspect-square border-2 flex flex-col items-center justify-center p-1 relative text-center select-none shadow-[inset_0_0_8px_rgba(0,0,0,0.03)] scale-95 transition-all duration-300 hover:scale-105 ${style.color} ${style.shape}`}
                      title={`${spot.name} - Visited`}
                    >
                      <span className="font-serif text-[4.5px] font-black uppercase leading-none tracking-tighter truncate max-w-full">
                        {spot.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] my-0.5">{spot.keepsakeEmoji}</span>
                      <span className="font-serif text-[4px] leading-none text-bronze-charcoal/70">
                        {spot.arabic.substring(0, 5)}
                      </span>
                      {/* Authentic mini date marker */}
                      <span className="font-mono text-[3.5px] text-bronze-muted mt-0.5">2026.05</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-3 text-center text-[12px] italic text-bronze-muted/40 font-semibold bg-white/30 rounded-lg">
                No active visa stamps yet. Focus lens and snap polaroids to unlock!
              </div>
            )}
          </div>

          {/* Selected Vibes / Parameters */}
          {selectedMoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center bg-white/40 p-2.5 rounded-xl border border-red-500/5">
              <span className="text-[11px] uppercase tracking-wider font-sans font-extrabold text-bronze-muted/40">Vibes:</span>
              {selectedMoods.map(m => (
                <span
                  key={m}
                  className="text-[11px] px-2 py-0.5 rounded-full font-bold font-sans bg-bahrain-red/10 text-bahrain-red border border-bahrain-red/10"
                >
                  {MOOD_LABELS[m]}
                </span>
              ))}
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-sans bg-bronze-charcoal/10 text-bronze-charcoal font-bold"
              >
                {tier === 'Wandering' ? 'Budget' : tier === 'Curated' ? 'Curated' : 'Luxury'} · {duration}d
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/10 to-transparent" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-xl bg-bahrain-red hover:bg-bahrain-dark text-white font-bold text-xs tracking-wider transition-all cursor-pointer shadow-md shadow-bahrain-red/10 active:scale-98 select-none"
            >
              Share Passport ↗
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-white border border-red-500/15 hover:bg-red-500/5 text-bronze-charcoal font-bold text-xs transition-all cursor-pointer active:scale-98 select-none"
            >
              Close
            </button>
          </div>
        </div>

        {/* Dynamic bottom red/white border bar representing the flag stripe horizontally */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, #FAF9F6 0%, #FAF9F6 20%, #D11A38 20%, #D11A38 100%)' }}
        />
      </div>
    </div>
  )
}
