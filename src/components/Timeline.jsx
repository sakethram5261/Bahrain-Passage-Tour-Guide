import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useVibe } from '../hooks/useVibe'
import LocationCard from './LocationCard'

const dayThemes = {
  1: { 
    title: 'Spice Alleys & Grand Gates', 
    desc: 'Walk historic market lanes, taste warm saffron halwa, and breathe the cardamom steam of traditional karak brew.', 
    reward: 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.' 
  },
  2: { 
    title: 'Ancient Sands & Clay Kilns', 
    desc: 'Touch 4,000-year-old fort ramparts, mold red clay alongside generational potters, and stargaze under Sakhir skies.', 
    reward: 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.' 
  },
  3: { 
    title: 'Shores & Vanishing Sandbanks', 
    desc: 'Charter wooden sea taxis, seek the old oyster diver quarters, and step onto pure white sandbars that submerge daily.', 
    reward: 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.' 
  },
  4: { 
    title: 'Desert Secrets & Stargazing', 
    desc: 'Walk the Sakhir ridge lines, marvel at lone desert trees, and sleep under infinite skies of Manama.', 
    reward: 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.' 
  },
  5: { 
    title: 'Coastline Winds & Pearl Tracks', 
    desc: 'Follow old oyster merchant paths, walk sitra coastlines, and trace modern marina water reflections.', 
    reward: 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.' 
  }
}

export default function Timeline({ locations, loading, onScan }) {
  const { 
    currentDayTab, 
    setCurrentDayTab, 
    unlockedDays, 
    completedDays, 
    completeDay, 
    currentSpotIndex, 
    setCurrentSpotIndex,
    soundVolume,
    soundMuted
  } = useVibe()
  
  const containerRef = useRef(null)
  const stampRef = useRef(null)
  const [stamping, setStamping] = useState(false)

  const activeSpots = locations.filter(s => s.day === currentDayTab)
  const isCompleted = completedDays.includes(currentDayTab)
  const activeTheme = dayThemes[currentDayTab] || { 
    title: 'Bahrain Passage Route', 
    desc: 'Curated wayfarer path.', 
    reward: 'Explore authentic paths.' 
  }

  const hasSpots = activeSpots.length > 0
  
  // N spots + 1 final Seal/Passport Page
  const totalSteps = hasSpots ? activeSpots.length + 1 : 0
  const isSealStep = currentSpotIndex === activeSpots.length
  const activeSpot = !isSealStep && hasSpots ? activeSpots[currentSpotIndex] : null

  useGSAP(() => {
    if (loading) return
    
    gsap.fromTo('.journal-page-node',
      { opacity: 0, scale: 0.98, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )
  }, [currentSpotIndex, currentDayTab, loading])

  const handleNextStep = () => {
    if (currentSpotIndex < totalSteps - 1) {
      gsap.to('.journal-page-node', {
        opacity: 0,
        x: -15,
        duration: 0.25,
        onComplete: () => {
          setCurrentSpotIndex(currentSpotIndex + 1)
          gsap.fromTo('.journal-page-node', 
            { opacity: 0, x: 15 },
            { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
          )
        }
      })
    }
  }

  const handlePrevStep = () => {
    if (currentSpotIndex > 0) {
      gsap.to('.journal-page-node', {
        opacity: 0,
        x: 15,
        duration: 0.25,
        onComplete: () => {
          setCurrentSpotIndex(currentSpotIndex - 1)
          gsap.fromTo('.journal-page-node', 
            { opacity: 0, x: -15 },
            { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
          )
        }
      })
    }
  }

  const handleSealDay = () => {
    setStamping(true)
    
    gsap.fromTo(stampRef.current,
      { scale: 3.8, rotate: -35, opacity: 0 },
      {
        scale: 1,
        rotate: 5,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.4)',
        onComplete: () => {
          setTimeout(() => {
            completeDay(currentDayTab)
            setStamping(false)
          }, 1200)
        }
      }
    )
  }

  const speakPhrase = (text) => {
    if (soundMuted) return
    try {
      // 1. Warm native Arabic Speech Pronunciation
      window.speechSynthesis.cancel()
      const match = text.match(/"([^"]+)"/)
      const speakText = match ? match[1] : text
      
      const utterance = new SpeechSynthesisUtterance(speakText)
      utterance.lang = 'ar-BH' // Bahraini Arabic accent dialect
      utterance.rate = 0.84   // Patient educational cadence
      utterance.pitch = 0.96  // Lyrical resonance
      utterance.volume = soundVolume
      
      window.speechSynthesis.speak(utterance)
      
      // 2. Physics-Modeled Traditional Oud Lute Pluck (Pure Web Audio Synthesis)
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      
      const playString = (frequency, delayTime, gainVolume) => {
        const osc = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        // Triangle wave offers a warm, hollow hollow resonance matching wooden lute bodies
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delayTime)
        
        // Pluck envelope: zero start, instant rise, long exponential wood decay
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delayTime)
        gainNode.gain.linearRampToValueAtTime(gainVolume * soundVolume, audioCtx.currentTime + delayTime + 0.02) // Fast attack plucking
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delayTime + 1.2) // Dampened decay
        
        osc.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        osc.start(audioCtx.currentTime + delayTime)
        osc.stop(audioCtx.currentTime + delayTime + 1.3)
      }
      
      // Pluck a warm traditional Arabic D-minor maqam chord progression
      playString(146.83, 0.0, 0.22)   // D3 (Deep wood resonance)
      playString(220.00, 0.04, 0.16)  // A3 (Warm fifth support)
      playString(293.66, 0.08, 0.12)  // D4 (Melodic octave pluck)
    } catch (e) {
      console.error('Speech plucker or AudioContext warm-up failed:', e)
    }
  }

  if (loading) {
    return (
      <div className="w-full py-24 flex items-center justify-center select-none">
        <div className="w-10 h-10 border-2 border-red-500/10 border-t-bahrain-red rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full py-2">
      
      {/* Chapter Title block */}
      <div className="flex flex-col text-left pl-4 md:pl-0 mb-6 select-none">
        <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
          Day {currentDayTab}
        </span>
        <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
          {activeTheme.title}
        </h3>
        <p className="font-sans text-xs text-bronze-muted mt-1 max-w-xl leading-relaxed">
          {activeTheme.desc}
        </p>
      </div>

      {/* Main Journal Page Canvas */}
      <div className="relative w-full">
        {!hasSpots ? (
          <div className="w-full py-16 text-center glass-panel rounded-3xl p-6 select-none">
            <p className="font-serif text-sm text-bronze-muted italic">
            No matching stops found for your interests. Adjust your preferences.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Journal Page Node wrapper */}
            <div className="journal-page-node w-full">
              
              {!isSealStep ? (
                /* Dynamic Spot Page Spread */
                <LocationCard spot={activeSpot} onScan={onScan} />
              ) : (
                /* Vintage Passport Sealing Page */
                <div className="glass-panel rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto min-h-[380px] flex flex-col justify-center items-center relative overflow-hidden border border-red-500/10 shadow-lg">
                  
                  {stamping && (
                    <div className="absolute inset-0 z-40 bg-white/80 flex items-center justify-center pointer-events-none">
                      <div 
                        ref={stampRef}
                        className="w-36 h-36 border-4 border-double border-bahrain-red/80 rounded-full flex flex-col items-center justify-center rotate-6 text-bahrain-red shadow-lg bg-pearl-white opacity-0"
                      >
                        <span className="font-serif text-[10px] tracking-widest uppercase font-bold">Authenticated</span>
                        <span className="font-serif text-[8px] tracking-wider uppercase font-bold mt-1">Bahrain Entry</span>
                        <span className="font-serif text-[6px] text-bronze-charcoal mt-1">2026-05-25</span>
                      </div>
                    </div>
                  )}

                  {!isCompleted ? (
                    <div className="relative z-10 flex flex-col items-center max-w-md">
                      <div className="w-20 h-20 border-2 border-dashed border-red-500/20 rounded-full flex items-center justify-center text-red-500/35 mb-6 select-none">
                        🔒
                      </div>

                      <span className="font-sans text-[8px] tracking-[0.2em] text-bahrain-red uppercase font-bold block mb-2 select-none">
                        Day Complete
                      </span>
                      <h4 className="font-serif text-2xl text-bronze-charcoal font-semibold mb-3">
                        Complete Day {currentDayTab}
                      </h4>
                      <p className="font-sans text-xs text-bronze-muted leading-relaxed mb-8">
                        You've explored all landmarks for this day. Mark it as complete to unlock the insider reward.
                      </p>
                      
                      <button
                        onClick={handleSealDay}
                        className="px-8 py-3 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-xs uppercase tracking-widest font-bold transition-all shadow-md cursor-pointer"
                      >
                        Complete Day
                      </button>
                    </div>
                  ) : (
                    <div className="relative z-10 text-left flex flex-col md:flex-row justify-between items-center gap-8 w-full max-w-xl">
                      
                      {/* Reward Callout */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-600" />
                          <span className="font-sans text-[8px] tracking-widest uppercase text-green-700 font-bold select-none">
                            Day Complete
                          </span>
                        </div>
                        <h4 className="font-serif text-2xl text-bronze-charcoal font-semibold">
                          Day {currentDayTab} Insider Reward
                        </h4>
                        
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex justify-between items-start gap-4">
                          <p className="font-serif text-xs italic text-bronze-charcoal leading-relaxed font-semibold flex-1">
                            {activeTheme.reward}
                          </p>
                          <button
                            onClick={() => speakPhrase(activeTheme.reward)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-red-500/15 hover:border-red-500/35 hover:shadow-sm text-[8px] uppercase font-sans font-bold tracking-widest text-bahrain-red transition-all cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95"
                          >
                            <span>🔊 Pronounce</span>
                          </button>
                        </div>

                        {currentDayTab < 5 && unlockedDays.includes(currentDayTab + 1) && (
                          <button
                            onClick={() => setCurrentDayTab(currentDayTab + 1)}
                            className="px-5 py-2.5 rounded-lg border border-bahrain-red/20 text-bahrain-red hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-bold transition-all cursor-pointer select-none"
                          >
                            Next Day →
                          </button>
                        )}
                      </div>

                      {/* Red Stamp Ink Mark */}
                      <div className="w-32 h-32 border-4 border-double border-bahrain-red/70 rounded-full flex flex-col items-center justify-center rotate-12 text-bahrain-red bg-pearl-white/40 shrink-0 select-none shadow-sm">
                        <span className="font-serif text-[8px] tracking-widest uppercase font-bold">Authenticated</span>
                        <span className="font-serif text-[6px] tracking-wider uppercase font-bold mt-0.5">Bahrain Entry</span>
                        <span className="font-serif text-[5px] text-bronze-charcoal mt-1">Passage sealed</span>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Retro Editorial Navigation controls */}
            <div className="w-full max-w-4xl mx-auto flex justify-between items-center px-4 md:px-1 select-none">
              
              <span className="font-sans text-[9px] tracking-wider uppercase text-bronze-muted/60 font-bold">
                {isSealStep 
                  ? `Day Complete (${currentSpotIndex + 1} of ${totalSteps})` 
                  : `Stop ${currentSpotIndex + 1} of ${totalSteps}`
                }
              </span>

              {/* Dot Indicators */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }, (_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSpotIndex(idx)}
                    className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                      currentSpotIndex === idx ? 'bg-bahrain-red scale-110' : 'bg-red-500/15 hover:bg-red-500/30'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next controls */}
              <div className="flex gap-2">
                <button
                  disabled={currentSpotIndex === 0}
                  onClick={handlePrevStep}
                  className="px-4 py-1.5 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  ← Previous
                </button>
                <button
                  disabled={currentSpotIndex === totalSteps - 1}
                  onClick={handleNextStep}
                  className="px-4 py-1.5 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Next →
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  )
}
