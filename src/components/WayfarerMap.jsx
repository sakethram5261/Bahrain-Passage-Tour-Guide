import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import L from 'leaflet'
import confetti from 'canvas-confetti'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'
import { callLocalAI, buildSpotNarratorPrompt, buildLocationNavPrompt } from '../services/aiService'
import { playDiscoverySuccess } from '../services/audioUtils'

// Category icons
const CAT_ICON = {
  fort: '🏰',
  souq: '🕌',
  coast: '🌊',
  culture: '🏺',
  desert: '🌿',
  modern: '✨',
  hotel: '🔑',
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

function parseCoordsStr(str) {
  if (!str) return { lat: 26.2185, lon: 50.5912 }
  try {
    const cleaned = str.replace(/[^\d.,-]/g, '')
    const parts = cleaned.split(',')
    const lat = parseFloat(parts[0])
    const lon = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) {
      return { lat: 26.2185, lon: 50.5912 }
    }
    return { lat, lon }
  } catch {
    return { lat: 26.2185, lon: 50.5912 }
  }
}

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
    soundVolume = 0.5,
    soundMuted = false,
    jaradaTide = { isSubmerged: false },
  } = useVibe()

  // ── Local state ───────────────────────────────────────────────────────────
  const [selectedSpot, setSelectedSpot] = useState(null)
  const [hoveredSpot, setHoveredSpot] = useState(null)

  // Zoom / Pan
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)
  const routeLineRef = useRef(null)

  // Pearl Hunt
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeSpots = useMemo(() => locations.filter(s => s.day === currentDayTab), [locations, currentDayTab])

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

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5,
      zoomDelta: 0.5
    })
    map.setView([26.2185, 50.5912], 11)
    mapRef.current = map

    // CartoDB Voyager tiles (clean baseline with labels for better visibility)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      minZoom: 9
    }).addTo(map)

    markersLayerRef.current = L.layerGroup().addTo(map)

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      clearTimeout(timer)
      try {
        map.remove()
      } catch (e) {
        console.warn('Leaflet cleanup error:', e)
      }
      mapRef.current = null
      markersLayerRef.current = null
    }
  }, [])



  // ── Zoom handlers ──────────────────────────────────────────────────────────
  const resetZoom = useCallback((e) => {
    if (e) e.stopPropagation()
    const map = mapRef.current
    if (!map) return
    
    const bounds = []
    if (selectedHotel) {
      const h = parseCoordsStr(selectedHotel.coords)
      bounds.push([h.lat, h.lon])
    }
    activeSpots.forEach(s => {
      const c = parseCoordsStr(s.coords)
      bounds.push([c.lat, c.lon])
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] })
    } else {
      map.setView([26.15, 50.55], 11)
    }
  }, [activeSpots, selectedHotel])

  const handleZoomAction = useCallback((action, e) => {
    if (e) e.stopPropagation()
    const map = mapRef.current
    if (!map) return
    if (action === 'in') {
      map.zoomIn()
    } else if (action === 'out') {
      map.zoomOut()
    } else if (action === 'reset') {
      resetZoom()
    }
  }, [resetZoom])

  // Spot click helper
  const handleSpotClick = useCallback((spot) => {
    const idx = activeSpots.findIndex(s => s.id === spot.id)
    if (idx !== -1) setCurrentSpotIndex(idx)
    setSelectedSpot(spot)
    setShowBottomSheet(true)

    // Center map on spot
    const coords = parseCoordsStr(spot.coords)
    mapRef.current?.setView([coords.lat, coords.lon], Math.max(mapRef.current.getZoom(), 13), { animate: true })
  }, [activeSpots, setCurrentSpotIndex])

  const handleMapNodeClick = useCallback((spot) => {
    if (!riddleSpot) { handleSpotClick(spot); return }

    const isActiveDaySpot = activeSpots.some(s => s.id === spot.id)
    if (!isActiveDaySpot) { handleSpotClick(spot); return }

    if (spot.id === riddleSpot.id) {
      if (pearlsCollected.includes(spot.id)) {
        setPearlAlert({ success: true, text: 'You already found this pearl!' })
        handleSpotClick(spot)
        return
      }
      setPearlsCollected(prev => [...prev, spot.id])
      setGoldFils(prev => prev + 350)
      awardXP(100, 'Dilmun Pearl riddle solved')
      if (!passportStamps.includes(spot.id)) setPassportStamps(prev => [...prev, spot.id])
      setPearlAlert({ success: true, text: `TREASURE FOUND! ${spot.name} — +350 Fils, +100 XP!` })
      
      // Custom victory confetti
      try {
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#f59e0b', '#FFFDF9', '#60a5fa']
        })
      } catch (e) {
        console.warn('Confetti failed to launch:', e)
      }

      playDiscoverySuccess(1.0, !soundVolume || soundMuted)
      handleSpotClick(spot)
    } else {
      handleSpotClick(spot)
      setPearlAlert({ success: false, text: `Not quite — keep searching for the ancient landmark!` })
    }
  }, [activeSpots, riddleSpot, pearlsCollected, handleSpotClick, awardXP, passportStamps, setGoldFils, setPassportStamps, setPearlsCollected, soundVolume, soundMuted])

  // Sync / Draw Layer Markers & Route polylines
  useEffect(() => {
    const map = mapRef.current
    const markersLayer = markersLayerRef.current
    if (!map || !markersLayer) return

    const timer = setTimeout(() => {
      // Clear layers
      markersLayer.clearLayers()
      try {
        if (routeLineRef.current) {
          routeLineRef.current.remove()
        }
      } catch (e) {
        // suppress
      }
      routeLineRef.current = null

      // Force size update
      map.invalidateSize()

      // 1. Draw active route polyline
      if (activeSpots.length > 1) {
        const latLons = activeSpots.map(s => {
          const { lat, lon } = parseCoordsStr(s.coords)
          return [lat, lon]
        })
        routeLineRef.current = L.polyline(latLons, {
          color: '#C1122F',
          weight: 3.5,
          dashArray: '8, 8',
          opacity: 0.85
        }).addTo(map)
      }

      // 2. Draw Hotel Base Camp Marker
      if (selectedHotel) {
        const hotelCoords = parseCoordsStr(selectedHotel.coords)
        const hotelIcon = L.divIcon({
          className: 'custom-leaflet-icon',
          html: `
            <div class="flex flex-col items-center justify-center relative" style="width: 40px; height: 40px;">
              <div class="absolute inset-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 animate-ping"></div>
              <div class="w-7 h-7 rounded-full bg-white border-2 border-[#B8860B] shadow-md flex items-center justify-center text-xs">🔑</div>
              <div class="text-[6.5px] font-black uppercase text-[var(--color-primary)] tracking-wider mt-0.5" style="background: rgba(255,255,255,0.7); padding: 0 3px; border-radius: 4px; white-space: nowrap;">BASE CAMP</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
        
        const hotelMarker = L.marker([hotelCoords.lat, hotelCoords.lon], { icon: hotelIcon })
        hotelMarker.on('mouseover', () => {
          setHoveredSpot({
            ...selectedHotel,
            category: 'hotel',
            arabic: 'المقر الرئيسي (الفندق)',
            period: selectedHotel.neighborhood
          })
        })
        hotelMarker.on('mouseout', () => setHoveredSpot(null))
        hotelMarker.addTo(markersLayer)

        if (activeSpots.length > 0) {
          const firstSpot = parseCoordsStr(activeSpots[0].coords)
          const lastSpot = parseCoordsStr(activeSpots[activeSpots.length - 1].coords)
          
          L.polyline([[hotelCoords.lat, hotelCoords.lon], [firstSpot.lat, firstSpot.lon]], {
            color: '#b38600',
            weight: 2.2,
            dashArray: '5, 5',
            opacity: 0.75
          }).addTo(markersLayer)

          L.polyline([[lastSpot.lat, lastSpot.lon], [hotelCoords.lat, hotelCoords.lon]], {
            color: '#b38600',
            weight: 1.8,
            dashArray: '5, 5',
            opacity: 0.5
          }).addTo(markersLayer)
        }
      }

      // 3. Draw pins for spots
      spotsCatalog.forEach(spot => {
        const { lat, lon } = parseCoordsStr(spot.coords)
        const isActive = activeSpots.some(s => s.id === spot.id)
        const activeIdx = activeSpots.findIndex(s => s.id === spot.id)
        const isSelected = selectedSpot?.id === spot.id
        const scanned = collectedKeepsakes.includes(spot.id)
        const hasPearl = pearlsCollected.includes(spot.id)
        const isSubmerged = spot.id === 'jarada-island' && jaradaTide?.isSubmerged

        const iconHtml = `
          <div class="custom-map-pin flex items-center justify-center relative" style="width: 32px; height: 32px;">
            ${isSelected && isActive ? '<div class="absolute inset-1 rounded-full bg-red-500/20 border border-red-500/40 animate-ping"></div>' : ''}
            
            <div class="rounded-full flex items-center justify-center shadow-md font-bold text-[9px] border-2 border-white select-none transition-all"
              style="
                width: ${isSelected ? '24px' : '20px'};
                height: ${isSelected ? '24px' : '20px'};
                background-color: ${isSubmerged ? '#1e40af' : hasPearl ? '#f59e0b' : scanned ? '#10b981' : isSelected ? 'var(--color-primary)' : isActive ? '#E53E3E' : 'rgba(90,70,65,0.45)'};
                color: white;
              "
            >
              ${isSubmerged ? '🌊' : hasPearl ? '💎' : scanned ? '★' : isActive ? (activeIdx + 1) : ''}
            </div>

            ${isActive ? `<div class="absolute -top-3.5 text-[9px] drop-shadow-sm">${CAT_ICON[spot.category] || '📍'}</div>` : ''}
          </div>
        `

        const marker = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'custom-leaflet-icon',
            html: iconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        })

        marker.on('click', () => {
          handleMapNodeClick(spot)
        })

        marker.on('mouseover', () => {
          setHoveredSpot(spot)
        })

        marker.on('mouseout', () => {
          setHoveredSpot(null)
        })

        marker.addTo(markersLayer)
      })

      resetZoom()
    }, 60)

    return () => {
      clearTimeout(timer)
      try {
        if (routeLineRef.current) {
          routeLineRef.current.remove()
        }
      } catch (e) {
        // suppress
      }
      routeLineRef.current = null
    }
  }, [activeSpots, selectedSpot, collectedKeepsakes, pearlsCollected, selectedHotel, resetZoom, handleMapNodeClick])

  // ── AI Narrator ───────────────────────────────────────────────────────────
  const loadAiNarration = useCallback(async (spot) => {
    if (aiNarration[spot.id]) return
    setAiLoading(true)
    const { system, user } = buildSpotNarratorPrompt(spot.name, spot.desc)
    const text = await callLocalAI(system, user,
      `I remember this place well. ${spot.desc} Sit quietly here and let the atmosphere speak to you.`,
      { cacheKey: `narrator:${spot.id}`, maxTokens: 100 }
    )
    setAiNarration(prev => ({ ...prev, [spot.id]: text }))
    setAiLoading(false)
  }, [aiNarration])

  const loadAiNavTip = useCallback(async (spot) => {
    if (aiNavTip[spot.id]) return
    const { system, user } = buildLocationNavPrompt(spot.name)
    const text = await callLocalAI(system, user,
      `Head to the ${spot.category} district and ask locals for directions to ${spot.name}.`,
      { cacheKey: `nav:${spot.id}`, maxTokens: 60 }
    )
    setAiNavTip(prev => ({ ...prev, [spot.id]: text }))
  }, [aiNavTip])

  // When spot is selected, load AI content
  useEffect(() => {
    if (selectedSpot) {
      queueMicrotask(() => {
        loadAiNarration(selectedSpot)
        loadAiNavTip(selectedSpot)
      })
    }
  }, [selectedSpot, loadAiNarration, loadAiNavTip])

  // ── Close ─────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (onClose) onClose()
    else setActiveLeaf('chronicles')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const mapStyles = `
    .custom-leaflet-icon {
      border: none !important;
      background: transparent !important;
    }
    .leaflet-container {
      font-family: var(--font-body) !important;
    }
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
    <div className="cartography-scroll-sheet z-[300] flex flex-col h-full overflow-hidden">
      <style>{mapStyles}</style>

      {/* ── Header ── */}
      <div 
        className="flex items-center justify-between px-4 md:px-6 py-3 border-b shrink-0"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(193, 18, 47, 0.1)' }}
      >
        <div>
          <span className="text-overline tracking-wide text-[var(--color-primary)] block">
            Route Map
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
          className="w-9 h-9 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold text-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
        >
          ✕
        </button>
      </div>

      {/* ── Body: sidebar + map ── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar */}
        <div 
          className="hidden md:flex w-56 shrink-0 flex-col border-r overflow-y-auto scrollbar-none"
          style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'rgba(193, 18, 47, 0.08)' }}
        >
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
                        ? 'bg-[var(--color-primary)] text-white shadow-sm'
                        : 'text-bronze-charcoal hover:bg-[var(--color-primary-soft)]'
                    }`}
                    style={!isActiveDay ? { backgroundColor: 'rgba(193, 18, 47, 0.05)' } : {}}
                  >
                    <span className="font-sans text-[13px] font-semibold uppercase tracking-wide">
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
                                ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-bronze-charcoal'
                                : 'hover:bg-[var(--color-primary-soft)] border border-transparent'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
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
                className="w-full px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-sans text-[12px] uppercase tracking-wide font-semibold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
              >
                <span>📜</span>
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
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Mobile: horizontal stops strip */}
          <div 
            className="flex md:hidden items-center gap-2 px-3 py-2 border-b overflow-x-auto scrollbar-none shrink-0 snap-x snap-mandatory overscroll-x-contain" 
            style={{ scrollbarWidth: 'none', scrollPadding: '0 12px', backgroundColor: 'var(--color-surface-2)', borderColor: 'rgba(193, 18, 47, 0.08)' }}
          >
            {activeSpots.map((spot, idx) => {
              const isSelected = selectedSpot?.id === spot.id
              return (
                <button
                  key={spot.id}
                  onClick={() => handleSpotClick(spot)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shrink-0 text-[13px] font-bold transition-all cursor-pointer snap-start ${
                    isSelected
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-105'
                      : 'bg-white text-bronze-charcoal hover:border-[var(--color-primary-soft)]'
                  }`}
                  style={!isSelected ? { borderColor: 'rgba(193, 18, 47, 0.1)' } : {}}
                >
                  <span className={`w-3.5 h-3.5 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                    isSelected ? 'bg-white text-[var(--color-primary)]' : 'bg-[var(--color-primary)] text-white'
                  }`}>{idx + 1}</span>
                  <span className="font-serif truncate max-w-[80px]">{spot.name.split('(')[0].trim()}</span>
                </button>
              )
            })}
          </div>

          {/* Leaflet Parchment Styled Map Box */}
          <div className="flex-1 parchment-map-container relative overflow-hidden select-none">
            <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 10 }} />
            
            {/* Paper Grain overlay on top of Leaflet layers */}
            <div className="paper-grain opacity-[0.05] pointer-events-none z-20" />

            {/* Hover tooltip (for desktop mouseover) */}
            {hoveredSpot && !showBottomSheet && (
              <div
                className="absolute z-[1000] pointer-events-none pointer-events-none fade-in bg-white/97 border rounded-xl px-3 py-2 shadow-lg text-left min-w-[150px] max-w-[200px] border-red-500/25"
                style={{
                  top: '10px',
                  left: '10px'
                }}
              >
                <div className="font-serif text-[13px] font-bold text-bronze-charcoal truncate">{hoveredSpot.name?.split('(')[0]}</div>
                <div className="font-sans text-[12px] text-[var(--color-primary)] italic font-semibold mt-0.5">{hoveredSpot.arabic}</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-bronze-muted font-sans uppercase">
                  <span>{CAT_ICON[hoveredSpot.category] || '📍'}</span>
                  <span>{hoveredSpot.period?.split(',')[0]}</span>
                </div>
              </div>
            )}

            {/* Pearl Alert banner */}
            {pearlAlert && (
              <div className={`absolute bottom-24 left-3 right-3 md:bottom-4 z-[1000] p-3 rounded-2xl border text-[13px] font-bold shadow-lg fade-in flex justify-between items-center ${
                pearlAlert.success
                  ? 'bg-emerald-500/95 border-emerald-400 text-white'
                  : 'border-rose-400/40 text-rose-800'
              }`} style={!pearlAlert.success ? { backgroundColor: 'var(--color-surface)' } : {}}>
                <span>{pearlAlert.text}</span>
                <button onClick={() => setPearlAlert(null)} className="ml-2 shrink-0 text-[12px] px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 cursor-pointer">✕</button>
              </div>
            )}

            {/* Styled Zoom controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-20">
              <button 
                onClick={(e) => handleZoomAction('in', e)} 
                title="Zoom in"
                aria-label="Zoom in"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-amber-500/20 shadow-sm flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                ＋
              </button>
              <button 
                onClick={(e) => handleZoomAction('out', e)} 
                title="Zoom out"
                aria-label="Zoom out"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-amber-500/20 shadow-sm flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                －
              </button>
              <button 
                onClick={(e) => handleZoomAction('reset', e)} 
                title="Reset view"
                aria-label="Reset view"
                className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur border border-amber-500/20 shadow-sm flex items-center justify-center text-sm font-bold text-bronze-charcoal hover:bg-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                ⟲
              </button>
            </div>

            {/* Map projection label */}
            <div className="absolute bottom-1 left-2 font-mono text-[10px] tracking-wide text-bronze-muted/40 uppercase select-none z-20">
              Interactive Cartography · Leaflet Engine
            </div>
          </div>

          {/* ── Desktop Selected Spot Detail Card (sticky bottom strip) ── */}
          {selectedSpot && (
            <div className="hidden md:flex shrink-0 bg-[var(--color-surface-2)] border-t-2 border-double border-amber-600/30 px-5 py-3.5 gap-4 items-start fade-in z-20">
              <span className="text-3xl p-2.5 bg-amber-500/8 rounded-2xl border border-amber-500/12 shrink-0">
                {CAT_ICON[selectedSpot.category] || '📍'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h4 className="font-serif text-[15px] font-bold text-bronze-charcoal leading-tight">
                    {selectedSpot.name}
                  </h4>
                  <span className="font-serif text-sm text-[var(--color-primary)] italic font-bold">{selectedSpot.arabic}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] font-sans text-bronze-muted/70 font-bold uppercase tracking-wide flex-wrap">
                  <span>{selectedSpot.period}</span>
                  <span>•</span>
                  <span className="text-[var(--color-primary)]/80">{selectedSpot.coords}</span>
                  <span>•</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800">
                    {selectedSpot.pathCost || selectedSpot.budgetCost || 'Free'}
                  </span>
                </div>
                <p className="font-sans text-[14px] text-bronze-muted mt-1.5 leading-relaxed font-medium line-clamp-2">
                  {selectedSpot.desc}
                </p>
                {/* AI Narration */}
                {aiLoading && !aiNarration[selectedSpot.id] && (
                  <p className="font-serif text-[12px] italic text-amber-700/60 mt-1.5 animate-pulse">
                    Loading local history...
                  </p>
                )}
                {aiNarration[selectedSpot.id] && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300/30">
                    <span className="font-sans text-[7.5px] uppercase tracking-wide text-amber-700 font-semibold block mb-1">
                      Local Recollection
                    </span>
                    <p className="font-serif text-[10.5px] italic text-bronze-charcoal leading-relaxed">
                      "{aiNarration[selectedSpot.id]}"
                    </p>
                  </div>
                )}
                {/* AI Nav tip */}
                {aiNavTip[selectedSpot.id] && (
                  <p className="font-sans text-[9px] text-blue-700/70 mt-1.5 font-semibold">
                    {aiNavTip[selectedSpot.id]}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name + ', Bahrain')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[12px] uppercase tracking-wide font-semibold rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm"
                >
                  Directions
                </a>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-sans text-[12px] uppercase tracking-wide font-semibold rounded-xl transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                >
                  View Spot
                </button>
              </div>
            </div>
          )}

        </div>{/* end map+detail column */}
      </div>{/* end body */}

      {/* ── Mobile Bottom Sheet ── */}
      {showBottomSheet && selectedSpot && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-[400] slide-up">
          <div className="bg-[var(--color-surface-2)] border-t-2 border-double border-amber-600/30 rounded-t-3xl shadow-2xl p-5 max-h-[72vh] overflow-y-auto scrollbar-none">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-1 bg-bronze-muted/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <button
                onClick={() => setShowBottomSheet(false)}
                aria-label="Close bottom sheet"
                className="ml-auto text-bronze-muted hover:text-[var(--color-primary)] text-[13px] font-bold cursor-pointer"
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
                <span className="font-serif text-sm text-[var(--color-primary)] italic font-bold">{selectedSpot.arabic}</span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-bronze-muted font-bold uppercase tracking-wide">
                  <span>{selectedSpot.period?.split(',')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700/10 text-emerald-800">
                    {selectedSpot.pathCost || 'Free'}
                  </span>
                </div>
              </div>
            </div>
            <p className="font-sans text-[12px] text-bronze-muted mt-3 leading-relaxed">{selectedSpot.desc}</p>

            {aiNarration[selectedSpot.id] && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-300/30">
                <span className="font-sans text-[11px] uppercase tracking-wide text-amber-700 font-semibold block mb-1">Local Recollection</span>
                <p className="font-serif text-[13.5px] italic text-bronze-charcoal leading-relaxed">"{aiNarration[selectedSpot.id]}"</p>
              </div>
            )}

            {aiNavTip[selectedSpot.id] && (
              <p className="font-sans text-[12px] text-blue-700/70 mt-2 font-semibold">{aiNavTip[selectedSpot.id]}</p>
            )}

            <div className="flex gap-3 mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSpot.name + ', Bahrain')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-[12px] uppercase tracking-wide font-semibold rounded-xl text-center transition-all shadow-sm"
              >
                Google Maps
              </a>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-sans text-[12px] uppercase tracking-wide font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                View Spot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
