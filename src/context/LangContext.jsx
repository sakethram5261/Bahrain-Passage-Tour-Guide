/**
 * LangContext.jsx — Global EN/AR language toggle with RTL support
 *
 * Usage:
 *   const { lang, setLang, isRTL } = useLang()
 *   // lang is 'en' or 'ar'
 *
 * When lang === 'ar':
 *   - document.documentElement.lang = 'ar'
 *   - document.documentElement.dir  = 'rtl'
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translation'

const LangContext = createContext(null)

const STORAGE_KEY = 'bp_lang'

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  const isRTL = lang === 'ar'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch { /* ignore */ }
  }, [lang, isRTL])

  const setLang = (newLang) => {
    if (newLang === 'en' || newLang === 'ar') setLangState(newLang)
  }

  const toggle = () => setLang(lang === 'en' ? 'ar' : 'en')

  // Translation helper function
  const t = (key, fallback = '') => {
    const section = translations[lang] || translations.en
    return section[key] || fallback || key
  }

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, isRTL, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within <LangProvider>')
  return ctx
}
