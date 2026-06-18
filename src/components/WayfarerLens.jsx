import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useVibe } from '../hooks/useVibe'
import { fetchSpotStory } from '../services/itinerary-service'

export default function WayfarerLens({ spot, onClose }) {
  const { 
    selectedMoods, 
    tier, 
    saveCapturedPhoto, 
    saveLensStory, 
    lensStories, 
    activeGuide, 
    unlockKeepsake,
    capturedPhotos = {}
  } = useVibe()
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const lensRef = useRef(null)
  const ringRef = useRef(null)
  const flashRef = useRef(null)

  const [permission, setPermission] = useState('pending')
  const [capturing, setCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [storyLoading, setStoryLoading] = useState(false)
  
  // High-fidelity Optics Scanner states
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLog, setScanLog] = useState('Standby for snapshot alignment...')
  const [photoRank, setPhotoRank] = useState('')

  useEffect(() => {
    let active = true

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        if (active) {
          streamRef.current = stream
          setPermission('granted')
        }
      } catch {
        if (active) {
          setPermission('denied')
        }
      }
    }

    startCamera()

    return () => {
      active = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Callback ref: attaches stream to video element as soon as it mounts into DOM.
  // Avoids the invalid useEffect dependency on videoRef.current.
  const videoCallbackRef = (element) => {
    videoRef.current = element
    if (element && streamRef.current) {
      element.srcObject = streamRef.current
    }
  }

  useGSAP(() => {
    if (captured) return

    gsap.fromTo(ringRef.current,
      { rotate: 0 },
      { rotate: 360, duration: 25, repeat: -1, ease: 'none' }
    )
  }, [captured])

  const playScanBeep = (freq = 800, duration = 0.08) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const audioCtx = new AudioContext()
      const osc = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration - 0.01)
      
      osc.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc.start()
      osc.stop(audioCtx.currentTime + duration)
    } catch { /* ignore */ }
  }

  const handleCapture = async () => {
    if (capturing || scanning) return
    setCapturing(true)

    // Play physical camera shutter sound
    try {
      const shutterSfx = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav')
      shutterSfx.volume = 0.25
      shutterSfx.play().catch(() => {})
    } catch { /* ignore */ }

    // Play physical camera flash animation
    gsap.fromTo(flashRef.current,
      { opacity: 0 },
      { 
        opacity: 1, 
        duration: 0.1, 
        yoyo: true, 
        repeat: 1, 
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(flashRef.current, { opacity: 0 })
        }
      }
    )

    // Capture physical video matrix via canvas
    let capturedDataUrl = null
    try {
      if (permission === 'granted' && videoRef.current && videoRef.current.readyState >= 2) {
        const canvas = document.createElement('canvas')
        const w = videoRef.current.videoWidth || 640
        const h = videoRef.current.videoHeight || 480
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        
        // Apply a gorgeous premium retro sepia/contrast polaroid photo filter directly in canvas
        ctx.filter = 'sepia(0.3) contrast(1.15) brightness(0.95)'
        ctx.drawImage(videoRef.current, 0, 0, w, h)
        capturedDataUrl = canvas.toDataURL('image/jpeg')
      }
    } catch (e) {
      console.error('Failed to parse camera stream:', e)
    }

    // Fallback: If camera blocked or warming up, take a stylized polaroid postcard of the default spot!
    if (!capturedDataUrl) {
      capturedDataUrl = spot.image
    }

    // Launch High-Fidelity Scanning simulation
    setScanning(true)
    setScanProgress(0)
    setScanLog('INITIALIZING...')
    
    // Choose random premium rank
    const ranks = [
      'ARCHIVIST RANK (GOLD STAMP)',
      'EXPERT PICK (SEAL)',
      'LOCAL STORYTELLER PICK (LEGACY)',
      'HIGH-FIDELITY ALIGNMENT (AESTHETIC)'
    ]
    const chosenRank = ranks[Math.floor(Math.random() * ranks.length)]
    setPhotoRank(chosenRank)

    // Scanning intervals over 2.4 seconds
    let progress = 0
    const scanInterval = setInterval(() => {
      progress += 10
      setScanProgress(progress)
      
      // Play cool scanner beep ticks
      playScanBeep(700 + progress * 3.5, 0.05)

      if (progress === 10) {
        setScanLog('ALIGNING SCAN PARAMETERS...')
      } else if (progress === 35) {
        setScanLog('MEASURING CONTRAST & DEPTH...')
      } else if (progress === 60) {
        setScanLog('PROCESSING PHOTOGRAMMETRY...')
      } else if (progress === 85) {
        setScanLog('FINALIZING ARCHIVE ENTRY...')
      } else if (progress >= 100) {
        clearInterval(scanInterval)
        
        // Save and compile story
        saveCapturedPhoto(spot.id, capturedDataUrl)
        setScanning(false)
        setStoryLoading(true)
        
        // Fetch dynamic real-time local storyteller decipher
        fetchSpotStory(spot, selectedMoods, tier, activeGuide).then(storyText => {
          if (storyText) {
            saveLensStory(spot.id, storyText)
          }
          unlockKeepsake(spot.id)
          setStoryLoading(false)
          setCapturing(false)
          setCaptured(true)
        }).catch(() => {
          setStoryLoading(false)
          setCapturing(false)
          setCaptured(true)
        })
      }
    }, 240)
  }


  return (
    <div 
      ref={lensRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none backdrop-blur-sm"
    >
      {/* Visual Shutter Flash overlay */}
      <div 
        ref={flashRef}
        className="fixed inset-0 bg-white z-50 opacity-0 pointer-events-none" 
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-pearl-bg border border-red-500/10 flex flex-col justify-between p-6 shadow-2xl overflow-hidden min-h-[500px]">
        
        {/* Viewfinder Header */}
        <div className="flex justify-between items-center pb-4 border-b border-red-500/10">
          <div className="flex flex-col text-left">
            <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
              Camera
            </span>
            <span className="font-serif text-lg text-bronze-charcoal font-semibold mt-0.5">
              {captured ? 'Photo Saved' : 'Camera Ready'}
            </span>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-pearl-border border border-red-500/10 text-bronze-charcoal hover:bg-red-500/5 cursor-pointer transition-all text-xs"
          >
            ✕
          </button>
        </div>

        {/* Viewport Box */}
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          {scanning ? (
            /* Premium active optics scanning HUD view */
            <div className="w-full max-w-sm p-6 rounded-2xl border border-amber-600/40 bg-[#f4f1e8] text-center select-none shadow-[0_4px_25px_rgba(184,134,11,0.18)] relative overflow-hidden animate-pulse">
              {/* Scanning gold coordinates overlay flanking brackets */}
              <div className="absolute top-4 left-4 font-mono text-[9px] text-amber-800 font-bold">
                [ {spot.coords.split(',')[0] || '26.2285° N'} ]
              </div>
              <div className="absolute top-4 right-4 font-mono text-[9px] text-amber-800 font-bold">
                [ {spot.coords.split(',')[1]?.trim() || '50.5198° E'} ]
              </div>

              {/* Glowing circular reticle with gold sweep bar */}
              <div className="relative w-44 h-44 mx-auto rounded-full border-2 border-dashed border-amber-600/60 flex items-center justify-center bg-white/75 shadow-[inset_0_0_20px_rgba(217,119,6,0.1)] my-5 overflow-hidden">
                {/* Horizontal scanning sweep bar */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-amber-600 shadow-[0_0_10px_#d97706] opacity-80"
                  style={{
                    top: `${scanProgress}%`,
                    transition: 'top 0.1s linear'
                  }}
                />
                
                {/* Crosshairs */}
                <div className="absolute w-6 h-px bg-amber-600/60" />
                <div className="absolute h-6 w-px bg-amber-600/60" />

                {/* Progress Circle Spinner */}
                <svg className="absolute w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(217,119,6,0.1)"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#b8860b"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 * (1 - scanProgress / 100)}
                    style={{ transition: 'stroke-dashoffset 0.15s ease' }}
                  />
                </svg>

                <span className="font-mono text-xl font-bold text-amber-800 z-10">
                  {scanProgress}%
                </span>
              </div>

              {/* Scrolling status log text */}
              <div className="mt-4 bg-white/95 border border-amber-600/20 p-3 rounded-xl min-h-[60px] flex items-center justify-center">
                <p className="font-mono text-[9px] text-amber-900 uppercase tracking-widest leading-relaxed font-bold">
                  {scanLog}
                </p>
              </div>

              <span className="font-sans text-[7px] tracking-[0.25em] text-amber-800/60 uppercase block mt-3.5 font-bold">
                Do Not Move Device · Aligning Strata
              </span>
            </div>
          ) : !captured ? (
            <div className="flex flex-col items-center w-full">
              
              {/* Retro Camera Reticle Round Frame */}
              <div className="relative w-64 h-64 rounded-full border-4 border-amber-600/40 overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.55),_inset_0_0_16px_rgba(0,0,0,0.85)] mb-6 bg-zinc-950 flex items-center justify-center">
                
                <div className="absolute inset-0 z-0">
                  {permission === 'granted' ? (
                    <video 
                      ref={videoCallbackRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    /* High-fidelity mock viewfinder if permission denied */
                    <div className="w-full h-full relative bg-bahrain-dark flex items-center justify-center">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-bahrain-dark to-bahrain-dark/95 text-center select-none z-0">
                        <span className="font-serif text-sm text-pearl-bg/85 font-medium italic tracking-wider z-10 truncate max-w-full px-2">
                          {spot.name}
                        </span>
                        <span className="font-serif text-xs text-amber-500/80 mt-1 z-10 font-bold">
                          {spot.arabic}
                        </span>
                        <span className="font-sans text-[6px] text-pearl-bg/35 tracking-[0.2em] uppercase mt-2.5 z-10">
                          Optical Scanner Port
                        </span>
                      </div>
                      <img 
                        src={spot.image} 
                        alt="mock camera view" 
                        className="w-full h-full object-cover opacity-60 filter grayscale-[20%] relative z-10"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-red-950/20 z-20" />
                      <div className="absolute inset-0 border border-dashed border-red-500/30 rounded-full scale-[0.85] z-25 pointer-events-none" />
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-[6px] tracking-widest text-white bg-black/70 px-2 py-0.5 rounded uppercase z-30 font-bold">
                        Simulating Reticle
                      </span>
                    </div>
                  )}
                </div>

                {/* Rotating Focus rings */}
                <div 
                  ref={ringRef}
                  className="absolute inset-0 z-10 border border-dashed border-red-500/35 rounded-full scale-95" 
                />

                <div className="absolute inset-0 z-10 pointer-events-none border-[12px] border-amber-800/10 rounded-full" />
                
                {/* Viewfinder crosshair */}
                <div className="absolute z-20 w-3 h-3 border-l border-t border-red-500/60 top-1/2 left-1/2 -translate-x-3 -translate-y-3" />
                <div className="absolute z-20 w-3 h-3 border-r border-t border-red-500/60 top-1/2 left-1/2 translate-x-1 -translate-y-3" />
                <div className="absolute z-20 w-3 h-3 border-l border-b border-red-500/60 top-1/2 left-1/2 -translate-x-3 translate-y-1" />
                <div className="absolute z-20 w-3 h-3 border-r border-b border-red-500/60 top-1/2 left-1/2 translate-x-1 translate-y-1" />
              </div>

              {/* Viewport instruction text */}
              <div className="flex flex-col items-center gap-1.5 max-w-xs text-center select-none">
                <span className="font-sans text-[9px] tracking-[0.25em] text-bahrain-red uppercase font-bold">
                  {permission === 'granted' ? 'Lens Aligned' : 'Simulating Reticle'}
                </span>
                <p className="font-sans text-[10px] text-bronze-muted leading-relaxed">
                  Point at the landmark's horizon and snap a physical Polaroid picture for your scrapbook.
                </p>
              </div>

            </div>
          ) : (
            /* Scrapbook Capture Detail */
            <div className="w-full max-w-sm p-5 rounded-2xl glass-panel-heavy border-bahrain-red relative text-left animate-scaleIn">
              
              {/* Dynamic Scrapbook envelope effect */}
              <div className="absolute top-4 right-4 w-14 h-14 border border-dashed border-bahrain-red/35 rounded-full flex flex-col items-center justify-center -rotate-12 select-none pointer-events-none">
                <span className="font-serif text-[6px] tracking-widest text-bahrain-red uppercase font-bold">Sealed</span>
                <span className="font-serif text-[5px] text-bronze-charcoal mt-0.5">Customs</span>
              </div>

              <span className="font-sans text-[8px] tracking-widest text-bahrain-red uppercase font-bold block mb-1">
                Scrapbook Entry Added
              </span>
              <h4 className="font-serif text-2xl text-bronze-charcoal font-semibold mb-3">
                {spot.name}
              </h4>

              {/* Polaroid chemical noise and gradual color bleed visual */}
              <div className="w-full h-36 rounded-xl overflow-hidden relative border-4 border-white shadow-md bg-zinc-900 mb-4 flex items-center justify-center">
                <img 
                  src={capturedPhotos[spot.id] || spot.image} 
                  alt={spot.name} 
                  className="w-full h-full object-cover jn-photo-developing"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="absolute bottom-1 right-2 border border-white/45 rounded-full w-8 h-8 rotate-12 flex flex-col items-center justify-center text-white/50 text-[3.5px] font-serif leading-none font-bold select-none pointer-events-none">
                  <span>SEALED</span>
                </div>
              </div>

              {/* Photo Clarity Rank badge */}
              {photoRank && (
                <div className="mb-3 px-3 py-1.5 rounded-xl border border-amber-600/30 bg-amber-500/5 flex items-center justify-between">
                  <span className="font-sans text-[8px] uppercase tracking-wider text-amber-600 font-extrabold">
                    Optics Rank
                  </span>
                  <span className="font-sans text-[8px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded truncate max-w-[200px]">
                    {photoRank}
                  </span>
                </div>
              )}

              {/* Gold Fils and XP stipend reward banner */}
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-emerald-800 font-sans text-[9px] font-bold">
                <span>Reward:</span>
                <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-900">
                  +250 Fils & +30 XP Added!
                </span>
              </div>
              
              {/* Polaroid Decipher description */}
              <div className="p-4 rounded-xl bg-pearl-bg border border-red-500/5 mb-4 relative">
                {storyLoading ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-6 h-6 border-2 border-red-500/10 border-t-bahrain-red rounded-full animate-spin" />
                    <span className="font-serif text-[10px] italic text-bronze-muted">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <p className="font-serif text-xs italic text-bronze-charcoal leading-relaxed">
                    {lensStories[spot.id] || "We have logged this landmark into your physical scrapbook with a live postcard snap. Review the secret local tips on your main logbook."}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-red-500/10 pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-sans text-[8px] tracking-widest uppercase text-bronze-muted/60 font-bold">
                    Coordinates:
                  </span>
                  <span className="font-mono text-[8px] font-bold text-bahrain-red">
                    {spot.coords}
                  </span>
                </div>
                
                <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold">
                  Bahrain Passage
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Viewfinder Shutter Footer */}
        <div className="w-full flex flex-col items-center gap-4 border-t border-red-500/10 pt-4">
          {!captured ? (
            <div className="flex flex-col items-center">
              {/* Massive Retro Shutter Button */}
              <button
                onClick={handleCapture}
                disabled={capturing || scanning}
                className="w-16 h-16 rounded-full border-4 border-white bg-bahrain-red hover:bg-bahrain-dark transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center relative outline-none disabled:opacity-50"
              >
                <div className="absolute inset-1 rounded-full border border-white/20" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-sans">
                  {scanning ? '...' : 'Snap'}
                </span>
              </button>
              <span className="font-sans text-[8px] tracking-widest text-bronze-muted/50 uppercase mt-2">
                {scanning ? 'Analysing Photo Strata...' : 'Press Shutter to Capture'}
              </span>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-xs uppercase tracking-widest font-bold transition-all shadow-md cursor-pointer w-full"
            >
              Done
            </button>
          )}

          <div className="w-full flex justify-between items-center text-center mt-2 border-t border-red-500/5 pt-3">
            <span className="font-sans text-[8px] tracking-wider text-bronze-muted/60 uppercase">
              {captured ? 'Postcard Printed' : 'Viewfinder Ready'}
            </span>
            <span className="font-sans text-[8px] tracking-widest text-bahrain-red uppercase font-bold">
              Journal Archives
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}
