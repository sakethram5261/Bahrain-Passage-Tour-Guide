import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useVibe } from '../hooks/useVibe'
import { fetchAISpotStory } from '../services/openrouter'

export default function WayfarerLens({ spot, onClose }) {
  const { 
    selectedMoods, 
    tier, 
    saveCapturedPhoto, 
    saveLensStory, 
    lensStories, 
    activeGuide, 
    unlockKeepsake 
  } = useVibe()
  
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const lensRef = useRef(null)
  const ringRef = useRef(null)
  const flashRef = useRef(null)

  const [permission, setPermission] = useState('pending')
  const [capturing, setCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

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

  useEffect(() => {
    if (permission === 'granted' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [permission, videoRef.current])

  useGSAP(() => {
    if (captured) return

    gsap.fromTo(ringRef.current,
      { rotate: 0 },
      { rotate: 360, duration: 25, repeat: -1, ease: 'none' }
    )
  }, [captured])

  const handleCapture = async () => {
    if (capturing) return
    setCapturing(true)

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

    // Save Captured Polaroid into context scrapbook
    saveCapturedPhoto(spot.id, capturedDataUrl)

    // Fetch dynamic real-time local storyteller decipher from OpenRouter
    setAiLoading(true)
    const storyText = await fetchAISpotStory(spot, selectedMoods, tier, activeGuide)
    if (storyText) {
      saveLensStory(spot.id, storyText)
    }
    unlockKeepsake(spot.id)
    setAiLoading(false)
    setCapturing(false)
    setCaptured(true)
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
              Optics Port V5
            </span>
            <span className="font-serif text-lg text-bronze-charcoal font-semibold mt-0.5">
              {captured ? 'Scrapbook Snapshot Locked' : 'Focusing Wayfarer Viewfinder'}
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
          {!captured ? (
            <div className="flex flex-col items-center w-full">
              
              {/* Retro Camera Reticle Round Frame */}
              <div className="relative w-64 h-64 rounded-full border-4 border-amber-600/40 overflow-hidden shadow-[0_0_24px_rgba(0,0,0,0.55),_inset_0_0_16px_rgba(0,0,0,0.85)] mb-6 bg-zinc-950 flex items-center justify-center">
                
                <div className="absolute inset-0 z-0">
                  {permission === 'granted' ? (
                    <video 
                      ref={videoRef}
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
              
              {/* Polaroid Decipher description */}
              <div className="p-4 rounded-xl bg-pearl-bg border border-red-500/5 mb-4 relative">
                {aiLoading ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 select-none">
                    <div className="w-6 h-6 border-2 border-red-500/10 border-t-bahrain-red rounded-full animate-spin" />
                    <span className="font-serif text-[10px] italic text-bronze-muted">
                      Storyteller deciphering scrolls...
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
                disabled={capturing}
                className="w-16 h-16 rounded-full border-4 border-white bg-bahrain-red hover:bg-bahrain-dark transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center relative outline-none"
              >
                <div className="absolute inset-1 rounded-full border border-white/20" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-sans">
                  Snap
                </span>
              </button>
              <span className="font-sans text-[8px] tracking-widest text-bronze-muted/50 uppercase mt-2">
                Press Shutter to Capture
              </span>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="px-8 py-2.5 rounded-full bg-bahrain-red hover:bg-bahrain-dark text-white font-sans text-xs uppercase tracking-widest font-bold transition-all shadow-md cursor-pointer w-full"
            >
              Insert Photo into Journal Page
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
