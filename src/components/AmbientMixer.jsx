import { useState, useEffect, useRef } from 'react'
import { soundscape } from '../services/audioSynthesizer'
import { Music, Play, Pause, Volume2, Sliders } from 'lucide-react'

export default function AmbientMixer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [wavesVol, setWavesVol] = useState(() => {
    const val = localStorage.getItem('bp_synth_waves_vol')
    return val !== null ? Number(val) : 0.5
  })
  const [windVol, setWindVol] = useState(() => {
    const val = localStorage.getItem('bp_synth_wind_vol')
    return val !== null ? Number(val) : 0.3
  })
  const [oudVol, setOudVol] = useState(() => {
    const val = localStorage.getItem('bp_synth_oud_vol')
    return val !== null ? Number(val) : 0.4
  })

  const initialized = useRef(false)

  // Toggle mixer panel
  const toggleMixer = () => {
    setIsOpen(!isOpen)
  }

  // Toggle master playback
  const handlePlayback = () => {
    if (!initialized.current) {
      soundscape.init()
      initialized.current = true
    }

    if (isPlaying) {
      soundscape.stop()
      setIsPlaying(false)
    } else {
      soundscape.start()
      soundscape.setVolumes(wavesVol, windVol, oudVol)
      setIsPlaying(true)
    }
  }

  // Sync volumes when playing and sliders change
  useEffect(() => {
    if (isPlaying && initialized.current) {
      soundscape.setVolumes(wavesVol, windVol, oudVol)
    }
    // Save to localStorage
    localStorage.setItem('bp_synth_waves_vol', wavesVol.toString())
    localStorage.setItem('bp_synth_wind_vol', windVol.toString())
    localStorage.setItem('bp_synth_oud_vol', oudVol.toString())
  }, [wavesVol, windVol, oudVol, isPlaying])

  // Stop soundscape on unmount
  useEffect(() => {
    return () => {
      if (initialized.current) {
        soundscape.stop()
      }
    }
  }, [])

  return (
    <div className="relative inline-block text-left select-none">
      {/* Floating Music Button */}
      <button
        onClick={handlePlayback}
        onDoubleClick={toggleMixer}
        className={`relative flex items-center justify-center p-2.5 rounded-full border border-white/20 backdrop-blur-md cursor-pointer transition-all duration-300 ${
          isPlaying
            ? 'bg-[#BA0C2F] text-white shadow-[0_0_12px_rgba(186,12,47,0.4)] animate-[pulse_2s_infinite]'
            : 'bg-black/40 text-stone-200 hover:bg-black/60 hover:text-white'
        }`}
        aria-label={isPlaying ? 'Pause Ambient Soundscape' : 'Play Ambient Soundscape'}
        title="Double-click to open Mixer sliders"
      >
        <Music size={14} className={isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} />
        
        {/* Tiny active wave indicator */}
        {isPlaying && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-stone-900/80 border border-white/10 text-[6px]">
            <span className="w-0.5 h-1.5 bg-white rounded-full animate-[bounce_0.6s_infinite_0.1s]"></span>
            <span className="w-0.5 h-2 bg-white rounded-full animate-[bounce_0.6s_infinite_0.3s]"></span>
            <span className="w-0.5 h-1 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s]"></span>
          </span>
        )}
      </button>

      {/* Toggle Sliders Button */}
      <button
        onClick={toggleMixer}
        className={`ml-1.5 p-2 rounded-full border border-white/20 bg-black/40 text-stone-200 hover:bg-black/60 hover:text-white cursor-pointer transition-all ${
          isOpen ? 'bg-white/10 text-white' : ''
        }`}
        aria-label="Toggle Soundscape Mixer Sliders"
        title="Adjust Ambient Mixer"
      >
        <Sliders size={14} />
      </button>

      {/* Slide-out Glassmorphic Mixer panel */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-3 w-64 p-4 rounded-2xl bg-stone-950/92 backdrop-blur-xl border border-stone-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[9999] transition-all duration-300 ease-out animate-fade-in-up"
          role="region"
          aria-label="Ambient Soundscape Mixer"
        >
          <div className="flex items-center justify-between mb-3 border-b border-stone-800/60 pb-2">
            <div>
              <h4 className="font-serif text-xs font-bold text-stone-100 tracking-wide uppercase">Sensory Mixer</h4>
              <span className="text-[9px] font-sans text-[#E7A852] font-semibold tracking-wider uppercase">Bahrain Soundscapes</span>
            </div>
            <button
              onClick={handlePlayback}
              className={`p-2 rounded-full cursor-pointer transition-all duration-250 flex items-center justify-center ${
                isPlaying 
                  ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Waves Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-sans text-stone-400 font-medium">
                <span className="flex items-center gap-1">🌊 Gulf Waves</span>
                <span>{Math.round(wavesVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wavesVol}
                onChange={(e) => setWavesVol(Number(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#E7A852]"
              />
            </div>

            {/* Wind Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-sans text-stone-400 font-medium">
                <span className="flex items-center gap-1">🌾 Desert Wind</span>
                <span>{Math.round(windVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={windVol}
                onChange={(e) => setWindVol(Number(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#E7A852]"
              />
            </div>

            {/* Oud Drone Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-sans text-stone-400 font-medium">
                <span className="flex items-center gap-1">🎵 Cavern Oud</span>
                <span>{Math.round(oudVol * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={oudVol}
                onChange={(e) => setOudVol(Number(e.target.value))}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-[#E7A852]"
              />
            </div>
          </div>

          <div className="mt-3.5 pt-2 border-t border-stone-800/60 text-center">
            <p className="text-[8px] font-sans text-stone-500 font-medium leading-normal">
              Procedural Web Audio Synthesis<br />
              0 bytes loaded · Real-time DSP
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
