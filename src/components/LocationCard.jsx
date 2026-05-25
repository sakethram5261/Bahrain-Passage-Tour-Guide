import { useVibe } from '../hooks/useVibe'

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
      gainNode.gain.linearRampToValueAtTime(0.08 * soundVolume, audioCtx.currentTime + 0.003) // Very rapid click strike
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03) // Rapid decay
      
      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      osc.start()
      osc.stop(audioCtx.currentTime + 0.035)
    } catch (e) {
      console.error('Typewriter sound play failed:', e)
    }
  }

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
              
              {/* Vintage Travel Poster Background (Reveals if image fails or is slow to load) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-bahrain-dark to-bahrain-dark/95 border border-amber-500/10 text-center select-none z-0">
                <span className="font-serif text-[40px] text-amber-500/5 font-extrabold uppercase absolute tracking-widest pointer-events-none">
                  BAHRAIN
                </span>
                <span className="font-serif text-xs text-pearl-bg/85 font-medium italic tracking-wider px-2 z-10 truncate max-w-full">
                  {spot.name}
                </span>
                <span className="font-serif text-xs text-amber-500/80 mt-1 z-10 font-bold">
                  {spot.arabic}
                </span>
                <span className="font-sans text-[6px] text-pearl-bg/35 tracking-[0.25em] uppercase mt-3 z-10 font-semibold">
                  Wayfarer Logbook
                </span>
              </div>

              {/* The actual photo (lays on top and hides if broken) */}
              <img
                src={capturedPhotos[spot.id] || spot.image}
                alt={spot.name}
                className="w-full h-full object-cover block relative z-10"
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
              <p className="font-sans text-xs text-bronze-muted leading-relaxed mt-2.5 font-medium">
                {spot.desc}
              </p>
            </div>

            {/* Storyteller's Secret (AI Dynamic Decipher or Local Tip) */}
            <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10">
              <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold block mb-1">
                {lensStories[spot.id] ? '📖 Custom Storyteller Decipher' : '✨ The Storyteller\'s Secret'}
              </span>
              <p className="font-serif text-[12px] italic text-bronze-charcoal leading-relaxed font-semibold">
                {lensStories[spot.id] || spot.insider}
              </p>
            </div>

            {/* Lined Notebook Paper: Wanderlust Reflections */}
            <div className="p-4.5 rounded-2xl border border-red-500/10 shadow-sm relative overflow-hidden bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="font-sans text-[8px] tracking-widest uppercase text-bahrain-red font-bold flex items-center gap-1">
                  ✍️ Wanderlust Reflections Log
                </span>
                <span className="font-serif text-[8px] text-bronze-muted/60 italic font-medium select-none">
                  Lined paper ledger
                </span>
              </div>
              <textarea
                value={journalReflections[spot.id] || ''}
                onChange={(e) => {
                  saveJournalReflection(spot.id, e.target.value)
                  playTypewriterClick()
                }}
                placeholder="Type your physical journal thoughts here... (typewriter key feedback enabled)"
                rows="3"
                className="w-full text-xs font-serif text-bronze-charcoal placeholder-bronze-muted/30 lined-notepad-paper border-none focus:outline-none resize-none focus:ring-0 leading-6 bg-transparent"
              />
            </div>

            {/* Route Guidelines */}
            <div className="p-4 rounded-2xl bg-pearl-bg border border-red-500/5">
              <div className="flex justify-between items-center mb-1">
                <span className="font-sans text-[8px] tracking-widest uppercase text-bronze-muted/70 font-bold">
                  Pathway Details
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white border border-red-500/10 text-[8px] uppercase tracking-wider font-extrabold text-bahrain-red">
                  Est. Cost: {spot.pathCost}
                </span>
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
              {capturedPhotos[spot.id] ? '📷 Re-Focus & Re-Shoot' : '📷 Focus Wayfarer Lens'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
