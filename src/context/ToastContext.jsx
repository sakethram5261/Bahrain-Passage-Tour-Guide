/**
 * ToastContext.jsx — Global non-blocking notification system
 *
 * Usage:
 *   const { toast } = useToast()
 *   toast.success('Keepsake collected!')
 *   toast.error('Couldn\'t load that. Tap to retry.')
 *   toast.info('XP earned!')
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'


const ToastContext = createContext(null)

let _nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
  }, [])

  const addToast = useCallback((type, message, duration = 3200) => {
    const id = ++_nextId
    setToasts(prev => {
      // Max 3 visible at once — drop the oldest
      const capped = prev.length >= 3 ? prev.slice(1) : prev
      return [...capped, { id, type, message, leaving: false }]
    })
    timersRef.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error:   (msg, dur) => addToast('error',   msg, dur),
    info:    (msg, dur) => addToast('info',     msg, dur),
  }

  // Subscribe to AI fallback events
  useEffect(() => {
    let lastToastTime = 0
    const handleFallback = () => {
      const now = Date.now()
      if (now - lastToastTime > 8000) {
        addToast('info', 'AI Concierge offline. Using local guide database.', 4000)
        lastToastTime = now
      }
    }
    window.addEventListener('ai-fallback-triggered', handleFallback)
    return () => window.removeEventListener('ai-fallback-triggered', handleFallback)
  }, [addToast])


  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ─── Internal ToastContainer component ────────────────────────────────────────

const ICONS = { success: '✓', error: '⚠', info: 'ℹ' }
const COLORS = {
  success: { bg: 'linear-gradient(135deg, #1C6B3A 0%, #14532D 100%)', accent: '#4ADE80' },
  error:   { bg: 'linear-gradient(135deg, #BA0C2F 0%, #8A0A22 100%)', accent: '#FCA5A5' },
  info:    { bg: 'linear-gradient(135deg, #92400E 0%, #78350F 100%)', accent: '#D4AF37' },
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: 'fixed',
        top: 56, // below the progress indicator
        right: 16,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxWidth: 320,
      }}
    >
      {toasts.map(t => {
        const col = COLORS[t.type] || COLORS.info
        return (
          <div
            key={t.id}
            role="status"
            aria-label={t.message}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: col.bg,
              color: '#fff',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 13,
              boxShadow: '0 8px 24px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)',
              border: `1px solid ${col.accent}40`,
              transform: t.leaving ? 'translateX(110%)' : 'translateX(0)',
              opacity: t.leaving ? 0 : 1,
              transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1), opacity 0.28s ease',
              willChange: 'transform',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: `${col.accent}25`,
              border: `1.5px solid ${col.accent}60`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 900, flexShrink: 0, color: col.accent,
            }}>
              {ICONS[t.type]}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4, fontStyle: 'italic', fontSize: 12 }}>
              {t.message}
            </span>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
                fontSize: 14, cursor: 'pointer', padding: '0 0 0 4px', flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
