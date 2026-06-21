let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playTypewriterClick(pitchMultiplier = 1.0, soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sine'
    const startFreq = 1150 * pitchMultiplier
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.04)

    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(500, ctx.currentTime)
    filter.Q.setValueAtTime(5, ctx.currentTime)

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.12 * soundVolume, ctx.currentTime + 0.003)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)

    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  } catch { /* ignore */ }
}

export function playPageSwish(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const bufferSize = ctx.sampleRate * 0.35
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    const baseFreq = 400 + Math.random() * 80
    filter.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
    filter.Q.setValueAtTime(3.0, ctx.currentTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08 * soundVolume, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start()
  } catch { /* ignore */ }
}

export function playOudPluck(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const playString = (frequency, delayTime, gainVolume) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delayTime)
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delayTime)
      gainNode.gain.linearRampToValueAtTime(gainVolume * soundVolume, ctx.currentTime + delayTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delayTime + 1.2)
      
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      osc.start(ctx.currentTime + delayTime)
      osc.stop(ctx.currentTime + delayTime + 1.3)
    }
    
    playString(146.83, 0.0, 0.22)   // D3
    playString(220.00, 0.04, 0.16)  // A3
    playString(293.66, 0.08, 0.12)  // D4
  } catch { /* ignore */ }
}

export function playDiscoverySuccess(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(523.25, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08 * soundVolume, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}

export function playScanBeep(freq = 800, duration = 0.08, soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.04 * soundVolume, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration - 0.01)
    
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch { /* ignore */ }
}

export function playCampStampSound(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15) // D6
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.08 * soundVolume, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch { /* ignore */ }
}

export function playRiddleCorrect(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.15 * soundVolume, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* ignore */ }
}

export function playRiddleIncorrect(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2 * soundVolume, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch { /* ignore */ }
}

export function playDaySealStamp(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(90, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.25)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.24 * soundVolume, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.24)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch { /* ignore */ }
}

export function playRankUpChime(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const playNote = (freq, delay, dur) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay)
      gain.gain.setValueAtTime(0, ctx.currentTime + delay)
      gain.gain.linearRampToValueAtTime(0.2 * soundVolume, ctx.currentTime + delay + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur - 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur)
    }
    playNote(261.63, 0, 0.2) // C4
    playNote(329.63, 0.15, 0.2) // E4
    playNote(392.00, 0.3, 0.2) // G4
    playNote(523.25, 0.45, 0.5) // C5
  } catch { /* ignore */ }
}

export function playPhraseFeedbackTone(soundVolume = 1, soundMuted = false) {
  if (soundMuted) return
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.04 * soundVolume, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.22)
  } catch { /* ignore */ }
}

export function resetAudioContext() {
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
}