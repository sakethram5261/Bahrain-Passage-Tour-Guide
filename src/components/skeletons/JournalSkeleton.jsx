/**
 * JournalSkeleton.jsx
 * Branded parchment loading skeleton shown while JournalNotebook lazy-loads.
 */
export default function JournalSkeleton() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF9F6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontFamily: '"Playfair Display", Georgia, serif',
      }}
    >
      {/* Header skeleton */}
      <div style={{
        width: '100%',
        background: 'linear-gradient(135deg, #BA0C2F 0%, #8A0A22 100%)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ width: 140, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.25)', animation: 'jnSkeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: 80, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.15)', animation: 'jnSkeletonPulse 1.5s ease-in-out 0.2s infinite' }} />
        </div>
        <div style={{ width: 60, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.2)', animation: 'jnSkeletonPulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* Day tabs skeleton */}
      <div style={{
        width: '100%',
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        overflowX: 'auto',
        background: '#FAF9F6',
        borderBottom: '1px solid rgba(209,26,56,0.08)',
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 60, height: 32, borderRadius: 16, flexShrink: 0,
            background: i === 1 ? 'rgba(209,26,56,0.12)' : 'rgba(42,35,33,0.06)',
            animation: `jnSkeletonPulse 1.5s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>

      {/* Content cards skeleton */}
      <div style={{ width: '100%', maxWidth: 560, padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero card */}
        <div style={{
          borderRadius: 16, overflow: 'hidden',
          background: 'rgba(42,35,33,0.04)',
          border: '1px solid rgba(209,26,56,0.08)',
        }}>
          <div style={{ height: 180, background: 'rgba(42,35,33,0.06)', animation: 'jnSkeletonPulse 1.5s ease-in-out infinite' }} />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 18, width: '60%', borderRadius: 9, background: 'rgba(42,35,33,0.08)', animation: 'jnSkeletonPulse 1.5s ease-in-out 0.1s infinite' }} />
            <div style={{ height: 12, width: '85%', borderRadius: 6, background: 'rgba(42,35,33,0.05)', animation: 'jnSkeletonPulse 1.5s ease-in-out 0.2s infinite' }} />
            <div style={{ height: 12, width: '70%', borderRadius: 6, background: 'rgba(42,35,33,0.05)', animation: 'jnSkeletonPulse 1.5s ease-in-out 0.3s infinite' }} />
          </div>
        </div>

        {/* Two info cards */}
        {[0, 1].map(i => (
          <div key={i} style={{
            borderRadius: 12, padding: 14,
            background: 'rgba(42,35,33,0.04)',
            border: '1px solid rgba(209,26,56,0.07)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 16, background: 'rgba(209,26,56,0.1)', animation: `jnSkeletonPulse 1.5s ease-in-out ${0.1 + i * 0.15}s infinite` }} />
              <div style={{ height: 14, flex: 1, borderRadius: 7, background: 'rgba(42,35,33,0.07)', animation: `jnSkeletonPulse 1.5s ease-in-out ${0.2 + i * 0.15}s infinite` }} />
            </div>
            <div style={{ height: 10, width: '80%', borderRadius: 5, background: 'rgba(42,35,33,0.05)', animation: `jnSkeletonPulse 1.5s ease-in-out ${0.3 + i * 0.15}s infinite` }} />
          </div>
        ))}
      </div>

      {/* Compass spinner */}
      <div style={{ marginTop: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <svg
          viewBox="0 0 60 60" width={40} height={40}
          style={{ animation: 'jnCompassSpin 3s linear infinite', opacity: 0.3 }}
          fill="none" stroke="#BA0C2F" strokeWidth="1.5"
        >
          <circle cx="30" cy="30" r="26" strokeDasharray="3,3" />
          <path d="M 30,30 L 28,10 L 30,4 L 32,10 Z" fill="#BA0C2F" opacity="0.5" />
          <path d="M 30,30 L 50,28 L 56,30 L 50,32 Z" fill="#BA0C2F" opacity="0.3" />
          <path d="M 30,30 L 28,50 L 30,56 L 32,50 Z" fill="#BA0C2F" opacity="0.2" />
          <path d="M 30,30 L 10,28 L 4,30 L 10,32 Z" fill="#BA0C2F" opacity="0.2" />
        </svg>
        <span style={{ fontFamily: '"Playfair Display", serif', fontSize: 11, color: 'rgba(92,84,81,0.45)', fontStyle: 'italic', letterSpacing: '0.2em' }}>
          Loading your passage…
        </span>
      </div>

      <style>{`
        @keyframes jnSkeletonPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes jnCompassSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
