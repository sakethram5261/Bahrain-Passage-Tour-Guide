import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useVibe } from '../hooks/useVibe'
import { fetchSpotStory } from '../services/itinerary-service'
import { playScanBeep as playScanBeepShared } from '../services/audioUtils'
import { callGeminiVision } from '../services/aiService'

// ─── Per-spot fallback texts (shown if no API key is configured) ──────────────
const SPOT_VISION_FALLBACKS = {
  'qal-at-al-bahrain': 'The warm coral stone here is over 4,000 years old — Dilmun merchants pressed their clay seals against these very walls to mark shipments bound for ancient Mesopotamia.',
  'muharraq-souq': 'The intricate gypsum lattice screens overhead are hand-carved — each geometric pattern is unique to the craftsman who made it, a tradition passed down through Muharraq families for centuries.',
  'pearling-path': 'The wind-towers you see here are Bahrain\'s original air conditioning — coral stone channels caught the sea breeze and funneled it down into the pearl merchants\' homes below.',
  'block-338': 'The murals here change every season — local artists repaint these walls during the spring arts festival, making Block 338 a living canvas that never looks the same twice.',
  'jarada-island': 'The white sand here is so fine it squeaks underfoot — geologists believe it formed from thousands of years of crushed coral and shell fragments ground smooth by the Gulf tides.',
  'tree-of-life': 'This solitary mesquite tree\'s roots descend over 50 meters through the dry Sakhir desert to reach a hidden freshwater aquifer — it has survived 400+ years without any visible water source.',
  'haji-cafe': 'The copper pots here have been seasoned by decades of saffron and cardamom — regulars say you can taste the history in every cup of karak tea served on these worn wooden benches.',
  'aali-pottery': 'The red clay used here is harvested from local Sakhir marshes — the same rich mineral-heavy soil that ancient Dilmun potters used to fire the ceremonial jars found in nearby burial mounds.',
  'arad-fort': 'The cylindrical corner towers here were an engineering marvel in the 15th century — their curved walls deflect cannonballs rather than absorbing the impact, a technique ahead of its time.',
  'national-museum': 'The traditional pearling dhow preserved inside here is one of the last surviving examples — it was built using hand-stitched wooden planks, no nails, stitched together with twisted coconut fiber rope.',
  'al-dar-islands': 'The shallow seagrass beds visible here are nurseries for the Gulf\'s blue swimming crabs — they shelter here as juveniles before migrating to deeper offshore waters.',
  'reef-island': 'At exactly 7:15 PM, the city\'s skyscraper neon lights begin to reflect off the calm marina surface here — locals call it the \'Golden Mirror,\' and it lasts only about 40 minutes.',
}

const DEFAULT_VISION_FALLBACK = 'Every corner of Bahrain holds a layer of history waiting to be uncovered — from 5,000-year-old Dilmun trade routes to the pearl divers who held their breath for two minutes in these warm Gulf waters.'

const VISION_PROMPT = `You are a Bahraini heritage archaeologist and storyteller. 
Examine this photograph and describe in exactly 2 sentences what you observe that connects visually to Bahrain's cultural, historical, or natural heritage.
Be specific to what is actually visible in the image — textures, colors, architecture, materials, or natural features.
Write in a rich, sensory style. Do not use generic tourist language. Do not start with "I see" or "The image shows".`

export default function WayfarerLens({ spot, onClose }) {
  const {
    saveCapturedPhoto,
    saveLensStory,
    unlockKeepsake,
    capturedPhotos = {},
    soundVolume,
    soundMuted,
    awardXP,
    setGoldFils,
  } = useVibe()

  const videoRef      = useRef(null)
  const streamRef     = useRef(null)
  const lensRef       = useRef(null)
  const ringRef       = useRef(null)
  const flashRef      = useRef(null)
  const fileInputRef  = useRef(null)
  const storyBoxRef   = useRef(null)

  const [permission, setPermission]       = useState('pending')
  const [capturing, setCapturing]         = useState(false)
  const [captured, setCaptured]           = useState(false)
  const [visionLoading, setVisionLoading] = useState(false)
  const [visionText, setVisionText]       = useState('')
  const [displayedVision, setDisplayedVision] = useState('')

  // Typewriter reveal for AI vision text
  useEffect(() => {
    if (!visionText) return
    let i = 0
    const tid = setInterval(() => {
      if (i === 0) {
        setDisplayedVision('')
      }
      i++
      setDisplayedVision(visionText.slice(0, i))
      if (i >= visionText.length) clearInterval(tid)
    }, 18)
    return () => {
      clearInterval(tid)
      setDisplayedVision('')
    }
  }, [visionText])

  // Animate vision box in when visionText arrives
  useEffect(() => {
    if (visionText && storyBoxRef.current) {
      gsap.fromTo(storyBoxRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [visionText])

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
        if (active) setPermission('denied')
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

  const videoCallbackRef = (element) => {
    videoRef.current = element
    if (element && streamRef.current) {
      element.srcObject = streamRef.current
    }
  }

  useGSAP(() => {
    if (captured || !ringRef.current) return
    gsap.fromTo(ringRef.current,
      { rotate: 0 },
      { rotate: 360, duration: 25, repeat: -1, ease: 'none' }
    )
  }, [captured])

  const playScanBeep = (freq = 800, duration = 0.08) => {
    playScanBeepShared(freq, duration, soundVolume, soundMuted)
  }

  const processCapture = async (capturedDataUrl) => {
    setCapturing(true)
    setVisionLoading(true)
    setVisionText('')

    // Animate flash
    if (flashRef.current) {
      gsap.fromTo(flashRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.08, yoyo: true, repeat: 1, ease: 'power2.out',
          onComplete: () => { if (flashRef.current) gsap.set(flashRef.current, { opacity: 0 }) }
        }
      )
    }

    playScanBeep(800, 0.06)

    // Extract base64 data (strip data:image/...;base64, prefix)
    const base64Match = capturedDataUrl.match(/^data:([^;]+);base64,(.+)$/)
    const mimeType = base64Match?.[1] || 'image/jpeg'
    const base64Data = base64Match?.[2] || ''

    const fallback = SPOT_VISION_FALLBACKS[spot.id] || DEFAULT_VISION_FALLBACK

    // Call real Gemini Vision — or fallback silently
    let aiText = fallback
    if (base64Data) {
      aiText = await callGeminiVision(base64Data, mimeType, VISION_PROMPT, fallback)
    }

    setVisionLoading(false)
    setVisionText(aiText)

    // Save photo + story
    saveCapturedPhoto(spot.id, capturedDataUrl)

    fetchSpotStory(spot).then(storyText => {
      if (storyText) saveLensStory(spot.id, storyText)
      unlockKeepsake(spot.id)
    }).catch(() => {
      unlockKeepsake(spot.id)
    })

    // Award XP & fils
    if (typeof awardXP === 'function') awardXP(30)
    if (typeof setGoldFils === 'function') setGoldFils(prev => (prev || 0) + 250)

    playScanBeep(1050, 0.1)
    setCapturing(false)
    setCaptured(true)
  }

  const handleCapture = async () => {
    if (capturing) return

    let capturedDataUrl = null
    try {
      if (permission === 'granted' && videoRef.current && videoRef.current.readyState >= 2) {
        const canvas = document.createElement('canvas')
        const w = videoRef.current.videoWidth || 640
        const h = videoRef.current.videoHeight || 480
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.filter = 'sepia(0.25) contrast(1.12) brightness(0.96)'
        ctx.drawImage(videoRef.current, 0, 0, w, h)
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88)
      }
    } catch (e) {
      console.error('Failed to capture camera frame:', e)
    }

    if (!capturedDataUrl) {
      capturedDataUrl = spot.image
    }

    await processCapture(capturedDataUrl)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      await processCapture(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      ref={lensRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 select-none backdrop-blur-md"
    >
      {/* Flash overlay */}
      <div
        ref={flashRef}
        className="fixed inset-0 bg-white z-50 opacity-0 pointer-events-none"
      />

      <div className="relative w-full max-w-lg rounded-3xl bg-[#FAF6EE] border border-[#C1122F]/10 flex flex-col justify-between p-6 shadow-2xl overflow-hidden min-h-[500px]">

        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#C1122F]/08">
          <div className="flex flex-col text-left">
            <span style={{
              fontFamily: '"Outfit", system-ui, sans-serif',
              fontSize: 8, letterSpacing: '0.28em',
              color: '#C1122F', textTransform: 'uppercase', fontWeight: 700,
            }}>
              Wayfarer Lens
            </span>
            <span style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 18, color: '#1C1917', fontWeight: 600, marginTop: 2,
            }}>
              {captured ? 'Image Archived' : 'Camera Ready'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-stone-200 text-stone-500 hover:bg-red-500/5 cursor-pointer transition-all text-xs"
          >
            ✕
          </button>
        </div>

        {/* Main viewport */}
        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-4">

          {/* ── Capturing / AI reading state ── */}
          {capturing && (
            <div className="w-full max-w-sm text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[#C1122F]/15 border-t-[#C1122F] animate-spin" />
              <p style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: 'italic', fontSize: 13,
                color: '#5C5451', letterSpacing: '0.01em',
              }}>
                {visionLoading ? 'Reading your image…' : 'Archiving entry…'}
              </p>
              <p style={{
                fontFamily: '"Outfit", system-ui, sans-serif',
                fontSize: 9, letterSpacing: '0.18em',
                color: 'rgba(193,18,47,0.5)', textTransform: 'uppercase',
                marginTop: 6,
              }}>
                {visionLoading ? 'Gemini Vision · Cultural Heritage Mode' : 'Saving to chronicle…'}
              </p>
            </div>
          )}

          {/* ── Captured + AI response state ── */}
          {!capturing && captured && (
            <div className="w-full max-w-sm">
              {/* Polaroid photo */}
              <div style={{
                background: '#fff',
                padding: '8px 8px 32px 8px',
                boxShadow: '0 6px 28px rgba(28,25,23,0.14), 0 1px 4px rgba(28,25,23,0.08)',
                borderRadius: 6,
                transform: 'rotate(-1.5deg)',
                marginBottom: 20,
              }}>
                <div style={{ width: '100%', paddingBottom: '75%', position: 'relative', borderRadius: 3, overflow: 'hidden', background: '#e8e4dc' }}>
                  <img
                    src={capturedPhotos[spot.id] || spot.image}
                    alt={spot.name}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      objectFit: 'cover',
                      filter: 'sepia(0.15) contrast(1.08) brightness(0.94)',
                    }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
                <div style={{
                  paddingTop: 8, textAlign: 'center',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: 10, fontStyle: 'italic',
                  color: '#78716C', letterSpacing: '0.05em',
                }}>
                  {spot.name}
                </div>
              </div>

              {/* AI Vision response */}
              <div
                ref={storyBoxRef}
                style={{
                  background: 'rgba(193,18,47,0.03)',
                  border: '1px solid rgba(193,18,47,0.12)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 12,
                  opacity: visionText ? 1 : 0,
                }}
              >
                <div style={{
                  fontFamily: '"Outfit", system-ui, sans-serif',
                  fontSize: 8, letterSpacing: '0.22em',
                  color: '#C1122F', textTransform: 'uppercase', fontWeight: 700,
                  marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span>✦</span> AI Heritage Reading
                </div>
                <p style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic', fontSize: 13, lineHeight: 1.65,
                  color: '#1C1917', margin: 0,
                  minHeight: 42,
                }}>
                  {displayedVision}
                  {displayedVision.length < visionText.length && (
                    <span style={{ borderRight: '1.5px solid #C1122F', marginLeft: 1, animation: 'cursorBlink 0.7s step-end infinite' }} />
                  )}
                </p>
              </div>

              {/* Reward strip */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.18)',
                borderRadius: 10, padding: '8px 12px',
                fontFamily: '"Outfit", system-ui, sans-serif',
                fontSize: 10, fontWeight: 700,
                color: '#15803D',
              }}>
                <span>Archived to Chronicle</span>
                <span style={{ background: 'rgba(22,163,74,0.12)', padding: '2px 8px', borderRadius: 6 }}>
                  +250 Fils · +30 XP
                </span>
              </div>
            </div>
          )}

          {/* ── Camera viewfinder state ── */}
          {!capturing && !captured && (
            <div className="flex flex-col items-center w-full gap-4">
              {/* Viewfinder */}
              <div style={{
                width: 240, height: 240, borderRadius: 16,
                overflow: 'hidden', position: 'relative',
                background: '#1C1917',
                boxShadow: '0 8px 32px rgba(28,25,23,0.2)',
              }}>
                {permission === 'granted' ? (
                  <video
                    ref={videoCallbackRef}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                      src={spot.image}
                      alt="Location preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55, filter: 'sepia(0.3)' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      padding: 16, textAlign: 'center',
                    }}>
                      <p style={{ fontFamily: '"Playfair Display", serif', fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginBottom: 4 }}>
                        {spot.name}
                      </p>
                      <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(193,18,47,0.8)' }}>
                        Tap Snap to archive
                      </p>
                    </div>
                  </div>
                )}

                {/* Corner brackets */}
                <div style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTop: '2px solid rgba(193,18,47,0.6)', borderLeft: '2px solid rgba(193,18,47,0.6)', borderRadius: '3px 0 0 0' }} />
                <div style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderTop: '2px solid rgba(193,18,47,0.6)', borderRight: '2px solid rgba(193,18,47,0.6)', borderRadius: '0 3px 0 0' }} />
                <div style={{ position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderBottom: '2px solid rgba(193,18,47,0.6)', borderLeft: '2px solid rgba(193,18,47,0.6)', borderRadius: '0 0 0 3px' }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottom: '2px solid rgba(193,18,47,0.6)', borderRight: '2px solid rgba(193,18,47,0.6)', borderRadius: '0 0 3px 0' }} />
              </div>

              <p style={{
                fontFamily: '"Outfit", system-ui, sans-serif',
                fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#A8A29E', textAlign: 'center',
              }}>
                {permission === 'granted' ? 'Camera active · AI will read your photo' : 'Tap Snap · AI will read your photo'}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="w-full border-t border-stone-200/80 pt-4">
          {!captured && !capturing ? (
            <div className="flex items-center justify-center gap-6">
              {/* Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '1px solid #D6D3D1', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16,
                  transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(28,25,23,0.08)',
                }}
                title="Upload a photo"
              >
                📁
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

              {/* Shutter */}
              <button
                onClick={handleCapture}
                disabled={capturing}
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #C1122F, #8B0D22)',
                  border: '3px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(193,18,47,0.35)',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.06)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
                <span style={{ fontFamily: '"Outfit", sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                  Snap
                </span>
              </button>
            </div>
          ) : captured ? (
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 100,
                background: 'linear-gradient(135deg, #C1122F, #8B0D22)',
                color: '#fff',
                fontFamily: '"Outfit", system-ui, sans-serif',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(193,18,47,0.3)',
              }}
            >
              Return to Journal
            </button>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
