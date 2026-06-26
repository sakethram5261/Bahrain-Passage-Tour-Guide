import { useState, useRef } from 'react'
import { useVibe } from '../hooks/useVibe'
import { ShieldAlert, Sun, Clock } from 'lucide-react'
import { playTypewriterClick } from '../services/audioUtils'

// Helper to calculate estimated home currency equivalents
const getHomeCurrencyEquivalent = (costStr) => {
  if (!costStr) return null
  const lower = costStr.toLowerCase()
  if (lower.includes('free')) return '($0.00 USD)'
  
  if (lower.includes('fils')) {
    const digits = parseFloat(lower.replace(/[^0-9.]/g, ''))
    if (!isNaN(digits)) {
      const usdVal = (digits / 1000) * 2.65
      return `($${usdVal.toFixed(2)} USD eq.)`
    }
  }
  
  if (lower.includes('bhd') || lower.includes('dinar')) {
    const digits = parseFloat(lower.replace(/[^0-9.]/g, ''))
    if (!isNaN(digits)) {
      const usdVal = digits * 2.65
      return `($${usdVal.toFixed(2)} USD eq.)`
    }
  }
  return null
}

// Helper to render Lucide icons based on alert type
const AlertIcon = ({ type }) => {
  if (type === 'modesty') return <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
  if (type === 'heat') return <Sun className="w-3.5 h-3.5 text-red-600 shrink-0" />
  if (type === 'friday') return <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
  return null
}

// Helper to determine safety and custom dress code mods
const getTouristAlerts = (spotName, spotMood) => {
  const alerts = []
  const lower = spotName.toLowerCase()
  
  if (lower.includes('mosque') || lower.includes('temple') || lower.includes('grave') || lower.includes('burial')) {
    alerts.push({
      type: 'modesty',
      text: 'Modest Dress: Long pants/skirts & covered shoulders required.',
      color: 'bg-amber-500/10 border-amber-500/20 text-amber-900'
    })
  }
  
  if (spotMood === 'empires' || spotMood === 'sea' || lower.includes('fort') || lower.includes('tree') || lower.includes('burial') || lower.includes('sandbank')) {
    alerts.push({
      type: 'heat',
      text: 'Midday Heat Alert: Wear sunscreen & stay hydrated. Peak sun 11am-3pm.',
      color: 'bg-red-500/10 border-red-500/20 text-red-900'
    })
  }
  
  if (lower.includes('souq') || lower.includes('mosque') || lower.includes('cafe')) {
    alerts.push({
      type: 'friday',
      text: 'Friday Schedule: Traditional shops close Friday mornings for prayers.',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-900'
    })
  }
  return alerts
}

// Helper to calculate live operational status tags
const getLiveOpeningStatus = (spotName) => {
  const now = new Date()
  const hours = now.getHours()
  const day = now.getDay() // 0 = Sun, 5 = Fri
  const lower = spotName.toLowerCase()
  
  if (day === 5 && hours >= 10 && hours <= 13 && (lower.includes('souq') || lower.includes('cafe'))) {
    return {
      open: false,
      text: 'CLOSED FOR FRIDAY PRAYERS',
      color: 'bg-red-500/10 text-red-800 border-red-500/20'
    }
  }
  
  if (lower.includes('fort') || lower.includes('tree') || lower.includes('burial')) {
    const isOpen = hours >= 6 && hours <= 18
    return {
      open: isOpen,
      text: isOpen ? 'OPEN (SUNRISE - SUNSET)' : 'CLOSED (NIGHT HOURS)',
      color: isOpen ? 'bg-green-500/10 text-green-800 border-green-500/20' : 'bg-red-500/10 text-red-800 border-red-500/20'
    }
  }
  
  const isAttractionOpen = hours >= 9 && hours <= 20
  return {
    open: isAttractionOpen,
    text: isAttractionOpen ? 'OPEN NOW (9 AM - 8 PM)' : 'CLOSED (OPENS 9 AM)',
    color: isAttractionOpen ? 'bg-green-500/10 text-green-800 border-green-500/20' : 'bg-red-500/10 text-red-800 border-red-500/20'
  }
}

export default function LocationCard({ spot, onScan }) {
  const { 
    capturedPhotos, 
    lensStories, 
    collectedKeepsakes, 
    journalReflections, 
    saveJournalReflection,
    soundVolume,
    soundMuted
  } = useVibe() || {}
  
  const hasKeepsake = collectedKeepsakes && collectedKeepsakes.includes(spot.id)

  const [prevSpotId, setPrevSpotId] = useState(spot.id)
  const [localReflection, setLocalReflection] = useState(journalReflections[spot.id] || '')
  const [saveState, setSaveState] = useState('saved')
  const reflectionDebounceRef = useRef(null)

  if (spot.id !== prevSpotId) {
    setPrevSpotId(spot.id)
    setLocalReflection(journalReflections[spot.id] || '')
  }

  const handleReflectionChange = (e) => {
    const val = e.target.value
    setLocalReflection(val)
    playTypewriterClick(1.0, soundVolume, soundMuted)
    setSaveState('typing')

    if (reflectionDebounceRef.current) {
      clearTimeout(reflectionDebounceRef.current)
    }
    reflectionDebounceRef.current = setTimeout(() => {
      setSaveState('saving')
      saveJournalReflection(spot.id, val)
      setTimeout(() => {
        setSaveState('saved')
      }, 300)
    }, 450)
  }

  return (
    <div className="glass-panel rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col transition-all duration-500 hover:shadow-md hover:border-red-500/10 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-stretch">
        
        {/* Left Column: Gallery Photo Card */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col items-center justify-start">
          <div className="relative bg-white p-4 shadow-md border border-stone-200 transition-all duration-300 w-full max-w-[290px] select-none rounded-xl">
            {/* Gold Star Keepsake sticker */}
            {hasKeepsake && (
              <div
                aria-label="Keepsake collected"
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  zIndex: 30,
                }}
              />
            )}

            <div className="w-full h-64 md:h-[240px] overflow-hidden relative border border-stone-100 bg-bahrain-dark flex items-center justify-center rounded-lg mb-3">
              
              {/* Vintage Airmail Postcard Background (Reveals if image fails or is slow to load) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[var(--color-surface)] border-8 border-double border-[var(--color-primary-mid)] text-center select-none z-0">
                <div className="z-10 flex flex-col items-center space-y-1">
                  <span className="text-overline text-[var(--color-primary)]">BAHRAIN POST</span>
                  <span className="text-caption font-semibold text-[var(--color-text)] italic max-w-[180px] truncate">{spot.name}</span>
                  <span className="text-caption font-bold text-[var(--color-primary)]">{spot.arabic}</span>
                  <span className="text-overline text-[var(--color-text-faint)]">Official Chronicle Card</span>
                </div>
              </div>

              {/* The actual photo (lays on top and hides if broken) */}
              <img
                src={capturedPhotos[spot.id] || spot.image}
                alt={`${spot.name} — Bahrain`}
                className="w-full h-full object-cover block relative z-10"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.style.setProperty('display', 'flex');
                }}
              />
              <div
                style={{
                  display: 'none',
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  background: 'var(--color-surface-2, #F5F5F4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  boxSizing: 'border-box',
                  zIndex: 10
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
                    fontSize: '14px',
                    color: 'var(--color-text-muted, #78716C)',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {spot.name}
                </span>
              </div>
              
              {capturedPhotos[spot.id] && (
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 font-mono text-overline text-white z-20">
                  Captured Snap
                </div>
              )}
            </div>

            {/* Distress Ink Postmark Stamp overlay */}
            {capturedPhotos[spot.id] && (
              <div className="postmark-stamp" aria-hidden="true">
                <span className="font-serif text-overline text-[var(--color-primary)] block">Sealed</span>
                <span className="font-serif text-overline text-[var(--color-primary)]/60 block">MANAMA</span>
                <span className="font-mono text-overline text-[var(--color-primary)]/80 block">25.05.2026</span>
              </div>
            )}

            <div className="flex flex-col text-left mt-2 border-t border-stone-100 pt-2">
              <span className="text-body font-semibold text-[var(--color-text)] truncate">
                {spot.name}
              </span>
              <span className="text-overline text-[var(--color-text-faint)]">
                {capturedPhotos[spot.id] ? 'Snapped Live' : 'Explorer Card'} • 2026
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Handwritten Scrapbook Journal */}
        <div className="flex-1 flex flex-col justify-between py-1 text-left">
          <div className="space-y-4">
            
            {/* Meta Epoch & Calligraphy */}
            <div className="flex justify-between items-start border-b border-red-500/10 pb-2">
              <div className="flex flex-col">
                <span className="text-overline text-[var(--color-text-faint)]">
                  {spot.period}
                </span>
                <span className="font-mono text-caption text-[var(--color-text-faint)]">
                  {spot.coords}
                </span>
              </div>
              <span className="font-serif text-title text-bahrain-red italic font-medium">
                {spot.arabic}
              </span>
            </div>

            {/* Title & Narrative */}
            <div>
              <h3 className="text-heading text-bronze-charcoal tracking-tight">
                {spot.name}
              </h3>
              
              {/* Tourist Convenience Alerts */}
              {(() => {
                const alerts = getTouristAlerts(spot.name, spot.mood)
                if (alerts.length === 0) return null
                return (
                  <div className="flex flex-col gap-2 mt-2 mb-3">
                    {alerts.map((al, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-caption font-medium select-none animate-fadeIn ${al.color}`}
                      >
                        <AlertIcon type={al.type} />
                        <span>{al.text}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <p className="font-sans text-xs text-bronze-muted leading-relaxed mt-2 font-medium">
                {spot.desc}
              </p>
            </div>

            {/* Storyteller's Secret (AI Dynamic Decipher or Local Tip) */}
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <span className="text-overline text-[var(--color-primary)] block mb-1">
                {lensStories[spot.id] ? 'Local Insights' : 'Local Story'}
              </span>
              <p className="font-serif text-body italic text-bronze-charcoal leading-relaxed">
                {lensStories[spot.id] || spot.insider}
              </p>
            </div>

            {/* Diary Reflections */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-overline text-[var(--color-text-faint)] flex items-center gap-1">
                  Notes
                </span>
              </div>
              <textarea
                value={localReflection}
                onChange={handleReflectionChange}
                placeholder="Jot down your notes and memories..."
                rows="3"
                className="w-full text-xs font-sans text-stone-700 placeholder-stone-400 border-none focus:outline-none resize-none focus:ring-0 leading-6 bg-transparent"
              />
              <div className="flex justify-between items-center mt-2">
                <span 
                  className="text-caption font-medium"
                  style={{ color: saveState === 'saved' ? 'var(--color-success)' : 'var(--color-text-faint)' }}
                >
                  {saveState === 'typing' && 'Typing...'}
                  {saveState === 'saving' && 'Saving...'}
                  {saveState === 'saved' && 'Saved'}
                </span>
                <span className="text-caption font-medium text-[var(--color-text-faint)]">{localReflection.length} chars</span>
              </div>
            </div>

            {/* Route Guidelines */}
            <div className="p-4 rounded-2xl bg-pearl-bg border border-red-500/5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2 border-b border-red-500/5 pb-2">
                <div className="flex flex-col text-left">
                  <span className="text-overline text-[var(--color-text-faint)]">
                    Pathway Details
                  </span>
                  
                  {/* Live Status Badge */}
                  <div className="mt-1 flex items-center">
                    {(() => {
                      const status = getLiveOpeningStatus(spot.name)
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-overline select-none ${status.color}`}>
                          <span className={`w-1 h-1 rounded-full shrink-0 ${status.open ? 'bg-green-500' : 'bg-red-500'}`} />
                          {status.text}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    {/* Currency converted cost badge */}
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-1 rounded-md bg-white border border-red-500/10 text-caption font-semibold text-bahrain-red">
                        Est. Cost: {spot.pathCost}
                      </span>
                      {getHomeCurrencyEquivalent(spot.pathCost) && (
                        <span className="text-caption font-normal text-[var(--color-text-faint)]">
                          {getHomeCurrencyEquivalent(spot.pathCost)}
                        </span>
                      )}
                    </div>

                    {/* Google Maps Directions Deep-Link Luggage Tag */}
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ', Bahrain')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-amber-500/10 border border-amber-600/30 text-caption font-semibold text-amber-800 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Open Directions in Google Maps"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-body text-bronze-muted leading-relaxed">
                {spot.pathGuide}
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-red-500/10 mt-6 flex justify-between items-center gap-3">
            <span className="text-overline text-[var(--color-text-faint)]">
              Scan location
            </span>

            <button
              onClick={() => onScan(spot)}
              className={`px-5 py-2 rounded-xl text-caption font-semibold tracking-wide uppercase transition-all cursor-pointer shadow-sm ${
                capturedPhotos[spot.id]
                  ? 'bg-green-600 hover:bg-green-700 text-white border border-green-600'
                  : 'bg-bahrain-red hover:bg-bahrain-dark text-white border border-bahrain-red'
              }`}
            >
              {capturedPhotos[spot.id] ? 'Retake Photo' : 'Capture Photo'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
