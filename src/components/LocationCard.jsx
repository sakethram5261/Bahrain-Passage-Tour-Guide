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
  } = useVibe()
  
  const hasKeepsake = collectedKeepsakes && collectedKeepsakes.includes(spot.id)

  return (
    <div className="glass-panel rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col transition-all duration-500 hover:shadow-md hover:border-red-500/10 w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-stretch">
        
        {/* Left Column: Polaroid Photo Frame */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col items-center justify-center">
          <div className="relative bg-white p-3.5 pb-12 shadow-xl border border-red-500/5 rotate-[-1.5deg] hover:rotate-[1deg] transition-all duration-700 w-full max-w-[290px] select-none">
            {/* Taped top effect */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/40 backdrop-blur-[1px] border border-white/20 shadow-sm rotate-[-3deg] z-10 pointer-events-none" />

            {/* Gold Star Keepsake sticker */}
            {hasKeepsake && (
              <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-amber-500/10 border-2 border-dashed border-amber-600/40 flex items-center justify-center rotate-12 text-amber-600 shadow-sm z-30 font-serif font-extrabold text-[12px] pointer-events-none select-none">
                ★
              </div>
            )}

            <div className="w-full h-64 md:h-[240px] overflow-hidden relative border border-red-500/5 bg-bahrain-dark flex items-center justify-center rounded-sm">
              
              {/* Vintage Airmail Postcard Background (Reveals if image fails or is slow to load) */}
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
                  <span className="font-serif text-[11px] text-bronze-charcoal/80 font-medium italic mt-0.5 max-w-[180px] truncate">{spot.name}</span>
                  <span className="font-serif text-[10px] text-bahrain-red/90 font-bold mt-0.5">{spot.arabic}</span>
                  <span className="font-sans text-[7px] text-bronze-muted/60 uppercase tracking-widest font-semibold mt-1">Official Chronicle Card</span>
                </div>
              </div>

              {/* The actual photo (lays on top and hides if broken) */}
              <img
                src={capturedPhotos[spot.id] || spot.image}
                alt={spot.name}
                className="w-full h-full object-cover block relative z-10"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              
              {capturedPhotos[spot.id] && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[7px] font-mono text-white tracking-widest uppercase font-bold z-20">
                  Captured Snap
                </div>
              )}
            </div>

            {/* Distress Ink Postmark Stamp overlay */}
            {capturedPhotos[spot.id] && (
              <div className="postmark-stamp">
                <span className="font-serif text-[6px] tracking-widest text-bahrain-red block uppercase font-extrabold">Sealed</span>
                <span className="font-serif text-[5px] text-bahrain-red/60 uppercase block font-bold mt-0.5">MANAMA</span>
                <span className="font-mono text-[4px] text-bahrain-red/80 block uppercase font-bold mt-0.5">25.05.2026</span>
              </div>
            )}

            <div className="absolute bottom-3 left-4 right-4 flex flex-col text-left">
              <span className="font-serif text-[10px] text-bronze-charcoal/80 font-bold tracking-tight truncate">
                {spot.name}
              </span>
              <span className="font-sans text-[6px] text-bronze-muted/50 tracking-wider uppercase font-semibold mt-0.5">
                {capturedPhotos[spot.id] ? 'Snapped Live' : 'Scrapbook Postcard'} • 2026
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
                <span className="font-sans text-[8px] tracking-[0.15em] text-bronze-muted/50 uppercase font-bold">
                  {spot.period}
                </span>
                <span className="font-sans text-[8px] tracking-wider text-bahrain-red font-bold font-mono mt-0.5">
                  {spot.coords}
                </span>
              </div>
              <span className="font-serif text-lg text-bahrain-red italic font-medium">
                {spot.arabic}
              </span>
            </div>

            {/* Title & Narrative */}
            <div>
              <h3 className="font-serif text-2xl md:text-3xl text-bronze-charcoal font-semibold tracking-tight">
                {spot.name}
              </h3>
              
              {/* Tourist Convenience Alerts */}
              {(() => {
                const alerts = getTouristAlerts(spot.name, spot.mood)
                if (alerts.length === 0) return null
                return (
                  <div className="flex flex-col gap-1.5 mt-2 mb-3">
                    {alerts.map((al, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-[9.5px] font-sans font-bold select-none animate-fadeIn ${al.color}`}
                      >
                        <AlertIcon type={al.type} />
                        <span>{al.text}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <p className="font-sans text-xs text-bronze-muted leading-relaxed mt-2.5 font-medium">
                {spot.desc}
              </p>
            </div>

            {/* Storyteller's Secret (AI Dynamic Decipher or Local Tip) */}
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold block mb-1">
                {lensStories[spot.id] ? 'Local Insights' : 'Local Story'}
              </span>
              <p className="font-serif text-[12px] italic text-bronze-charcoal leading-relaxed font-semibold">
                {lensStories[spot.id] || spot.insider}
              </p>
            </div>

            {/* Diary Reflections */}
            <div className="p-4 rounded-2xl border border-stone-200 bg-white dark:bg-[#1C1816] shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="font-sans text-[9px] tracking-wider uppercase text-neutral-400 font-extrabold flex items-center gap-1">
                  Notes
                </span>
              </div>
              <textarea
                value={journalReflections[spot.id] || ''}
                onChange={(e) => {
                  saveJournalReflection(spot.id, e.target.value)
                  playTypewriterClick(1.0, soundVolume, soundMuted)
                }}
                placeholder="Jot down your notes and memories..."
                rows="3"
                className="w-full text-xs font-sans text-stone-700 dark:text-stone-300 placeholder-stone-400 border-none focus:outline-none resize-none focus:ring-0 leading-6 bg-transparent"
              />
            </div>

            {/* Route Guidelines */}
            <div className="p-4 rounded-2xl bg-pearl-bg border border-red-500/5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2 border-b border-red-500/5 pb-2">
                <div className="flex flex-col text-left">
                  <span className="font-sans text-[8px] tracking-widest uppercase text-bronze-muted/70 font-bold">
                    Pathway Details
                  </span>
                  
                  {/* Live Status Badge */}
                  <div className="mt-1 flex items-center">
                    {(() => {
                      const status = getLiveOpeningStatus(spot.name)
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[7.5px] uppercase tracking-wider font-black select-none ${status.color}`}>
                          <span className={`w-1 h-1 rounded-full shrink-0 ${status.open ? 'bg-green-500' : 'bg-red-500'}`} />
                          {status.text}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {/* Currency converted cost badge */}
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-red-500/10 text-[8px] uppercase tracking-wider font-extrabold text-bahrain-red">
                        Est. Cost: {spot.pathCost}
                      </span>
                      {getHomeCurrencyEquivalent(spot.pathCost) && (
                        <span className="text-[7.5px] font-sans font-bold text-bronze-muted/50 mt-0.5">
                          {getHomeCurrencyEquivalent(spot.pathCost)}
                        </span>
                      )}
                    </div>

                    {/* Google Maps Directions Deep-Link Luggage Tag */}
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + ', Bahrain')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded bg-amber-500/10 border border-amber-600/30 text-[8px] uppercase tracking-widest font-black text-amber-800 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                      title="Open Directions in Google Maps"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              </div>
              <p className="font-sans text-xs text-bronze-muted leading-relaxed font-semibold">
                {spot.pathGuide}
              </p>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-red-500/10 mt-6 flex justify-between items-center gap-3">
            <span className="font-sans text-[8px] tracking-widest uppercase text-bronze-muted/40 font-bold">
              Optics Port Ready
            </span>

            <button
              onClick={() => onScan(spot)}
              className={`px-5 py-2 rounded-xl text-[9px] tracking-widest uppercase font-bold transition-all cursor-pointer shadow-sm ${
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
