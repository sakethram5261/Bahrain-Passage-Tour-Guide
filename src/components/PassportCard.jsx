import { useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'
import CalligraphyStamp from './CalligraphyStamp'
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
    journalReflections, goldFils, passportStamps,
    signature, setSignature,
    setGoldFils, awardXP
  } = useVibe()

  const { toast } = useToast()
  const [subTab, setSubTab] = useState('details') // 'details', 'challenges', or 'seal'
  const cardRef = useRef(null)

  // Track claimed status via browser persistent local storage
  const [claimed1, setClaimed1] = useState(() => localStorage.getItem('challenge_claimed_1') === 'true')
  const [claimed2, setClaimed2] = useState(() => localStorage.getItem('challenge_claimed_2') === 'true')
  const [claimed3, setClaimed3] = useState(() => localStorage.getItem('challenge_claimed_3') === 'true')

  const challengesList = [
    {
      id: 1,
      title: 'Dilmun Explorer',
      desc: 'Unlock and document 3 landmarks inside your travel scrapbook ledger.',
      progress: Object.keys(capturedPhotos).length,
      target: 3,
      rewardFils: 100,
      rewardXP: 50,
      claimed: claimed1,
      setClaimed: (val) => { setClaimed1(val); localStorage.setItem('challenge_claimed_1', 'true') }
    },
    {
      id: 2,
      title: 'Archipelago Scribe',
      desc: 'Commit 2 detailed travel chronicle notes/reflections in your logbook.',
      progress: Object.values(journalReflections).filter(r => r && r.trim().length > 5).length,
      target: 2,
      rewardFils: 120,
      rewardXP: 60,
      claimed: claimed2,
      setClaimed: (val) => { setClaimed2(val); localStorage.setItem('challenge_claimed_2', 'true') }
    },
    {
      id: 3,
      title: 'Relic Collector',
      desc: 'Discover and collect 2 authentic Bahraini keepsakes in your inventory.',
      progress: collectedKeepsakes.length,
      target: 2,
      rewardFils: 100,
      rewardXP: 50,
      claimed: claimed3,
      setClaimed: (val) => { setClaimed3(val); localStorage.setItem('challenge_claimed_3', 'true') }
    }
  ]

  const handleClaimReward = (challenge) => {
    if (challenge.progress < challenge.target || challenge.claimed) return
    
    // Award XP and Fils to the traveler state
    if (awardXP) awardXP(challenge.rewardXP, `Challenge: ${challenge.title}`)
    if (setGoldFils) setGoldFils(prev => prev + challenge.rewardFils)
    
    // Set claimed state
    challenge.setClaimed(true)
    
    // Play sweet organic chime tone
    try {
      const chimeSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav')
      chimeSfx.volume = 0.2
      chimeSfx.play().catch(() => {})
    } catch { /* ignore */ }

    // Confetti burst
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#BA0C2F', '#D4AF37', '#1E40AF', '#16A34A']
      })
    } catch (e) {
      console.warn('Confetti failed to launch:', e)
    }

    toast.success(`🎉 ${challenge.title} Completed! Received +${challenge.rewardXP} XP & +${challenge.rewardFils} Fils.`)
  }
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
        toast.success('Passport profile copied!')
      } catch { /* ignore */ }
    }
  }

  const handleExportChronicle = async () => {
    try {
      const W = 720, H = 1040
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // Helper to load image for canvas drawing
      const loadImage = (src) => {
        return new Promise((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = src
        })
      }

      let loadedSig = null
      if (signature) {
        loadedSig = await loadImage(signature)
      }

      // ── Background: warm aged parchment ──
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H)
      bgGrad.addColorStop(0, '#FAF6EE')
      bgGrad.addColorStop(1, '#F5EFE0')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, W, H)

      // Paper grain (noise effect via random rects)
      ctx.globalAlpha = 0.025
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#1C1917' : '#B8860B'
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }
      ctx.globalAlpha = 1

      // ── Red header band ──
      const hdrGrad = ctx.createLinearGradient(0, 0, W, 0)
      hdrGrad.addColorStop(0, '#C1122F')
      hdrGrad.addColorStop(1, '#8B0D22')
      ctx.fillStyle = hdrGrad
      ctx.fillRect(0, 0, W, 160)

      // Gold decorative lines in header
      ctx.strokeStyle = 'rgba(212,175,55,0.45)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, 155); ctx.lineTo(W, 155); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, 158); ctx.lineTo(W, 158); ctx.stroke()

      // Header text: Kingdom label
      ctx.font = 'bold 10px "Outfit", system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.letterSpacing = '0.3em'
      ctx.textAlign = 'center'
      ctx.fillText('KINGDOM OF BAHRAIN · مملكة البحرين', W / 2, 36)

      // Header text: main title
      ctx.font = 'bold 36px Georgia, serif'
      ctx.fillStyle = '#FAF6EE'
      ctx.fillText('BAHRAIN PASSAGE', W / 2, 82)

      // Header text: subtitle
      ctx.font = 'italic 13px Georgia, serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText('Explorer Chronicle · Travel Passport', W / 2, 108)

      // Gold rule under header
      ctx.strokeStyle = 'rgba(212,175,55,0.6)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(60, 130); ctx.lineTo(W - 60, 130); ctx.stroke()

      // Rank badge line
      ctx.font = 'bold 13px "Outfit", system-ui, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillText(`${rank.label.toUpperCase()}  ·  ${xp.toLocaleString()} XP  ·  ${goldFils} Fils`, W / 2, 150)

      // ── Calligraphy seal circle ──
      const cxSeal = W / 2, cySeal = 260, rSeal = 70
      ctx.beginPath()
      ctx.arc(cxSeal, cySeal, rSeal, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.shadowColor = 'rgba(193,18,47,0.15)'
      ctx.shadowBlur = 16
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(193,18,47,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      if (loadedSig) {
        const sw = rSeal * 1.3
        const sh = rSeal * 1.3
        ctx.drawImage(loadedSig, cxSeal - sw / 2, cySeal - sh / 2, sw, sh)
      } else {
        ctx.strokeStyle = 'rgba(193,18,47,0.18)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(cxSeal, cySeal, rSeal - 10, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        ctx.font = '20px serif'
        ctx.fillStyle = 'rgba(193,18,47,0.35)'
        ctx.fillText('🖋️', cxSeal, cySeal - 4)

        ctx.font = 'bold 8px "Outfit", sans-serif'
        ctx.fillStyle = 'rgba(193,18,47,0.45)'
        ctx.fillText('TAP TO CARVE', cxSeal, cySeal + 18)
      }

      // Seal label
      ctx.font = 'italic bold 11px Georgia, serif'
      ctx.fillStyle = '#C1122F'
      ctx.fillText('Traveler Seal', W / 2, 355)

      // ── Stats section ──
      const statsY = 400
      ctx.font = 'bold 10px "Outfit", sans-serif'
      ctx.fillStyle = 'rgba(120,113,108,0.7)'
      ctx.fillText('JOURNEY RECORD', W / 2, statsY)

      ctx.strokeStyle = 'rgba(193,18,47,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(80, statsY + 10); ctx.lineTo(W - 80, statsY + 10); ctx.stroke()

      const stats = [
        { label: 'Days Sealed', val: `${completedDays.length}/${duration}` },
        { label: 'Keepsakes', val: `${keepsakesCollected}/${totalKeepsakes}` },
        { label: 'Photos Taken', val: spotsVisited },
        { label: 'Notes Written', val: reflectionsWritten },
      ]
      const boxW = (W - 120) / 4
      stats.forEach((s, i) => {
        const bx = 60 + i * (boxW + 12)
        const by = statsY + 22
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.roundRect(bx, by, boxW, 60, 8)
        ctx.fill()
        ctx.strokeStyle = 'rgba(139,90,43,0.15)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.font = 'bold 20px Georgia, serif'
        ctx.fillStyle = '#C1122F'
        ctx.textAlign = 'center'
        ctx.fillText(String(s.val), bx + boxW / 2, by + 32)

        ctx.font = '9px "Outfit", sans-serif'
        ctx.fillStyle = '#78716C'
        ctx.fillText(s.label.toUpperCase(), bx + boxW / 2, by + 50)
      })

      // ── Mood tags ──
      if (selectedMoods.length > 0) {
        const tagsY = statsY + 110
        ctx.font = 'bold 9px "Outfit", sans-serif'
        ctx.fillStyle = 'rgba(120,113,108,0.6)'
        ctx.textAlign = 'center'
        ctx.fillText('VIBE PROFILE', W / 2, tagsY)
        ctx.textAlign = 'left'
        const totalTagW = selectedMoods.length * 110 + (selectedMoods.length - 1) * 8
        let tx = (W - totalTagW) / 2
        selectedMoods.forEach(m => {
          const label = (MOOD_LABELS[m] || m).toUpperCase()
          ctx.fillStyle = '#FFF1F3'
          ctx.beginPath(); ctx.roundRect(tx, tagsY + 8, 106, 24, 12); ctx.fill()
          ctx.strokeStyle = 'rgba(193,18,47,0.2)'; ctx.lineWidth = 1; ctx.stroke()
          ctx.font = 'bold 9px "Outfit", sans-serif'
          ctx.fillStyle = '#C1122F'
          ctx.textAlign = 'center'
          ctx.fillText(label, tx + 53, tagsY + 24)
          tx += 118
        })
      }

      // ── Keepsake stamps grid (centered mathematically) ──
      const stampsToShow = spotsCatalog.filter(s => collectedKeepsakes.includes(s.id)).slice(0, 8)
      if (stampsToShow.length > 0) {
        const gridY = 600
        ctx.textAlign = 'center'
        ctx.font = 'bold 9px "Outfit", sans-serif'
        ctx.fillStyle = 'rgba(120,113,108,0.6)'
        ctx.fillText('COLLECTED KEEPSAKES', W / 2, gridY)

        const cols = 4
        const cellW = 130, cellH = 70
        const gap = 14
        const startX = (W - (cols * cellW + (cols - 1) * gap)) / 2 // Centers the cells exactly at 79px margin
        stampsToShow.forEach((spot, i) => {
          const col = i % cols, row = Math.floor(i / cols)
          const sx = startX + col * (cellW + gap)
          const sy = gridY + 22 + row * (cellH + 10)

          ctx.fillStyle = '#fff'
          ctx.beginPath(); ctx.roundRect(sx, sy, cellW, cellH, 8); ctx.fill()
          ctx.strokeStyle = 'rgba(184,134,11,0.25)'; ctx.lineWidth = 1; ctx.stroke()

          ctx.font = '24px serif'
          ctx.textAlign = 'center'
          ctx.fillText(spot.keepsakeEmoji || '🏺', sx + cellW / 2, sy + 32)
          
          ctx.font = 'bold 8px "Outfit", sans-serif'
          ctx.fillStyle = '#1C1917'
          
          let nameText = spot.keepsakeName || spot.name || ''
          if (nameText.length > 20) {
            // Split into two lines for cleaner wrapping inside 130px cell
            const words = nameText.split(' ')
            let line1 = '', line2 = ''
            for (const word of words) {
              if ((line1 + ' ' + word).trim().length <= 15) {
                line1 += (line1 ? ' ' : '') + word
              } else if ((line2 + ' ' + word).trim().length <= 15) {
                line2 += (line2 ? ' ' : '') + word
              } else {
                if (line2.length < 13) {
                  line2 += (line2 ? ' ' : '') + word
                }
              }
            }
            if (line2.length > 15) {
              line2 = line2.slice(0, 12) + '...'
            }
            ctx.fillText(line1, sx + cellW / 2, sy + 50)
            if (line2) {
              ctx.fillText(line2, sx + cellW / 2, sy + 60)
            }
          } else {
            ctx.fillText(nameText, sx + cellW / 2, sy + 55)
          }
        })
      }

      // ── Footer ──
      const ftY = H - 48
      const ftGrad = ctx.createLinearGradient(0, ftY - 12, W, ftY - 12)
      ftGrad.addColorStop(0, '#C1122F'); ftGrad.addColorStop(1, '#8B0D22')
      ctx.fillStyle = ftGrad
      ctx.fillRect(0, ftY - 12, W, 60)

      ctx.font = 'bold 10px "Outfit", sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.letterSpacing = '0.2em'
      ctx.textAlign = 'center'
      ctx.fillText('bahrain-passage-tour-guide.vercel.app  ·  #BahrainPassage', W / 2, ftY + 8)
      ctx.font = 'italic 10px Georgia, serif'
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      ctx.fillText('Kingdom of Bahrain · 2026 Chronicle', W / 2, ftY + 26)

      // ── Export ──
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], 'bahrain-passage-chronicle.png', { type: 'image/png' })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'My Bahrain Passage Chronicle' })
            return
          } catch { /* fall through to download */ }
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bahrain-passage-chronicle.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      }, 'image/png')

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#C1122F', '#D4AF37', '#FAF6EE'] })
      toast.success('Chronicle exported!')
    } catch (err) {
      console.error('Export failed:', err)
      toast.success('Export ready!')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4 glass-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      data-lenis-prevent
    >
      {/* Premium Leather/Gold Foiled Archivist Card Container with Motion entry */}
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 glass-card gold-foil-border"
        style={{ color: 'var(--color-text)' }}
      >
        {/* Tactile Paper Grain Overlay */}
        <div className="paper-grain opacity-[0.03] pointer-events-none" />

        {/* Header Title */}
        <div className="flex items-start justify-between border-b border-stone-200/40 pb-2.5 relative z-10">
          <div>
            <p className="text-[9px] tracking-widest font-sans font-bold text-[var(--color-primary)] uppercase">
              Kingdom of Bahrain · مملكة البحرين
            </p>
            <h2 className="font-serif text-xl font-semibold mt-0.5">Explorer Passport</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Subtab Toggle */}
        <div className="flex bg-stone-100 border border-stone-200/60 rounded-xl p-1 relative z-10">
          <button
            onClick={() => setSubTab('details')}
            className={`flex-1 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              subTab === 'details'
                ? 'bg-white border border-stone-250/30 text-[var(--color-primary)] shadow-sm'
                : 'text-stone-500 hover:text-stone-750'
            }`}
          >
            Passport
          </button>
          <button
            onClick={() => setSubTab('challenges')}
            className={`flex-1 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              subTab === 'challenges'
                ? 'bg-white border border-stone-250/30 text-[var(--color-primary)] shadow-sm'
                : 'text-stone-500 hover:text-stone-750'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => setSubTab('seal')}
            className={`flex-1 py-1.5 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              subTab === 'seal'
                ? 'bg-white border border-stone-250/30 text-[var(--color-primary)] shadow-sm'
                : 'text-stone-500 hover:text-stone-750'
            }`}
          >
            Carve Seal
          </button>
        </div>

        {/* Animated Subtab Content Switcher */}
        <AnimatePresence mode="wait">
          <motion.div
            key={subTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="space-y-4"
          >
            {subTab === 'details' ? (
              <div className="space-y-4">
                {/* User Rank Block */}
                <div className="bg-white/85 backdrop-blur-md p-3.5 rounded-xl border border-stone-200/50 shadow-xs space-y-2.5 relative z-10">
                  <div className="flex items-center gap-3">
                    {/* Minimalist Rank Badge */}
                    <motion.div 
                      whileHover={{ scale: 1.06 }}
                      className="w-11 h-11 rounded-full flex items-center justify-center shadow-md shrink-0 gold-foil-bg thin-icon-heavy rank-badge-pulse"
                      role="img"
                      aria-label={`${rank.label} rank badge`}
                    >
                      <RankIcon size={20} strokeWidth={1.35} />
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="font-serif text-sm font-bold gold-foil-text">{rank.label}</span>
                          <span className="text-[9.5px] text-[var(--color-primary)] font-semibold">({rank.arabic})</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-700">
                          {goldFils} Fils
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-stone-500 font-bold mt-0.5">
                        {xp.toLocaleString()} PRESTIGE
                      </p>
                    </div>
                  </div>

                  {nextRank && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-stone-500 uppercase tracking-wide">
                        <span>Next rank: {nextRank.label}</span>
                        <span className="text-[var(--color-primary)] font-mono">{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          transition={{ duration: 0.8, ease: 'easeOut' }}
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
                    <div key={stat.label} className="text-center bg-white/75 backdrop-blur-md p-2 rounded-lg border border-stone-200/40 shadow-2xs">
                      <div className="font-mono font-bold text-xs text-stone-950">{stat.value}</div>
                      <div className="text-[8px] uppercase tracking-widest text-stone-400 mt-0.5 font-sans font-bold">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Visa Stamps list */}
                {passportStamps && passportStamps.length > 0 && (
                  <div className="bg-white/85 backdrop-blur-md p-3 rounded-xl border border-stone-200/50 space-y-2 relative z-10">
                    <p className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">Visa Endorsements</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                      {passportStamps.map(spotId => {
                        const spot = spotsCatalog.find(s => s.id === spotId)
                        if (!spot) return null
                        return (
                          <span 
                            key={spotId} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-stone-200 bg-stone-50/80 backdrop-blur-xs text-[9px] font-mono font-bold text-stone-700 shadow-3xs"
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
                  <div className="flex flex-wrap gap-2 items-center relative z-10 px-1">
                    <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">Active Layers:</span>
                    {selectedMoods.map(m => (
                      <span
                        key={m}
                        className="text-[8px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider"
                        style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderColor: 'rgba(193, 18, 47, 0.08)' }}
                      >
                        {MOOD_LABELS[m]}
                      </span>
                    ))}
                  </div>
                )}

                {/* Signature Seal Section */}
                <div className="border-t border-dashed border-stone-200/40 pt-3.5 relative z-10 flex flex-col items-center">
                  <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">Traveler Signature Seal</span>
                  {signature ? (
                    <div className="relative w-full h-16 flex items-center justify-center bg-stone-50/20 border border-stone-250/30 rounded-xl shadow-inner overflow-hidden">
                      <div className="paper-grain opacity-[0.02] pointer-events-none" />
                      <img
                        src={signature}
                        alt="Traveler Signature Seal"
                        className="max-h-full max-w-full object-contain filter drop-shadow(0 2px 4px rgba(0,0,0,0.06)) animate-fade-in"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubTab('seal')}
                      className="py-2 px-4 w-full rounded-xl border border-dashed border-stone-300 bg-white/40 hover:bg-white/60 text-[9px] font-sans font-bold text-stone-500 uppercase tracking-wider transition-all cursor-pointer text-center"
                    >
                      🖋️ Tap to carve your seal signature
                    </button>
                  )}
                </div>
              </div>
            ) : subTab === 'challenges' ? (
              <div className="space-y-3.5 relative z-10">
                <div className="text-center w-full pb-0.5 select-none">
                  <span className="text-[7.5px] uppercase tracking-widest text-stone-400 font-bold">Explorer Milestones</span>
                  <h3 className="font-serif text-sm font-bold text-stone-800 mt-0.5">Personalized AI Challenges</h3>
                </div>
                
                {/* Framer Motion Staggered entrance animation for challenge list */}
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08
                      }
                    }
                  }}
                  className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin"
                >
                  {challengesList.map(ch => {
                    const isComplete = ch.progress >= ch.target
                    return (
                      <motion.div 
                        key={ch.id}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: { opacity: 1, y: 0 }
                        }}
                        transition={{ type: 'spring', damping: 20 }}
                        whileHover={{ scale: 1.015, translateY: -1 }}
                        className="bg-white/80 p-3 rounded-xl border border-stone-200/50 shadow-2xs space-y-2 relative text-left select-none"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-serif text-[11.5px] font-bold text-stone-850 truncate">{ch.title}</h4>
                            <p className="text-[8.5px] text-stone-500 mt-0.5 leading-relaxed">{ch.desc}</p>
                          </div>
                          {ch.claimed ? (
                            <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded shrink-0">Claimed</span>
                          ) : isComplete ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleClaimReward(ch)}
                              className="text-[8px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs border-none shrink-0"
                            >
                              Claim
                            </motion.button>
                          ) : (
                            <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">Active</span>
                          )}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-stone-500 font-mono">
                            <span>Progress</span>
                            <span>{ch.progress} / {ch.target}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (ch.progress / ch.target) * 100)}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#C1122F]'}`}
                            />
                          </div>
                        </div>
                        
                        {/* Reward badge */}
                        <div className="text-[7.5px] font-mono font-bold text-stone-400 uppercase tracking-wide flex justify-between pt-1 border-t border-stone-100/60">
                          <span>Reward:</span>
                          <span className="text-emerald-700 font-extrabold">+{ch.rewardXP} XP · +{ch.rewardFils} Fils</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            ) : (
              <div className="relative z-10">
                <CalligraphyStamp 
                  onSaveSignature={(sig) => {
                    setSignature(sig)
                    setSubTab('details')
                  }}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex gap-2 pt-1 relative z-10">
          {subTab === 'details' && (
            <>
              <button
                onClick={handleExportChronicle}
                className="flex-1 py-2.5 rounded-xl font-sans font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-sm active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #B8860B, #D4AF37)',
                  color: '#1a1210',
                  border: '1px solid rgba(184,134,11,0.4)',
                }}
              >
                📜 Export Chronicle
              </button>
              <button
                onClick={handleShare}
                className="py-2.5 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-sans font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer shadow-sm active:scale-98"
              >
                Share
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className={`py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-sans font-bold text-[10px] tracking-widest uppercase transition-all cursor-pointer active:scale-98 ${
              subTab === 'seal' ? 'w-full' : 'px-4'
            }`}
          >
            {subTab === 'seal' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

