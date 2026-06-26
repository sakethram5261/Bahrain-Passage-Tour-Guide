let audioCtx = null

// Voss-McCartney algorithm for pink noise
const createPinkNoiseBuffer = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  
  let b0 = 0.0, b1 = 0.0, b2 = 0.0, b3 = 0.0, b4 = 0.0, b5 = 0.0, b6 = 0.0
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    output[i] *= 0.11 // rescue gain
    b6 = white * 0.115926
  }
  return noiseBuffer
}

// Simple white noise
const createWhiteNoiseBuffer = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const output = noiseBuffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

class BahrainSoundscape {
  constructor() {
    this.initialized = false
    this.playing = false
    
    // Nodes
    this.ctx = null
    this.masterGain = null
    
    // Wave nodes (Pink noise + LFO filter)
    this.waveSource = null
    this.waveFilter = null
    this.waveGain = null
    this.waveLFO = null
    
    // Wind nodes (White noise + LFO bandpass)
    this.windSource = null
    this.windFilter = null
    this.windGain = null
    this.windLFO = null
    
    // Oud nodes (Drone in Maqam Hijaz: D, F#, A)
    this.oscillators = []
    this.oudGain = null
    this.oudFilter = null
    this.delayNode = null
    this.delayFeedback = null
  }

  init() {
    if (this.initialized) return
    
    // Initialize AudioContext
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    this.ctx = audioCtx
    
    // Master Gain
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime) // fade-in later
    this.masterGain.connect(this.ctx.destination)
    
    // 1. WAVE SYNTHESIS
    const pinkNoise = createPinkNoiseBuffer(this.ctx)
    this.waveSource = this.ctx.createBufferSource()
    this.waveSource.buffer = pinkNoise
    this.waveSource.loop = true
    
    this.waveFilter = this.ctx.createBiquadFilter()
    this.waveFilter.type = 'lowpass'
    this.waveFilter.Q.value = 1.2
    this.waveFilter.frequency.setValueAtTime(450, this.ctx.currentTime)
    
    this.waveLFO = this.ctx.createOscillator()
    this.waveLFO.frequency.setValueAtTime(0.07, this.ctx.currentTime) // 14 seconds per swell
    
    const waveLFOGain = this.ctx.createGain()
    waveLFOGain.gain.setValueAtTime(320, this.ctx.currentTime) // +/- 320Hz sweep
    
    this.waveGain = this.ctx.createGain()
    this.waveGain.gain.setValueAtTime(0.0, this.ctx.currentTime) // muted initially
    
    this.waveLFO.connect(waveLFOGain)
    waveLFOGain.connect(this.waveFilter.frequency)
    this.waveSource.connect(this.waveFilter)
    this.waveFilter.connect(this.waveGain)
    this.waveGain.connect(this.masterGain)
    
    // 2. WIND SYNTHESIS
    const whiteNoise = createWhiteNoiseBuffer(this.ctx)
    this.windSource = this.ctx.createBufferSource()
    this.windSource.buffer = whiteNoise
    this.windSource.loop = true
    
    this.windFilter = this.ctx.createBiquadFilter()
    this.windFilter.type = 'bandpass'
    this.windFilter.Q.value = 4.0
    this.windFilter.frequency.setValueAtTime(350, this.ctx.currentTime)
    
    this.windLFO = this.ctx.createOscillator()
    this.windLFO.frequency.setValueAtTime(0.04, this.ctx.currentTime) // very slow whistle
    
    const windLFOGain = this.ctx.createGain()
    windLFOGain.gain.setValueAtTime(200, this.ctx.currentTime)
    
    this.windGain = this.ctx.createGain()
    this.windGain.gain.setValueAtTime(0.0, this.ctx.currentTime)
    
    this.windLFO.connect(windLFOGain)
    windLFOGain.connect(this.windFilter.frequency)
    this.windSource.connect(this.windFilter)
    this.windFilter.connect(this.windGain)
    this.windGain.connect(this.masterGain)
    
    // 3. OUD DRONE (Maqam Hijaz)
    // Frequencies: D3 (146.83Hz), F#3 (185.00Hz), A3 (220.00Hz), D4 (293.66Hz)
    const freqs = [146.83, 185.00, 220.00, 293.66]
    this.oudGain = this.ctx.createGain()
    this.oudGain.gain.setValueAtTime(0.0, this.ctx.currentTime)
    
    this.oudFilter = this.ctx.createBiquadFilter()
    this.oudFilter.type = 'lowpass'
    this.oudFilter.frequency.setValueAtTime(380, this.ctx.currentTime) // warm tone
    
    // Ambient cavern delay
    this.delayNode = this.ctx.createDelay(1.5)
    this.delayNode.delayTime.setValueAtTime(0.6, this.ctx.currentTime)
    this.delayFeedback = this.ctx.createGain()
    this.delayFeedback.gain.setValueAtTime(0.4, this.ctx.currentTime)
    
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      osc.type = 'triangle' // woody, soft string-like sound
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      
      // Subtle detune chorus
      osc.detune.setValueAtTime(idx * 3.5 - 5.5, this.ctx.currentTime)
      
      const oscGain = this.ctx.createGain()
      oscGain.gain.setValueAtTime(0.12, this.ctx.currentTime) // balance
      
      osc.connect(oscGain)
      oscGain.connect(this.oudFilter)
      this.oscillators.push(osc)
    })
    
    // Connect delay loop
    this.oudFilter.connect(this.oudGain)
    this.oudFilter.connect(this.delayNode)
    this.delayNode.connect(this.delayFeedback)
    this.delayFeedback.connect(this.delayNode)
    this.delayFeedback.connect(this.oudGain)
    
    this.oudGain.connect(this.masterGain)
    
    // Start noise sources and LFOs
    this.waveSource.start(0)
    this.waveLFO.start(0)
    this.windSource.start(0)
    this.windLFO.start(0)
    this.oscillators.forEach(osc => osc.start(0))
    
    this.initialized = true
  }

  start() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    
    this.masterGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 1.5)
    this.playing = true
  }

  stop() {
    if (!this.initialized) return
    this.masterGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 1.0)
    setTimeout(() => {
      if (this.ctx && !this.playing) {
        // Hold context suspended to save CPU
        this.ctx.suspend()
      }
    }, 1100)
    this.playing = false
  }

  setVolumes(waveVol, windVol, oudVol) {
    if (!this.initialized) return
    const t = this.ctx.currentTime
    this.waveGain.gain.linearRampToValueAtTime(waveVol * 0.45, t + 0.2)
    this.windGain.gain.linearRampToValueAtTime(windVol * 0.18, t + 0.2)
    this.oudGain.gain.linearRampToValueAtTime(oudVol * 0.22, t + 0.2)
  }
}

export const soundscape = new BahrainSoundscape()
