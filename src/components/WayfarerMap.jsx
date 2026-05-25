import { useState } from 'react'
import { useVibe } from '../hooks/useVibe'
import { spotsCatalog } from '../hooks/useItinerary'

// Bounding boxes for Bahrain geography coordinates mapping
const MIN_LAT = 25.95
const MAX_LAT = 26.28
const MIN_LON = 50.42
const MAX_LON = 50.80

export default function WayfarerMap({ locations }) {
  const { currentDayTab, currentSpotIndex, setCurrentSpotIndex, collectedKeepsakes, setActiveLeaf } = useVibe()
  const [hoveredSpot, setHoveredSpot] = useState(null)

  // Map coordinates to SVG coordinate system (width: 550, height: 360)
  const mapWidth = 550
  const mapHeight = 360

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

  // Active spots for the selected day tab
  const activeSpots = locations.filter(s => s.day === currentDayTab)

  const handleSpotClick = (spotId) => {
    const idx = activeSpots.findIndex(s => s.id === spotId)
    if (idx !== -1) {
      setCurrentSpotIndex(idx)
      setActiveLeaf('chronicles') 
    }
  }

  return (
    <div className="cartography-scroll-sheet select-none relative animate-fadeIn">
      {/* 1. ANCIENT WOODEN FRAME CORNER CLIPS */}
      <div className="book-corner-clip top-left" />
      <div className="book-corner-clip top-right" />
      <div className="book-corner-clip bottom-left" />
      <div className="book-corner-clip bottom-right" />

      {/* 2. WAX SEAL CLOSE MAP BUTTON (Rolls up scroll back to journal) */}
      <button
        onClick={() => setActiveLeaf('chronicles')}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-bahrain-red hover:bg-bahrain-dark border-2 border-double border-amber-500/60 flex items-center justify-center text-white shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 z-50 font-sans font-extrabold text-[16px]"
        title="Close & Roll Up Map Scroll"
      >
        ✕
      </button>

      {/* 3. SCROLLABLE CHART CANVAS */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto antique-scrollbar flex flex-col gap-6 justify-between select-none">
        
        <div>
          <span className="font-sans text-[8px] tracking-[0.25em] text-bahrain-red uppercase font-bold block">
            Cartographic Logbook Guide
          </span>
          <h4 className="font-serif text-2xl text-bronze-charcoal font-bold tracking-tight mt-0.5">
            Wayfarer's <span className="italic text-bahrain-red">Geographical Route Chart</span>
          </h4>
          <p className="font-sans text-xs text-bronze-muted leading-relaxed mt-1 font-semibold">
            Dashed red path outlines your active travel route chronologically for Chapter Page {currentDayTab}. Click any marker or legend entry to turn your book page.
          </p>
        </div>

        {/* Interactive map split view */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch flex-1">
          
          {/* Active spot legend list */}
          <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-1 antique-scrollbar flex flex-col justify-start select-none">
            <span className="font-sans text-[8.5px] uppercase tracking-wider text-bahrain-red font-bold block pb-1.5 border-b border-red-500/10">
              Route Stops Legend:
            </span>
            {activeSpots.map((spot, idx) => {
              const isActive = currentSpotIndex === idx
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
                      {spot.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[12px] shrink-0">
                    {scanned ? spot.keepsakeEmoji : '📸'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* SVG Map Layout */}
          <div className="lg:col-span-3 rounded-xl bg-[#FAF9F6] border border-red-500/10 relative flex items-center justify-center p-4 overflow-hidden shadow-inner min-h-[360px] flex-1">
            
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="w-full h-auto select-none max-h-[380px]"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(42,35,33,0.03))' }}
            >
              {/* Soft Ocean Grid Lines */}
              <g stroke="rgba(209,26,56,0.04)" strokeWidth="0.5" strokeDasharray="4,8">
                <line x1="0" y1="90" x2={mapWidth} y2="90" />
                <line x1="0" y1="180" x2={mapWidth} y2="180" />
                <line x1="0" y1="270" x2={mapWidth} y2="270" />
                <line x1="130" y1="0" x2="130" y2={mapHeight} />
                <line x1="260" y1="0" x2="260" y2={mapHeight} />
                <line x1="390" y1="0" x2="390" y2={mapHeight} />
              </g>

              {/* Hand-Drawn Bahrain Main Island Outline */}
              <path
                d="M 120,40 
                   Q 140,35 170,30
                   Q 210,25 240,45
                   Q 260,60 270,75
                   Q 280,95 285,120
                   Q 290,150 280,180
                   Q 275,200 270,230
                   Q 260,280 250,310
                   Q 245,335 235,345
                   Q 230,350 220,345
                   Q 210,340 215,310
                   Q 220,290 215,260
                   Q 210,230 200,200
                   Q 190,175 180,150
                   Q 160,110 145,95
                   Q 125,80 115,65
                   Q 110,50 120,40 Z"
                fill="#f4f0e2"
                stroke="#4b3e39"
                strokeWidth="1.6"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* Hand-Drawn Muharraq Island Outline (Northeast) */}
              <path
                d="M 285,35
                   Q 305,25 330,30
                   Q 350,35 345,55
                   Q 340,70 325,65
                   Q 310,60 295,50
                   Q 280,45 285,35 Z"
                fill="#f4f0e2"
                stroke="#4b3e39"
                strokeWidth="1.6"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* Hand-Drawn Sitra Island Outline (East) */}
              <path
                d="M 288,140
                   Q 305,145 308,165
                   Q 310,180 298,190
                   Q 290,195 284,185
                   Q 280,170 285,155
                   Q 288,145 288,140 Z"
                fill="#f4f0e2"
                stroke="#4b3e39"
                strokeWidth="1.6"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* Ocean Waves Decorations */}
              <path d="M 50,40 Q 60,38 70,40" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth="0.8" />
              <path d="M 440,280 Q 450,278 460,280" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth="0.8" />
              <path d="M 120,320 Q 130,318 140,320" fill="none" stroke="rgba(209,26,56,0.18)" strokeWidth="0.8" />

              {/* HIGH-CONTRAST BOLD GEOGRAPHIC LABELS & CITIES */}
              <g stroke="none" fill="#0d0a09" className="font-serif font-bold text-[11px]">
                <text x="145" y="70" fontSize="12" fill="#000000" fontWeight="900" letterSpacing="0.5">BAHRAIN ISLAND</text>
                <text x="345" y="32" fontSize="9" letterSpacing="0.2">MUHARRAQ</text>
                <text x="312" y="152" fontSize="9" letterSpacing="0.2">SITRA ISLAND</text>
                <text x="142" y="230" fontSize="9" fill="#3b2f2b" fontStyle="italic" opacity="0.8">Sakhir Desert Dunes</text>
                <text x="400" y="270" fontSize="10.5" fill="#C1122F" fontWeight="800" opacity="0.45" letterSpacing="3">ARABIAN GULF</text>
              </g>

              {/* Manama (Capital Star) */}
              <g transform="translate(230, 48)">
                <path d="M 0,-7 L 2,-2 L 7,-2 L 3,1 L 5,6 L 0,3 L -5,6 L -3,1 L -7,-2 L -2,-2 Z" fill="#aa7c11" stroke="#000000" strokeWidth="0.5" />
                <text x="10" y="3" fontSize="10.5" fill="#000000" fontWeight="900" fontFamily="serif" stroke="none">MANAMA (Capital)</text>
              </g>
              {/* Riffa Fort */}
              <g transform="translate(195, 125)">
                <circle cx="0" cy="0" r="3" fill="#C1122F" stroke="#000000" strokeWidth="0.5" />
                <text x="8" y="3.5" fontSize="8.5" fill="#3b2f2b" fontFamily="sans-serif" stroke="none" fontWeight="bold">Riffa Fort</text>
              </g>

              {/* Dotted travel route path connecting day landmarks in order */}
              {activeSpots.length > 1 && (
                <polyline
                  points={activeSpots.map(s => {
                    const coords = getSvgCoords(s.coords)
                    return `${coords.x},${coords.y}`
                  }).join(' ')}
                  fill="none"
                  stroke="#C1122F"
                  strokeWidth="2.8"
                  strokeDasharray="4,5"
                  className="animate-pulse"
                  opacity="0.9"
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

              {/* DETAILED LATITUDE/LONGITUDE DOUBLE RULE BORDER */}
              <g stroke="#0d0a09" strokeWidth="1.2" fill="none">
                <rect x="2" y="2" width={mapWidth - 4} height={mapHeight - 4} />
                <rect x="5" y="5" width={mapWidth - 10} height={mapHeight - 10} strokeWidth="0.5" strokeDasharray="3,3" />
              </g>
              {/* Latitude/Longitude scales ticks text */}
              <g stroke="none" fill="#3b2f2b" className="font-mono text-[7px] font-extrabold" opacity="0.8">
                <text x="65" y="14" textAnchor="middle">50°27' E</text>
                <text x="195" y="14" textAnchor="middle">50°35' E</text>
                <text x="325" y="14" textAnchor="middle">50°43' E</text>
                <text x="455" y="14" textAnchor="middle">50°51' E</text>
                <text x="14" y="90" textAnchor="start" transform="rotate(-90 14 90)">26°14' N</text>
                <text x="14" y="180" textAnchor="start" transform="rotate(-90 14 180)">26°08' N</text>
                <text x="14" y="270" textAnchor="start" transform="rotate(-90 14 270)">26°02' N</text>
              </g>

              {/* Hand-drawn Map spots coordinates */}
              {spotsCatalog.map(spot => {
                const coords = getSvgCoords(spot.coords)
                const isActiveDaySpot = activeSpots.some(s => s.id === spot.id)
                const activeIndex = activeSpots.findIndex(s => s.id === spot.id)
                const isSelectedSpot = isActiveDaySpot && currentSpotIndex === activeIndex
                const scanned = collectedKeepsakes.includes(spot.id)

                return (
                  <g
                    key={spot.id}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    className="cursor-pointer"
                    onClick={() => handleSpotClick(spot.id)}
                    onMouseEnter={() => setHoveredSpot(spot)}
                    onMouseLeave={() => setHoveredSpot(null)}
                  >
                    {isActiveDaySpot && (
                      <circle
                        cx="0"
                        cy="0"
                        r="16"
                        className="fill-bahrain-red/10 stroke-bahrain-red/45 map-node-pulse"
                        strokeWidth="1.8"
                      />
                    )}

                    <circle
                      cx="0"
                      cy="0"
                      r={isSelectedSpot ? "9.5" : "7.8"}
                      className={`transition-all duration-300 ${
                        scanned
                          ? 'fill-amber-500 stroke-white'
                          : isSelectedSpot
                            ? 'fill-bahrain-red stroke-white shadow-md'
                            : isActiveDaySpot
                              ? 'fill-bahrain-accent stroke-[#FAF9F6]'
                              : 'fill-bronze-muted/40 stroke-[#FAF9F6]/90'
                      }`}
                      strokeWidth={isSelectedSpot ? "2.8" : "1.8"}
                    />

                    {/* Number index labels directly inside nodes */}
                    {isActiveDaySpot && !scanned && (
                      <text
                        x="0"
                        y="2.8"
                        textAnchor="middle"
                        fill="white"
                        className="font-sans text-[8px] font-extrabold"
                        stroke="none"
                      >
                        {activeIndex + 1}
                      </text>
                    )}

                    {scanned && (
                      <text
                        x="0"
                        y="2.8"
                        textAnchor="middle"
                        fill="white"
                        className="font-serif text-[8.5px] font-bold"
                        stroke="none"
                      >
                        ★
                      </text>
                    )}
                  </g>
                )
              })}

            </svg>

            {/* Map label */}
            <div className="absolute bottom-2 left-3 font-mono text-[7px] tracking-widest text-bronze-muted/50 font-bold uppercase">
              Bahrain Archipelago projections WGS84 • MERCATOR
            </div>

            {/* Float details panel */}
            {hoveredSpot && (
              <div className="absolute top-2 left-2 right-2 bg-white/98 backdrop-blur-md p-3.5 rounded-xl border-2 border-bahrain-red/30 shadow-lg flex items-center gap-3.5 z-30 text-left animate-fadeIn">
                <span className="text-2xl p-2 bg-red-500/5 rounded-xl border border-red-500/10">
                  {collectedKeepsakes.includes(hoveredSpot.id) ? hoveredSpot.keepsakeEmoji : '📍'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-sm font-bold text-bronze-charcoal truncate">
                      {hoveredSpot.name}
                    </span>
                    <span className="font-serif text-xs text-bahrain-red italic font-extrabold shrink-0 ml-1">
                      {hoveredSpot.arabic}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[7.5px] font-sans text-bronze-muted/70 font-extrabold uppercase">
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
    </div>
  )
}
