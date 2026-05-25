import { useRef, useEffect, useState } from 'react'

export const CrowdCanvas = ({ src = '/images/peeps/all-peeps.png', rows = 7, cols = 15 }) => {
  const canvasRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imgRef = useRef(null)
  const walkersRef = useRef([])

  useEffect(() => {
    const img = new Image()
    img.src = src

    img.onload = () => {
      imgRef.current = img
      setImageLoaded(true)
    }

    img.onerror = () => {
      // Elegant CDN Fallback if local all-peeps image doesn't exist
      console.warn(`Local sprite sheet not found at ${src}, falling back to Skiper UI CDN...`)
      const fallbackImg = new Image()
      fallbackImg.crossOrigin = 'anonymous'
      fallbackImg.src = 'https://skiper-ui.com/images/peeps/all-peeps.png'
      fallbackImg.onload = () => {
        imgRef.current = fallbackImg
        setImageLoaded(true)
      }
    }
  }, [src])

  useEffect(() => {
    if (!imageLoaded || !imgRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const img = imgRef.current
    const spriteWidth = img.width / cols
    const spriteHeight = img.height / rows

    // Spawn walking travellers with higher density
    const spawnWalkers = (width, height) => {
      const walkers = []
      // Dense crowd populated dynamically based on screen width
      const walkerCount = Math.max(40, Math.min(115, Math.floor(width / 14)))
      
      for (let i = 0; i < walkerCount; i++) {
        // Auto-scale dynamically based on canvas height to perfectly fit the banner (75% to 92% of banner height)
        const targetDrawnHeight = height * (0.75 + Math.random() * 0.17)
        const scale = targetDrawnHeight / spriteHeight
        const direction = Math.random() > 0.5 ? 1 : -1
        
        walkers.push({
          x: Math.random() * (width + 240) - 120,
          y: 0,
          scale,
          speed: 0.14 + Math.random() * 0.36, // Smooth strolling speeds
          direction,
          row: Math.floor(Math.random() * rows),
          col: Math.floor(Math.random() * cols),
          bobOffset: Math.random() * Math.PI * 2,
          bobSpeed: 0.01 + Math.random() * 0.012,
          bobHeight: (1.8 + Math.random() * 2.2) * scale // Proportional bobbing to prevent frantic vibrating
        })
      }
      walkersRef.current = walkers
    }

    const rect = canvas.getBoundingClientRect()
    spawnWalkers(rect.width, rect.height)

    // Canvas render loop
    const render = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const walkers = walkersRef.current

      // Sort walkers by scale so larger ones (foreground) are drawn on top of smaller ones (background) for premium 2.5D depth
      const sortedWalkers = [...walkers].sort((a, b) => a.scale - b.scale)

      sortedWalkers.forEach(walker => {
        // Translate walker coordinates
        walker.x += walker.speed * walker.direction

        // Natural walking leg bobbing curve
        const bob = Math.abs(Math.sin(walker.x * walker.bobSpeed + walker.bobOffset)) * walker.bobHeight

        // Render sprite frame onto canvas
        const sx = walker.col * spriteWidth
        const sy = walker.row * spriteHeight
        const dx = walker.x
        
        // Draw resting on bottom of canvas. 
        // Proportional offset (+18% of drawn scale height) accounts for transparent padding at the bottom of the sprite cell,
        // placing feet perfectly flush on the bottom edge.
        const dy = rect.height - (spriteHeight * walker.scale) - bob + (spriteHeight * walker.scale) * 0.18

        ctx.drawImage(
          img,
          sx, sy, spriteWidth, spriteHeight,
          dx, dy, spriteWidth * walker.scale, spriteHeight * walker.scale
        )

        // Reset and wrap around when walks off viewport bounds
        if (walker.direction === 1 && walker.x > rect.width + 120) {
          walker.x = -120
          walker.row = Math.floor(Math.random() * rows)
          walker.col = Math.floor(Math.random() * cols)
        } else if (walker.direction === -1 && walker.x < -120) {
          walker.x = rect.width + 120
          walker.row = Math.floor(Math.random() * rows)
          walker.col = Math.floor(Math.random() * cols)
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [imageLoaded, rows, cols])

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block bg-transparent select-none pointer-events-none" 
    />
  )
}

export const Skiper39 = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[48px] sm:h-[64px] bg-[#D11A38] z-[45] select-none shadow-[0_-6px_20px_rgba(209,26,56,0.18)] flex flex-col justify-end pointer-events-none">
      {/* The Serrated teeth pointing up into the cream page */}
      <div className="absolute top-[-7px] sm:top-[-9px] left-0 right-0 h-[8px] sm:h-[10px] overflow-hidden">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-full text-[#D11A38] fill-current" style={{ display: 'block' }}>
          <polygon points="0,10 2.5,0 5,10 7.5,0 10,10 12.5,0 15,10 17.5,0 20,10 22.5,0 25,10 27.5,0 30,10 32.5,0 35,10 37.5,0 40,10 42.5,0 45,10 47.5,0 50,10 52.5,0 55,10 57.5,0 60,10 62.5,0 65,10 67.5,0 70,10 72.5,0 75,10 77.5,0 80,10 82.5,0 85,10 87.5,0 90,10 92.5,0 95,10 97.5,0 100,10" />
        </svg>
      </div>
      {/* Peeps walking inside the red banner */}
      <div className="h-[48px] sm:h-[64px] absolute bottom-0 left-0 right-0 overflow-hidden">
        <CrowdCanvas src="/images/peeps/all-peeps.png" rows={7} cols={15} />
      </div>
    </div>
  )
}
