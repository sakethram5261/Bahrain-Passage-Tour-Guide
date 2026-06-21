/**
 * LangToggle.jsx — Compact EN / AR toggle button for the journal header.
 * Flips the global lang context and triggers RTL layout switch.
 */
import { useLang } from '../context/LangContext'

export default function LangToggle({ className = '' }) {
  const { lang, toggle } = useLang()
  const isAr = lang === 'ar'

  return (
    <button
      id="lang-toggle"
      onClick={toggle}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      aria-pressed={isAr}
      title={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-200 dark:border-[#2E2724] bg-stone-100/80 dark:bg-[#1C1816]/80 text-[#1C1917] dark:text-[#EDEBE6] hover:bg-stone-200/90 dark:hover:bg-[#24201E] text-[10px] font-extrabold tracking-wider cursor-pointer transition-all select-none hover:scale-102 active:scale-98 ${className}`}
      style={{
        fontFamily: isAr ? '"Noto Naskh Arabic", "Scheherazade New", serif' : '"Outfit", sans-serif',
      }}
    >
      <span style={{ opacity: isAr ? 0.55 : 1, transition: 'opacity 0.15s' }}>EN</span>
      <span style={{ opacity: 0.25, fontSize: 9 }}>|</span>
      <span style={{ opacity: isAr ? 1 : 0.55, transition: 'opacity 0.15s' }}>عر</span>
    </button>
  )
}
