import { useState, useEffect, useRef } from 'react'

export default function CalligraphyStamp({ onSaveSignature }) {
  const [name, setName] = useState('')
  const [inkColor, setInkColor] = useState('saffron') // saffron, cardamom, oud
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Ink styles definition - rich premium tones matching the light/parchment theme
  const INKS = {
    saffron: {
      name: 'Saffron Crimson',
      color: '#C1122F',
      gradient: ['#D11A38', '#E7A852', '#8B0D22'],
      border: 'border-red-600/30'
    },
    cardamom: {
      name: 'Cardamom Green',
      color: '#1C2E24',
      gradient: ['#1B2E24', '#2C4C3B', '#0E1712'],
      border: 'border-emerald-850/30'
    },
    oud: {
      name: 'Oud Charcoal',
      color: '#362E2B',
      gradient: ['#443834', '#5E4E49', '#241E1C'],
      border: 'border-stone-700/30'
    }
  }

  // Draw the structured, premium calligraphy on the canvas
  const drawCalligraphy = (text, inkKey, progress = 1) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // Clear canvas - transparent background so it sits flush
    ctx.clearRect(0, 0, w, h)

    if (!text.trim()) {
      // Draw placeholder text
      ctx.font = 'italic 12px Georgia, serif'
      ctx.fillStyle = 'rgba(120, 113, 108, 0.45)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Enter your name to carve your seal', w / 2, h / 2)
      return
    }

    // Create ink gradient for the calligraphic strokes
    const grad = ctx.createLinearGradient(w / 2 - 80, h / 2 - 80, w / 2 + 80, h / 2 + 80)
    const ink = INKS[inkKey]
    grad.addColorStop(0, ink.gradient[0])
    grad.addColorStop(0.5, ink.gradient[1])
    grad.addColorStop(1, ink.gradient[2])

    ctx.strokeStyle = grad
    ctx.fillStyle = grad
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Generate pseudo-random seed based on the name to keep the calligraphy consistent per traveler
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }

    const getRand = (min, max, offset) => {
      const value = Math.sin(hash + offset) * 10000
      const rand = value - Math.floor(value)
      return min + rand * (max - min)
    }

    const centerX = w / 2
    const centerY = h / 2

    // Define structural calligraphic strokes - simulating authentic, balanced Arabic composition
    const strokes = []

    // Stroke 1: Bottom Sweeping Crescent (Noon/Ya style baseline)
    const crescentDepth = getRand(35, 45, 1)
    const crescentLeftY = centerY + getRand(10, 18, 2)
    const crescentRightY = centerY + getRand(5, 15, 3)
    const crescentWidth = getRand(40, 48, 4)

    strokes.push({
      type: 'bezier',
      lineWidth: 5.5,
      startX: centerX - crescentWidth,
      startY: crescentLeftY,
      cp1x: centerX - crescentWidth * 0.75,
      cp1y: centerY + crescentDepth,
      cp2x: centerX + crescentWidth * 0.75,
      cp2y: centerY + crescentDepth,
      endX: centerX + crescentWidth,
      endY: crescentRightY
    })

    // Stroke 2: Central Tall Pillar (Alif)
    const pillar1Height = getRand(46, 54, 5)
    const pillar1Curve = getRand(-5, -1, 6)
    strokes.push({
      type: 'pillar',
      lineWidth: 4.0,
      startX: centerX,
      startY: centerY + 22,
      endX: centerX + pillar1Curve,
      endY: centerY - pillar1Height,
      hookX: centerX + pillar1Curve - 6,
      hookY: centerY - pillar1Height + 3
    })

    // Stroke 3: Left Pillar
    const pillar2Height = getRand(36, 42, 7)
    const pillar2Curve = getRand(-3, 1, 8)
    strokes.push({
      type: 'pillar',
      lineWidth: 3.2,
      startX: centerX - 14,
      startY: centerY + 18,
      endX: centerX - 14 + pillar2Curve,
      endY: centerY - pillar2Height,
      hookX: centerX - 14 + pillar2Curve - 5,
      hookY: centerY - pillar2Height + 2
    })

    // Stroke 4: Right Pillar
    const pillar3Height = getRand(38, 44, 9)
    const pillar3Curve = getRand(1, 5, 10)
    strokes.push({
      type: 'pillar',
      lineWidth: 3.2,
      startX: centerX + 14,
      startY: centerY + 18,
      endX: centerX + 14 + pillar3Curve,
      endY: centerY - pillar3Height,
      hookX: centerX + 14 + pillar3Curve - 5,
      hookY: centerY - pillar3Height + 2
    })

    // Stroke 5: Sweeping Diagonal Flourish (Kaf/Ya upper stroke)
    const flourishStartY = centerY - getRand(12, 22, 11)
    const flourishEndX = centerX + getRand(34, 44, 12)
    const flourishEndY = centerY - getRand(28, 38, 13)
    strokes.push({
      type: 'bezier',
      lineWidth: 2.8,
      startX: centerX - 28,
      startY: flourishStartY,
      cp1x: centerX - 12,
      cp1y: centerY - 40,
      cp2x: centerX + 12,
      cp2y: centerY - 40,
      endX: flourishEndX,
      endY: flourishEndY
    })

    // Stroke 6: Left accent swoop
    strokes.push({
      type: 'bezier',
      lineWidth: 2.0,
      startX: centerX - 40,
      startY: centerY - 4,
      cp1x: centerX - 36,
      cp1y: centerY + 10,
      cp2x: centerX - 24,
      cp2y: centerY + 8,
      endX: centerX - 20,
      endY: centerY - 2
    })

    // Stroke 7: Right accent swoop
    strokes.push({
      type: 'bezier',
      lineWidth: 2.0,
      startX: centerX + 20,
      startY: centerY - 2,
      cp1x: centerX + 24,
      cp1y: centerY + 8,
      cp2x: centerX + 36,
      cp2y: centerY + 10,
      endX: centerX + 40,
      endY: centerY - 4
    })

    // Calligraphic Diamonds / Dots (nuqta) - placed in structurally balanced locations
    const dots = []
    // Bottom dot (below crescent)
    dots.push({ x: centerX + getRand(-4, 4, 14), y: centerY + crescentDepth + getRand(12, 15, 15), size: getRand(5, 6, 16) })
    
    // Upper-left dot
    if (getRand(0, 1, 17) > 0.35) {
      dots.push({ x: centerX - 24 + getRand(-3, 3, 18), y: centerY - 20 + getRand(-3, 3, 19), size: getRand(4, 5, 20) })
    }
    // Upper-right dot (potentially double dot)
    if (getRand(0, 1, 21) > 0.4) {
      dots.push({ x: centerX + 24 + getRand(-3, 3, 22), y: centerY - 16 + getRand(-3, 3, 23), size: getRand(4, 5, 24) })
      if (getRand(0, 1, 25) > 0.65) {
        dots.push({ x: centerX + 30 + getRand(-3, 3, 26), y: centerY - 22 + getRand(-3, 3, 27), size: getRand(3.5, 4.5, 28) })
      }
    }

    // Small calligraphic vowel dashes (harakat)
    const accents = []
    accents.push({ type: 'dash', x: centerX + 18, y: centerY - 44, length: 7 })
    accents.push({ type: 'dash', x: centerX - 18, y: centerY - 48, length: 6 })

    // Draw elements based on progress
    const totalElements = strokes.length + dots.length + accents.length
    const visibleCount = Math.floor(totalElements * progress)

    let drawnCount = 0

    // 1. Draw main calligraphic lines
    for (const stroke of strokes) {
      if (drawnCount >= visibleCount) break
      ctx.beginPath()
      ctx.lineWidth = stroke.lineWidth

      if (stroke.type === 'bezier') {
        ctx.moveTo(stroke.startX, stroke.startY)
        ctx.bezierCurveTo(stroke.cp1x, stroke.cp1y, stroke.cp2x, stroke.cp2y, stroke.endX, stroke.endY)
        ctx.stroke()
      } else if (stroke.type === 'pillar') {
        ctx.moveTo(stroke.startX, stroke.startY)
        ctx.lineTo(stroke.endX, stroke.endY)
        ctx.stroke()

        // Draw top calligraphic hook
        ctx.beginPath()
        ctx.lineWidth = stroke.lineWidth * 0.75
        ctx.moveTo(stroke.endX, stroke.endY)
        ctx.quadraticCurveTo(stroke.hookX, stroke.hookY, stroke.endX - 3, stroke.endY + 6)
        ctx.stroke()
      }
      drawnCount++
    }

    // 2. Draw traditional diamond dots (nuqtas)
    for (const dot of dots) {
      if (drawnCount >= visibleCount) break
      ctx.save()
      ctx.translate(dot.x, dot.y)
      ctx.rotate(Math.PI / 4) // 45-degree calligraphic tilt
      ctx.fillRect(-dot.size / 2, -dot.size / 2, dot.size, dot.size)
      ctx.restore()
      drawnCount++
    }

    // 3. Draw vowel dashes
    for (const accent of accents) {
      if (drawnCount >= visibleCount) break
      ctx.beginPath()
      ctx.lineWidth = 1.6
      if (accent.type === 'dash') {
        ctx.moveTo(accent.x - accent.length / 2, accent.y - accent.length / 3)
        ctx.lineTo(accent.x + accent.length / 2, accent.y + accent.length / 3)
      }
      ctx.stroke()
      drawnCount++
    }

    // Draw elegant vintage double circular border frame
    // Outer solid ring
    ctx.beginPath()
    ctx.lineWidth = 1.8
    ctx.strokeStyle = `rgba(${hexToRgb(ink.color)}, 0.4)`
    ctx.arc(centerX, centerY, 75, 0, Math.PI * 2)
    ctx.stroke()

    // Inner dashed ring
    ctx.beginPath()
    ctx.lineWidth = 1.0
    ctx.strokeStyle = `rgba(${hexToRgb(ink.color)}, 0.22)`
    ctx.setLineDash([4, 4])
    ctx.arc(centerX, centerY, 70, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([]) // reset
  }

  // Hex to RGB helper
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  // Trigger animation on name or color change
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    
    let start = null
    const duration = 850 // ms

    const stepAnim = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      
      drawCalligraphy(name, inkColor, progress)
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(stepAnim)
      }
    }

    animRef.current = requestAnimationFrame(stepAnim)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [name, inkColor])

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !name.trim()) return
    const signatureDataUrl = canvas.toDataURL('image/png')
    
    if (onSaveSignature) {
      onSaveSignature(signatureDataUrl)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto p-1 bg-transparent">
      <div className="text-center w-full">
        <h3 className="font-serif text-xs font-bold text-stone-800 tracking-wide uppercase">Calligraphy Seal</h3>
        <p className="text-[9px] font-sans text-stone-500 font-medium mt-0.5">Carve your traveler name into an organic wax signature</p>
      </div>

      {/* The Canvas */}
      <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-stone-200 bg-[#FCFBF9] shadow-inner flex items-center justify-center">
        {/* Subtle parchment grain overlay */}
        <div className="absolute inset-0 paper-grain pointer-events-none opacity-25" />
        <canvas
          ref={canvasRef}
          width={360}
          height={180}
          className="w-full h-full block z-10"
        />
      </div>

      {/* Ink Wells */}
      <div className="flex items-center justify-center gap-3 w-full">
        {Object.entries(INKS).map(([key, ink]) => (
          <button
            key={key}
            onClick={() => setInkColor(key)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
              inkColor === key
                ? 'bg-white border-amber-500/60 scale-105 shadow-sm'
                : 'bg-stone-100/50 border-stone-200/60 hover:bg-stone-100'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full border border-black/10 shadow-inner"
              style={{ background: `radial-gradient(circle at 35% 35%, ${ink.gradient[1]} 0%, ${ink.color} 70%, ${ink.gradient[2]} 100%)` }}
            />
            <span className="text-[8px] font-sans font-bold text-stone-600 uppercase tracking-wider">{ink.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Input Box & Action */}
      <div className="w-full flex gap-2">
        <input
          type="text"
          maxLength={12}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Traveler Name..."
          className="flex-1 px-3 py-2 text-xs font-serif bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500/60 placeholder-stone-400 tracking-wide shadow-2xs"
        />
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-amber-500/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
        >
          Carve Seal
        </button>
      </div>
    </div>
  )
}
