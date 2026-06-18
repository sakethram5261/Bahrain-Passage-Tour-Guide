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

export function resetAudioContext() {
  if (audioCtx) {
    audioCtx.close()
    audioCtx = null
  }
}