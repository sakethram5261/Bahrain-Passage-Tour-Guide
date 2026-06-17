import { useState, useEffect, useRef, useCallback } from 'react'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'
import { callLocalAI, buildSpotNarratorPrompt, buildLocationNavPrompt } from '../services/aiService'

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_LAT = 25.95
const MAX_LAT = 26.28
const MIN_LON = 50.42
const MAX_LON = 50.80
const MAP_W = 560
const MAP_H = 370

// Category icons
const CAT_ICON = {
  fort: '🏰',
  souq: '🕌',
  coast: '🌊',
  culture: '🏺',
  desert: '🌿',
  modern: '✨',
  hotel: '🏡',
}

// Dilmun Pearl Hunt clues
const SPOT_CLUES = {
  'qal-at-al-bahrain': 'The grand stone fortress standing watch over the northern deeps — where 4,000 harvests of empire lie beneath your boots.',
  'muharraq-souq': 'A maze of traditional alleyways breathing spices, saffron, and Bahraini halwa under generational merchant arches.',
  'pearling-path': 'Walk the UNESCO shoreline where bare-chested divers once plunged 20 meters with nothing but a wooden nose clip and a prayer.',
  'block-338': 'The bohemian arts neighborhood packed with local murals, neon glass, and string-lit dining alleys of modern Manama.',
  'jarada-island': 'Where the ocean retreats, a sandbar appears — white as fresh milk, dry for only a few hours.',
  'tree-of-life': 'A lone green canopy standing 400 years in the barren desert with no visible water source for miles.',
  'haji-cafe': 'Tucked in a narrow alley since 1950 — they bring you whatever is cooking. No menu, no fuss, just warm bread and karak.',
  'aali-pottery': "Bahrain's ancient craft village where potters still throw clay by hand on wheels spinning since the Dilmun era.",
  'arad-fort': 'A 16th-century Portuguese-era watchtower surrounded by a sea moat, guarding the strait between two islands.',
  'national-museum': "The Kingdom's grand archaeological archive — from Dilmun burial mounds to pearl-diving maritime relics spanning 6,000 years.",
  'al-dar-islands': 'A cluster of white coral islands reachable only by dhow, where the reef glows turquoise and flamingos wade the shallows.',
  'reef-island': 'The glamorous reclaimed waterfront where glass towers and neon reflections shimmer across the night marina.',
  'riffa-fort': 'Perched above the Hunanaiyah valley, this walled palace-fortress was where Al Khalifa rulers summered in regal isolation.',
  'barbar-temple': 'Ancient 3-tiered Dilmun temple complex buried under Bahraini soil for 4,000 years, dedicated to freshwater god Enki.',
  'al-jasra-house': 'A traditional coral-stone dwelling from 1907, birthplace of a Bahraini amir, preserved in the village of Al Jasra.',
  'khalaf-house': "The most ornate wind-tower house in the Gulf — a merchant trader's mansion decorated with carved gypsum lattice screens.",
  'manama-souq': 'The oldest continuous market in the Gulf, where gold, frankincense, and spice traders have bartered since the 1800s.',
  'al-areen': 'A protected desert wildlife sanctuary sheltering rare Arabian Oryx, desert gazelle, and native flora in the Sakhir dunes.',
}

// Bahrain island outlines
const BAHRAIN_MAIN_COORDS = [
  [26.255, 50.565],[26.250, 50.555],[26.245, 50.540],[26.232, 50.510],
  [26.230, 50.485],[26.225, 50.465],[26.215, 50.450],[26.180, 50.453],
  [26.155, 50.460],[26.120, 50.463],[26.090, 50.470],[26.060, 50.475],
  [26.035, 50.480],[25.990, 50.485],[25.950, 50.490],[25.950, 50.635],
  [25.980, 50.630],[26.020, 50.625],[26.060, 50.622],[26.100, 50.612],
  [26.140, 50.608],[26.170, 50.612],[26.205, 50.600],[26.235, 50.595],
  [26.248, 50.585],[26.255, 50.565],
]
const MUHARRAQ_COORDS = [
  [26.240, 50.605],[26.255, 50.600],[26.275, 50.615],[26.280, 50.635],
  [26.270, 50.660],[26.245, 50.655],[26.220, 50.650],[26.230, 50.625],
  [26.235, 50.615],[26.240, 50.605],
]
const SITRA_COORDS = [
  [26.170, 50.620],[26.165, 50.635],[26.150, 50.640],[26.135, 50.635],
  [26.125, 50.625],[26.130, 50.615],[26.150, 50.612],[26.165, 50.615],[26.170, 50.620],
]

// Convert lat/lon to SVG x/y
function toSvg(lat, lon) {
  return {
    x: Math.round(((lon - MIN_LON) / (MAX_LON - MIN_LON)) * MAP_W),
    y: Math.round(MAP_H - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * MAP_H),
  }
}

function parseCoordsStr(str) {
  if (!str) return { x: 280, y: 185 }
  try {
    const cleaned = str.replace(/[^\d.,-]/g, '')
    const parts = cleaned.split(',')
    const lat = parseFloat(parts[0])
    const lon = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) {
      return { x: 280, y: 185 }
    }
    return toSvg(lat, lon)
  } catch {
    return { x: 280, y: 185 }
  }
}

function islandPath(coords) {
  return coords.map(([lat, lon], i) => {
    const { x, y } = toSvg(lat, lon)
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ') + 'Z'
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WayfarerMap({ locations, onClose }) {
  const {
    currentDayTab,
    currentSpotIndex,
    setCurrentSpotIndex,
    collectedKeepsakes,
    setActiveLeaf,
    setGoldFils,
    awardXP,
    passportStamps,
    setPassportStamps,
    pearlsCollected,
    setPearlsCollected,
    duration,
    selectedHotel,
  } = useVibe()

  // ── Local state ───────────────────────────────────────────────────────────
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [hoveredSpot, setHoveredSpot] = useState(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // Zoom / Pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const dragMoved = useRef(0)
  const svgContainerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(400)

  // Momentum references
  const velocity = useRef({ x: 0, y: 0 })
  const lastTime = useRef(0)
  const lastPos = useRef({ x: 0, y: 0 })
  const momentumFrame = useRef(null)

  useEffect(() => {
    return () => {
      if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current)
    }
  }, [])

  useEffect(() => {
    if (!svgContainerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    resizeObserver.observe(svgContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Pearl Hunt
  const [pearlChestAnim, setPearlChestAnim] = useState(null)
  const [pearlAlert, setPearlAlert] = useState(null)
  const [showClueScroll, setShowClueScroll] = useState(false)

  // AI Narrator
  const [aiNarration, setAiNarration] = useState({}) // { [spotId]: string }
  const [aiNavTip, setAiNavTip] = useState({})       // { [spotId]: string }
  const [aiLoading, setAiLoading] = useState(false)

  // Mobile bottom sheet
  const [showBottomSheet, setShowBottomSheet] = useState(false)

  // Day accordion — show active day open
  const [openDays, setOpenDays] = useState({ [currentDayTab]: true })

  const MIN_ZOOM = 1
  const MAX_ZOOM = 5

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeSpots = locations.filter(s => s.day === currentDayTab)

  // Group all spots by day
  const days = Array.from({ length: duration || 3 }, (_, i) => i + 1)

  // Pearl riddle target
  const riddleCandidates = activeSpots.filter(s => SPOT_CLUES[s.id])
  const riddleSpot = riddleCandidates.length > 0
    ? riddleCandidates[currentDayTab % riddleCandidates.length]
    : null
  const currentClue = riddleSpot
    ? SPOT_CLUES[riddleSpot.id]
    : 'Seek the most ancient landmark on your day\'s itinerary — the pearl waits in the oldest stone.'

  // Sync selected spot when day/index changes
  useEffect(() => {
    const spot = activeSpots[currentSpotIndex] || activeSpots[0] || null
    queueMicrotask(() => {
      setSelectedSpot(spot)
    })
  }, [currentSpotIndex, currentDayTab, locations])

  // ── Zoom helpers ──────────────────────────────────────────────────────────
  const clampPan = useCallback((x, y, z) => {
    const margin = 80
    if (z <= 1) return { x: 0, y: 0 }
    const maxX = (z - 1) * MAP_W
    const maxY = (z - 1) * MAP_H
    return {
      x: Math.max(-maxX - margin, Math.min(margin, x)),
      y: Math.max(-maxY - margin, Math.min(margin, y)),
    }
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * MAP_W
    const my = ((e.clientY - rect.top) / rect.height) * MAP_H
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev * factor))
      const sc = next / prev
      const nx = mx - (mx - pan.x) * sc
      const ny = my - (my - pan.y) * sc
      const clamped = clampPan(nx, ny, next)
      setPan(clamped)
      return next
    })
  }, [pan, clampPan])

  // Track zoom ref to prevent stale closure inside startMomentum animation frames
  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  const startMomentum = () => {
    const decay = 0.94 // Deceleration coefficient
    let vx = velocity.current.x
    let vy = velocity.current.y

    const step = () => {
      if (Math.abs(vx) < 0.08 && Math.abs(vy) < 0.08) return
      vx *= decay
      vy *= decay
      setPan(prev => clampPan(prev.x + vx, prev.y + vy, zoomRef.current))
      momentumFrame.current = requestAnimationFrame(step)
    }

    if (Math.abs(vx) > 0.4 || Math.abs(vy) > 0.4) {
      momentumFrame.current = requestAnimationFrame(step)
    }
  }

  // Drag handlers
  const onMouseDown = (e) => {
    if (e.button !== 0) return
    isDragging.current = true
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    dragMoved.current = 0
    velocity.current = { x: 0, y: 0 }
    lastTime.current = performance.now()
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current)
  }

  const onMouseMove = (e) => {
    if (!isDragging.current) return
    const nx = e.clientX - dragStart.current.x
    const ny = e.clientY - dragStart.current.y
    dragMoved.current = Math.hypot(nx - pan.x, ny - pan.y)

    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      const dx = e.clientX - lastPos.current.x
      const dy = e.clientY - lastPos.current.y
      velocity.current = { x: (dx / dt) * 16, y: (dy / dt) * 16 }
    }
    lastTime.current = now
    lastPos.current = { x: e.clientX, y: e.clientY }

    setPan(clampPan(nx, ny, zoom))
  }

  const onMouseUp = () => {
    isDragging.current = false
    startMomentum()
  }

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return
    isDragging.current = true
    dragStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y }
    dragMoved.current = 0
    velocity.current = { x: 0, y: 0 }
    lastTime.current = performance.now()
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    if (momentumFrame.current) cancelAnimationFrame(momentumFrame.current)
  }

  const onTouchMove = (e) => {
    if (!isDragging.current || e.touches.length !== 1) return
    const nx = e.touches[0].clientX - dragStart.current.x
    const ny = e.touches[0].clientY - dragStart.current.y
    dragMoved.current = Math.hypot(nx - pan.x, ny - pan.y)

    const now = performance.now()
    const dt = now - lastTime.current
    if (dt > 0) {
      const dx = e.touches[0].clientX - lastPos.current.x
      const dy = e.touches[0].clientY - lastPos.current.y
      velocity.current = { x: (dx / dt) * 16, y: (dy / dt) * 16 }
    }
    lastTime.current = now
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }

    setPan(clampPan(nx, ny, zoom))
  }

  const onTouchEnd = () => {
    isDragging.current = false
    startMomentum()
  }

  const zoomIn = (e) => { e.stopPropagation(); setZoom(z => { const n = Math.min(z * 1.3, MAX_ZOOM); setPan(clampPan(pan.x, pan.y, n)); return n }) }
  const zoomOut = (e) => { e.stopPropagation(); setZoom(z => { const n = Math.max(z / 1.3, MIN_ZOOM); const c = clampPan(pan.x, pan.y, n); setPan(c); return n }) }
  const resetZoom = (e) => { e.stopPropagation(); setZoom(1); setPan({ x: 0, y: 0 }) }

  // ── AI Narrator ───────────────────────────────────────────────────────────
  const loadAiNarration = async (spot) => {
    if (aiNarration[spot.id]) return
    setAiLoading(true)
    const { system, user } = buildSpotNarratorPrompt(spot.name, spot.desc)
    const text = await callLocalAI(system, user,
      `I remember this place well. ${spot.desc} Sit quietly here and let the atmosphere speak to you.`,
      { cacheKey: `narrator:${spot.id}`, maxTokens: 100 }
    )
    setAiNarration(prev => ({ ...prev, [spot.id]: text }))
    setAiLoading(false)
  }

  const loadAiNavTip = async (spot) => {
    if (aiNavTip[spot.id]) return
    const { system, user } = buildLocationNavPrompt(spot.name)
    const text = await callLocalAI(system, user,
      `Head to the ${spot.category} district and ask locals for directions to ${spot.name}.`,
      { cacheKey: `nav:${spot.id}`, maxTokens: 60 }
    )
    setAiNavTip(prev => ({ ...prev, [spot.id]: text }))
  }

  // When spot is selected, load AI content
  useEffect(() => {
    if (selectedSpot) {
      queueMicrotask(() => {
        loadAiNarration(selectedSpot)
        loadAiNavTip(selectedSpot)
      })
    }
  }, [selectedSpot?.id])

  // ── Spot click handlers ───────────────────────────────────────────────────
  const handleSpotClick = useCallback((spot) => {
    if (dragMoved.current > 6) return
    const idx = activeSpots.findIndex(s => s.id === spot.id)
    if (idx !== -1) setCurrentSpotIndex(idx)
    setSelectedSpot(spot)
    setShowBottomSheet(true)
  }, [activeSpots])

  const handleMapNodeClick = useCallback((spot) => {
    if (dragMoved.current > 6) return
    if (!riddleSpot) { handleSpotClick(spot); return }

    const isActiveDaySpot = activeSpots.some(s => s.id === spot.id)
    if (!isActiveDaySpot) { handleSpotClick(spot); return }

    if (spot.id === riddleSpot.id) {
      if (pearlsCollected.includes(spot.id)) {
        setPearlAlert({ success: true, text: '✨ You already found this pearl!' })
        handleSpotClick(spot)
        return
      }
      setPearlChestAnim(spot.id)
      setPearlsCollected(prev => [...prev, spot.id])
      setGoldFils(prev => prev + 350)
      awardXP(100, 'Dilmun Pearl riddle solved')
      if (!passportStamps.includes(spot.id)) setPassportStamps(prev => [...prev, spot.id])
      setPearlAlert({ success: true, text: `🏆 TREASURE FOUND! ${spot.name} — +350 Fils, +100 XP!` })
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(523.25, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.35)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
        osc.connect(gain); gain.connect(ctx.destination)
        osc.start(); osc.stop(ctx.currentTime + 0.5)
      } catch { /* ignore */ }
      setTimeout(() => setPearlChestAnim(null), 3500)
      handleSpotClick(spot)
    } else {
      handleSpotClick(spot)
      setPearlAlert({ success: false, text: `📍 Not quite — keep searching for the ancient landmark!` })
    }
  }, [activeSpots, riddleSpot, pearlsCollected, handleSpotClick])

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (onClose) onClose()
    else setActiveLeaf('chronicles')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const mapStyles = `
    @keyframes routeFlow { to { stroke-dashoffset: -20; } }
    .map-route { animation: routeFlow 1.5s linear infinite; }
    @keyframes pulseRing {
      0% { r: 14; opacity: 0.8; }
      100% { r: 26; opacity: 0; }
    }
    .map-pulse { animation: pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite; }
    @keyframes chestShake {
      0%,100%{transform:rotate(0deg) scale(1)} 20%{transform:rotate(-8deg) scale(1.1)}
      40%{transform:rotate(8deg) scale(1.1)} 60%{transform:rotate(-6deg) scale(1.05)}
    }
    .chest-shake { animation: chestShake 0.7s ease-in-out infinite; display:inline-block; }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .slide-up { animation: slideUp 0.32s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
    .fade-in { animation: fadeIn 0.2s ease both; }
    .scrollbar-none { scrollbar-width: none; }
    .scrollbar-none::-webkit-scrollbar { display:none; }
  `

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0d0a09]/90 backdrop-blur-sm">
      <style>{mapStyles}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-[#FAF9F6] border-b border-red-500/10 shrink-0">
        <div>
          <span className="font-sans text-[11px] tracking-[0.25em] text-bahrain-red uppercase font-bold block">
            Wayfarer's Cartographic Chart
          </span>
          <h2 className="font-serif text-lg font-bold text-bronze-charcoal leading-tight">
            Day {currentDayTab} Route Map
            <span className="ml-2 font-sans text-[12.5px] text-bronze-muted font-normal">
              {activeSpots.length} stops
            </span>
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-bahrain-red hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        >
          ✕
        </button>
      </div>

      {/* ── Body: sidebar + map ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar */}
        <div className="hidden md:flex w-56 shrink-0 flex-col bg-[#FCFBF8] border-r border-red-500/8 overflow-y-auto scrollbar-none">
          <div className="p-3 space-y-3">
            {days.map(day => {
              const daySpots = locations.filter(s => s.day === day)
              const isActiveDay = day === currentDayTab
              const isOpen = openDays[day]

              return (
                <div key={day}>
                  <button
                    onClick={() => setOpenDays(prev => ({ ...prev, [day]: !prev[day] }))}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                      isActiveDay
                        ? 'bg-bahrain-red text-white shadow-sm'
                        : 'bg-red-500/5 text-bronze-charcoal hover:bg-red-500/10'
                    }`}
                  >
                    <span className="font-sans text-[13px] font-extrabold uppercase tracking-wider">
                      Day {day}
                    </span>
                    <span className="text-[12px] opacity-70">{daySpots.length} stops {isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="mt-1.5 space-y-1 pl-1">
                      {daySpots.map((spot, idx) => {
                        const isSelected = selectedSpot?.id === spot.id
                        const scanned = collectedKeepsakes.includes(spot.id)
                        const hasPearl = pearlsCollected.includes(spot.id)
                        return (
                          <button
                            key={spot.id}
                            onClick={() => handleSpotClick(spot)}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                              isSelected
                                ? 'bg-bahrain-red/10 border border-bahrain-red text-bronze-charcoal'
                                : 'hover:bg-red-500/5 border border-transparent'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-bahrain-red text-white' : 'bg-red-500/10 text-bahrain-red'
                            }`}>
                              {idx + 1}
                            </span>
                            <span className="font-serif text-[13.5px] text-bronze-charcoal font-semibold truncate flex-1 leading-tight">
                              {spot.name.split('(')[0].trim()}
                            </span>
                            <span className="text-[13px] shrink-0">
                              {hasPearl ? '💎' : scanned ? spot.keepsakeEmoji : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pearl Quest in sidebar */}
          {riddleSpot && (
            <div className="mt-auto p-3 border-t border-amber-600/15">
              <button
                onClick={() => setShowClueScroll(prev => !prev)}
                className="w-full px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-sans text-[12px] uppercase tracking-widest font-black transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span className="chest-shake">📜</span>
                {showClueScroll ? 'Close Scroll' : 'Pearl Hunt Clue'}
              </button>
              {showClueScroll && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-400/30 rounded-xl fade-in">
                  <p className="font-serif text-[13px] italic text-bronze-charcoal leading-relaxed">
                    "{currentClue}"
                  </p>
                  <span className="font-sans text-[10px] text-amber-700/60 uppercase mt-1.5 block text-right">
                    Click the correct map pin
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map + detail column */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Mobile: horizontal stops strip */}
          <div className="flex md:hidden items-center gap-2 px-3 py-2 bg-[#FCFBF8] border-b border-red-500/8 overflow-x-auto scrollbar-none shrink-0 snap-x snap-mandatory overscroll-x-contain" style={{ scrollbarWidth: 'none', scrollPadding: '0 12px' }}>
            {activeSpots.map((spot, idx) => {
              const isSelected = selectedSpot?.id === spot.id
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotClick(spot)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shrink-0 text-[13px] font-bold transition-all cursor-pointer snap-start ${
                    isSelected
                      ? 'bg-bahrain-red text-white border-bahrain-red shadow-sm scale-105'
                      : 'bg-white text-bronze-charcoal border-red-500/10 hover:border-red-500/30'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                    isSelected ? 'bg-white text-bahrain-red' : 'bg-bahrain-red text-white'
                  }`}>{idx + 1}</span>
                  <span className="font-serif truncate max-w-[80px]">{spot.name.split('(')[0].trim()}</span>
                </button>
              )
            })}
          </div>

          {/* SVG Map Canvas */}
          <div
            ref={svgContainerRef}
            className="flex-1 bg-[#d4e8f7] relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onWheel={handleWheel}
            onMouseMoveCapture={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
            }}
          >
            <svg
              viewBox={`0 0 ${MAP_W} ${MAP_H}`}
              className="w-full h-full"
              style={{ display: 'block' }}
            >
              <defs>
                <filter id="land-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#1a0d06" floodOpacity="0.18" />
                </filter>
                <linearGradient id="land-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FBF9F0" />
                  <stop offset="60%" stopColor="#F0ECD9" />
                  <stop offset="100%" stopColor="#DDD5B2" />
                </linearGradient>
                <linearGradient id="route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C1122F" />
                  <stop offset="100%" stopColor="#F05050" />
                </linearGradient>
                <pattern id="ocean-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                  <circle cx="9" cy="9" r="0.7" fill="rgba(30,90,180,0.08)" />
                </pattern>
              </defs>

              {/* Ocean background fill */}
              <rect width={MAP_W} height={MAP_H} fill="url(#ocean-dots)" />

              {/* ─ SINGLE transform group for all map content ─ */}
              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>

                {/* Ocean grid lines */}
                <g stroke="rgba(30,90,180,0.07)" strokeWidth={0.5/zoom} strokeDasharray="5,10">
                  <line x1="0" y1="92" x2={MAP_W} y2="92" />
                  <line x1="0" y1="185" x2={MAP_W} y2="185" />
                  <line x1="0" y1="277" x2={MAP_W} y2="277" />
                  <line x1="140" y1="0" x2="140" y2={MAP_H} />
                  <line x1="280" y1="0" x2="280" y2={MAP_H} />
                  <line x1="420" y1="0" x2="420" y2={MAP_H} />
                </g>

                {/* Islands */}
                {[
                  { coords: BAHRAIN_MAIN_COORDS },
                  { coords: MUHARRAQ_COORDS },
                  { coords: SITRA_COORDS },
                ].map(({ coords }, i) => (
                  <path
                    key={i}
                    d={islandPath(coords)}
                    fill="url(#land-grad)"
                    stroke="#4b3e39"
                    strokeWidth={1.4/zoom}
                    strokeLinejoin="round"
                    filter="url(#land-shadow)"
                    opacity="0.96"
                  />
                ))}

                {/* Al Dar Islands */}
                <circle
                  cx={toSvg(26.1558, 50.6833).x} cy={toSvg(26.1558, 50.6833).y}
                  r="5" fill="url(#land-grad)" stroke="#4b3e39" strokeWidth={0.9/zoom}
                  filter="url(#land-shadow)" opacity="0.96"
                />

                {/* Jarada sandbar */}
                <ellipse
                  cx={toSvg(26.2201, 50.7725).x} cy={toSvg(26.2201, 50.7725).y}
                  rx="7" ry="3.5" fill="url(#land-grad)" stroke="#4b3e39" strokeWidth={0.9/zoom}
                  filter="url(#land-shadow)" opacity="0.96"
                  transform={`rotate(15, ${toSvg(26.2201, 50.7725).x}, ${toSvg(26.2201, 50.7725).y})`}
                />

                {/* Ocean wave decorations */}
                {[[50,40],[450,290],[90,310]].map(([x,y],i) => (
                  <path key={i} d={`M${x},${y} Q${x+10},${y-2} ${x+20},${y}`}
                    fill="none" stroke="rgba(30,90,180,0.2)" strokeWidth={0.6/zoom} />
                ))}

                {/* Geo labels */}
                <text x="148" y="72" fontSize={11/zoom} fill="#1c1613" fontWeight="900" fontFamily="serif" letterSpacing="0.4">BAHRAIN ISLAND</text>
                <text x="300" y="22" fontSize={8.5/zoom} fill="#3a2f2b" fontFamily="serif">MUHARRAQ</text>
                <text x="308" y="148" fontSize={8.5/zoom} fill="#3a2f2b" fontFamily="serif">SITRA</text>
                <text x="140" y="238" fontSize={8/zoom} fill="#6b5b4b" fontStyle="italic" fontFamily="serif" opacity="0.75">Sakhir Desert Dunes</text>
                <text x="420" y="280" fontSize={10/zoom} fill="#C1122F" fontWeight="800" letterSpacing={2.5/zoom} opacity="0.28" fontFamily="serif">ARABIAN GULF</text>

                {/* Manama capital star */}
                <g transform={`translate(${toSvg(26.23, 50.577).x}, ${toSvg(26.23, 50.577).y}) scale(${1/zoom})`}>
                  <path d="M0,-6 L2,-2 L6,-2 L3,1 L4,5 L0,3 L-4,5 L-3,1 L-6,-2 L-2,-2 Z" fill="#aa7c11" stroke="#000" strokeWidth="0.4" />
                  <text x="10" y="3" fontSize="9" fill="#1c1613" fontWeight="900" fontFamily="serif">MANAMA ★</text>
                </g>

                {/* Compass rose */}
                <g transform={`translate(38,28) scale(${0.65/zoom})`} stroke="rgba(193,18,47,0.32)" fill="none" strokeWidth="0.9">
                  <circle cx="40" cy="40" r="32" strokeDasharray="2,4" />
                  <circle cx="40" cy="40" r="12" />
                  <path d="M40,0 L40,80 M0,40 L80,40" />
                  <path d="M40,40 L36,16 L40,2 L44,16 Z" fill="rgba(193,18,47,0.08)" />
                  <text x="34" y="-4" fill="#C1122F" fontSize="11" fontWeight="bold" fontFamily="serif" stroke="none">N</text>
                </g>

                {/* Hotel Base Camp routes */}
                {selectedHotel && activeSpots.length > 0 && (() => {
                  const hotelCoords = parseCoordsStr(selectedHotel.coords)
                  const firstSpotCoords = parseCoordsStr(activeSpots[0].coords)
                  const lastSpotCoords = parseCoordsStr(activeSpots[activeSpots.length - 1].coords)
                  return (
                    <>
                      {/* Departure route: Hotel -> First Spot */}
                      <line
                        x1={hotelCoords.x}
                        y1={hotelCoords.y}
                        x2={firstSpotCoords.x}
                        y2={firstSpotCoords.y}
                        fill="none"
                        stroke="#b38600"
                        strokeWidth={2.5/zoom}
                        strokeDasharray={`4,4`}
                        opacity="0.8"
                      />
                      {/* Return route: Last Spot -> Hotel */}
                      <line
                        x1={lastSpotCoords.x}
                        y1={lastSpotCoords.y}
                        x2={hotelCoords.x}
                        y2={hotelCoords.y}
                        fill="none"
                        stroke="#b38600"
                        strokeWidth={2/zoom}
                        strokeDasharray={`4,4`}
                        opacity="0.5"
                      />
                    </>
                  )
                })()}

                {/* Active route polyline */}
                {activeSpots.length > 1 && (
                  <polyline
                    points={activeSpots.map(s => {
                      const { x, y } = parseCoordsStr(s.coords)
                      return `${x},${y}`
                    }).join(' ')}
                    fill="none"
                    stroke="url(#route-grad)"
                    strokeWidth={3/zoom}
                    strokeDasharray={`7,7`}
                    className="map-route"
                    opacity="0.9"
                  />
                )}

                {/* Map spots */}
                {spotsCatalog.map(spot => {
                  const { x, y } = parseCoordsStr(spot.coords)
                  const isActive = activeSpots.some(s => s.id === spot.id)
                  const activeIdx = activeSpots.findIndex(s => s.id === spot.id)
                  const isSelected = selectedSpot?.id === spot.id
                  const scanned = collectedKeepsakes.includes(spot.id)
                  const hasPearl = pearlsCollected.includes(spot.id)
                  const isGhost = !isActive

                  return (
                    <g
                      key={spot.id}
                      transform={`translate(${x},${y}) scale(${1/zoom})`}
                      onClick={() => handleMapNodeClick(spot)}
                      onMouseEnter={() => setHoveredSpot(spot)}
                      onMouseLeave={() => setHoveredSpot(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Tap hitbox */}
                      <circle cx="0" cy="0" r="22" fill="transparent" />

                      {/* Pulse ring for selected active spot */}
                      {isSelected && isActive && (
                        <circle cx="0" cy="0" r="14" className="map-pulse"
                          fill="rgba(193,18,47,0.06)" stroke="rgba(193,18,47,0.35)" strokeWidth="1.5" />
                      )}

                      {/* Pearl chest spin ring */}
                      {pearlChestAnim === spot.id && (
                        <circle cx="0" cy="0" r="26" fill="none" stroke="#f59e0b"
                          strokeWidth="2" strokeDasharray="4,6" className="animate-spin" />
                      )}

                      {/* Main dot */}
                      <circle
                        cx="0" cy="0"
                        r={isSelected ? 11 : isActive ? 9 : 5}
                        fill={
                          hasPearl ? '#f59e0b'
                          : scanned ? '#10b981'
                          : isSelected ? '#C1122F'
                          : isActive ? '#E53E3E'
                          : 'rgba(90,70,65,0.28)'
                        }
                        stroke={isGhost ? 'rgba(90,70,65,0.18)' : 'white'}
                        strokeWidth={isSelected ? 2.5 : 1.8}
                      />

                      {/* Labels */}
                      {isActive && !scanned && !hasPearl && (
                        <text x="0" y="3" textAnchor="middle" fill="white"
                          fontSize="7" fontWeight="900" fontFamily="sans-serif"
                          style={{ pointerEvents: 'none' }}>
                          {activeIdx + 1}
                        </text>
                      )}
                      {hasPearl && <text x="0" y="3" textAnchor="middle" fontSize="7" style={{ pointerEvents: 'none' }}>💎</text>}
                      {!hasPearl && scanned && <text x="0" y="3" textAnchor="middle" fontSize="7" style={{ pointerEvents: 'none' }}>★</text>}

                      {/* Category icon label under active spots */}
                      {isActive && !isGhost && (
                        <text x="0" y={isSelected ? -16 : -13}
                          textAnchor="middle" fontSize={isSelected ? 8 : 7}
                          fontWeight="700" fontFamily="serif" fill="#2a1f1c"
                          style={{ pointerEvents: 'none' }}>
                          {CAT_ICON[spot.category] || '📍'}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Selected Hotel Base Camp Marker */}
                {selectedHotel && (() => {
                  const hotelCoords = parseCoordsStr(selectedHotel.coords)
                  return (
                    <g
                      transform={`translate(${hotelCoords.x},${hotelCoords.y}) scale(${1.25/zoom})`}
                      onMouseEnter={() => setHoveredSpot({
                        ...selectedHotel,
                        category: 'hotel',
                        arabic: 'المقر الرئيسي (الفندق)',
                        period: selectedHotel.neighborhood
                      })}
                      onMouseLeave={() => setHoveredSpot(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Pulse ring */}
                      <circle cx="0" cy="0" r="14" className="map-pulse"
                        fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.45)" strokeWidth="1.5" />

                      {/* Main gold key circle */}
                      <circle cx="0" cy="0" r="9" fill="#FFFDF9" stroke="#D4AF37" strokeWidth="1.8" />
                      <text x="0" y="3" textAnchor="middle" fontSize="9" style={{ pointerEvents: 'none' }}>🔑</text>

                      {/* Label text */}
                      <text x="0" y="-13"
                        textAnchor="middle" fontSize="6.5"
                        fontWeight="900" fontFamily="serif" fill="#BA0C2F"
                        style={{ pointerEvents: 'none' }}
                      >
                        BASE CAMP
                      </text>
                    </g>
                  )
                })()}

                {/* Border frame (inside transform) */}
                <rect x="1" y="1" width={MAP_W-2} height={MAP_H-2}
                  fill="none" stroke="#2a1a10" strokeWidth={1.2/zoom} />
                <rect x="5" y="5" width={MAP_W-10} height={MAP_H-10}
                  fill="none" stroke="#2a1a10" strokeWidth={0.5/zoom} strokeDasharray={`3,4`} />

                {/* Lat/Lon ticks */}
                <g fill="#3b2f2b" fontSize={7/zoom} fontFamily="monospace" fontWeight="bold" opacity="0.7">
                  <text x="75" y="13" textAnchor="middle">50°27'E</text>
                  <text x="210" y="13" textAnchor="middle">50°35'E</text>
                  <text x="345" y="13" textAnchor="middle">50°43'E</text>
                  <text x="480" y="13" textAnchor="middle">50°51'E</text>
                </g>

              </g>{/* end single transform group */}
            </svg>

            {/* Hover tooltip (follows cursor, not at top) */}
            {hoveredSpot && !showBottomSheet && (
              <div
                className="absolute pointer-events-none z-30 fade-in"
                style={{ left: Math.min(hoverPos.x + 14, containerWidth - 200), top: Math.max(hoverPos.y - 60, 4) }}
              >
                <div className="bg-white/97 border border-bahrain-red/25 rounded-xl px-3 py-2 shadow-lg text-left min-w-[150px] max-w-[200px]">
                  <div className="font-serif text-[13px] font-bold text-bronze-charcoal truncate">{hoveredSpot.name.split('(')[0]}</div>
                  <div className="font-sans text-[12px] text-bahrain-red italic font-semibold mt-0.5">{hoveredSpot.arabic}</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-bronze-muted font-sans uppercase">
                    <span>{CAT_ICON[hoveredSpot.category] || '📍'}</span>
                    <span>{hoveredSpot.period?.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pearl Alert banner */}
            {pearlAlert && (
              <div className={`absolute bottom-24 left-3 right-3 md:bottom-4 z-40 p-3 rounded-2xl border text-[13px] font-bold shadow-lg fade-in flex justify-between items-center ${
                pearlAlert.success
                  ? 'bg-emerald-500/95 border-emerald-400 text-white'
                  : 'bg-[#FAF9F6] border-rose-400/40 text-rose-800'
              }`}>
                <span>{pearlAlert.text}</span>
                <button onClick={() => setPearlAlert(null)} className="ml-2 shrink-0 text-[12px] px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 cursor-pointer">✕</button>
              </div>
            )}

            {/* Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
              {[['＋', zoomIn, 'Zoom in'], ['－', zoomOut, 'Zoom out'], ['⟲', resetZoom, 'Reset view']].map(([label, fn, title]) => (
                <button key={label} onClick={fn} title={title}
                  className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-amber-500/20 shadow-sm flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer">
                  {label}
                </button>
              ))}
            </div>

            {/* Map projection label */}
            <div className="absolute bottom-1 left-2 font-mono text-[10px] tracking-widest text-bronze-muted/40 uppercase select-none">
              Bahrain WGS84 · Mercator
            </div>
          </div>

          {/* ── Desktop Selected Spot Detail Card (sticky bottom strip) ── */}
          {selectedSpot && (
            <div className="hidden md:flex shrink-0 bg-[#FCFBF8] border-t-2 border-double border-amber-600/30 px-5 py-3.5 gap-4 items-start fade-in">
              <span className="text-3xl p-2.5 bg-amber-500/8 rounded-2xl border border-amber-500/12 shrink-0">
                {CAT_ICON[selectedSpot.category] || '📍'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-serif text-[15px] font-bold text-bronze-charcoal leading-tight">
                    {selectedSpot.name}
                  </h4>
                  <span className="font-serif text-sm text-bahrain-red italic font-bold">{selectedSpot.arabic}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-sans text-bronze-muted/70 font-bold uppercase tracking-wide flex-wrap">
                  <span>{selectedSpot.period}</span>
                  <span>•</span>
                  <span className="text-bahrain-red/80">{selectedSpot.coords}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800">
                    💰 {selectedSpot.pathCost || selectedSpot.budgetCost || 'Free'}
                  </span>
                </div>
                <p className="font-sans text-[14px] text-bronze-muted mt-1.5 leading-relaxed font-medium line-clamp-2">
                  {selectedSpot.desc}
                </p>
                {/* AI Narration */}
                {aiLoading && !aiNarration[selectedSpot.id] && (
                  <p className="font-serif text-[12px] italic text-amber-700/60 mt-1.5 animate-pulse">
                    Jafar is recalling a memory...
                  </p>
                )}
                {aiNarration[selectedSpot.id] && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300/30">
                    <span className="font-sans text-[7.5px] uppercase tracking-wider text-amber-700 font-extrabold block mb-1">
                      🗣️ Jafar's Recollection
                    </span>
                    <p className="font-serif text-[10.5px] italic text-bronze-charcoal leading-relaxed">
                      "{aiNarration[selectedSpot.id]}"
                    </p>
                  </div>
                )}
                {/* AI Nav tip */}
                {aiNavTip[selectedSpot.id] && (
                  <p className="font-sans text-[9px] text-blue-700/70 mt-1.5 font-semibold">
                    🧭 {aiNavTip[selectedSpot.id]}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name + ', Bahrain')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[12px] uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
                >
                  🧭 Maps
                </a>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-bahrain-red hover:bg-red-800 text-white font-sans text-[12px] uppercase tracking-wider font-extrabold rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  📖 Proceed
                </button>
              </div>
            </div>
          )}

        </div>{/* end map+detail column */}
      </div>{/* end body */}

      {/* ── Mobile Bottom Sheet ── */}
      {showBottomSheet && selectedSpot && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[400] slide-up">
          <div className="bg-[#FCFBF8] border-t-2 border-double border-amber-600/30 rounded-t-3xl shadow-2xl p-5 max-h-[72vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-1 bg-bronze-muted/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <button
                onClick={() => setShowBottomSheet(false)}
                className="ml-auto text-bronze-muted hover:text-bahrain-red text-[13px] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl p-2 bg-amber-500/8 rounded-xl border border-amber-500/12 shrink-0">
                {CAT_ICON[selectedSpot.category] || '📍'}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-base font-bold text-bronze-charcoal">{selectedSpot.name}</h4>
                <span className="font-serif text-sm text-bahrain-red italic font-bold">{selectedSpot.arabic}</span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-bronze-muted font-bold uppercase tracking-wide">
                  <span>{selectedSpot.period?.split(',')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800">
                    💰 {selectedSpot.pathCost || 'Free'}
                  </span>
                </div>
              </div>
            </div>
            <p className="font-sans text-[12px] text-bronze-muted mt-3 leading-relaxed">{selectedSpot.desc}</p>

            {aiNarration[selectedSpot.id] && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300/30">
                <span className="font-sans text-[11px] uppercase tracking-wider text-amber-700 font-extrabold block mb-1">🗣️ Jafar's Recollection</span>
                <p className="font-serif text-[13.5px] italic text-bronze-charcoal leading-relaxed">"{aiNarration[selectedSpot.id]}"</p>
              </div>
            )}

            {aiNavTip[selectedSpot.id] && (
              <p className="font-sans text-[12px] text-blue-700/70 mt-2 font-semibold">🧭 {aiNavTip[selectedSpot.id]}</p>
            )}

            <div className="flex gap-3 mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name + ', Bahrain')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[12px] uppercase tracking-wider font-extrabold rounded-xl text-center transition-all shadow-sm"
              >
                🧭 Google Maps
              </a>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-bahrain-red hover:bg-red-800 text-white font-sans text-[12px] uppercase tracking-wider font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                📖 Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
