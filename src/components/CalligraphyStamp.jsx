import { useState, useEffect, useRef } from 'react'

export default function CalligraphyStamp({ onSaveSignature }) {
  const [name, setName] = useState('')
  const [inkColor, setInkColor] = useState('saffron') // saffron, cardamom, oud
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Ink styles definition
  const INKS = {
    saffron: {
      name: 'Saffron Crimson',
      color: '#C8102E',
      gradient: ['#D11A38', '#E7A852', '#960B22'],
      border: 'border-amber-600/30'
    },
    cardamom: {
      name: 'Cardamom Green-Black',
      color: '#1C2E24',
      gradient: ['#1B2E24', '#2C4C3B', '#0E1712'],
      border: 'border-emerald-800/30'
    },
    oud: {
      name: 'Oud Charcoal',
      color: '#362E2B',
      gradient: ['#443834', '#5E4E49', '#241E1C'],
      border: 'border-stone-700/30'
    }
  }

  // Draw the calligraphy on the canvas
  const drawCalligraphy = (text, inkKey, progress = 1) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, w, h)

    // Set background texture - extremely light parchment wash
    ctx.fillStyle = 'rgba(254, 253, 247, 0.05)'
    ctx.fillRect(0, 0, w, h)

    if (!text) {
      // Draw placeholder text
      ctx.font = 'italic 13px Georgia, serif'
      ctx.fillStyle = 'rgba(120, 113, 108, 0.4)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Enter your name to carve your seal', w / 2, h / 2)
      return
    }

    // Create ink gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    const ink = INKS[inkKey]
    grad.addColorStop(0, ink.gradient[0])
    grad.addColorStop(0.5, ink.gradient[1])
    grad.addColorStop(1, ink.gradient[2])

    ctx.strokeStyle = grad
    ctx.fillStyle = grad
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Generate pseudo-random seed based on the user name to keep the calligraphy consistent
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash)
    }

    const getRand = (min, max, offset) => {
      const value = Math.sin(hash + offset) * 10000
      const rand = value - Math.floor(value)
      return min + rand * (max - min)
    }

    // Number of glyph blocks based on name length
    const numGlyphs = Math.min(Math.max(text.length, 3), 8)
    const padding = 60
    const startX = padding
    const endX = w - padding
    const stepX = (endX - startX) / (numGlyphs - 1)
    const centerY = h / 2

    // Draw main sweeping calligraphic baseline (procedural)
    ctx.beginPath()
    ctx.lineWidth = 4.5
    
    // Draw the baseline flourish
    let currX = startX
    let currY = centerY + getRand(-10, 10, 0)
    ctx.moveTo(currX, currY)

    const points = []
    points.push({ x: currX, y: currY })

    for (let i = 1; i < numGlyphs; i++) {
      const nextX = startX + i * stepX
      const nextY = centerY + getRand(-25, 25, i * 10)
      const cp1x = currX + stepX * 0.4
      const cp1y = currY - getRand(30, 80, i * 20)
      const cp2x = currX + stepX * 0.6
      const cp2y = nextY + getRand(30, 80, i * 30)

      points.push({ x: nextX, y: nextY, cp1x, cp1y, cp2x, cp2y })

      currX = nextX
      currY = nextY
    }

    // Drawing baseline under progress animation
    const drawLimit = Math.floor(points.length * progress)
    if (drawLimit > 0) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < drawLimit; i++) {
        const pt = points[i]
        ctx.bezierCurveTo(pt.cp1x, pt.cp1y, pt.cp2x, pt.cp2y, pt.x, pt.y)
      }
      ctx.stroke()
    }

    // Draw vertical strokes, loop accents, and traditional dots (harakat)
    for (let i = 0; i < drawLimit; i++) {
      const pt = points[i]
      const offset = i * 15

      // 1. Vertical sweeps (Alif-like pillars)
      if (getRand(0, 1, offset) > 0.3) {
        ctx.beginPath()
        ctx.lineWidth = getRand(2, 5, offset + 1)
        const topY = pt.y - getRand(40, 85, offset + 2)
        ctx.moveTo(pt.x, pt.y)
        // Elegant bezier hook at the top of Alif
        ctx.bezierCurveTo(pt.x - 4, pt.y - 30, pt.x + 8, topY + 15, pt.x, topY)
        ctx.stroke()
      }

      // 2. Loop accents (like Waw or Fa)
      if (getRand(0, 1, offset + 3) > 0.6 && i < drawLimit - 1) {
        ctx.beginPath()
        ctx.lineWidth = 3
        const rx = getRand(10, 22, offset + 4)
        const ry = getRand(8, 16, offset + 5)
        ctx.ellipse(pt.x + stepX * 0.5, pt.y + 10, rx, ry, getRand(-0.2, 0.2, offset + 6), 0, Math.PI * 2)
        ctx.stroke()
      }

      // 3. Traditional calligraphic diamonds/dots (nuqta)
      if (getRand(0, 1, offset + 7) > 0.4) {
        const dotX = pt.x + getRand(-15, 15, offset + 8)
        const dotY = pt.y + (getRand(0, 1, offset + 9) > 0.5 ? -45 : 40)
        const dotSize = getRand(4, 7, offset + 10)
        
        ctx.save()
        ctx.translate(dotX, dotY)
        ctx.rotate(Math.PI / 4) // 45 degree tilt for calligraphic pen shape
        ctx.fillRect(-dotSize / 2, -dotSize / 2, dotSize, dotSize)
        ctx.restore()
      }

      // 4. Decorative small vowel dashes (harakat / fatha)
      if (getRand(0, 1, offset + 11) > 0.7) {
        const dashX = pt.x + getRand(-10, 10, offset + 12)
        const dashY = pt.y - 65
        ctx.beginPath()
        ctx.lineWidth = 1.8
        ctx.moveTo(dashX - 8, dashY - 4)
        ctx.lineTo(dashX + 8, dashY + 4)
        ctx.stroke()
      }
    }

    // Draw final decorative border frame (vintage oval stamp frame)
    ctx.beginPath()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = `rgba(${hexToRgb(ink.color)}, 0.22)`
    ctx.setLineDash([8, 6])
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 8, 0, Math.PI * 2)
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
    const duration = 950 // ms

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

  // Save the stamp signature
  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !name.trim()) return
    const signatureDataUrl = canvas.toDataURL('image/png')
    
    if (onSaveSignature) {
      onSaveSignature(signatureDataUrl)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-sm mx-auto p-4 bg-stone-900/40 border border-stone-800/80 rounded-2xl backdrop-blur-md">
      <div className="text-center w-full">
        <h3 className="font-serif text-sm font-bold text-stone-200 tracking-wide uppercase">Calligraphy Seal</h3>
        <p className="text-[10px] font-sans text-stone-500 font-medium mt-0.5">Carve your traveler name into an organic wax signature</p>
      </div>

      {/* The Canvas Canvas */}
      <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-stone-800 bg-[#FAF9F6] shadow-inner flex items-center justify-center">
        {/* Subtle parchment grain overlay */}
        <div className="absolute inset-0 paper-grain pointer-events-none opacity-20" />
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
                ? 'bg-stone-800/80 border-amber-500/60 scale-105 shadow-md'
                : 'bg-stone-950/20 border-transparent hover:bg-stone-800/30'
            }`}
          >
            <span
              className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
              style={{ background: `radial-gradient(circle at 35% 35%, ${ink.gradient[1]} 0%, ${ink.color} 70%, ${ink.gradient[2]} 100%)` }}
            />
            <span className="text-[9px] font-sans font-semibold text-stone-400 uppercase tracking-wider">{ink.name.split(' ')[0]}</span>
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
          className="flex-1 px-3 py-2 text-xs font-serif bg-stone-950/40 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500/60 placeholder-stone-600 tracking-wide"
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
