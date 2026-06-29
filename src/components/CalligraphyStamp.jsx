import { useState, useEffect, useRef, useCallback } from 'react'

// Hex to RGB helper
const hexToRgb = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

// Map A-Z letters to specific calligraphic shapes to create unique Arabic-style monogram seals
const LETTER_CONFIGS = {
  'A': { type: 'pillar', height: 42, hook: -5 },
  'B': { type: 'loop_flat', dots: { pos: 'below', count: 1 } },
  'C': { type: 'crescent_left', dots: { pos: 'above', count: 1 } },
  'D': { type: 'loop_flat', hook: 3 },
  'E': { type: 'loop_flat', dots: { pos: 'above', count: 2 } },
  'F': { type: 'loop_up', dots: { pos: 'above', count: 1 } },
  'G': { type: 'crescent_left', dots: { pos: 'above', count: 2 } },
  'H': { type: 'pillar_fork', height: 38 },
  'I': { type: 'pillar', height: 34, dots: { pos: 'above', count: 1 } },
  'J': { type: 'crescent_left', dots: { pos: 'below', count: 1 } },
  'K': { type: 'pillar', height: 40, flourish: true },
  'L': { type: 'pillar', height: 42, hook: -4 },
  'M': { type: 'loop_down' },
  'N': { type: 'crescent_up', dots: { pos: 'above', count: 1 } },
  'O': { type: 'loop_down', dots: { pos: 'above', count: 1 } },
  'P': { type: 'loop_flat', dots: { pos: 'below', count: 3 } },
  'Q': { type: 'crescent_left', dots: { pos: 'above', count: 2 } },
  'R': { type: 'tail_down' },
  'S': { type: 'crescent_up', dots: { pos: 'above', count: 3 } },
  'T': { type: 'loop_flat', dots: { pos: 'above', count: 2 } },
  'U': { type: 'crescent_up' },
  'V': { type: 'tail_down', dots: { pos: 'above', count: 1 } },
  'W': { type: 'tail_down' },
  'X': { type: 'pillar_fork', height: 32 },
  'Y': { type: 'crescent_up', dots: { pos: 'below', count: 2 } },
  'Z': { type: 'tail_down', dots: { pos: 'above', count: 1 } }
}

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

export default function CalligraphyStamp({ onSaveSignature }) {
  const [name, setName] = useState('')
  const [inkColor, setInkColor] = useState('saffron') // saffron, cardamom, oud
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  // Draw the structured, premium calligraphy on the canvas
  const drawCalligraphy = useCallback((text, inkKey, progress = 1) => {
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

    const centerX = w / 2
    const centerY = h / 2

    const cleanText = text.trim().toUpperCase()
    const chars = cleanText.split('').filter(c => LETTER_CONFIGS[c] || c === ' ')
    const len = chars.length

    if (len === 0) {
      ctx.font = 'italic 12px Georgia, serif'
      ctx.fillStyle = 'rgba(120, 113, 108, 0.45)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Enter valid letters to carve your seal', w / 2, h / 2)
      return
    }

    // Define the bounding box for the name strokes
    const totalWidth = Math.min(140, Math.max(30, len * 16))
    const startX = centerX - totalWidth / 2
    const spacing = len > 1 ? totalWidth / (len - 1) : 0

    const strokes = []
    const dots = []
    const accents = []

    // 1. Draw a baseline sweeping crescent at the bottom (connecting element)
    const crescentWidth = Math.max(30, totalWidth * 0.6)
    strokes.push({
      type: 'bezier',
      lineWidth: 4.8,
      startX: centerX - crescentWidth,
      startY: centerY + 14,
      cp1x: centerX - crescentWidth * 0.65,
      cp1y: centerY + 34,
      cp2x: centerX + crescentWidth * 0.65,
      cp2y: centerY + 34,
      endX: centerX + crescentWidth,
      endY: centerY + 12
    })

    // 2. Process each letter
    for (let i = 0; i < len; i++) {
      const char = chars[i]
      if (char === ' ') continue

      const charX = len > 1 ? startX + i * spacing : centerX
      const config = LETTER_CONFIGS[char] || { type: 'pillar', height: 32 }
      const charY = centerY + 12 // Connection to the baseline

      // Generate slight variations based on character code and position to make it look organic
      const charHash = char.charCodeAt(0) + i
      const varHeight = (charHash % 6) - 3 // -3 to +3 px variation
      const varX = (charHash % 4) - 2 // -2 to +2 px variation
      const cx = charX + varX

      if (config.type === 'pillar') {
        const height = (config.height || 32) + varHeight
        strokes.push({
          type: 'pillar',
          lineWidth: 3.2,
          startX: cx,
          startY: charY,
          endX: cx - 1,
          endY: charY - height,
          hookX: cx - 6,
          hookY: charY - height + 1
        })
      } 
      else if (config.type === 'pillar_fork') {
        const height = (config.height || 30) + varHeight
        strokes.push({
          type: 'pillar',
          lineWidth: 3.0,
          startX: cx,
          startY: charY,
          endX: cx - 1,
          endY: charY - height,
          hookX: cx - 7,
          hookY: charY - height + 1
        })
        // Fork branch
        strokes.push({
          type: 'bezier',
          lineWidth: 2.0,
          startX: cx - 1,
          startY: charY - height * 0.5,
          cp1x: cx + 6,
          cp1y: charY - height * 0.75,
          cp2x: cx + 8,
          cp2y: charY - height + 2,
          endX: cx + 6,
          endY: charY - height
        })
      }
      else if (config.type === 'loop_flat') {
        strokes.push({
          type: 'bezier',
          lineWidth: 2.8,
          startX: cx - 7,
          startY: charY - 2,
          cp1x: cx - 5,
          cp1y: charY + 5,
          cp2x: cx + 5,
          cp2y: charY + 5,
          endX: cx + 7,
          endY: charY - 3
        })
      }
      else if (config.type === 'loop_up') {
        strokes.push({
          type: 'bezier',
          lineWidth: 2.6,
          startX: cx - 4,
          startY: charY,
          cp1x: cx - 6,
          cp1y: charY - 14,
          cp2x: cx + 6,
          cp2y: charY - 14,
          endX: cx + 4,
          endY: charY
        })
      }
      else if (config.type === 'loop_down') {
        strokes.push({
          type: 'bezier',
          lineWidth: 2.6,
          startX: cx - 5,
          startY: charY - 4,
          cp1x: cx - 8,
          cp1y: charY - 1,
          cp2x: cx - 1,
          cp2y: charY + 10,
          endX: cx + 3,
          endY: charY
        })
      }
      else if (config.type === 'crescent_left') {
        strokes.push({
          type: 'bezier',
          lineWidth: 3.0,
          startX: cx - 3,
          startY: charY - 12,
          cp1x: cx + 10,
          cp1y: charY - 10,
          cp2x: cx + 10,
          cp2y: charY + 8,
          endX: cx - 6,
          endY: charY + 6
        })
      }
      else if (config.type === 'crescent_up') {
        strokes.push({
          type: 'bezier',
          lineWidth: 2.8,
          startX: cx - 6,
          startY: charY - 10,
          cp1x: cx - 4,
          cp1y: charY + 3,
          cp2x: cx + 4,
          cp2y: charY + 3,
          endX: cx + 6,
          endY: charY - 8
        })
      }
      else if (config.type === 'tail_down') {
        strokes.push({
          type: 'bezier',
          lineWidth: 3.0,
          startX: cx,
          startY: charY - 2,
          cp1x: cx + 3,
          cp1y: charY + 3,
          cp2x: cx - 2,
          cp2y: charY + 11,
          endX: cx - 5,
          endY: charY + 9
        })
      }

      if (config.flourish) {
        strokes.push({
          type: 'bezier',
          lineWidth: 2.0,
          startX: cx - 6,
          startY: charY - 22,
          cp1x: cx - 1,
          cp1y: charY - 28,
          cp2x: cx + 3,
          cp2y: charY - 18,
          endX: cx + 5,
          endY: charY - 13
        })
      }

      // Add character dots (nuqtas)
      if (config.dots) {
        const dotY = config.dots.pos === 'above' ? charY - 24 : charY + 12
        const dotSize = 3.6
        if (config.dots.count === 1) {
          dots.push({ x: cx, y: dotY, size: dotSize })
        } else if (config.dots.count === 2) {
          dots.push({ x: cx - 2.5, y: dotY, size: dotSize })
          dots.push({ x: cx + 2.5, y: dotY, size: dotSize })
        } else if (config.dots.count === 3) {
          dots.push({ x: cx - 3.5, y: dotY + 1.5, size: dotSize })
          dots.push({ x: cx + 3.5, y: dotY + 1.5, size: dotSize })
          dots.push({ x: cx, y: dotY - 1.5, size: dotSize })
        }
      }

      // Add occasional vowel accent (harakat) above
      if (charHash % 4 === 0) {
        accents.push({ type: 'dash', x: cx + 3, y: charY - 28, length: 4 })
      }
    }

    // Draw elements based on progress (for organic drawing feel)
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
        ctx.quadraticCurveTo(stroke.hookX, stroke.hookY, stroke.endX - 2, stroke.endY + 5)
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
  }, [])

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
  }, [name, inkColor, drawCalligraphy])

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
