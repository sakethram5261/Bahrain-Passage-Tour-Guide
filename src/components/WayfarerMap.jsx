import { useState, useEffect } from 'react'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'

// Helper to clean and format legend name
const formatLegendName = (name) => {
  let clean = name.replace(/\s*\(.*\)/g, '')
  clean = clean.trim()
  if (clean.length > 20) return clean.substring(0, 18) + '...'
  return clean
}

// Helper to get category icons
const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case 'fort': return '🏰'
    case 'souq': return '🕌'
    case 'coast': return '🦪'
    case 'culture': return '🏺'
    case 'desert': return '🌳'
    case 'modern': return '✨'
    default: return '📍'
  }
}


// Bounding boxes for Bahrain geography coordinates mapping
const MIN_LAT = 25.95
const MAX_LAT = 26.28
const MIN_LON = 50.42
const MAX_LON = 50.80

// Comprehensive poetic clues for all 18 landmark spots
const SPOT_CLUES = {
  'qal-at-al-bahrain': 'The grand stone fortress standing watch over the northern deeps, where strata marks 4,000 harvests of empires. Four millennia beneath your boots.',
  'muharraq-souq': 'A maze of traditional alleyways breathing spices, saffron, and Bahraini halwa under generational merchant arches.',
  'pearling-path': 'Walk the UNESCO shoreline where bare-chested divers once plunged to 20 meters with nothing but a wooden nose clip and a prayer.',
  'block-338': 'The bohemian arts neighborhood packed with local murals, neon glass, and string-lit dining alleys of modern Manama.',
  'jarada-island': 'Where the ocean retreats, a sandbar appears, white as fresh milk and dry for only a few hours. Safe only at low tide.',
  'tree-of-life': 'A lone green canopy standing 400 years in the barren desert with no visible water source for miles. A botanical miracle in parched sands.',
  'haji-cafe': "Tucked in a narrow alley, since 1950 they bring you whatever is cooking — no menu, no fuss, just warm bread and cardamom karak.",
  'aali-pottery': "Bahrain's ancient craft village where potters still throw clay by hand on wheels spinning since the Dilmun era.",
  'arad-fort': 'A 16th-century Portuguese-era watchtower surrounded by a sea moat, guarding the strait between two islands.',
  'national-museum': 'The Kingdom\'s grand archaeological archive — from Dilmun burial mounds to pearl-diving maritime relics spanning 6,000 years.',
  'al-dar-islands': 'A cluster of white coral islands reachable only by dhow, where the reef glows turquoise and flamingos wade the shallows.',
  'reef-island': 'The glamorous reclaimed waterfront where glass towers and neon reflections shimmer across the night marina.',
  'riffa-fort': 'Perched above the Hunanaiyah valley, this walled palace-fortress was where Al Khalifa rulers summered in regal isolation.',
  'barbar-temple': 'Ancient 3-tiered Dilmun temple complex buried under Bahraini soil for 4,000 years, dedicated to freshwater god Enki.',
  'al-jasra-house': 'A traditional coral-stone dwelling from 1907, birthplace of a Bahraini amir, preserved in the village of Al Jasra.',
  'khalaf-house': 'The most ornate wind-tower house in the Gulf — a merchant trader\'s mansion decorated with carved gypsum lattice screens.',
  'manama-souq': 'The oldest continuous market in the Gulf, where gold, frankincense, and spice traders have bartered since the 1800s.',
  'al-areen': 'A protected desert wildlife sanctuary sheltering rare Arabian Oryx, desert gazelle, and native flora in the Sakhir dunes.',
}

// Real-world coordinate polygons for Bahrain geography outlines
const BAHRAIN_MAIN_COORDS = [
  [26.255, 50.565], // Reef Island / North Seef
  [26.250, 50.555], // Seef
  [26.245, 50.540], // West Seef
  [26.232, 50.510], // Karranah
  [26.230, 50.485], // Barbar
  [26.225, 50.465], // Diraz
  [26.215, 50.450], // Budaiya
  [26.180, 50.453], // North Jasra
  [26.155, 50.460], // Al Jasra
  [26.120, 50.463], // Hamala / Dumistan
  [26.090, 50.470], // Malkiya
  [26.060, 50.475], // Zallaq North
  [26.035, 50.480], // Zallaq
  [25.990, 50.485], // Wasmiya / Al Areen
  [25.950, 50.490], // Bottom Left (extends to bottom edge)
  [25.950, 50.635], // Bottom Right (extends to bottom edge)
  [25.980, 50.630], // Jaww
  [26.020, 50.625], // Askar South
  [26.060, 50.622], // Askar
  [26.100, 50.612], // East Riffa / Eker
  [26.140, 50.608], // Ma'ameer
  [26.170, 50.612], // Sitra bridge
  [26.205, 50.600], // Sitra causeway
  [26.235, 50.595], // Diplomatic Area / Bridge
  [26.248, 50.585], // Manama North Corniche
]

const MUHARRAQ_COORDS = [
  [26.240, 50.605], // Bridge to Manama
  [26.255, 50.600], // Busaiteen
  [26.275, 50.615], // Dair / Samaheej
  [26.280, 50.635], // Galali
  [26.270, 50.660], // Amwaj Islands
  [26.245, 50.655], // Hidd East
  [26.220, 50.650], // Hidd South
  [26.230, 50.625], // Arad Fort area
  [26.235, 50.615], // Halat Seltah
]

const SITRA_COORDS = [
  [26.170, 50.620], // North Sitra
  [26.165, 50.635], // East Sitra
  [26.150, 50.640], // Sitra Port
  [26.135, 50.635], // South Sitra East
  [26.125, 50.625], // South Sitra
  [26.130, 50.615], // West Sitra
  [26.150, 50.612], // Sitra Village
  [26.165, 50.615], // Sitra Causeway
]

export default function WayfarerMap({ locations, onClose }) {
  const { 
    currentDayTab, 
    currentSpotIndex, 
    setCurrentSpotIndex, 
    collectedKeepsakes, 
    setActiveLeaf,
    goldFils,
    setGoldFils,
    awardXP,
    passportStamps,
    setPassportStamps,
    pearlsCollected,
    setPearlsCollected,
  } = useVibe()
  const [hoveredSpot, setHoveredSpot] = useState(null)
  
  // Dilmun Pearl Hunt Local UI States (non-persistent visual feedback)
  const [pearlChestAnim, setPearlChestAnim] = useState(null)
  const [showClueScroll, setShowClueScroll] = useState(false)
  const [pearlAlert, setPearlAlert] = useState(null)

  // Interactive Zoom/Pan States
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragDistance, setDragDistance] = useState(0)
  const [startCoords, setStartCoords] = useState({ x: 0, y: 0 })

  const mapWidth = 550
  const mapHeight = 360
  const MIN_ZOOM = 1
  const MAX_ZOOM = 5

  // Drag & Pan handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Left click only
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true)
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y })
    setDragDistance(0)
    setStartCoords({ x: clientX, y: clientY })
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return
    const dx = clientX - startCoords.x
    const dy = clientY - startCoords.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    setDragDistance(distance)

    const newX = clientX - dragStart.x
    const newY = clientY - dragStart.y

    // Constrain pan boundaries to prevent map from being dragged completely out of view
    const margin = 100
    const maxPanX = (zoom - 1) * mapWidth
    const maxPanY = (zoom - 1) * mapHeight

    // Keep center locked at zoom = 1
    const boundedX = zoom === 1 ? 0 : Math.max(-maxPanX - margin, Math.min(margin, newX))
    const boundedY = zoom === 1 ? 0 : Math.max(-maxPanY - margin, Math.min(margin, newY))

    setPan({ x: boundedX, y: boundedY })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Mouse wheel zoom relative to cursor position in SVG coordinates
  const handleWheel = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const svgX = (mouseX / rect.width) * mapWidth
    const svgY = (mouseY / rect.height) * mapHeight

    const zoomFactor = 1.15
    let newZoom = zoom
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, MAX_ZOOM)
    } else {
      newZoom = Math.max(zoom / zoomFactor, MIN_ZOOM)
    }

    if (newZoom !== zoom) {
      const scaleChange = newZoom / zoom
      const nextPanX = svgX - (svgX - pan.x) * scaleChange
      const nextPanY = svgY - (svgY - pan.y) * scaleChange

      const maxPanX = (newZoom - 1) * mapWidth
      const maxPanY = (newZoom - 1) * mapHeight
      const margin = 100

      setZoom(newZoom)
      setPan({
        x: newZoom === 1 ? 0 : Math.max(-maxPanX - margin, Math.min(margin, nextPanX)),
        y: newZoom === 1 ? 0 : Math.max(-maxPanY - margin, Math.min(margin, nextPanY))
      })
    }
  }

  // Floating button zoom helpers
  const zoomIn = (e) => {
    e.stopPropagation()
    const newZoom = Math.min(zoom * 1.3, MAX_ZOOM)
    adjustZoom(newZoom)
  }

  const zoomOut = (e) => {
    e.stopPropagation()
    const newZoom = Math.max(zoom / 1.3, MIN_ZOOM)
    adjustZoom(newZoom)
  }

  const resetZoom = (e) => {
    e.stopPropagation()
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const adjustZoom = (newZoom) => {
    if (newZoom !== zoom) {
      const scaleChange = newZoom / zoom
      setZoom(newZoom)
      setPan(prev => {
        const nextX = mapWidth / 2 - (mapWidth / 2 - prev.x) * scaleChange
        const nextY = mapHeight / 2 - (mapHeight / 2 - prev.y) * scaleChange
        const maxPanX = (newZoom - 1) * mapWidth
        const maxPanY = (newZoom - 1) * mapHeight
        const margin = 100
        return {
          x: newZoom === 1 ? 0 : Math.max(-maxPanX - margin, Math.min(margin, nextX)),
          y: newZoom === 1 ? 0 : Math.max(-maxPanY - margin, Math.min(margin, nextY))
        }
      })
    }
  }

  // Dynamically pick current riddle from spots the user actually has on their itinerary for this day
  const activeSpots = locations.filter(s => s.day === currentDayTab)
  
  // Local state for selected spot (shown in details card)
  const [selectedSpot, setSelectedSpot] = useState(() => {
    return activeSpots[currentSpotIndex] || activeSpots[0] || null
  })

  // Sync selectedSpot if currentSpotIndex or currentDayTab or locations changes
  useEffect(() => {
    const active = locations.filter(s => s.day === currentDayTab)
    const current = active[currentSpotIndex] || active[0] || null
    setSelectedSpot(current)
  }, [currentSpotIndex, currentDayTab, locations])

  const riddleCandidates = activeSpots.filter(s => SPOT_CLUES[s.id])
  // Use a stable index based on day so clue doesn't change on re-render, but varies per day
  const riddleSpot = riddleCandidates.length > 0 
    ? riddleCandidates[currentDayTab % riddleCandidates.length] 
    : null
  const currentClue = riddleSpot ? SPOT_CLUES[riddleSpot.id] : 'Seek the most ancient landmark on your day\'s itinerary — the pearl waits in the oldest stone.'

  const getSvgCoords = (coordsStr) => {
    try {
      const parts = coordsStr.split(',')
      const lat = parseFloat(parts[0])
      const lon = parseFloat(parts[1])

      const x = ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * mapWidth
      const y = mapHeight - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * mapHeight
      return { x: Math.round(x), y: Math.round(y) }
    } catch (e) {
      return { x: 250, y: 180 }
    }
  }

  const handleSpotClick = (spotId) => {
    const idx = activeSpots.findIndex(s => s.id === spotId)
    if (idx !== -1) {
      setCurrentSpotIndex(idx)
      setSelectedSpot(activeSpots[idx])
    } else {
      // Allow clicking and viewing details of spots not on today's itinerary
      const catalogSpot = spotsCatalog.find(s => s.id === spotId)
      if (catalogSpot) {
        setSelectedSpot(catalogSpot)
      }
    }
  }

  const handleMapNodeClick = (spot) => {
    if (dragDistance > 5) return // Ignore click if user was dragging/panning the map

    const isActiveDaySpot = activeSpots.some(s => s.id === spot.id)

    // Tapping a spot not on today's itinerary just shows its details card
    if (!isActiveDaySpot) {
      handleSpotClick(spot.id)
      return
    }

    if (!riddleSpot) {
      handleSpotClick(spot.id)
      return
    }
    
    if (spot.id === riddleSpot.id) {
      if (pearlsCollected.includes(spot.id)) {
        setPearlAlert({ success: true, text: "✨ You already unlocked the Shimmering Pearl chest for these coordinates!" })
        handleSpotClick(spot.id)
        return
      }

      // Spark chest opening animation!
      setPearlChestAnim(spot.id)
      setPearlsCollected(prev => [...prev, spot.id])
      setGoldFils(prev => prev + 350)
      awardXP(100, "Dilmun Pearl riddle solved")
      
      // Auto-unlock stamp for that spot
      if (!passportStamps.includes(spot.id)) {
        setPassportStamps(prev => [...prev, spot.id])
      }

      setPearlAlert({ 
        success: true, 
        text: `🏆 TREASURE FOUND! Solved coordinates for ${spot.name}! Unlocked a Shimmering Pearl, +350 Fils, and +100 XP!` 
      })

      // Correct audio chime
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (AudioContext) {
          const audioCtx = new AudioContext()
          const osc = audioCtx.createOscillator()
          const gain = audioCtx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
          osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.15) // G5
          osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.35) // C6
          gain.gain.setValueAtTime(0, audioCtx.currentTime)
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5)
          osc.connect(gain)
          gain.connect(audioCtx.destination)
          osc.start()
          osc.stop(audioCtx.currentTime + 0.5)
        }
      } catch(e){}

      setTimeout(() => {
        setPearlChestAnim(null)
      }, 3500)
      
      handleSpotClick(spot.id)
    } else {
      // Normal spot click
      handleSpotClick(spot.id)
      setPearlAlert({ 
        success: false, 
        text: `📍 Checked coordinates for ${spot.name}. Keep searching for the ancient landmark!` 
      })
    }
  }

  // Local style overrides for custom SVG and layout animations
  const mapStyle = `
    @keyframes routeFlow {
      to {
        stroke-dashoffset: -20;
      }
    }
    .route-flow-line {
      animation: routeFlow 1.5s linear infinite;
    }
    @keyframes pulseNode {
      0% { r: 12; opacity: 0.8; }
      100% { r: 22; opacity: 0; }
    }
    .map-node-pulse-ring {
      animation: pulseNode 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes chestShake {
      0%, 100% { transform: scale(1) rotate(0deg); }
      20% { transform: scale(1.1) rotate(-8deg); }
      40% { transform: scale(1.1) rotate(8deg); }
      60% { transform: scale(1.1) rotate(-8deg); }
      80% { transform: scale(1.1) rotate(8deg); }
    }
    .chest-shake {
      animation: chestShake 0.7s ease-in-out infinite;
      transform-origin: center;
      display: inline-block;
    }
    .scrollbar-none::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-none {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;

  return (
    <div className="cartography-scroll-sheet select-none relative animate-fadeIn flex flex-col h-full overflow-hidden">
      <style>{mapStyle}</style>

      {/* 1. ANCIENT WOODEN FRAME CORNER CLIPS */}
      <div className="book-corner-clip top-left" />
      <div className="book-corner-clip top-right" />
      <div className="book-corner-clip bottom-left" />
      <div className="book-corner-clip bottom-right" />

      {/* 2. WAX SEAL CLOSE MAP BUTTON (Rolls up scroll back to journal) */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (onClose) onClose()
          else setActiveLeaf('chronicles')
        }}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-bahrain-red hover:bg-bahrain-dark border-2 border-double border-amber-500/60 flex items-center justify-center text-white shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 z-50 font-sans font-extrabold text-[16px]"
        title="Close & Roll Up Map Scroll"
      >
        ✕
      </button>

      {/* 3. SCROLLABLE CHART CANVAS */}
      <div className="flex-1 p-4 md:p-6 flex flex-col justify-between overflow-hidden select-none">
        
        {/* Title block */}
        <div className="mb-2 shrink-0">
          <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold block">
            Cartographic Logbook Guide
          </span>
          <h4 className="font-serif text-xl md:text-2xl text-bronze-charcoal font-bold tracking-tight mt-0.5">
            Wayfarer's <span className="italic text-bahrain-red">Geographical Route Chart</span>
          </h4>
          <p className="font-sans text-[10px] md:text-xs text-bronze-muted leading-relaxed mt-0.5 font-semibold hidden sm:block">
            Dashed path outlines your active travel route chronologically for Day {currentDayTab}. Click any marker or legend entry to turn your book page.
          </p>
        </div>

        {/* Main interactive split view */}
        <div className="flex-1 flex flex-col md:flex-row gap-5 min-h-0 overflow-hidden relative mb-2">
          
          {/* Active spot legend list - Desktop Only */}
          <div className="hidden md:flex w-64 shrink-0 flex-col gap-2 overflow-y-auto pr-1 antique-scrollbar select-none">
            <span className="font-sans text-[8.5px] uppercase tracking-wider text-bahrain-red font-bold block pb-1.5 border-b border-red-500/10">
              Route Stops Legend:
            </span>
            <div className="space-y-1.5">
              {activeSpots.map((spot, idx) => {
                const isActive = selectedSpot && selectedSpot.id === spot.id
                const scanned = collectedKeepsakes.includes(spot.id)

                return (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot.id)}
                    onMouseEnter={() => setHoveredSpot(spot)}
                    onMouseLeave={() => setHoveredSpot(null)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-red-500/5 border-bahrain-red font-bold scale-[1.01] shadow-sm'
                        : 'bg-[#FAF9F6] border-red-500/5 hover:border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-sans text-[9px] font-extrabold text-white bg-bahrain-red w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-serif text-[12px] text-bronze-charcoal block truncate font-bold">
                        {formatLegendName(spot.name)}
                      </span>
                    </div>
                    <span className="text-[12px] shrink-0">
                      {scanned ? spot.keepsakeEmoji : '📸'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Map Viewport Area (includes mobile top timeline and SVG box) */}
          <div className="flex-1 flex flex-col gap-3.5 min-h-0 overflow-hidden relative">
            
            {/* Mobile horizontal stops timeline list */}
            <div className="flex md:hidden w-full overflow-x-auto gap-2.5 py-1 px-1 scrollbar-none shrink-0 select-none">
              {activeSpots.map((spot, idx) => {
                const isActive = selectedSpot && selectedSpot.id === spot.id
                const scanned = collectedKeepsakes.includes(spot.id)

                return (
                  <button
                    key={spot.id}
                    onClick={() => handleSpotClick(spot.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shrink-0 cursor-pointer text-[10px] ${
                      isActive
                        ? 'bg-bahrain-red text-white border-bahrain-red font-bold scale-105 shadow-sm'
                        : 'bg-[#FAF9F6] text-bronze-charcoal border-red-500/10'
                    }`}
                  >
                    <span className={`font-sans text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-white text-bahrain-red' : 'bg-bahrain-red text-white'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-serif font-bold">
                      {formatLegendName(spot.name)}
                    </span>
                    <span>
                      {scanned ? spot.keepsakeEmoji : '📸'}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* SVG Canvas Container */}
            <div 
              className="flex-1 rounded-2xl bg-[#FAF9F6] border border-red-500/10 relative flex items-center justify-center p-3 overflow-hidden shadow-inner min-h-0 cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
            >
              
              <svg
                viewBox={`0 -12 ${mapWidth} ${mapHeight + 12}`}
                className="w-full h-full select-none max-h-full"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(42,35,33,0.03))' }}
              >
                <defs>
                  {/* Landmass raised drop shadow */}
                  <filter id="land-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1.2" dy="2.2" stdDeviation="1.8" floodColor="#3b2f2b" floodOpacity="0.22" />
                  </filter>
                  
                  {/* Warm sand dune island gradient */}
                  <linearGradient id="land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FAF8F0" />
                    <stop offset="50%" stopColor="#F4F0E2" />
                    <stop offset="100%" stopColor="#E6DFBD" />
                  </linearGradient>

                  {/* Flowing travel route red gradient */}
                  <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C1122F" />
                    <stop offset="100%" stopColor="#E53E3E" />
                  </linearGradient>
                </defs>

                {/* Main Zoom and Pan Group */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

                {/* Soft Ocean Grid Lines */}
                <g stroke="rgba(209,26,56,0.035)" strokeWidth={0.5 / zoom} strokeDasharray="4,8">
                  <line x1="0" y1="90" x2={mapWidth} y2="90" />
                  <line x1="0" y1="180" x2={mapWidth} y2="180" />
                  <line x1="0" y1="270" x2={mapWidth} y2="270" />
                  <line x1="130" y1="0" x2="130" y2={mapHeight} />
                  <line x1="260" y1="0" x2="260" y2={mapHeight} />
                  <line x1="390" y1="0" x2="390" y2={mapHeight} />
                </g>

                {/* Dynamic GPS landmass outlines */}
                {(() => {
                  const generatePath = (coords) => {
                    return coords.map((p, idx) => {
                      const { x, y } = getSvgCoords(p[0] + ',' + p[1])
                      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`
                    }).join(' ') + ' Z'
                  }
                  return (
                    <>
                      {/* Bahrain Main Island */}
                      <path
                        d={generatePath(BAHRAIN_MAIN_COORDS)}
                        fill="url(#land-grad)"
                        stroke="#4b3e39"
                        strokeWidth={1.6 / zoom}
                        strokeLinejoin="round"
                        opacity="0.95"
                        filter="url(#land-shadow)"
                      />

                      {/* Muharraq Island (Northeast) */}
                      <path
                        d={generatePath(MUHARRAQ_COORDS)}
                        fill="url(#land-grad)"
                        stroke="#4b3e39"
                        strokeWidth={1.6 / zoom}
                        strokeLinejoin="round"
                        opacity="0.95"
                        filter="url(#land-shadow)"
                      />

                      {/* Sitra Island (East) */}
                      <path
                        d={generatePath(SITRA_COORDS)}
                        fill="url(#land-grad)"
                        stroke="#4b3e39"
                        strokeWidth={1.6 / zoom}
                        strokeLinejoin="round"
                        opacity="0.95"
                        filter="url(#land-shadow)"
                      />

                      {/* Al Dar Islands Coral Bar */}
                      <circle
                        cx={getSvgCoords('26.1558, 50.6833').x}
                        cy={getSvgCoords('26.1558, 50.6833').y}
                        r="4.5"
                        fill="url(#land-grad)"
                        stroke="#4b3e39"
                        strokeWidth={1 / zoom}
                        opacity="0.95"
                        filter="url(#land-shadow)"
                      />

                      {/* Jarada Island Sandbar */}
                      <ellipse
                        cx={getSvgCoords('26.2201, 50.7725').x}
                        cy={getSvgCoords('26.2201, 50.7725').y}
                        rx="6.5"
                        ry="3.2"
                        fill="url(#land-grad)"
                        stroke="#4b3e39"
                        strokeWidth={1 / zoom}
                        opacity="0.95"
                        filter="url(#land-shadow)"
                        transform={`rotate(15, ${getSvgCoords('26.2201, 50.7725').x}, ${getSvgCoords('26.2201, 50.7725').y})`}
                      />
                    </>
                  )
                })()}

                {/* Ocean Waves Decorations */}
                <path d="M 50,40 Q 60,38 70,40" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth={0.8 / zoom} />
                <path d="M 440,280 Q 450,278 460,280" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth={0.8 / zoom} />
                <path d="M 120,320 Q 130,318 140,320" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth={0.8 / zoom} />

                {/* GEOGRAPHIC TEXT LABELS & CITIES */}
                <g stroke="none" fill="#1c1613" className="font-serif font-bold text-[11px]" opacity="0.85">
                  <text x="145" y="70" fontSize="12" fill="#000000" fontWeight="900" letterSpacing="0.5">BAHRAIN ISLAND</text>
                  <text x="295" y="24" fontSize="9" letterSpacing="0.2">MUHARRAQ</text>
                  <text x="305" y="144" fontSize="9" letterSpacing="0.2">SITRA ISLAND</text>
                  <text x="142" y="230" fontSize="9" fill="#5c4c45" fontStyle="italic" opacity="0.8">Sakhir Desert Dunes</text>
                  <text x="400" y="270" fontSize="10.5" fill="#C1122F" fontWeight="800" opacity="0.35" letterSpacing="3">ARABIAN GULF</text>
                </g>

                {/* Manama (Capital Star) */}
                <g transform="translate(230, 48)">
                  <path d="M 0,-7 L 2,-2 L 7,-2 L 3,1 L 5,6 L 0,3 L -5,6 L -3,1 L -7,-2 L -2,-2 Z" fill="#aa7c11" stroke="#000000" strokeWidth="0.5" />
                  <text x="10" y="3" fontSize="10.5" fill="#000000" fontWeight="900" fontFamily="serif" stroke="none">MANAMA (Capital)</text>
                </g>

                {/* Animated travel route path */}
                {activeSpots.length > 1 && (
                  <polyline
                    points={activeSpots.map(s => {
                      const coords = getSvgCoords(s.coords)
                      return `${coords.x},${coords.y}`
                    }).join(' ')}
                    fill="none"
                    stroke="url(#route-grad)"
                    strokeWidth={3.2 / zoom}
                    strokeDasharray="6,6"
                    className="route-flow-line"
                    opacity="0.95"
                  />
                )}

                {/* Compass Rose drawing */}
                <g transform="translate(55, 60) scale(0.68)" stroke="rgba(209,26,56,0.35)" fill="none" strokeWidth="0.8">
                  <circle cx="40" cy="40" r="32" strokeDasharray="3,3" />
                  <circle cx="40" cy="40" r="12" />
                  <path d="M 40,0 L 40,80 M 0,40 L 80,40" />
                  <path d="M 40,40 L 36,15 L 40,2 L 44,15 Z" fill="rgba(209,26,56,0.06)" />
                  <path d="M 40,40 L 65,36 L 78,40 L 65,44 Z" fill="rgba(209,26,56,0.03)" />
                  <path d="M 40,40 L 36,65 L 40,78 L 44,65 Z" fill="rgba(209,26,56,0.03)" />
                  <path d="M 40,40 L 15,36 L 2,40 L 15,44 Z" fill="rgba(209,26,56,0.03)" />
                  <text x="35" y="-5" fill="#C1122F" className="font-serif text-[11px] font-bold" stroke="none">N</text>
                </g>

                {/* CARTOGRAPHIC LEGEND FRAME BOX */}
                <g transform="translate(355, 230)" stroke="#4b3e39" strokeWidth="1" fill="none">
                  <rect x="0" y="0" width="180" height="115" rx="6" fill="#FAF9F6" strokeWidth="1" opacity="0.98" />
                  <rect x="3" y="3" width="174" height="109" rx="4" strokeWidth="0.5" strokeDasharray="2,3" />
                  <text x="90" y="16" textAnchor="middle" fill="#0d0a09" className="font-sans text-[8.5px] font-extrabold" stroke="none">
                    MAP CHART LEGEND
                  </text>
                  <line x1="12" y1="20" x2="168" y2="20" strokeWidth="0.5" />
                  <g stroke="none" fill="#0d0a09" className="font-serif text-[8.5px] font-bold">
                    <text x="25" y="36">🔴   Active Route Stop</text>
                    <text x="25" y="52">🟡   Traditional Souq Alleys</text>
                    <text x="25" y="68">🏰   Ancient Empire Forts</text>
                    <text x="25" y="84">🦪   Coral Reef & Pearl Beds</text>
                    <text x="25" y="100">★   Discovered Souvenirs</text>
                  </g>
                </g>

                </g>

                {/* DOUBLE RULE BORDER */}
                <g stroke="#0d0a09" strokeWidth="1.2" fill="none">
                  <rect x="2" y="2" width={mapWidth - 4} height={mapHeight - 4} />
                  <rect x="5" y="5" width={mapWidth - 10} height={mapHeight - 10} strokeWidth="0.5" strokeDasharray="3,3" />
                </g>
                
                {/* Lat/Lon ticks */}
                <g stroke="none" fill="#3b2f2b" className="font-mono text-[7px] font-extrabold" opacity="0.8">
                  <text x="65" y="14" textAnchor="middle">50°27' E</text>
                  <text x="195" y="14" textAnchor="middle">50°35' E</text>
                  <text x="325" y="14" textAnchor="middle">50°43' E</text>
                  <text x="455" y="14" textAnchor="middle">50°51' E</text>
                  <text x="14" y="90" textAnchor="start" transform="rotate(-90 14 90)">26°14' N</text>
                  <text x="14" y="180" textAnchor="start" transform="rotate(-90 14 180)">26°08' N</text>
                  <text x="14" y="270" textAnchor="start" transform="rotate(-90 14 270)">26°02' N</text>
                </g>

                {/* Interactive Map spots coordinates */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {spotsCatalog.map(spot => {
                  const coords = getSvgCoords(spot.coords)
                  const isActiveDaySpot = activeSpots.some(s => s.id === spot.id)
                  const activeIndex = activeSpots.findIndex(s => s.id === spot.id)
                  const isSelectedSpot = selectedSpot && selectedSpot.id === spot.id
                  const scanned = collectedKeepsakes.includes(spot.id)
                  const hasPearl = pearlsCollected.includes(spot.id)

                  return (
                    <g
                      key={spot.id}
                      transform={`translate(${coords.x}, ${coords.y}) scale(${1 / zoom})`}
                      className="cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      role="button"
                      onClick={() => handleMapNodeClick(spot)}
                      onMouseEnter={() => setHoveredSpot(spot)}
                      onMouseLeave={() => setHoveredSpot(null)}
                    >
                      {/* Large tap hitbox */}
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="transparent"
                        stroke="none"
                        style={{ pointerEvents: 'all' }}
                      />

                      {/* Glowing selected node animation ring */}
                      {isSelectedSpot && (
                        <circle
                          cx="0"
                          cy="0"
                          r="16"
                          className="fill-bahrain-red/10 stroke-bahrain-red/45 map-node-pulse-ring"
                          strokeWidth="1.8"
                        />
                      )}

                      {/* Dilmun Chest Sparkle rotating ray */}
                      {pearlChestAnim === spot.id && (
                        <circle
                          cx="0"
                          cy="0"
                          r="26"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="4,6"
                          className="animate-spin"
                        />
                      )}

                      <circle
                        cx="0"
                        cy="0"
                        r={isSelectedSpot ? "9.5" : "7.8"}
                        className={`transition-all duration-300 ${
                          hasPearl
                            ? 'fill-amber-500 stroke-white'
                            : scanned
                              ? 'fill-emerald-500 stroke-white'
                              : isSelectedSpot
                                ? 'fill-bahrain-red stroke-white shadow-md'
                                : isActiveDaySpot
                                  ? 'fill-bahrain-accent stroke-[#FAF9F6]'
                                  : 'fill-bronze-muted/40 stroke-[#FAF9F6]/90'
                        }`}
                        strokeWidth={isSelectedSpot ? "2.8" : "1.8"}
                      />

                      {/* Numbers labels */}
                      {isActiveDaySpot && !scanned && !hasPearl && (
                        <text
                          x="0"
                          y="2.8"
                          textAnchor="middle"
                          fill="white"
                          className="font-sans text-[8px] font-extrabold"
                          stroke="none"
                          style={{ pointerEvents: 'none' }}
                        >
                          {activeIndex + 1}
                        </text>
                      )}

                      {hasPearl && (
                        <text x="0" y="2.8" textAnchor="middle" fill="white" className="font-serif text-[8.5px] font-bold" stroke="none" style={{ pointerEvents: 'none' }}>💎</text>
                      )}

                      {!hasPearl && scanned && (
                        <text x="0" y="2.8" textAnchor="middle" fill="white" className="font-serif text-[8.5px] font-bold" stroke="none" style={{ pointerEvents: 'none' }}>★</text>
                      )}
                    </g>
                  )
                })}
                </g>

              </svg>

              {/* Premium Floating Zoom Controls */}
              <div className="absolute right-4 top-4 flex flex-col gap-2 z-50 select-none">
                <button
                  onClick={zoomIn}
                  className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-md border border-amber-500/25 shadow-md flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Zoom In"
                >
                  ＋
                </button>
                <button
                  onClick={zoomOut}
                  className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-md border border-amber-500/25 shadow-md flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Zoom Out"
                >
                  －
                </button>
                <button
                  onClick={resetZoom}
                  className="w-8 h-8 rounded-lg bg-white/80 backdrop-blur-md border border-amber-500/25 shadow-md flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-[#FAF8F5] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  title="Recenter / Reset View"
                >
                  ⟲
                </button>
              </div>

              {/* Map projections label */}
              <div className="absolute bottom-2 left-3 font-mono text-[7px] tracking-widest text-bronze-muted/50 font-bold uppercase">
                Bahrain Archipelago projections WGS84 • MERCATOR
              </div>

              {/* Pearl Quest Alert Banner */}
              {pearlAlert && (
                <div 
                  className={`absolute top-4 left-4 right-4 z-40 p-3 rounded-2xl border text-[9.5px] font-sans font-bold leading-relaxed shadow-lg animate-scaleIn flex justify-between items-center select-none ${
                    pearlAlert.success 
                      ? 'bg-emerald-500/95 border-emerald-500 text-white' 
                      : 'bg-[#FAF9F6] border-rose-500/40 text-rose-800'
                  }`}
                >
                  <span>{pearlAlert.text}</span>
                  <button 
                    onClick={() => setPearlAlert(null)}
                    className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-black/10 hover:bg-black/20 shrink-0 ml-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Dilmun Clue Scroll Launcher */}
              <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5 z-40">
                {showClueScroll && (
                  <div className="w-64 bg-[#FAF9F6] border-2 border-amber-600/40 p-3.5 rounded-2xl shadow-xl aged-paper-gradient text-left animate-scaleIn select-none">
                    <div className="flex justify-between items-center pb-1.5 border-b border-amber-600/20">
                      <span className="font-sans text-[7.5px] tracking-wider text-amber-700 font-extrabold uppercase flex items-center gap-1">
                        <span className="chest-shake">📜</span> Dilmun Clue Scroll
                      </span>
                      <button 
                        onClick={() => setShowClueScroll(false)} 
                        className="text-[9.5px] text-bronze-muted hover:text-bahrain-red cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="font-serif text-[10px] italic text-bronze-charcoal leading-relaxed mt-2 font-semibold">
                      "{currentClue}"
                    </p>
                    <span className="font-sans text-[7px] text-amber-600/60 uppercase block mt-2 text-right">
                      Click correct coordinate pin to unlock Pearl
                    </span>
                  </div>
                )}

                <button
                  onClick={() => { setShowClueScroll(prev => !prev); setPearlAlert(null); }}
                  className="px-3 py-2 rounded-full bg-amber-600 hover:bg-amber-500 border border-amber-500/20 text-white font-sans text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-lg flex items-center gap-1.5 active:scale-95"
                >
                  <span className="chest-shake">📜</span> {showClueScroll ? 'Close Scroll' : 'Dilmun Pearl Clue'}
                </button>
              </div>

              {/* Hover quick preview panel */}
              {hoveredSpot && (
                <div className="absolute top-2 left-2 right-2 bg-white/98 backdrop-blur-md p-3 rounded-xl border border-bahrain-red/30 shadow-md flex items-center gap-3 z-30 text-left animate-fadeIn">
                  <span className="text-xl p-1.5 bg-red-500/5 rounded-xl border border-red-500/10">
                    {collectedKeepsakes.includes(hoveredSpot.id) ? hoveredSpot.keepsakeEmoji : '📍'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-serif text-xs font-bold text-bronze-charcoal truncate">
                        {hoveredSpot.name}
                      </span>
                      <span className="font-serif text-[10px] text-bahrain-red italic font-extrabold shrink-0 ml-1">
                        {hoveredSpot.arabic}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[7px] font-sans text-bronze-muted/70 font-extrabold uppercase">
                      <span>{hoveredSpot.period}</span>
                      <span>•</span>
                      <span className="text-bahrain-red/80">{hoveredSpot.coords}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Selected Spot Details Ledger Card */}
        {selectedSpot && (
          <div className="bg-[#FCFBF8] border-2 border-double border-amber-600/40 rounded-2xl p-4 md:p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left animate-fadeIn select-none shrink-0 z-40">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <span className="text-3xl p-2.5 bg-amber-600/5 rounded-2xl border border-amber-500/10 shrink-0 select-none">
                {getCategoryIcon(selectedSpot.category)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h5 className="font-serif text-base font-bold text-bronze-charcoal leading-tight">
                    {selectedSpot.name}
                  </h5>
                  <span className="font-serif text-sm text-bahrain-red italic font-extrabold select-none">
                    {selectedSpot.arabic}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[8px] font-sans text-bronze-muted/75 font-extrabold uppercase tracking-wider">
                  <span>{selectedSpot.period}</span>
                  <span>•</span>
                  <span className="text-bahrain-red/90">{selectedSpot.coords}</span>
                  <span>•</span>
                  <span className="text-amber-700/80">{selectedSpot.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 select-none">
                  <span className="px-2 py-0.5 rounded bg-emerald-700/10 text-emerald-800 text-[9px] font-sans font-bold uppercase tracking-wider">
                    💰 Budget: {selectedSpot.pathCost || selectedSpot.budgetCost || 'Free Entry'}
                  </span>
                  {(() => {
                    const activeIndex = activeSpots.findIndex(s => s.id === selectedSpot.id)
                    if (activeIndex !== -1) {
                      return (
                        <span className="px-2 py-0.5 rounded-full bg-bahrain-red/10 text-bahrain-red text-[9px] font-sans font-bold uppercase tracking-wider">
                          Active Stop {activeIndex + 1}
                        </span>
                      )
                    }
                    const otherDaySpot = locations.find(s => s.id === selectedSpot.id)
                    if (otherDaySpot) {
                      return (
                        <span className="px-2 py-0.5 rounded-full bg-amber-600/10 text-amber-700 text-[9px] font-sans font-bold uppercase tracking-wider">
                          Itinerary Day {otherDaySpot.day}
                        </span>
                      )
                    }
                    return (
                      <span className="px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 text-[9px] font-sans font-bold uppercase tracking-wider">
                        Not on itinerary
                      </span>
                    )
                  })()}
                </div>
                <p className="font-sans text-xs text-bronze-charcoal mt-2 leading-relaxed font-medium">
                  {selectedSpot.desc}
                </p>
                {selectedSpot.simpleTerms && (
                  <p className="font-sans text-xs text-bronze-charcoal mt-1.5 leading-relaxed font-medium">
                    🔍 <span className="font-sans font-bold text-[9px] uppercase tracking-wide mr-1">What You Can Find Here:</span>
                    {selectedSpot.simpleTerms}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-row md:flex-col lg:flex-row gap-2.5 w-full md:w-auto shrink-0 self-stretch md:self-center justify-end">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name + ', Bahrain')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>🧭</span> Google Maps
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onClose) onClose()
                  else setActiveLeaf('chronicles')
                }}
                className="flex-1 md:flex-none px-4 py-2.5 bg-bahrain-red hover:bg-bahrain-dark border-2 border-double border-amber-500/60 text-white font-sans text-[10px] uppercase tracking-wider font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <span>📖</span> Proceed
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
