/**
 * MapSkeleton.jsx
 * Shown while WayfarerMap or TourChatbot lazy-loads.
 */
export default function MapSkeleton({ height = 340, label = 'Loading map…' }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #FAF6EE 0%, #EFE9DC 100%)',
        border: '1px solid rgba(209,26,56,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Grid lines mimicking a map */}
      <svg
        style={{ position: 'absolute', inset: 0, opacity: 0.07 }}
        width="100%" height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="mapGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B5A4B" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
      </svg>

      {/* Compass + pulse ring */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute',
          width: 70, height: 70,
          borderRadius: '50%',
          border: '2px solid rgba(186,12,47,0.2)',
          animation: 'mapRingPulse 1.8s ease-out infinite',
        }} />
        <svg
          viewBox="0 0 60 60" width={44} height={44}
          style={{ animation: 'mapCompassSpin 4s linear infinite', position: 'relative', zIndex: 1 }}
          fill="none" stroke="#BA0C2F" strokeWidth="1.2"
        >
          <circle cx="30" cy="30" r="24" strokeDasharray="4,4" />
          <circle cx="30" cy="30" r="10" />
          <path d="M 30,30 L 27,12 L 30,5 L 33,12 Z" fill="#BA0C2F" opacity="0.7" />
          <path d="M 30,30 L 48,27 L 55,30 L 48,33 Z" fill="#D4AF37" opacity="0.5" />
          <path d="M 30,30 L 27,48 L 30,55 L 33,48 Z" fill="#BA0C2F" opacity="0.35" />
          <path d="M 30,30 L 12,27 L 5,30 L 12,33 Z" fill="#D4AF37" opacity="0.35" />
          <circle cx="30" cy="30" r="3" fill="#BA0C2F" />
        </svg>
      </div>

      <span style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: 12,
        fontStyle: 'italic',
        color: 'rgba(92,84,81,0.55)',
        letterSpacing: '0.18em',
        position: 'relative',
        zIndex: 1,
      }}>
        {label}
      </span>

      <style>{`
        @keyframes mapRingPulse {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes mapCompassSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
