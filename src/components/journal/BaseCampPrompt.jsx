import { HOTELS_DB } from '../AIHotelPanel'
import { Hotel } from 'lucide-react'

export default function BaseCampPrompt({
  baseCampPromptOpen,
  selectedHotel,
  tier,
  selectedMoods,
  setSelectedHotel,
  awardXP,
  setBaseCampPromptOpen,
  playCampStampSound,
  soundVolume,
  soundMuted,
  setActiveTab,
  isRTL
}) {
  if (!baseCampPromptOpen || selectedHotel) return null

  const filteredHotels = HOTELS_DB.filter(h => h.tierFit.includes(tier) || h.moodFit.some(m => selectedMoods.includes(m)))
  const displayHotels = filteredHotels.length > 0 ? filteredHotels : HOTELS_DB

  return (
    <div
      className="jn-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Establish Base Camp Stay"
      onClick={(e) => { if (e.target === e.currentTarget) setBaseCampPromptOpen(false) }}
    >
      <div className="jn-ksake-modal" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <button 
          className="jn-ksake-close" 
          onClick={() => setBaseCampPromptOpen(false)} 
          aria-label="Close base camp selection"
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', color: 'var(--bp-ink-muted)' }}
        >
          ✕ Skip
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bp-primary-soft)', padding: '8px', borderRadius: '12px' }}>
            <Hotel className="w-6 h-6 text-[var(--bp-primary)]" />
          </div>
          <div>
            <span className="jn-shop-eyebrow" style={{ color: 'var(--bp-primary)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Welcome to Bahrain</span>
            <h4 className="jn-ksake-name" style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'var(--bp-font-display)', color: 'var(--bp-ink)' }}>Establish your Base Camp</h4>
          </div>
        </div>
        <p className="jn-ksake-desc" style={{ fontSize: '12.5px', color: 'var(--bp-ink-muted)', marginBottom: '16px', lineHeight: 1.55 }}>
          Before starting your chronicle, select a recommended hotel matching your <strong>{tier}</strong> budget and vibe to serve as your journey's central base.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
          {displayHotels.map(hotel => (
            <button
              key={hotel.id}
              onClick={() => {
                setSelectedHotel(hotel)
                awardXP(50, 'Established Base Camp')
                setBaseCampPromptOpen(false)
                playCampStampSound(soundVolume, soundMuted)
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '12px',
                borderRadius: '12px',
                background: '#fffdf9',
                border: '1.5px solid rgba(139,90,43,0.15)',
                textAlign: isRTL ? 'right' : 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--bp-primary)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,90,43,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: '22px', padding: '6px', borderRadius: '8px', background: '#FAF6EE', border: '1px solid rgba(139,90,75,0.1)', flexShrink: 0 }}>{hotel.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, fontFamily: 'var(--bp-font-display)', fontSize: '13px', fontWeight: 700, color: '#2A2321' }}>{hotel.name}</h5>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '1px 5px', borderRadius: '999px' }}>{hotel.cost.replace('From ', '')}</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#5C5451', lineHeight: 1.4 }}>{hotel.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setBaseCampPromptOpen(false)
              setActiveTab('hotels')
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid var(--bp-primary)',
              color: 'var(--bp-primary)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Browse All Hotels
          </button>
          <button
            onClick={() => setBaseCampPromptOpen(false)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)',
              color: '#fff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Decide Later
          </button>
        </div>
      </div>
    </div>
  )
}
