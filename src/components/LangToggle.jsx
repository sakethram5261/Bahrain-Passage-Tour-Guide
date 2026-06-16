/**
 * LangToggle.jsx — Compact EN / AR toggle button for the journal header.
 * Flips the global lang context and triggers RTL layout switch.
 */
import { useLang } from '../context/LangContext'

export default function LangToggle({ style = {}, className = '' }) {
  const { lang, toggle } = useLang()
  const isAr = lang === 'ar'

  return (
    <button
      id="lang-toggle"
      onClick={toggle}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      aria-pressed={isAr}
      title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        fontFamily: isAr ? '"Noto Naskh Arabic", "Scheherazade New", serif' : '"Playfair Display", serif',
        ...style,
      }}
      className={className}
    >
      <span style={{ opacity: isAr ? 0.55 : 1, transition: 'opacity 0.2s' }}>EN</span>
      <span style={{ opacity: 0.4, fontSize: 9 }}>|</span>
      <span style={{ opacity: isAr ? 1 : 0.55, transition: 'opacity 0.2s' }}>عر</span>
    </button>
  )
}
