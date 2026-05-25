import { useState, useEffect } from 'react'
import { useVibe } from '../hooks/useVibe'
import { useItinerary, spotsCatalog } from '../hooks/useItinerary'
import WayfarerLens from './WayfarerLens'
import WayfarerMap from './WayfarerMap'
import { Carousel_002 } from './v1/skiper48'

export function getGuideThoughts(spot, guideId) {
  if (!spot) return "Select a landmark below to begin our journey..."
  const spotName = spot.name.split(' (')[0]
  
  if (guideId === 'jafar') {
    return `Ah, the sight of ${spotName} always warms my soul. In my youth during the 1920s pearling boom, our pearling fleets would steer by this landmark. My secret tip: look for the old spice and incense merchants just down the path—their families have traded here for generations, and they brew a legendary cardamom karak tea if you ask with respect.`
  } else if (guideId === 'ninsun') {
    return `Under the sacred skies of c. 2000 BCE, ${spotName} was known as a sanctuary of Dilmun. We walked these limestone paths to offer fresh spring water clay stamps to the gods. My mystical tip: feel the ancient limestone blocks at dusk—they retain the sun's warmth, and you can almost hear the soft whispers of freshwater springs rising from the salt seas.`
  } else {
    return `As a military architect of the 1400s, I designed defensive works near ${spotName}. Its stone layout is a masterclass in sea-facing masonry. My tactical tip: climb to the eastern parapet where the sea breeze hits. From there, you can see how the architectural alignment gives a perfect tactical view of the shallow coastal reefs.`
  }
}

export default function Dashboard() {
  const { 
    selectedMoods, 
    tier, 
    duration, 
    resetChronicle, 
    unlockedDays, 
    completedDays, 
    completeDay,
    currentDayTab, 
    setCurrentDayTab, 
    aiItinerary,
    activeGuide,
    setActiveGuide,
    collectedKeepsakes,
    soundVolume,
    setSoundVolume,
    soundMuted,
    setSoundMuted,
    activeLeaf,
    setActiveLeaf,
    currentSpotIndex,
    setCurrentSpotIndex,
    capturedPhotos,
    journalReflections,
    saveJournalReflection
  } = useVibe()
  
  const { locations, loading } = useItinerary(selectedMoods, tier, duration, aiItinerary)
  const [activeScanSpot, setActiveScanSpot] = useState(null)
  const [selectedKeepsake, setSelectedKeepsake] = useState(null)
  const [stamping, setStamping] = useState(false)
  const [flippingLeaf, setFlippingLeaf] = useState(null)

  // Real-time ticking system clock state for the physical pocket watch hands
  const [systemTime, setSystemTime] = useState(new Date())

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setSystemTime(new Date())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  const activeSpots = locations.filter(s => s.day === currentDayTab)
  const hasSpots = activeSpots.length > 0
  const totalSteps = hasSpots ? activeSpots.length + 1 : 0
  const isSealStep = currentSpotIndex === activeSpots.length
  const activeSpot = !isSealStep && hasSpots ? activeSpots[currentSpotIndex] : null
  const isDayCompleted = completedDays.includes(currentDayTab)

  const hasKeepsake = (spotId) => collectedKeepsakes && collectedKeepsakes.includes(spotId)

  // Instant page content updates (disabled buggy 3D page flip rotation overlay as requested)
  const triggerPageTurnAnimation = (updateFn, direction = 'right') => {
    updateFn();
  }

  const handleNextStep = () => {
    if (currentSpotIndex < totalSteps - 1) {
      triggerPageTurnAnimation(() => {
        setCurrentSpotIndex(currentSpotIndex + 1)
      }, 'right')
    }
  }

  const handlePrevStep = () => {
    if (currentSpotIndex > 0) {
      triggerPageTurnAnimation(() => {
        setCurrentSpotIndex(currentSpotIndex - 1)
      }, 'left')
    }
  }

  const handleLeafSwitch = (leafId) => {
    if (activeLeaf === leafId) return
    const direction = getLeafOrder(leafId) > getLeafOrder(activeLeaf) ? 'right' : 'left'
    triggerPageTurnAnimation(() => {
      setActiveLeaf(leafId)
    }, direction)
  }

  const handleDaySwitch = (dayNum) => {
    if (currentDayTab === dayNum) return
    const direction = dayNum > currentDayTab ? 'right' : 'left'
    triggerPageTurnAnimation(() => {
      setCurrentDayTab(dayNum)
      setCurrentSpotIndex(0)
    }, direction)
  }

  const getLeafOrder = (leafId) => {
    switch (leafId) {
      case 'chronicles': return 1
      case 'cartography': return 2
      case 'keepsakes': return 3
      case 'lexicon': return 4
      default: return 1
    }
  }

  const playBookPageFlip = () => {
    if (soundMuted) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const audioCtx = new AudioContext()
      
      const osc = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(180, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.35)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.06 * soundVolume, audioCtx.currentTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.32)
      
      osc.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.35)
    } catch (e) {}
  }

  const handleSealDay = () => {
    setStamping(true)
    
    if (!soundMuted) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          const audioCtx = new AudioContext()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(90, audioCtx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.25)
          gain.gain.setValueAtTime(0, audioCtx.currentTime)
          gain.gain.linearRampToValueAtTime(0.24 * soundVolume, audioCtx.currentTime + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.24)
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.3)
        }
      } catch (e) {}
    }

    setTimeout(() => {
      completeDay(currentDayTab)
      setStamping(false)
    }, 1100)
  }

  const playTypewriterClick = () => {
    if (soundMuted) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      const filter = audioCtx.createBiquadFilter()
      
      osc.type = 'sine'
      const pitchMultiplier = 0.95 + Math.random() * 0.15
      const startFreq = 1100 * pitchMultiplier
      osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.04)
      
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(550, audioCtx.currentTime)
      filter.Q.setValueAtTime(4, audioCtx.currentTime)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.08 * soundVolume, audioCtx.currentTime + 0.003) 
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03) 
      
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc.start()
      osc.stop(audioCtx.currentTime + 0.035)
    } catch (e) {}
  }

  const playGlossarySound = (arabicText, freqOffset = 0) => {
    if (soundMuted) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(arabicText)
      utterance.lang = 'ar-BH'
      utterance.rate = 0.8
      utterance.pitch = 0.98
      utterance.volume = soundVolume
      window.speechSynthesis.speak(utterance)

      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      
      const audioCtx = new AudioContext()
      
      const playString = (frequency, delayTime, gainVolume) => {
        const osc = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + delayTime)
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + delayTime)
        gainNode.gain.linearRampToValueAtTime(gainVolume * soundVolume, audioCtx.currentTime + delayTime + 0.02)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delayTime + 1.2)
        
        osc.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        
        osc.start(audioCtx.currentTime + delayTime)
        osc.stop(audioCtx.currentTime + delayTime + 1.3)
      }
      
      playString(146.83 + freqOffset, 0.0, 0.22) // D3
      playString(220.00 + freqOffset * 1.5, 0.04, 0.16) // A3
    } catch (e) {}
  }

  const almanac = (() => {
    switch (currentDayTab) {
      case 1:
        return {
          location: 'Manama Souq Spicery',
          metrics: [
            { label: 'Ambient Temperature', value: '31°C / 88°F', desc: 'Warm spice alleys breeze' },
            { label: 'Jasmine Bloom Peak', value: '7:00 PM - 9:30 PM', desc: 'Best aroma window left of gate' },
            { label: 'Karak Steam Rating', value: 'Excellent (High humidity)', desc: 'Perfect acoustic coffee houses' }
          ],
          icon: '☕',
          notes: 'The souq is warmest in mid-afternoon. Highly recommend exploring early morning or twilight after jasmine strands unfold.'
        }
      case 2:
        return {
          location: 'Sakhir Desert Mounds',
          metrics: [
            { label: 'Desert Air Clarity', value: '94% Visibility', desc: 'Superb dry stellar stargazing' },
            { label: 'Stargazing Window', value: '9:00 PM - 2:00 AM', desc: 'Clear skies near Tree of Life' },
            { label: 'Clay Mold Temp', value: 'Warm (Clay sets quick)', desc: 'Perfect Aali kick-wheel spinning' }
          ],
          icon: '🏰',
          notes: 'High atmospheric clarity over the Sakhir dunes tonight. Clear wind gusts from the East carry cool, dry breezes.'
        }
      case 3:
        return {
          location: 'Jarada Tidal Shorelines',
          metrics: [
            { label: 'Disappearing Sandbar', value: 'Low Tide (2.4m Peak)', desc: 'Sand is 100% dry and exposed' },
            { label: 'Tidal Sandbar Peak', value: '11:30 AM - 2:30 PM', desc: 'Ephemeral 3-hour low-tide peak' },
            { label: 'Marine Water Temp', value: '26°C / 79°F', desc: 'Ideal shallow coral swimming' }
          ],
          icon: '⛵',
          notes: 'Coordinate closely with speedboat captains. The Jarada sandbank will completely submerge back into the turquoise Gulf by 3:45 PM.'
        }
      case 4:
        return {
          location: 'Haniniya Valley Crests',
          metrics: [
            { label: 'Valley Wind Speed', value: '12 knots (Northeast)', desc: 'Cool cliffside ventilation breeze' },
            { label: 'Promenade Neon Glow', value: 'Ignites at 7:15 PM', desc: 'Best skyline waterfront reflections' },
            { label: 'Outdoor Acoustics', value: 'Calm water surface', desc: 'Ideal Reef Island coastal walk' }
          ],
          icon: '🌅',
          notes: 'Sunset winds through the valley crests are incredibly refreshing. Excellent night-sky walks along modern promenades.'
        }
      case 5:
        return {
          location: 'Sitra Pearl Harbors',
          metrics: [
            { label: 'Coastal Wave Height', value: '0.4m (Gentle ripples)', desc: 'Ideal Sitra sea ferry transits' },
            { label: 'Oyster Coral Visibility', value: 'Moderate water clarity', desc: 'Spot starfish near coral reefs' },
            { label: 'Al Dar Cabana Temp', value: '29°C / 84°F', desc: 'Cool island breeze under palm shade' }
          ],
          icon: '🦪',
          notes: 'Sea ferry waters remain calm and fully safe. Bring light linens for Sitra island harbor walking.'
        }
      default:
        return {
          location: 'Kingdom of Bahrain',
          metrics: [{ label: 'Temperature', value: '30°C', desc: 'Warm Gulf breeze' }],
          icon: '🇧🇭',
          notes: 'Welcome wayfarer.'
        }
    }
  })()

  const guides = [
    { id: 'jafar', name: 'Merchant Jafar', title: 'Pearling Era (1920s)', emoji: '⛵', arabic: 'تاجر' },
    { id: 'ninsun', name: 'Priestess Ninsun', title: 'Dilmun Era (2000 BCE)', emoji: '🏺', arabic: 'كاهنة' },
    { id: 'al-farsi', name: 'Architect Al-Farsi', title: 'Military Era (1400s)', emoji: '🏰', arabic: 'مهندس' }
  ]

  const romanNumerals = { 
    1: 'Page I', 
    2: 'Page II', 
    3: 'Page III', 
    4: 'Page IV', 
    5: 'Page V',
    6: 'Page VI',
    7: 'Page VII',
    8: 'Page VIII',
    9: 'Page IX',
    10: 'Page X'
  }

  // Calculate hands degrees for clock
  const secondsAngle = systemTime.getSeconds() * 6
  const minutesAngle = systemTime.getMinutes() * 6 + systemTime.getSeconds() * 0.1
  const hoursAngle = (systemTime.getHours() % 12) * 30 + systemTime.getMinutes() * 0.5

  return (
    <div className="min-h-screen wood-desk-backdrop pt-10 pb-24 md:pb-28 px-4 md:px-8 flex flex-col items-center justify-start font-sans relative select-none">
      
      {/* 1. TACTILE DESKTOP PROPS (Floats around the journal book only on desktop) */}
      {/* Quill Pen in Ink bottle */}
      <div className="hidden lg:block desktop-prop-quill">
        <svg viewBox="0 0 120 180" className="w-full h-auto">
          <defs>
            <linearGradient id="quillGradDash2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a3e3d" />
              <stop offset="60%" stopColor="#2c2120" />
              <stop offset="100%" stopColor="#120c0c" />
            </linearGradient>
          </defs>
          <rect x="35" y="110" width="50" height="50" rx="10" fill="#1A1817" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <rect x="35" y="110" width="50" height="15" fill="rgba(193,18,47,0.3)" />
          <rect x="47" y="92" width="26" height="18" fill="#1C1817" />
          <ellipse cx="60" cy="92" rx="13" ry="4" fill="#3D302F" />
          <path d="M 47,100 Q 60,103 73,100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.75" fill="none" />
          <path d="M 60,95 Q 50,60 30,15 Q 40,40 55,75 Z" fill="url(#quillGradDash2)" />
          <path d="M 60,95 Q 65,55 78,10 Q 70,35 63,70 Z" fill="url(#quillGradDash2)" opacity="0.9" />
          <path d="M 60,98 Q 57,60 48,12" stroke="#aa7c11" strokeWidth="1.5" fill="none" opacity="0.8" />
        </svg>
      </div>

      {/* Steaming Karak Tea Cup on brass plate */}
      <div className="hidden lg:block desktop-prop-tea" title="Generational Cardamom Karak Tea">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse cx="50" cy="72" rx="42" ry="12" fill="none" stroke="#d4af37" strokeWidth="1.8" />
          <ellipse cx="50" cy="72" rx="42" ry="12" fill="rgba(42,35,33,0.9)" />
          <path d="M 24,42 Q 22,25 24,18 L 76,18 Q 78,25 76,42 Q 74,68 50,70 Q 26,68 24,42 Z" fill="#FAF9F6" stroke="#aa7c11" strokeWidth="1" />
          <ellipse cx="50" cy="20" rx="23" ry="5" fill="#a46d37" />
          <ellipse cx="50" cy="18" rx="26" ry="6" fill="none" stroke="#d4af37" strokeWidth="1.5" />
          <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#FAF9F6" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 75,28 Q 90,32 86,48 Q 82,60 70,54" fill="none" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" />
          <path d="M 38,10 Q 34,4 40,-2 T 36,-10" className="tea-steam-line" />
          <path d="M 50,10 Q 54,4 48,-2 T 52,-10" className="tea-steam-line" style={{ animationDelay: '1.2s' }} />
          <path d="M 62,10 Q 58,4 64,-2 T 60,-10" className="tea-steam-line" style={{ animationDelay: '2.4s' }} />
        </svg>
      </div>

      {/* Ticking Brass Pocket Watch displaying user actual system time */}
      <div className="hidden lg:block desktop-prop-watch" title="Nautical chronometer watch (synced to local time)">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="4" />
          <circle cx="50" cy="50" r="46" fill="rgba(42,35,33,0.95)" />
          <circle cx="50" cy="2" r="8" fill="none" stroke="#aa7c11" strokeWidth="2" />
          <circle cx="50" cy="50" r="38" fill="#FAF9F6" stroke="#221c1a" strokeWidth="1.5" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="16"
              x2="50"
              y2="20"
              stroke="#1A1412"
              strokeWidth="1.5"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="30"
            stroke="#1A1412"
            strokeWidth="2.8"
            strokeLinecap="round"
            transform={`rotate(${hoursAngle} 50 50)`}
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke="#3D3330"
            strokeWidth="1.8"
            strokeLinecap="round"
            transform={`rotate(${minutesAngle} 50 50)`}
          />
          <line
            x1="50"
            y1="55"
            x2="50"
            y2="18"
            stroke="#C1122F"
            strokeWidth="0.8"
            strokeLinecap="round"
            transform={`rotate(${secondsAngle} 50 50)`}
          />
          <circle cx="50" cy="50" r="3.2" fill="#d4af37" stroke="#1A1412" strokeWidth="0.8" />
        </svg>
      </div>

      {/* Leather-bound Bahrain Passage Visa Passport */}
      <div className="hidden lg:block desktop-prop-passport">
        <svg viewBox="0 0 120 180" className="w-full h-auto">
          <rect x="5" y="5" width="110" height="170" rx="8" fill="#5F161B" stroke="#8C1D24" strokeWidth="1" />
          <rect x="9" y="9" width="102" height="162" rx="5" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="60" cy="72" r="16" fill="none" stroke="#D4AF37" strokeWidth="0.75" />
          <path d="M 50,72 Q 60,82 70,72 Q 60,62 50,72 Z M 55,72 Q 60,77 65,72" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
          <path d="M 60,56 L 60,88 M 44,72 L 76,72" stroke="#D4AF37" strokeWidth="0.5" opacity="0.6" />
          <text x="60" y="32" fill="#D4AF37" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.2" textAnchor="middle">KINGDOM OF BAHRAIN</text>
          <text x="60" y="146" fill="#D4AF37" fontSize="8" fontFamily="serif" letterSpacing="2" textAnchor="middle">PASSPORT</text>
          <text x="60" y="156" fill="#D4AF37" fontSize="4" fontFamily="sans-serif" letterSpacing="1" textAnchor="middle" opacity="0.65">ENTRY VISA ACTIVATE</text>
        </svg>
      </div>

      {/* Decorative Vintage Study Desktop Header */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-red-500/10 mb-8 gap-4 z-10 select-none text-bronze-charcoal">
        <div className="flex flex-col text-left">
          <span className="font-sans text-[8px] tracking-[0.3em] text-bahrain-red uppercase font-extrabold">
            The Wayfarer's Chronicle
          </span>
          <h1 className="font-serif text-3xl font-semibold mt-0.5 tracking-tight">
            Bahrain <span className="italic font-normal text-bahrain-red">Passage</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-serif italic text-bronze-charcoal/70">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-bahrain-red animate-pulse" />
            <span className="font-sans text-[9px] tracking-widest uppercase font-bold text-bronze-charcoal">
              {tier === 'Wandering' ? 'Wandering Explorer' : 'Exquisite Curator'}
            </span>
          </div>

          <span className="w-1 h-1 rounded-full bg-red-500/20" />

          <span className="font-sans text-[9px] tracking-wider uppercase font-semibold text-bronze-charcoal/60">
            Stamps: {completedDays.length} / {duration}
          </span>

          <span className="w-1 h-1 rounded-full bg-red-500/20" />

          {/* Brass Sound Controls console */}
          <div className="flex items-center gap-2 bg-red-500/5 px-3 py-1 rounded-xl border border-red-500/10 shadow-sm">
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="text-xs focus:outline-none hover:scale-110 transition-transform active:scale-95 cursor-pointer"
              title={soundMuted ? "Unmute Sounds" : "Mute Sounds"}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  setSoundVolume(parseFloat(e.target.value))
                  if (soundMuted) setSoundMuted(false)
                }}
                className="w-14 h-1 rounded-lg bg-red-500/10 appearance-none cursor-pointer accent-bahrain-red brass-slider"
              />
              <span className="font-mono text-[7px] text-bahrain-red font-bold w-4 text-right">
                {Math.round(soundVolume * 100)}%
              </span>
            </div>
          </div>

          <span className="w-1 h-1 rounded-full bg-red-500/20" />

          <button
            onClick={resetChronicle}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 hover:bg-red-500/10 text-bahrain-red text-[8px] tracking-widest uppercase font-bold transition-all cursor-pointer"
          >
            Realign Ledger
          </button>
        </div>
      </header>

      {/* Outer 3D Binder Journal Container */}
      <div className="w-full max-w-6xl journal-binder-wrapper relative flex items-center justify-center">
        
        {/* Protruding Leather Index Tabs extending from the Right Side of the book */}
        <div className="absolute top-16 -right-[46px] hidden md:flex flex-col gap-3 z-40">
          {[
            { id: 'chronicles', label: 'Chronicle', emoji: '📖' },
            { id: 'cartography', label: 'Map Log', emoji: '🗺️' },
            { id: 'keepsakes', label: 'Keepsakes', emoji: '🪙' },
            { id: 'lexicon', label: 'Lexicon', emoji: '📜' }
          ].map(tab => {
            const active = activeLeaf === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleLeafSwitch(tab.id)}
                className={`leather-tab-item relative px-3 py-3 flex flex-col items-center justify-center text-white ${
                  active ? 'active' : ''
                }`}
                style={{ width: '48px', height: '68px' }}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                <span className="font-sans text-[7px] font-extrabold uppercase tracking-widest text-center mt-1 scale-90" style={{ writingMode: 'vertical-rl' }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* The Open physical book ledger double page grid */}
        <div className="relative w-full grid grid-cols-1 md:grid-cols-2 rounded-[28px] overflow-visible journal-open-book bg-[#FAF9F6] shadow-2xl min-h-[580px] md:min-h-[640px]">
          
          {/* Mobile-only horizontal tab bar */}
          <div className="flex md:hidden justify-around bg-[#FCFBF8] border-b border-red-500/10 py-3 rounded-t-[24px] px-2 w-full select-none z-40">
            {[
              { id: 'chronicles', label: 'Chronicle', emoji: '📖' },
              { id: 'cartography', label: 'Map Log', emoji: '🗺️' },
              { id: 'keepsakes', label: 'Keepsakes', emoji: '🪙' },
              { id: 'lexicon', label: 'Lexicon', emoji: '📜' }
            ].map(tab => {
              const active = activeLeaf === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => handleLeafSwitch(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-tight transition-all active:scale-95 cursor-pointer ${
                    active 
                      ? 'bg-bahrain-red text-white shadow-sm font-extrabold' 
                      : 'bg-transparent text-bronze-charcoal hover:bg-red-500/5'
                  }`}
                >
                  <span className="text-xs leading-none">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* 3D Flipping Page Leaf Overlay */}
          {flippingLeaf && (
            <div className="flipping-leaf-container">
              <div className={`flipping-leaf flip-${flippingLeaf}`} />
            </div>
          )}
          
           {/* Vertical Seam Down the exact middle of the book */}
          <div className="journal-center-spine pointer-events-none hidden md:block" />

          {/* Metallic 3D Spiral Binder Rings */}
          <div className="hidden md:block">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="absolute pointer-events-none" style={{ top: `${8 + idx * 11.5}%`, left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
                <div className="binder-ring-shadow" style={{ top: '2px' }} />
                <div className="binder-ring" />
              </div>
            ))}
          </div>

          {/* LEFT PAGE - Chronicle Text, Narrators and Textarea Reflections */}
          <div className="journal-page-left p-6 md:p-8 flex flex-col justify-between overflow-y-auto antique-scrollbar relative">
            <div className="animate-fadeIn space-y-5 text-left">
              
              {activeLeaf === 'chronicles' && (
                <>
                  {/* Chapter Select tactile buttons */}
                  <div className="flex justify-between items-center select-none pb-2 border-b border-red-500/10">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-[10px] text-bronze-charcoal font-bold">Ledger Chapters:</span>
                      {Array.from({ length: duration }, (_, idx) => {
                        const d = idx + 1
                        const active = currentDayTab === d
                        const unlocked = unlockedDays.includes(d)
                        return (
                          <button
                            key={d}
                            disabled={!unlocked}
                            onClick={() => handleDaySwitch(d)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-serif text-[10px] font-extrabold transition-all relative ${
                              !unlocked
                                ? 'bg-red-500/5 text-bronze-charcoal/40 border border-dashed border-red-500/15 cursor-not-allowed'
                                : active
                                  ? 'bg-bahrain-red text-white border border-amber-500/30 scale-105 shadow-sm font-bold'
                                  : 'bg-white border border-red-500/10 text-bronze-charcoal hover:border-red-500/35 hover:scale-102 cursor-pointer shadow-sm'
                            }`}
                          >
                            {d}
                          </button>
                        )
                      })}
                    </div>
                    <span className="font-serif text-[10px] italic text-bahrain-red font-bold">
                      {romanNumerals[currentDayTab]}
                    </span>
                  </div>

                  {/* Narrator companion clipped note */}
                  <div className="relative p-4 bg-[#FCFBF8] border border-dashed border-red-500/25 rounded-2xl shadow-sm my-2 aged-paper-gradient">
                    <div className="paper-clip-asset" />
                    <span className="font-sans text-[7px] tracking-[0.25em] text-bahrain-red uppercase font-extrabold block pl-14">
                      Historical Companion Decipher • {guides.find(g => g.id === activeGuide)?.name}
                    </span>
                    <p className="font-serif text-[11.5px] italic text-bronze-charcoal leading-relaxed mt-2 pl-14 font-bold">
                      "{activeSpot ? getGuideThoughts(activeSpot, activeGuide) : `Select a landmark below, wayfarer. Let me guide you down these ancient paths...`}"
                    </p>
                    <div className="flex gap-1.5 mt-2.5 pl-14">
                      {guides.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setActiveGuide(g.id)}
                          className={`px-2 py-0.5 rounded-md text-[7px] uppercase tracking-wider font-extrabold transition-all border ${
                            activeGuide === g.id
                              ? 'bg-bahrain-red text-white border-bahrain-red'
                              : 'bg-white border-red-500/15 text-bronze-charcoal hover:border-red-500/35'
                          }`}
                        >
                          {g.emoji} {g.name.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title & description */}
                  {activeSpot ? (
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start border-b border-red-500/5 pb-1">
                        <div>
                          <span className="font-sans text-[7px] tracking-[0.15em] text-bronze-muted/50 uppercase font-bold">
                            {activeSpot.period}
                          </span>
                          <span className="font-sans text-[7px] tracking-wider text-bahrain-red font-bold font-mono block mt-0.5">
                            {activeSpot.coords}
                          </span>
                        </div>
                        <span className="font-serif text-lg text-bahrain-red italic font-medium">
                          {activeSpot.arabic}
                        </span>
                      </div>

                      <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold tracking-tight">
                        {activeSpot.name}
                      </h3>
                      
                      <p className="font-sans text-xs text-bronze-muted leading-relaxed font-semibold">
                        {activeSpot.desc}
                      </p>

                      <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10">
                        <span className="font-sans text-[7px] tracking-widest uppercase text-bahrain-red font-bold block mb-1">
                          ✨ The Storyteller's Decipher Key
                        </span>
                        <p className="font-serif text-[11px] italic text-bronze-charcoal leading-relaxed font-bold">
                          {activeSpot.insider}
                        </p>
                      </div>

                      {/* Lined Notebook Paper reflections */}
                      <div className="p-4 rounded-xl border border-red-500/10 shadow-sm relative overflow-hidden bg-white">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold flex items-center gap-1">
                            ✍️ Wayfarer Reflexes Log
                          </span>
                          <span className="font-serif text-[7px] text-bronze-muted/55 italic font-medium select-none">
                            Lined page
                          </span>
                        </div>
                        <textarea
                          value={journalReflections[activeSpot.id] || ''}
                          onChange={(e) => {
                            saveJournalReflection(activeSpot.id, e.target.value)
                            playTypewriterClick()
                          }}
                          placeholder="Type your physical journal thoughts here... (typewriter key feedback active)"
                          rows="2.5"
                          className="w-full text-xs font-serif text-bronze-charcoal placeholder-bronze-muted/30 ruled-lines-container border-none focus:outline-none resize-none focus:ring-0 leading-6 bg-transparent"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="font-serif text-xs italic text-bronze-muted">
                        All landmarks for this chapter sealed! Flip the tab to explore next pages.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeLeaf === 'cartography' && (
                <div className="space-y-4">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Meteorological Records
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Wayfarer's Almanac
                  </h3>
                  <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold">
                    Atmospheric readings and tide charts from the Sitra harbors, Jarada disappearing sandbanks, and the Sakhir desert sand hills.
                  </p>
                  <div className="space-y-3 mt-4">
                    {almanac.metrics.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-red-500/5 bg-white shadow-sm flex flex-col justify-between stitch-border">
                        <span className="font-sans text-[8px] uppercase tracking-wider text-bronze-muted/60 font-bold">
                          {m.label}
                        </span>
                        <span className="font-serif text-base font-extrabold text-bahrain-red mt-1">
                          {m.value}
                        </span>
                        <span className="font-sans text-[8px] text-bronze-muted/50 font-semibold mt-1">
                          {m.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeLeaf === 'keepsakes' && (
                <div className="space-y-5">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Official Entry Visas
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Wayfarer's Passport
                  </h3>
                  <p className="font-sans text-[11px] text-bronze-muted leading-relaxed font-semibold">
                    Sealed border stamps are permanently marked in your passport book upon completing a day's journey.
                  </p>
                  
                  <div className={`grid gap-2.5 mt-5 ${duration > 5 ? 'grid-cols-4' : 'grid-cols-2'}`}>
                    {Array.from({ length: duration }, (_, idx) => {
                      const d = idx + 1
                      const completed = completedDays.includes(d)
                      return (
                        <div key={d} className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 relative overflow-hidden bg-white shadow-sm ${completed ? 'border-bahrain-red/60 text-bahrain-red' : 'border-pearl-border/80 text-bronze-muted/20'}`}>
                          {completed ? (
                            <div className="w-full h-full border-2 border-double border-bahrain-red/60 rounded-full flex flex-col items-center justify-center rotate-6 text-bahrain-red p-1">
                              <span className="font-serif text-[5.5px] tracking-widest uppercase font-extrabold">Authenticated</span>
                              <span className="font-serif text-[4.5px] tracking-wider uppercase font-bold mt-0.5">Day {d} Entry</span>
                              <span className="font-mono text-[4px] text-bronze-charcoal mt-0.5">Sealed</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-base">🔒</span>
                              <span className="font-serif text-[8px] uppercase tracking-wider text-bronze-muted/50 mt-1 font-bold">Day {d} Stamp</span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* CAPTURED ALBUM SNAPSHOTS POSTCARDS GALLERY WITH 3D CARD SWIPE CAROUSEL */}
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold block mt-4 border-t border-red-500/10 pt-4">
                    📷 Captured Album Snapshots
                  </span>
                  <Carousel_002 
                    images={(() => {
                      const userSnaps = spotsCatalog
                        .map(spot => {
                          const photo = capturedPhotos[spot.id]
                          if (photo) {
                            return {
                              src: photo,
                              alt: spot.name
                            }
                          }
                          return null
                        })
                        .filter(Boolean);
                      
                      if (userSnaps.length > 0) return userSnaps;

                      // Elegant curated showcase travel snaps so the carousel works immediately!
                      return [
                        { 
                          src: 'https://images.unsplash.com/photo-1629814406259-2187f8a70a8d?q=80&w=600&auto=format&fit=crop', 
                          alt: 'Showcase Snap: Bab Al Bahrain' 
                        },
                        { 
                          src: 'https://images.unsplash.com/photo-1596422846543-75c6fc18a523?q=80&w=600&auto=format&fit=crop', 
                          alt: 'Showcase Snap: Al Fateh Grand Mosque' 
                        },
                        { 
                          src: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=600&auto=format&fit=crop', 
                          alt: 'Showcase Snap: Qal\'at al-Bahrain (Bahrain Fort)' 
                        }
                      ];
                    })()}
                    showPagination={true}
                    showNavigation={true}
                    loop={true}
                    autoplay={true}
                    spaceBetween={40}
                  />
                </div>
              )}

              {activeLeaf === 'lexicon' && (
                <div className="space-y-4">
                  <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                    Bilingual Glossary Keys
                  </span>
                  <h3 className="font-serif text-2xl text-bronze-charcoal font-semibold mt-1">
                    Wayfarer's Lexicon
                  </h3>
                  <p className="font-sans text-xs text-bronze-muted leading-relaxed font-semibold">
                    Click any word card to practice native Bahraini pronunciation and pluck the corresponding Oud acoustic scale.
                  </p>
                  <div className="grid grid-cols-1 gap-3 mt-4 max-h-[360px] overflow-y-auto antique-scrollbar pr-1">
                    {[
                      { word: "كَرَتْ", label: "Karak", arabic: "كَرَتْ", desc: "Bahrain's signature robust spiced condensed-milk tea.", pitchOffset: 0 },
                      { word: "حَلْوَى", label: "Halwa", arabic: "حَلْوَى", desc: "Saffron sweet jelly cooked in copper vats with almonds.", pitchOffset: 35 },
                      { word: "سُوقْ", label: "Souq", arabic: "سُوقْ", desc: "Ancient maze-like merchant alleyways of Old Manama.", pitchOffset: -15 },
                      { word: "دَلَّهْ", label: "Dallah", arabic: "دَلَّهْ", desc: "Long-beaked brass coffee pot used to brew Arabic coffee.", pitchOffset: 60 }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => playGlossarySound(item.word, item.pitchOffset)}
                        className="p-3 rounded-xl border border-red-500/10 bg-white hover:border-bahrain-red text-left cursor-pointer transition-all active:scale-98 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-serif text-[11px] font-bold text-bronze-charcoal">{item.label} <span className="italic text-bahrain-red font-medium">({item.arabic})</span></h5>
                          <p className="font-sans text-[9px] text-bronze-muted mt-0.5 leading-relaxed font-semibold">{item.desc}</p>
                        </div>
                        <span className="text-[9px] text-bahrain-red/60 hover:text-bahrain-red shrink-0 ml-2">🔊 Pluck</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Turn Page Step Navigation at the bottom of the Left Page */}
            {activeLeaf === 'chronicles' && hasSpots && (
              <div className="flex justify-between items-center pt-4 border-t border-red-500/10 mt-6 select-none">
                <span className="font-sans text-[9px] tracking-wider uppercase text-bronze-muted/60 font-bold">
                  Page {currentSpotIndex + 1} of {totalSteps}
                </span>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalSteps }, (_, idx) => (
                    <button
                      key={idx}
                      onClick={() => triggerPageTurnAnimation(() => setCurrentSpotIndex(idx), idx > currentSpotIndex ? 'right' : 'left')}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${
                        currentSpotIndex === idx ? 'bg-bahrain-red scale-110' : 'bg-red-500/15'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={currentSpotIndex === 0}
                    onClick={handlePrevStep}
                    className="px-3 py-1 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-extrabold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    disabled={currentSpotIndex === totalSteps - 1}
                    onClick={handleNextStep}
                    className="px-3 py-1 rounded-lg border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 text-[9px] uppercase tracking-widest font-extrabold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PAGE - Polaroid Photos, Keepsake drawer cabinet, Maps, and dynamic Itinerary check-lists */}
          <div className="journal-page-right p-6 md:p-8 flex flex-col justify-between items-center overflow-y-auto antique-scrollbar relative">
            <div className="animate-fadeIn w-full flex flex-col items-center justify-center flex-1">
              
              {activeLeaf === 'chronicles' && (
                isSealStep ? (
                  /* Custom Sealing Modal Frame */
                  <div className="w-full flex flex-col items-center justify-center text-center p-6 bg-white border border-dashed border-red-500/25 max-w-[310px] shadow-sm rounded-2xl animate-scaleIn relative overflow-hidden select-none my-auto">
                    
                    {stamping && (
                      <div className="absolute inset-0 z-40 bg-white/80 flex items-center justify-center pointer-events-none">
                        <div className="w-32 h-32 border-4 border-double border-bahrain-red/80 rounded-full flex flex-col items-center justify-center rotate-6 text-bahrain-red shadow-lg bg-pearl-white animate-scaleIn">
                          <span className="font-serif text-[9px] tracking-widest uppercase font-extrabold">Authenticated</span>
                          <span className="font-serif text-[7px] tracking-wider uppercase font-bold mt-1">Day {currentDayTab} Entry</span>
                          <span className="font-mono text-[5px] text-bronze-charcoal mt-1">Day {currentDayTab} sealed</span>
                        </div>
                      </div>
                    )}

                    {!isDayCompleted ? (
                      <div className="relative z-10 flex flex-col items-center space-y-3">
                        <div className="w-16 h-16 border-2 border-dashed border-red-500/20 rounded-full flex items-center justify-center text-red-500/35 mb-2 select-none">
                          🔒
                        </div>
                        <span className="font-sans text-[7px] tracking-[0.2em] text-bahrain-red uppercase font-bold block select-none">
                          Passage Sealing Verification
                        </span>
                        <h4 className="font-serif text-lg text-bronze-charcoal font-semibold">
                          Seal Day {currentDayTab}'s Passage
                        </h4>
                        <p className="font-sans text-[10px] text-bronze-muted leading-relaxed font-semibold">
                          You have explored all landmarks for this daily chapter. Imprint your official border stamp to seal the path and lock in the Insider reward.
                        </p>
                        
                        <button
                          onClick={handleSealDay}
                          className="px-6 py-2.5 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-[9px] uppercase tracking-widest font-extrabold transition-all shadow-md cursor-pointer"
                        >
                          Authenticate Stamp
                        </button>
                      </div>
                    ) : (
                      <div className="relative z-10 text-left flex flex-col justify-center items-center space-y-3 w-full">
                        <span className="font-sans text-[8px] tracking-widest text-green-700 font-extrabold select-none">
                          ✓ Day {currentDayTab} Passkey Active
                        </span>
                        <h5 className="font-serif text-[13px] font-bold text-bronze-charcoal text-center">
                          Traditional Insider Passkey:
                        </h5>
                        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center w-full">
                          <p className="font-serif text-[11px] italic text-bronze-charcoal leading-relaxed font-bold">
                            {currentDayTab === 1 && 'Insider Key: Place your right hand over your heart, greet a local merchant, and say "Chay Karak, bil-hail" (translates to "Cardamom Karak tea, please") for traditional warmth and a genuine smile.'}
                            {currentDayTab === 2 && 'Insider Key: At a local potter workshop, ask for fresh "Khubz Tannour" flatbread—it is baked in traditional red clay ovens and gifted with sesame toppings.'}
                            {currentDayTab === 3 && 'Insider Key: Ask the harbor skipper for the "Jarada tidal window"—it is the exact 3-hour low-tide peak when the sand is purest white and wild pearl oysters wash ashore.'}
                            {currentDayTab === 4 && 'Insider Key: Stand on the eastern lee side of the ancient Tree of Life at sunset; local desert nomads listen for a low whistle they attribute to water spirits.'}
                            {currentDayTab === 5 && 'Insider Key: Traditional respect in the Kingdom is simple: place your right hand over your heart and say "Salam Alaykum" (Peace be upon you) when starting any conversation.'}
                          </p>
                        </div>
                        <div className="w-24 h-24 border-4 border-double border-bahrain-red/70 rounded-full flex flex-col items-center justify-center rotate-12 text-bahrain-red bg-pearl-white/40 shrink-0 select-none shadow-sm mt-3">
                          <span className="font-serif text-[7px] tracking-widest uppercase font-bold">Authenticated</span>
                          <span className="font-serif text-[5px] tracking-wider uppercase font-bold mt-0.5">Bahrain Entry</span>
                          <span className="font-serif text-[4px] text-bronze-charcoal mt-0.5">Passage sealed</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  activeSpot && (
                    <div className="flex flex-col items-center justify-between w-full space-y-6 flex-1 py-2">
                      
                      {/* Polaroid Photo Frame */}
                      <div className="relative bg-white p-3.5 pb-10 shadow-xl border border-red-500/5 rotate-[-1.5deg] hover:rotate-[1deg] transition-all duration-700 w-full max-w-[240px] shrink-0">
                        {/* Taped top effect */}
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/40 backdrop-blur-[1px] border border-white/20 shadow-sm rotate-[-3deg] z-10 pointer-events-none" />
                        
                        {/* Keepsake sticker */}
                        {hasKeepsake(activeSpot.id) && (
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-600/40 flex items-center justify-center rotate-12 text-amber-600 shadow-sm z-30 font-serif font-extrabold text-[12px] pointer-events-none select-none">
                            ★
                          </div>
                        )}

                        <div className="w-full h-44 overflow-hidden relative border border-red-500/5 bg-bahrain-dark flex items-center justify-center rounded-sm">
                           {/* Vintage Airmail Postcard Background under photo */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#FCFBF8] border-8 border-double border-bahrain-red/20 text-center select-none z-0 relative">
                            {/* Airmail red & white diagonal striped border */}
                            <div className="absolute inset-0 border-4 border-transparent" style={{
                              backgroundImage: 'repeating-linear-gradient(45deg, #D11A38, #D11A38 8px, #FFFFFF 8px, #FFFFFF 16px, #4B85C4 16px, #4B85C4 24px, #FFFFFF 24px, #FFFFFF 32px)',
                              opacity: 0.15,
                              pointerEvents: 'none'
                            }} />
                            <div className="z-10 flex flex-col items-center space-y-1">
                              <span className="text-3xl animate-pulse">📮</span>
                              <span className="font-serif text-[10px] text-bahrain-red font-bold tracking-wider uppercase">BAHRAIN POST</span>
                              <span className="font-serif text-[11px] text-bronze-charcoal/80 font-medium italic mt-0.5 max-w-[160px] truncate">{activeSpot.name}</span>
                              <span className="font-serif text-[10px] text-bahrain-red/90 font-bold mt-0.5">{activeSpot.arabic}</span>
                              <span className="font-sans text-[7px] text-bronze-muted/60 uppercase tracking-widest font-semibold mt-1">Official Chronicle Card</span>
                            </div>
                          </div>
                          
                          <img
                            src={capturedPhotos[activeSpot.id] || activeSpot.image}
                            alt={activeSpot.name}
                            className="w-full h-full object-cover block relative z-10"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>

                        {capturedPhotos[activeSpot.id] && (
                          <div className="postmark-stamp scale-75 -bottom-2 -right-3">
                            <span className="font-serif text-[6px] tracking-widest text-bahrain-red block uppercase font-extrabold">Sealed</span>
                            <span className="font-serif text-[5px] text-bahrain-red/60 uppercase block font-bold mt-0.5">MANAMA</span>
                            <span className="font-mono text-[4px] text-bahrain-red/80 block uppercase font-bold mt-0.5">25.05.2026</span>
                          </div>
                        )}

                        <div className="absolute bottom-2.5 left-4 right-4 text-left">
                          <span className="font-serif text-[10px] text-bronze-charcoal/80 font-bold tracking-tight truncate block">{activeSpot.name}</span>
                          <span className="font-sans text-[6px] text-bronze-muted/50 tracking-wider uppercase font-semibold block mt-0.5">Scrapbook postcard • 2026</span>
                        </div>
                      </div>

                      {/* Tactile Polaroid capture shutter button */}
                      <button
                        onClick={() => setActiveScanSpot(activeSpot)}
                        className={`px-6 py-2 rounded-xl text-[9px] tracking-widest uppercase font-bold transition-all cursor-pointer shadow-md ${
                          capturedPhotos[activeSpot.id]
                            ? 'bg-green-600 hover:bg-green-700 text-white border border-green-600'
                            : 'bg-bahrain-red hover:bg-bahrain-dark text-white border border-bahrain-red'
                        }`}
                      >
                        {capturedPhotos[activeSpot.id] ? '📷 Re-Focus & Re-Shoot' : '📷 Capture Lens Stamp'}
                      </button>

                      {/* Desktop space fill: Beautiful handwritten Day Itinerary checklist card */}
                      <div className="w-full max-w-[320px] p-4.5 rounded-2xl border border-amber-600/35 bg-[#FCFBF8] shadow-sm text-left select-none relative overflow-hidden stitch-border shrink-0 my-2">
                        <div className="paper-clip-asset" style={{ right: '20px', left: 'auto' }} />
                        <span className="font-sans text-[7.5px] tracking-widest text-bahrain-red uppercase font-extrabold block mb-2">
                          📖 Day {currentDayTab} Travel Itinerary
                        </span>
                        
                        <div className="space-y-2 mt-1">
                          {activeSpots.map((spot, idx) => {
                            const isSelected = activeSpot && activeSpot.id === spot.id
                            const scanned = hasKeepsake(spot.id)
                            return (
                              <button
                                key={spot.id}
                                onClick={() => triggerPageTurnAnimation(() => setCurrentSpotIndex(idx), idx > currentSpotIndex ? 'right' : 'left')}
                                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all ${
                                  isSelected 
                                    ? 'bg-white border-bahrain-red shadow-sm font-bold scale-[1.01]' 
                                    : 'bg-transparent border-transparent hover:border-red-500/10'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {scanned ? (
                                    <span className="text-green-600 text-xs shrink-0 font-bold">✓</span>
                                  ) : (
                                    <span className="w-2.5 h-2.5 rounded-full border border-red-500/25 shrink-0 flex items-center justify-center font-sans text-[6px] font-bold text-red-500">
                                      {idx + 1}
                                    </span>
                                  )}
                                  <span className="font-serif text-[10px] text-bronze-charcoal truncate">
                                    {spot.name}
                                  </span>
                                </div>
                                <span className="font-mono text-[7px] text-bronze-muted/40 tracking-wider">
                                  {spot.coords.split(',')[0]}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                    </div>
                  )
                )
              )}

              {activeLeaf === 'cartography' && (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-[270px] aged-paper-gradient border border-dashed border-red-500/25 rounded-2xl shadow-sm my-auto">
                  <span className="text-4xl mb-3 animate-pulse">🗺️</span>
                  <span className="font-sans text-[7.5px] tracking-[0.25em] text-bahrain-red uppercase font-extrabold block mb-1">
                    Cartography Log
                  </span>
                  <p className="font-serif text-[11px] italic text-bronze-muted leading-relaxed font-bold">
                    "The grand geographical chart is unrolled across your wooden desk. Roll it up when finished to resume your ledger."
                  </p>
                </div>
              )}

              {activeLeaf === 'keepsakes' && (
                <div className="w-full max-w-[350px] flex flex-col items-center space-y-4">
                  <span className="font-sans text-[7px] tracking-[0.2em] text-amber-600 uppercase font-extrabold">
                    Interactive Keepsake Cabinet
                  </span>
                  
                  {/* Velvet Lined Drawer cabinet grid */}
                  <div className="velvet-drawer p-5 rounded-2xl shadow-xl w-full">
                    <div className="grid grid-cols-4 gap-2.5 relative z-10">
                      {spotsCatalog.map(spot => {
                        const unlocked = collectedKeepsakes.includes(spot.id)
                        return (
                          <button
                            key={spot.id}
                            disabled={!unlocked}
                            onClick={() => setSelectedKeepsake(spot)}
                            className={`aspect-square rounded-full flex items-center justify-center transition-all duration-300 relative border ${
                              unlocked
                                ? 'brass-coin-frame cursor-pointer hover:scale-105 active:scale-95'
                                : 'bg-black/40 border-transparent opacity-20 cursor-not-allowed'
                            }`}
                          >
                            <span className="text-base">{unlocked ? spot.keepsakeEmoji : '🔒'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {collectedKeepsakes.length === 0 && (
                    <p className="font-serif text-[10px] italic text-white/50 text-center leading-relaxed">
                      Cabinet empty. Point the Capture Lens at active chronicle spots and click Shutter to unlock traditional souvenirs!
                    </p>
                  )}

                  {/* Coin Relic handwritten card */}
                  {selectedKeepsake && (
                    <div className="p-4 rounded-xl bg-white border border-amber-600/40 text-left relative animate-scaleIn w-full">
                      <button 
                        onClick={() => setSelectedKeepsake(null)}
                        className="absolute top-2 right-2 text-[9px] text-bronze-muted/60 hover:text-bahrain-red cursor-pointer"
                      >
                        ✕ Close
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl p-1.5 rounded-lg bg-[#FAF9F6] border border-amber-600/20 shadow-sm">
                          {selectedKeepsake.keepsakeEmoji}
                        </span>
                        <div>
                          <span className="font-sans text-[7px] tracking-wider text-bahrain-red uppercase font-bold block">{selectedKeepsake.period}</span>
                          <h5 className="font-serif text-[12px] font-bold text-bronze-charcoal leading-none mt-0.5">{selectedKeepsake.keepsakeName}</h5>
                        </div>
                      </div>
                      <p className="font-serif text-[10px] italic text-bronze-charcoal leading-relaxed border-t border-red-500/5 pt-2 font-semibold">
                        {selectedKeepsake.keepsakeDesc}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeLeaf === 'lexicon' && (
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-[270px]">
                  {/* Embossed Compass Rose decoration */}
                  <svg viewBox="0 0 100 100" className="w-36 h-36 text-bahrain-red/10 mb-4 stroke-current" fill="none" strokeWidth="0.5">
                    <circle cx="50" cy="50" r="42" strokeDasharray="3,4" />
                    <circle cx="50" cy="50" r="18" />
                    <path d="M 50,2 L 50,98 M 2,50 L 98,50" />
                    <path d="M 50,50 L 46,20 L 50,5 L 54,20 Z" fill="rgba(209,26,56,0.03)" />
                    <path d="M 50,50 L 80,46 L 95,50 L 80,54 Z" fill="rgba(209,26,56,0.01)" />
                    <path d="M 50,50 L 46,80 L 50,95 L 54,80 Z" fill="rgba(209,26,56,0.01)" />
                    <path d="M 50,50 L 20,46 L 5,50 L 20,54 Z" fill="rgba(209,26,56,0.01)" />
                    <circle cx="50" cy="50" r="3" className="fill-current" />
                  </svg>
                  <span className="font-sans text-[7px] tracking-[0.25em] text-bahrain-red uppercase font-extrabold block mb-1">
                    Bilingual Keys
                  </span>
                  <p className="font-serif text-[11px] italic text-bronze-muted leading-relaxed">
                    "Language is the key to local hospitality. Practice these traditional greetings in Old Manama Souqs."
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Retro Footnote */}
      <footer className="wood-desk-footer w-full max-w-6xl pt-6 pb-2 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left select-none text-bronze-charcoal/50 z-10">
        <span className="font-sans text-[8px] tracking-wider uppercase font-semibold">
          Bahrain Tourism & Wayfarer Chronicle © 2026
        </span>
        <span className="font-sans text-[8px] tracking-widest text-bahrain-red/60 uppercase font-extrabold">
          National Red & White Pearl Archives
        </span>
      </footer>

      {activeLeaf === 'cartography' && (
        <WayfarerMap locations={locations} />
      )}

      {activeScanSpot && (
        <WayfarerLens 
          spot={activeScanSpot} 
          onClose={() => setActiveScanSpot(null)} 
        />
      )}
    </div>
  )
}
