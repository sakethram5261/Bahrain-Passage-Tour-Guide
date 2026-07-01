export default function QuickInfoSheet({
  quickInfoOpen,
  activeSpot,
  currentDayTab,
  lang,
  setQuickInfoOpen,
  setMapOpen
}) {
  if (!quickInfoOpen || !activeSpot) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Quick info: ${activeSpot.name}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) setQuickInfoOpen(false) }}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,12,11,0.55)', backdropFilter: 'blur(4px)' }} />

      {/* Sheet */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 560,
        background: '#FAF9F6',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 40px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        animation: 'slideUpFade 0.35s cubic-bezier(0.16,1,0.3,1) both',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(42,35,33,0.15)', margin: '0 auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#BA0C2F', fontWeight: 800, margin: '0 0 4px' }}>
              Quick Info · Day {currentDayTab}
            </p>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 22, fontWeight: 700, color: '#2A2321', margin: 0, lineHeight: 1.2 }}>
              {lang === 'ar' && activeSpot.arabic ? activeSpot.arabic : activeSpot.name}
            </h2>
            {lang === 'ar' && activeSpot.arabic && (
              <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(92,84,81,0.6)', margin: '2px 0 0' }}>{activeSpot.name}</p>
            )}
          </div>
          <button
            onClick={() => setQuickInfoOpen(false)}
            aria-label="Close quick info"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'rgba(92,84,81,0.4)', padding: '0 0 0 12px', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Info pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {activeSpot.coords && (
            <span style={{ padding: '4px 10px', borderRadius: 999, background: '#FAF6EE', border: '1px solid rgba(139,90,75,0.15)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#8B5A4B' }}>
              {activeSpot.coords}
            </span>
          )}
          {(activeSpot.pathCost || activeSpot.budgetCost) && (
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#059669' }}>
              {activeSpot.pathCost || activeSpot.budgetCost}
            </span>
          )}
          {activeSpot.category && (
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(209,26,56,0.06)', border: '1px solid rgba(209,26,56,0.15)', fontSize: 11, fontFamily: 'sans-serif', fontWeight: 700, color: '#BA0C2F' }}>
              {activeSpot.category}
            </span>
          )}
        </div>

        {/* Description */}
        {activeSpot.simpleTerms && (
          <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 13, fontStyle: 'italic', color: '#5C5451', lineHeight: 1.65, marginBottom: 20 }}>
            {activeSpot.simpleTerms}
          </p>
        )}

        {/* Insider tip */}
        {activeSpot.insider && (
          <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', marginBottom: 20 }}>
            <p style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 12, fontStyle: 'italic', color: '#2A2321', lineHeight: 1.6, margin: 0 }}>
              {activeSpot.insider}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {activeSpot.coords && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(activeSpot.coords + ' Bahrain')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 12,
                background: 'linear-gradient(135deg, #BA0C2F, #8A0A22)',
                color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
                textAlign: 'center', textDecoration: 'none', letterSpacing: '0.04em',
              }}
            >
              Get Directions
            </a>
          )}
          <button
            onClick={() => { setMapOpen(true); setQuickInfoOpen(false) }}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              background: '#FAF6EE', border: '1px solid rgba(212,175,55,0.3)',
              color: '#2A2321', fontSize: 12, fontWeight: 700, fontFamily: 'sans-serif',
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            Open Map
          </button>
        </div>
      </div>
    </div>
  )
}
