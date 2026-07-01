export default function KeepsakeDetailModal({
  selectedKsake,
  capturedPhotos,
  onClose
}) {
  if (!selectedKsake) return null

  return (
    <div
      className="jn-modal-overlay glass-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="jn-ksake-modal glass-card relative" style={{
        maxWidth: '520px',
        padding: '24px',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Tactile Paper Grain Overlay */}
        <div className="paper-grain" style={{ opacity: 0.035 }} />
        {/* Vintage borders inside */}
        <div style={{
          position: 'absolute',
          top: '8px', left: '8px', right: '8px', bottom: '8px',
          border: '1px dashed #D4C3A3',
          pointerEvents: 'none'
        }} />
        
        {/* Header: Kingdom of Bahrain visa header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '2px solid #BA0C2F',
          paddingBottom: '10px',
          marginBottom: '18px',
          position: 'relative'
        }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#BA0C2F', fontWeight: '900', fontFamily: 'var(--bp-font-body)' }}>
            Kingdom of Bahrain · Entry Visa
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'var(--bp-font-display)', color: '#1C1917', marginTop: '2px' }}>
            تأشيرة دخول دلمون الأثرية
          </div>
          <button 
            onClick={onClose} 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '4px',
              background: 'none',
              border: 'none',
              fontSize: '16px',
              color: '#78716C',
              cursor: 'pointer'
            }}
            aria-label="Close visa document"
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '20px', flexWrap: 'wrap' }}>
          {/* Photo component */}
          <div style={{
            flex: '1 1 180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              background: '#fff',
              padding: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid #E7E5E4',
              borderRadius: '4px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                width: '100%',
                height: '140px',
                overflow: 'hidden',
                borderRadius: '2px',
                background: '#292524',
                position: 'relative'
              }}>
                <img 
                  src={capturedPhotos[selectedKsake.id] || selectedKsake.image} 
                  alt={selectedKsake.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: '8px',
                  fontFamily: 'var(--bp-font-body)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 6px',
                  textAlign: 'center'
                }}>
                  Wayfarer Photo ID
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '9px', color: '#78716C', fontFamily: 'var(--bp-font-body)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Serial: #BP-{selectedKsake.id?.slice(0,8).toUpperCase() || 'KSAKE'}
              </div>
            </div>
          </div>

          {/* Visa details & stamp */}
          <div style={{
            flex: '1 2 240px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Souvenir:</span>
                <span style={{ fontWeight: 'bold', color: '#1C1917' }}>{selectedKsake.keepsakeEmoji} {selectedKsake.keepsakeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Site:</span>
                <span style={{ fontWeight: 'bold', color: '#1C1917' }}>{selectedKsake.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Epoch/Period:</span>
                <span style={{ fontWeight: 'bold', color: '#BA0C2F' }}>{selectedKsake.period}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', borderBottom: '1px dashed #E7E5E4', paddingBottom: '4px' }}>
                <span style={{ color: '#78716C', fontWeight: 'bold', textTransform: 'uppercase' }}>Coordinates:</span>
                <span style={{ fontWeight: 'bold', color: '#78716C', fontFamily: 'monospace' }}>{selectedKsake.coords}</span>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <span style={{ display: 'block', fontSize: '8px', textTransform: 'uppercase', color: '#A8A29E', fontWeight: 'bold', letterSpacing: '0.1em' }}>Cultural Description</span>
              <p style={{ margin: '2px 0 0 0', fontFamily: 'var(--bp-font-display)', fontSize: '11px', lineHeight: '1.4', color: '#44403C', fontStyle: 'italic' }}>
                "{selectedKsake.keepsakeDesc}"
              </p>
            </div>

            {/* Circular entry stamp */}
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              border: '2px double rgba(186, 12, 47, 0.45)',
              color: 'rgba(186, 12, 47, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-15deg)',
              pointerEvents: 'none',
              fontFamily: 'var(--bp-font-body)',
              fontSize: '8px',
              fontWeight: '950',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '4px',
              boxSizing: 'border-box',
              background: 'rgba(253, 251, 247, 0.85)',
              boxShadow: '0 0 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '6px', borderBottom: '1px solid rgba(186,12,47,0.3)', paddingBottom: '1px', marginBottom: '2px' }}>ENTRY SEAL</div>
              <div style={{ fontSize: '7px', fontWeight: 'black' }}>APPROVED</div>
              <div style={{ fontSize: '5px', marginTop: '1px', color: 'rgba(186,12,47,0.45)' }}>BP-PASSPORT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
