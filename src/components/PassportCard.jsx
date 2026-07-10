import { useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../context/ToastContext'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'
import CalligraphyStamp from './CalligraphyStamp'
import { Compass, Map, Anchor, BookOpen, Waves, Gem, X } from 'lucide-react'

const MOOD_LABELS = { empires: 'Empires', sea: 'Sea', spice: 'Spice', lights: 'Lights' }

import { RANKS, getRank, getNextRank } from '../data/ranks'

import { playDiscoverySuccess } from '../services/audioUtils'

export default function PassportCard({ onClose }) {
  const {
    xp, selectedMoods, duration,
    completedDays, collectedKeepsakes, capturedPhotos,
    journalReflections, goldFils, passportStamps,
    signature, setSignature,
    setGoldFils, awardXP,
    soundVolume, soundMuted
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
    playDiscoverySuccess(soundVolume, soundMuted)

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

  const RankIcon = rank.icon || Compass

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
      const W = 1080, H = 720
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

      // Draw Left Panel Cover (Crimson: #C41E3A)
      ctx.fillStyle = '#C41E3A'
      ctx.fillRect(0, 0, 380, H - 54)

      // Draw Right Panel Content Page (Cream: #F9F7F4)
      ctx.fillStyle = '#F9F7F4'
      ctx.fillRect(380, 0, W - 380, H - 54)

      // Draw Bottom Slim Footer (Crimson: #C41E3A)
      ctx.fillStyle = '#C41E3A'
      ctx.fillRect(0, H - 54, W, 54)

      // ─── LEFT PANEL DRAWING ───
      // Kingdom Text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.22em'
      ctx.textAlign = 'center'
      ctx.fillText('KINGDOM OF BAHRAIN', 190, 48)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = 'italic 13px Georgia, serif'
      ctx.letterSpacing = '0.08em'
      ctx.fillText('مملكة البحرين', 190, 72)

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(40, 95); ctx.lineTo(340, 95); ctx.stroke()

      // Title stacked
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 44px Georgia, serif'
      ctx.letterSpacing = '0.18em'
      ctx.fillText('BAHRAIN', 190, 160)
      ctx.fillText('PASSAGE', 190, 215)

      // Subtitle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = 'bold 9px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.15em'
      ctx.fillText('EXPLORER CHRONICLE · TRAVEL PASSPORT', 190, 255)

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.beginPath(); ctx.moveTo(40, 280); ctx.lineTo(340, 280); ctx.stroke()

      // Stats row
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 10.5px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.12em'
      ctx.fillText(`${rank.label.toUpperCase()}   ${xp.toLocaleString()} XP   ${goldFils} FILS`, 190, 312)

      // Circular Traveler Seal
      const cxSeal = 190, cySeal = 465, rSeal = 75
      ctx.beginPath()
      ctx.arc(cxSeal, cySeal, rSeal, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.lineWidth = 2
      ctx.stroke()

      if (loadedSig) {
        const sw = rSeal * 1.5
        const sh = rSeal * 1.5
        ctx.drawImage(loadedSig, cxSeal - sw / 2, cySeal - sh / 2, sw, sh)
      } else {
        // Draw Curved 4-point star in star path
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(cxSeal, cySeal - 30)
        ctx.quadraticCurveTo(cxSeal, cySeal, cxSeal + 30, cySeal)
        ctx.quadraticCurveTo(cxSeal, cySeal, cxSeal, cySeal + 30)
        ctx.quadraticCurveTo(cxSeal, cySeal, cxSeal - 30, cySeal)
        ctx.quadraticCurveTo(cxSeal, cySeal, cxSeal, cySeal - 30)
        ctx.fill()
      }

      // Traveler Seal label text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.28em'
      ctx.fillText('TRAVELER SEAL', 190, 582)

      // ─── RIGHT PANEL DRAWING ───
      const rOffset = 380
      ctx.textAlign = 'left'
      ctx.letterSpacing = '0.15em'

      // JOURNEY RECORD
      ctx.fillStyle = '#8C8A87'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.fillText('JOURNEY RECORD', rOffset + 40, 55)

      // Record Box 1
      const boxW = 285, boxH = 92
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(rOffset + 40, 75, boxW, boxH, 12); else ctx.rect(rOffset + 40, 75, boxW, boxH)
      ctx.fill()
      ctx.strokeStyle = 'rgba(196, 162, 101, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      ctx.textAlign = 'center'
      ctx.letterSpacing = '0'
      ctx.fillStyle = '#C41E3A'
      ctx.font = 'bold 32px Georgia, serif'
      ctx.fillText(`${completedDays.length}/${duration}`, rOffset + 40 + boxW / 2, 122)
      ctx.fillStyle = '#8C8A87'
      ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.12em'
      ctx.fillText('DAYS SEALED', rOffset + 40 + boxW / 2, 146)

      // Record Box 2
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(rOffset + 375, 75, boxW, boxH, 12); else ctx.rect(rOffset + 375, 75, boxW, boxH)
      ctx.fill()
      ctx.strokeStyle = 'rgba(196, 162, 101, 0.15)'
      ctx.stroke()
      
      ctx.fillStyle = '#C41E3A'
      ctx.font = 'bold 32px Georgia, serif'
      ctx.letterSpacing = '0'
      ctx.fillText(String(keepsakesCollected), rOffset + 375 + boxW / 2, 122)
      ctx.fillStyle = '#8C8A87'
      ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.12em'
      ctx.fillText('KEEPSAKES', rOffset + 375 + boxW / 2, 146)

      // VIBE PROFILE
      ctx.textAlign = 'left'
      ctx.letterSpacing = '0.15em'
      ctx.fillStyle = '#8C8A87'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.fillText('VIBE PROFILE', rOffset + 40, 212)

      const moodsList = [
        { id: 'empires', label: 'EMPIRES' },
        { id: 'spice', label: 'SPICE' },
        { id: 'lights', label: 'LIGHTS' },
        { id: 'sea', label: 'SEA' }
      ]
      moodsList.forEach((m, idx) => {
        const mx = rOffset + 40 + idx * 155
        const my = 230
        const isActive = selectedMoods.includes(m.id) || selectedMoods.length === 0
        
        ctx.fillStyle = isActive ? 'rgba(196, 30, 58, 0.05)' : 'rgba(140, 138, 135, 0.04)'
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(mx, my, 135, 32, 16); else ctx.rect(mx, my, 135, 32)
        ctx.fill()
        ctx.strokeStyle = isActive ? 'rgba(196, 30, 58, 0.18)' : 'rgba(140, 138, 135, 0.12)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = isActive ? '#C41E3A' : '#8C8A87'
        ctx.textAlign = 'center'
        ctx.letterSpacing = '0.08em'
        ctx.fillText(m.label, mx + 67.5, my + 20)
      })

      // COLLECTED KEEPSAKES
      ctx.textAlign = 'left'
      ctx.letterSpacing = '0.15em'
      ctx.fillStyle = '#8C8A87'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.fillText('COLLECTED KEEPSAKES', rOffset + 40, 302)

      const keepsakeStamps = [
        { id: 'dilmun-bull-stamp', emoji: '🏺', name: 'Dilmun Bull' },
        { id: 'saffron-karak-pot', emoji: '🍯', name: 'Saffron Karak' },
        { id: 'desert-bark-charm', emoji: '🌿', name: 'Desert Leaf' },
        { id: 'coral-reef-sprig', emoji: '🪸', name: 'Coral Shell' }
      ]
      keepsakeStamps.forEach((k, idx) => {
        const col = idx % 2
        const row = Math.floor(idx / 2)
        const kx = rOffset + 40 + col * 335
        const ky = 322 + row * 142
        const kw = 285, kh = 120
        
        const isCollected = collectedKeepsakes.includes(k.id)
        
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(kx, ky, kw, kh, 14); else ctx.rect(kx, ky, kw, kh)
        ctx.fill()
        ctx.strokeStyle = isCollected ? 'rgba(196, 30, 58, 0.15)' : 'rgba(140, 138, 135, 0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        // Draw emoji
        ctx.font = '40px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.letterSpacing = '0'
        if (isCollected) {
          ctx.globalAlpha = 1.0
          ctx.fillText(k.emoji, kx + kw / 2, ky + 52)
        } else {
          ctx.globalAlpha = 0.25
          ctx.fillText(k.emoji, kx + kw / 2, ky + 52)
          ctx.globalAlpha = 1.0
          
          ctx.font = '10px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = '#8C8A87'
          ctx.fillText('🔒 LOCKED', kx + kw / 2, ky + 74)
        }
        
        // Draw label
        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = isCollected ? '#1C1917' : '#8C8A87'
        ctx.letterSpacing = '0.04em'
        ctx.fillText(k.name.toUpperCase(), kx + kw / 2, ky + (isCollected ? 86 : 94))
      })

      // ─── BOTTOM SLIM FOOTER DRAWING ───
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.15em'
      ctx.textAlign = 'center'
      ctx.fillText('bahrain-passage-tour-guide.vercel.app', W / 2, H - 28)
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
      ctx.letterSpacing = '0.15em'
      ctx.fillText('#BahrainPassage · Kingdom of Bahrain 2026', W / 2, H - 12)

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

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#C41E3A', '#D4AF37', '#F9F7F4'] })
      toast.success('Chronicle exported!')
    } catch (err) {
      console.error('Export failed:', err)
      toast.success('Export ready!')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center px-4 glass-overlay overflow-y-auto py-10"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      data-lenis-prevent
    >
      {/* Premium Split-Screen Card Container with Motion entry */}
      <motion.div
        ref={cardRef}
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col bg-white border border-stone-250/20"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'var(--bp-font-body)' }}
      >
        <div className="flex flex-col md:flex-row min-h-[580px]">
          {/* Left Panel: Cover Page (Deep Heritage Crimson) */}
          <div className="w-full md:w-[380px] shrink-0 bg-[#C41E3A] text-white p-6 md:p-8 flex flex-col justify-between relative select-none">
            {/* Subtle background patterns */}
            <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 11%)', backgroundSize: '12px 12px' }} />
            
            <div className="space-y-4 relative z-10">
              <div className="text-center font-sans tracking-[0.25em] text-[10px] text-white/80 uppercase font-bold">
                KINGDOM OF BAHRAIN
                <div className="mt-1 font-serif text-[13px] tracking-[0.1em] lowercase font-normal italic text-white/70">مملكة البحرين</div>
              </div>
              <hr className="border-white/20" />
              
              <div className="py-6 text-center space-y-2">
                <h1 className="font-serif text-5xl font-extrabold tracking-[0.18em] text-white uppercase leading-none block">
                  BAHRAIN
                </h1>
                <h1 className="font-serif text-5xl font-extrabold tracking-[0.18em] text-white uppercase leading-none block mt-1">
                  PASSAGE
                </h1>
                <p className="font-sans text-[9px] tracking-[0.15em] uppercase text-white/60 pt-4 font-bold">
                  Explorer Chronicle · Travel Passport
                </p>
              </div>
              <hr className="border-white/20" />
              
              <div className="flex justify-between items-center text-[10px] tracking-wider font-sans font-bold text-white/90 uppercase px-1">
                <span>{rank.label}</span>
                <span>{xp} XP</span>
                <span>{goldFils} FILS</span>
              </div>
            </div>

            {/* Traveler Seal at the bottom */}
            <div className="flex flex-col items-center mt-8 relative z-10 hidden md:flex">
              <div className="w-40 h-40 rounded-full border-2 border-white/40 flex items-center justify-center relative bg-white/5 shadow-inner">
                {signature ? (
                  <img src={signature} alt="Traveler Seal" className="max-h-[85%] max-w-[85%] object-contain" />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-14 h-14 text-white fill-current">
                    <path d="M50 5 Q50 50 95 50 Q50 50 50 95 Q50 50 5 50 Q50 50 50 5 Z" />
                  </svg>
                )}
              </div>
              <span className="text-[9px] tracking-[0.3em] font-sans font-bold text-white/70 uppercase mt-3">
                TRAVELER SEAL
              </span>
            </div>
          </div>

          {/* Right Panel: Content Page (Soft Off-White/Cream) */}
          <div className="flex-1 bg-[#F9F7F4] text-[#1C1917] p-6 md:p-8 flex flex-col justify-between relative">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors p-1.5 flex items-center justify-center cursor-pointer z-20"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="space-y-6">
              {/* Subtab Toggle Buttons */}
              <div className="flex bg-stone-200/40 border border-stone-300/45 rounded-xl p-1 relative z-10 max-w-sm mr-6">
                <button
                  onClick={() => setSubTab('details')}
                  className={`flex-1 py-1.5 text-[9.5px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                    subTab === 'details' ? 'bg-white text-[#C41E3A] shadow-sm' : 'text-stone-500 hover:text-stone-700 bg-transparent'
                  }`}
                >
                  Passport
                </button>
                <button
                  onClick={() => setSubTab('challenges')}
                  className={`flex-1 py-1.5 text-[9.5px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                    subTab === 'challenges' ? 'bg-white text-[#C41E3A] shadow-sm' : 'text-stone-500 hover:text-stone-700 bg-transparent'
                  }`}
                >
                  Challenges
                </button>
                <button
                  onClick={() => setSubTab('seal')}
                  className={`flex-1 py-1.5 text-[9.5px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none ${
                    subTab === 'seal' ? 'bg-white text-[#C41E3A] shadow-sm' : 'text-stone-500 hover:text-stone-700 bg-transparent'
                  }`}
                >
                  Carve Seal
                </button>
              </div>

              {/* Subtab Content Panels */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={subTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {subTab === 'details' ? (
                    <div className="space-y-6">
                      {/* Journey Record Cards */}
                      <div>
                        <h3 className="text-[10px] tracking-[0.2em] font-sans font-bold text-stone-400 uppercase mb-2">
                          JOURNEY RECORD
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm text-center flex flex-col justify-center min-h-[90px]">
                            <span className="font-serif text-3xl font-extrabold text-[#C41E3A]">
                              {completedDays.length}/{duration}
                            </span>
                            <span className="text-[8.5px] uppercase tracking-widest text-stone-400 font-sans font-extrabold mt-1">
                              DAYS SEALED
                            </span>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-stone-200/50 shadow-sm text-center flex flex-col justify-center min-h-[90px]">
                            <span className="font-serif text-3xl font-extrabold text-[#C41E3A]">
                              {keepsakesCollected}
                            </span>
                            <span className="text-[8.5px] uppercase tracking-widest text-stone-400 font-sans font-extrabold mt-1">
                              KEEPSAKES
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vibe Profile Pills */}
                      <div>
                        <h3 className="text-[10px] tracking-[0.2em] font-sans font-bold text-stone-400 uppercase mb-2">
                          VIBE PROFILE
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {['empires', 'spice', 'lights', 'sea'].map(m => {
                            const isActive = selectedMoods.includes(m) || selectedMoods.length === 0
                            return (
                              <span
                                key={m}
                                className={`text-[9.5px] px-3.5 py-1.5 rounded-full font-bold border uppercase tracking-wider transition-all duration-300 ${
                                  isActive 
                                    ? 'bg-[#C41E3A]/5 border-[#C41E3A]/20 text-[#C41E3A] shadow-sm' 
                                    : 'bg-stone-200/20 border-stone-250/10 text-stone-400'
                                }`}
                              >
                                {MOOD_LABELS[m] || m}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Collected Keepsakes 2x2 Grid */}
                      <div>
                        <h3 className="text-[10px] tracking-[0.2em] font-sans font-bold text-stone-400 uppercase mb-2">
                          COLLECTED KEEPSAKES
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'dilmun-bull-stamp', emoji: '🏺', name: 'Dilmun Bull' },
                            { id: 'saffron-karak-pot', emoji: '🍯', name: 'Saffron Karak' },
                            { id: 'desert-bark-charm', emoji: '🌿', name: 'Desert Leaf' },
                            { id: 'coral-reef-sprig', emoji: '🪸', name: 'Coral Shell' }
                          ].map(k => {
                            const isCollected = collectedKeepsakes.includes(k.id)
                            return (
                              <div 
                                key={k.id} 
                                className={`bg-white p-3 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm min-h-[92px] transition-all duration-300 ${
                                  isCollected ? 'border-stone-200/80' : 'border-stone-200/30'
                                }`}
                              >
                                <div className={`text-3xl transition-all duration-300 ${isCollected ? 'opacity-100 scale-100' : 'opacity-25 scale-90 filter saturate-50'}`}>
                                  {k.emoji}
                                </div>
                                <span className={`text-[9px] font-sans font-bold mt-2 uppercase tracking-wide ${isCollected ? 'text-stone-850' : 'text-stone-400'}`}>
                                  {k.name}
                                </span>
                                {!isCollected && (
                                  <span className="text-[7px] text-stone-400 font-mono tracking-tighter mt-0.5">🔒 LOCKED</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : subTab === 'challenges' ? (
                    <div className="space-y-4">
                      <div className="text-left w-full select-none">
                        <span className="text-[8px] uppercase tracking-widest text-stone-400 font-bold">Explorer Milestones</span>
                        <h3 className="font-serif text-sm font-bold text-stone-800 mt-0.5">Personalized AI Challenges</h3>
                      </div>
                      
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                        {challengesList.map(ch => {
                          const isComplete = ch.progress >= ch.target
                          return (
                            <div 
                              key={ch.id}
                              className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm space-y-2 relative text-left select-none"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-serif text-[11px] font-bold text-stone-850 truncate">{ch.title}</h4>
                                  <p className="text-[8.5px] text-stone-500 mt-0.5 leading-relaxed">{ch.desc}</p>
                                </div>
                                {ch.claimed ? (
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-stone-450 bg-stone-100 px-2 py-0.5 rounded shrink-0">Claimed</span>
                                ) : isComplete ? (
                                  <button
                                    onClick={() => handleClaimReward(ch)}
                                    className="text-[8px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-2.5 py-1 rounded-lg transition-all cursor-pointer border-none shrink-0"
                                  >
                                    Claim
                                  </button>
                                ) : (
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">Active</span>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] font-bold text-stone-500 font-mono">
                                  <span>Progress</span>
                                  <span>{ch.progress} / {ch.target}</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-[#C41E3A]'}`}
                                    style={{ width: `${Math.min(100, (ch.progress / ch.target) * 105)}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="text-[7.5px] font-mono font-bold text-stone-400 uppercase tracking-wide flex justify-between pt-1 border-t border-stone-100/60">
                                <span>Reward:</span>
                                <span className="text-emerald-700 font-extrabold">+{ch.rewardXP} XP · +{ch.rewardFils} Fils</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
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
            </div>

            {/* Footer Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-stone-200/50 mt-6 relative z-10">
              {subTab === 'details' && (
                <>
                  <button
                    onClick={handleExportChronicle}
                    className="flex-1 py-2.5 rounded-xl font-sans font-bold text-[9.5px] tracking-widest uppercase transition-all cursor-pointer shadow-sm active:scale-95 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 border-none"
                  >
                    📜 Export Passport Image
                  </button>
                  <button
                    onClick={handleShare}
                    className="py-2.5 px-4 rounded-xl bg-[#C41E3A] hover:bg-[#A3162C] text-white font-sans font-bold text-[9.5px] tracking-widest uppercase transition-all cursor-pointer shadow-sm active:scale-95 border-none"
                  >
                    Share
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className={`py-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 font-sans font-bold text-[9.5px] tracking-widest uppercase transition-all cursor-pointer active:scale-95 ${
                  subTab === 'seal' ? 'w-full' : 'px-4'
                }`}
              >
                {subTab === 'seal' ? 'Cancel' : 'Close'}
              </button>
            </div>
          </div>
        </div>

        {/* Slim Crimson Footer */}
        <div className="bg-[#C41E3A] py-3 px-6 flex flex-col md:flex-row items-center justify-between text-[8px] md:text-[9.5px] font-sans font-bold tracking-[0.1em] text-white/90 border-t border-white/10 uppercase select-none w-full">
          <span className="hover:text-white transition-colors">bahrain-passage-tour-guide.vercel.app</span>
          <span className="opacity-90">#BahrainPassage · Kingdom of Bahrain 2026</span>
        </div>
      </motion.div>
    </div>
  )
}
