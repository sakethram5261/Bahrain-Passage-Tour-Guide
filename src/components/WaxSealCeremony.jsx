import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { useVibe } from '../hooks/useVibe'

export default function WaxSealCeremony({ dayNum, onComplete }) {
  const { signature } = useVibe()
  const [phase, setPhase] = useState('pour') // pour, press, cooled
  const [pourProgress, setPourProgress] = useState(0) // 0 to 1
  const [isPouring, setIsPouring] = useState(false)
  const pourTimer = useRef(null)
  const audioCtxRef = useRef(null)

  // ── Procedural Sound Synthesizers ────────────────────────────────────────
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  // Synthesize hot wax pouring / bubbling
  const startPourSound = () => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    // Create a low frequency bubble oscillator
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(90, ctx.currentTime)
    
    // Modulate bubble frequency
    const lfo = ctx.createOscillator()
    lfo.frequency.setValueAtTime(12, ctx.currentTime)
    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(30, ctx.currentTime)

    // White noise for hot hiss/sizzle
    const bufferSize = ctx.sampleRate * 2
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.Q.value = 8.0
    noiseFilter.frequency.setValueAtTime(1200, ctx.currentTime)

    const mainGain = ctx.createGain()
    mainGain.gain.setValueAtTime(0.0, ctx.currentTime)
    mainGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.1)

    // Connect nodes
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)
    
    osc.connect(mainGain)
    noiseSource.connect(noiseFilter)
    noiseFilter.connect(mainGain)
    
    mainGain.connect(ctx.destination)

    osc.start(0)
    lfo.start(0)
    noiseSource.start(0)

    return { osc, lfo, noiseSource, mainGain }
  }

  // Synthesize heavy metal stamp clink/thud
  const playStampSound = () => {
    initAudio()
    const ctx = audioCtxRef.current
    if (!ctx) return

    const t = ctx.currentTime

    // 1. Low thud (heavy force)
    const thud = ctx.createOscillator()
    thud.type = 'sine'
    thud.frequency.setValueAtTime(110, t)
    thud.frequency.exponentialRampToValueAtTime(30, t + 0.15)
    
    const thudGain = ctx.createGain()
    thudGain.gain.setValueAtTime(0.4, t)
    thudGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)

    thud.connect(thudGain)
    thudGain.connect(ctx.destination)
    thud.start(t)
    thud.stop(t + 0.2)

    // 2. High metallic ring
    const ring = ctx.createOscillator()
    ring.type = 'sine'
    ring.frequency.setValueAtTime(980, t)
    
    const ring2 = ctx.createOscillator()
    ring2.type = 'sine'
    ring2.frequency.setValueAtTime(1420, t)

    const ringGain = ctx.createGain()
    ringGain.gain.setValueAtTime(0.15, t)
    ringGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1)

    ring.connect(ringGain)
    ring2.connect(ringGain)
    ringGain.connect(ctx.destination)
    
    ring.start(t)
    ring2.start(t)
    ring.stop(t + 0.12)
    ring2.stop(t + 0.12)
  }

  // ── Pouring mechanics ────────────────────────────────────────────────────
  const soundRef = useRef(null)

  const startPouring = () => {
    if (phase !== 'pour') return
    setIsPouring(true)
    
    // Play sound
    try {
      soundRef.current = startPourSound()
    } catch { /* ignore */ }

    pourTimer.current = setInterval(() => {
      setPourProgress(prev => {
        const next = Math.min(prev + 0.04, 1)
        if (next >= 1) {
          clearInterval(pourTimer.current)
          setIsPouring(false)
          setPhase('press')
          stopPourSound()
        }
        return next
      })
    }, 50)
  }

  const stopPouring = () => {
    setIsPouring(false)
    clearInterval(pourTimer.current)
    stopPourSound()
  }

  const stopPourSound = () => {
    if (soundRef.current) {
      try {
        const ctx = audioCtxRef.current
        soundRef.current.mainGain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.15)
        const s = soundRef.current
        setTimeout(() => {
          s.osc.stop()
          s.lfo.stop()
          s.noiseSource.stop()
        }, 200)
      } catch { /* ignore */ }
      soundRef.current = null
    }
  }

  const handlePressStamp = () => {
    if (phase !== 'press') return
    
    // Play heavy thud sound
    try {
      playStampSound()
    } catch { /* ignore */ }

    setPhase('cooled')

    // Confetti celebration (gold and crimson)
    try {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#BA0C2F', '#D4AF37', '#FFFDF9', '#C1122F']
      })
    } catch (e) {
      console.warn('Confetti failed to launch:', e)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pourTimer.current)
      stopPourSound()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950/94 backdrop-blur-md select-none p-6 text-center animate-fade-in" data-lenis-prevent>
      
      {/* SVG Liquid Displacement Filter */}
      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="liquid-wax">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={phase === 'cooled' ? '6' : '15'} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="space-y-2 mb-6 max-w-sm">
        <span className="text-[10px] font-sans text-[#E7A852] font-black tracking-widest uppercase">Chapter Complete</span>
        <h2 className="font-serif text-2xl font-bold text-stone-100">Day {dayNum} Sealing Ceremony</h2>
        <p className="text-xs font-sans text-stone-400 leading-normal">
          {phase === 'pour' && 'Press and hold to pour the molten sealing wax onto the page'}
          {phase === 'press' && 'Tap the golden stamp seal to carve your signature into the wax'}
          {phase === 'cooled' && 'Your chapter has been sealed. The chronicles are secure'}
        </p>
      </div>

      {/* Tactile Ceremony Area */}
      <div className="relative w-full max-w-xs aspect-square rounded-2xl border border-stone-850 bg-[#F5F2EA] shadow-inner flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 paper-grain opacity-25 pointer-events-none" />
        
        {/* Molten Wax Pool */}
        {pourProgress > 0 && (
          <div
            style={{
              width: `${pourProgress * 140}px`,
              height: `${pourProgress * 140}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 40%, #E72A4B 0%, #BA0C2F 60%, #5C0212 100%)',
              filter: 'url(#liquid-wax) drop-shadow(0 4px 10px rgba(0,0,0,0.38))',
              transition: isPouring ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="relative flex items-center justify-center z-10"
          >
            {/* Sealed Emblem inside wax pool */}
            {phase === 'cooled' && (
              <div className="absolute inset-2 rounded-full border border-white/10 flex items-center justify-center overflow-hidden shadow-inner animate-fade-in">
                {signature ? (
                  <img
                    src={signature}
                    alt="Wax Seal Imprint"
                    className="max-h-full max-w-full object-contain filter invert opacity-35 brightness-150 contrast-200"
                  />
                ) : (
                  <div className="text-white/40 font-serif text-3xl font-bold select-none italic tracking-wider">
                    BP
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 1. Incense Pouring Spoon (Phase: Pour) */}
        {phase === 'pour' && (
          <div 
            onMouseDown={startPouring}
            onMouseUp={stopPouring}
            onMouseLeave={stopPouring}
            onTouchStart={startPouring}
            onTouchEnd={stopPouring}
            className={`absolute z-20 cursor-pointer p-4 transition-all duration-300 ${
              isPouring ? 'scale-95 -translate-y-2 rotate-6' : 'hover:scale-105 hover:-translate-y-1'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-300/40 shadow-lg flex items-center justify-center text-stone-900 font-bold relative">
              <span className="text-lg">🕯️</span>
              {/* Molten liquid glowing in spoon */}
              <span className="absolute inset-2 rounded-full bg-[#BA0C2F] shadow-inner animate-pulse" />
            </div>
            <p className="text-[9px] font-sans text-stone-500 font-bold tracking-wider uppercase mt-2">Hold to Pour</p>
          </div>
        )}

        {/* 2. Golden Stamp Tool (Phase: Press) */}
        {phase === 'press' && (
          <button
            onClick={handlePressStamp}
            className="absolute z-20 p-4 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-amber-300/60 shadow-xl rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 rank-badge-pulse flex flex-col items-center justify-center w-20 h-20"
          >
            <span className="text-2xl">🔱</span>
            <span className="text-[7px] font-sans font-black text-amber-950 uppercase tracking-widest mt-1">Press</span>
          </button>
        )}
      </div>

      {/* Reward / Confirm Action (Phase: Cooled) */}
      <div className="h-16 mt-6 flex items-center justify-center">
        {phase === 'cooled' && (
          <div className="animate-fade-in-up space-y-3">
            <div className="flex items-center gap-3 justify-center text-xs font-mono font-bold text-stone-400">
              <span className="text-amber-500">+100 XP</span>
              <span>·</span>
              <span className="text-amber-500">+400 Fils</span>
            </div>
            <button
              onClick={onComplete}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-sans font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
            >
              Seal Chronicles
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
