import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { Download } from 'lucide-react'
import { useVibe } from '../../hooks/useVibe'

export default function TravelScrollRenderer() {
  const scrollRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const { itinerarySpots = [], rank = { label: 'Explorer' } } = useVibe() || {}

  const handleExport = async () => {
    if (!scrollRef.current) return
    setIsExporting(true)
    
    // Briefly make the scroll visible for capture
    const el = scrollRef.current
    el.style.display = 'block'
    el.style.position = 'absolute'
    el.style.top = '-9999px'
    el.style.left = '-9999px'

    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F9F7F4'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = imgData
      link.download = 'bahrain-travel-scroll.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to generate scroll:', err)
    } finally {
      el.style.display = 'none'
      setIsExporting(false)
    }
  }

  return (
    <>
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="w-full mt-3 p-3 bg-stone-800 text-stone-100 rounded-lg flex items-center justify-center gap-2 hover:bg-stone-700 transition"
      >
        <Download size={16} />
        {isExporting ? 'Rolling Scroll...' : 'Generate Travel Scroll'}
      </button>

      {/* Hidden Scroll DOM to Capture */}
      <div 
        ref={scrollRef} 
        style={{ display: 'none', width: '600px', backgroundColor: '#F9F7F4', padding: '40px', border: '8px solid #C41E3A', fontFamily: 'serif' }}
      >
        <div className="text-center mb-8 border-b-2 border-[#C41E3A] pb-6">
          <h1 className="text-4xl font-bold text-stone-900 tracking-widest uppercase">Bahrain Passage</h1>
          <p className="text-sm text-stone-600 uppercase tracking-widest mt-2">{rank.label} Chronicle</p>
        </div>
        
        <div className="space-y-6">
          {itinerarySpots.map((spot, i) => (
            <div key={i} className="flex gap-4 items-center bg-white p-4 rounded shadow-sm border border-stone-200">
              <div className="w-12 h-12 bg-red-900 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">{spot.name}</h3>
                <p className="text-sm text-stone-600 line-clamp-2">{spot.desc || spot.simpleTerms}</p>
                <div className="text-xs text-stone-400 mt-1 uppercase tracking-widest">Day {spot.day}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t-2 border-stone-300 text-center text-sm text-stone-500 font-sans">
          Generated via Bahrain Passage Guide · {new Date().toLocaleDateString()}
        </div>
      </div>
    </>
  )
}
