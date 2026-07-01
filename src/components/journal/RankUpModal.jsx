import { Trophy } from 'lucide-react'

export default function RankUpModal({ showRankUpModal, unlockedRankInfo, onClose }) {
  if (!showRankUpModal || !unlockedRankInfo) return null

  return (
    <div
      className="jn-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Explorer Rank Advanced"
      onClick={onClose}
      style={{ zIndex: 3000, background: 'rgba(26,10,12,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="jn-ksake-modal"
        style={{
          background: 'linear-gradient(135deg, var(--bp-primary) 0%, var(--bp-primary-dark) 100%)',
          border: '4px solid var(--bp-parchment)',
          boxShadow: '0 30px 80px rgba(193, 18, 47, 0.45)',
          color: '#ffffff',
          textAlign: 'center',
          padding: '30px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>✦ Explorer Rank Advanced ✦</span>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <Trophy className="w-16 h-16 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
        </div>
        <h4 style={{ fontFamily: 'var(--bp-font-display)', fontSize: '24px', fontWeight: 900, marginBottom: '8px', color: '#ffffff' }}>
          {unlockedRankInfo.label}
        </h4>
        <span className="jn-tag jn-tag--amber" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#ffffff', padding: '4px 12px' }}>
          {unlockedRankInfo.arabic}
        </span>
        <p style={{ fontSize: '12px', margin: '20px 0 0 0', lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
          "Traveler, you have gained sufficient experience to be officially recognized by the guilds of the Archipelago. May the desert winds guide your sails!"
        </p>
        <button
          onClick={onClose}
          className="jn-action-btn jn-action-btn--primary"
          style={{ background: '#ffffff', color: 'var(--bp-primary)', fontWeight: 900, width: '100%', marginTop: '20px' }}
        >
          Accept Rank Promotion
        </button>
      </div>
    </div>
  )
}
