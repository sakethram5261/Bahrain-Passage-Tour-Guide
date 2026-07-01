import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { useLang } from '../context/LangContext'
import { 
  Landmark, 
  Waves, 
  Coffee, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDown, 
  Compass,
  Coins,
  Shield,
  Loader
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Language Scramble Constants
// ─────────────────────────────────────────────────────────────────────────────
const SLOT_PHRASES = [
  'Bienvenue à Bahreïn',       // French
  '巴林欢迎您',                 // Chinese
  'Bienvenido a Baréin',       // Spanish
  'Willkommen in Bahrain',     // German
  'Benvenuti in Bahrein',      // Italian
  'Добро пожаловать в Бахрейн', // Russian
  'バーレーنへようこそ',       // Japanese
  '바레인에 오신 것을 환영합니다', // Korean
  'Bem-vindo ao Bahrein',      // Portuguese
  'Bahreyn\'e hoş geldiniz',   // Turkish
  'به بحرین خوش آمدید',       // Persian
  'बहरीन में आपका स्वागत है',    // Hindi
  'Καλώς ήρθατε στο Μπαχρέιν',  // Greek
  'Welkom in Bahrein',         // Dutch
  'Välkommen till Bahrain',    // Swedish
  'Witamy w Bahrajnie',        // Polish
  'Chào mừng đến với Bahrain',  // Vietnamese
  'Selamat datang ke Bahrain', // Malay/Indonesian
  'Maligayang pagdating sa Bahrain', // Tagalog
  'Karibu Bahrain',            // Swahili
  'Velkommen til Bahrain',     // Danish
  'Tervetulaa Bahrainiin',     // Finnish
  'Velkommen til Bahrain',     // Norwegian
  'Üdvözöljük Bahreinben',     // Hungarian
  'Vítejte v Bahrajnu',        // Czech
  'Vitajte v Bahrajne',        // Slovak
  'Bun venit în Bahrain',      // Romanian
  'Ласкаво просимо до Бахрейну', // Ukrainian
  'ברוכים הבאים לבחריין',       // Hebrew
  'ยินดีต้อนรับสู่บาห์เรน',      // Thai
  'বাহরাইনে আপনাকে स्वागतम',    // Bengali
  'ਬਹਿਰੀਨ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ', // Punjabi
  'બ Gujarati બહેريનમાં તમારું સ્વાગત છે', // Gujarati
  'பஹ்ரைனுக்கு உங்களை வரவேற்கிறோம்', // Tamil
  'బహ్రెయిన్‌కు మీకు స్వాగతం',    // Telugu
  'ಬಹ್ರೇನ್ಗೆ ನಿಮಗೆ స్ವಾಗత',      // Kannada
  'ബഹ്‌റൈനിലേക്ക് നിങ്ങൾക്ക് സ്വാഗതം', // Malayalam
  'Velkomin til Barein',       // Icelandic
  'Dobrodošli u Bahrein',      // Croatian
  'Dobrodošli u Bahrein',      // Bosnian
  'Добре дошли в Бахрейн',     // Bulgarian
  'Sveiki atvykę į Bahreiną',   // Lithuanian
  'Laipni lūdzam Bahreinā',     // Latvian
  'Tere tulemast Bahraini',    // Estonian
  'კეთილი იყოს თქვენი მობრძანება ბაჰრეინში', // Georgian
  'Բարի გալուստ Բահրեյն',      // Armenian
  'Bəhreynə xoş gəlmisiniz',   // Azerbaijani
  'بحرین میں خوش آمدید',       // Urdu
  'बहराइनमा तपाईंलाई स्वागत छ',  // Nepali
  'බහරේනයට සාදරයෙන් පිළිගනිමු', // Sinhalese
  'Бахрейнд тавтай морил',      // Mongolian
  'សូមស្វាគមន៍មកកាន់ប្រទេសបារ៉ែន', // Khmer
  'ຍິນດີຕ້ອນຮັບສູ່ບາເຣນ',      // Lao
  'ဘာရိန်းနိုင်ငံမှ ကြိုဆိုပါသည်', // Burmese
  'Fáilte go dtí an Bairéin',   // Irish
  'Croeso i Bahrain',          // Welsh
  'Benvingut a Bahrain',       // Catalan
  'Bonvenon al Barejno',       // Esperanto
]

const ARABIC_FINAL  = 'مرحباً بكم في البحرين'
const ENGLISH_FINAL = 'Welcome to Bahrain'
const MIXED_CHARS   = 'أبتثجحخدذرزWELCOMTBAHRINwelcomtbahrinطظعغfqklmnhو0123456789@#$%'

function fontFor(txt) {
  if (/[\u0600-\u06FF]/.test(txt)) return 'var(--bp-font-display)'
  if (/[\u3040-\u30FF\u4E00-\u9FFF]/.test(txt)) return 'sans-serif'
  if (/[\u0400-\u04FF]/.test(txt)) return 'system-ui,"Noto Sans",sans-serif'
  if (/[\u0900-\u097F]/.test(txt)) return '"Noto Sans Devanagari",sans-serif'
  return 'var(--bp-font-display)'
}

const MOODS = [
  {
    id: 'empires',
    label: 'Empires',
    arabic: 'الإمبراطوريات',
    tagline: 'Ancient archaeological forts, temples & 5,000-year history',
    icon: Landmark,
    spots: ["Qal'at al-Bahrain", 'Barbar Temple', 'Arad Fort', 'Riffa Fort'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M0,30 L30,0 L60,30 L30,60 Z' stroke='%238B5A4B' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'><path d='M0,30 L30,0 L60,30 L30,60 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'sea',
    label: 'Sea',
    arabic: 'البحر',
    tagline: 'Refined pearls, coastal tides & disappearing sandbanks',
    icon: Waves,
    spots: ['Pearling Path UNESCO', 'Jarada Sandbank', 'Al Dar Islands', 'Sea Ferry'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'><path d='M0,20 Q15,5 30,20 T60,20 M0,30 Q15,15 30,30 T60,30' stroke='%231a5276' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='40' viewBox='0 0 60 40'><path d='M0,20 Q15,5 30,20 T60,20 M0,30 Q15,15 30,30 T60,30' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'spice',
    label: 'Spice',
    arabic: 'التوابل',
    tagline: 'Authentic souqs, traditional karak & saffron delicacies',
    icon: Coffee,
    spots: ['Manama Souq', 'Muharraq Alleyways', "Haji's Cafe", "A'ali Pottery"],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><path d='M25,2 C38,2 48,12 48,25 L48,48 L2,48 L2,25 C2,12 12,2 25,2 Z' stroke='%238B6914' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><path d='M25,2 C38,2 48,12 48,25 L48,48 L2,48 L2,25 C2,12 12,2 25,2 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
  {
    id: 'lights',
    label: 'Lights',
    arabic: 'الأضواء',
    tagline: 'Sophisticated arts, dining & modern cityscape',
    icon: Sparkles,
    spots: ['Block 338 Adliya', 'Reef Island', 'La Fontaine Arts', 'Night Skyline'],
    bgPatternInactive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20,2 L23,15 L38,18 L23,21 L20,38 L17,21 L2,18 L17,15 Z' stroke='%231a3a5c' stroke-width='0.8' fill='none' opacity='0.15'/></svg>")`,
    bgPatternActive: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><path d='M20,2 L23,15 L38,18 L23,21 L20,38 L17,21 L2,18 L17,15 Z' stroke='%23FFFFFF' stroke-width='0.8' fill='none' opacity='0.1'/></svg>")`
  },
]

export default function Onboarding() {
  const { 
    selectedMoods, 
    setSelectedMoods, 
    duration, 
    setDuration, 
    tier, 
    setTier, 
    generateItinerary, 
    setStep,
    quickStart
  } = useVibe()

  const { lang, setLang } = useLang()

  // Refs for welcome intro
  const containerRef   = useRef(null)
  const compassRef     = useRef(null)
  const slotTextRef    = useRef(null)
  const loadingDotsRef = useRef(null)
  const overlineRef    = useRef(null)
  const arabicLineRef  = useRef(null)
  const morphLineRef   = useRef(null)
  const taglineRef     = useRef(null)
  const morphViewRef   = useRef(null)
  const slotViewRef    = useRef(null)
  const setupSectionRef = useRef(null)
  const wipeRef        = useRef(null)

  const [showMorphLetters, setShowMorphLetters] = useState(false)
  const [isWiping, setIsWiping] = useState(false)

  // Scramble letters logic for morphing welcome text
  const ENGLISH_CHARS = ENGLISH_FINAL.split('')

  // Mouse reactive glow backdrops
  useEffect(() => {
    const handleMove = (e) => {
      const parent = containerRef.current
      if (!parent) return
      const glow1 = parent.querySelector('.onboarding-glow')
      if (glow1) {
        const x = (e.clientX / window.innerWidth) * 100
        const y = (e.clientY / window.innerHeight) * 100
        gsap.to(glow1, {
          background: `radial-gradient(ellipse 70% 50% at ${x}% ${y}%, rgba(196,162,101,0.06) 0%, transparent 80%)`,
          duration: 1.5,
          ease: 'power2.out'
        })
      }
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  // Rotate watermarked compass
  useEffect(() => {
    if (!compassRef.current) return
    const tween = gsap.to(compassRef.current, {
      rotation: 360,
      duration: 160,
      repeat: -1,
      ease: 'none'
    })
    return () => tween.kill()
  }, [])

  // Main welcome animation loop
  useEffect(() => {
    const slotText = slotTextRef.current
    const loadingDots = loadingDotsRef.current
    const overline = overlineRef.current
    const arabicLine = arabicLineRef.current
    const morphLine = morphLineRef.current
    const tagline = taglineRef.current

    if (!slotText) return

    gsap.set(slotText, { opacity: 1, scale: 1 })
    if (loadingDots) gsap.set(loadingDots, { opacity: 1 })
    if (overline) gsap.set(overline, { opacity: 0 })
    if (arabicLine) gsap.set(arabicLine, { width: 0, opacity: 1 })
    if (morphLine) gsap.set(morphLine, { width: 0 })
    if (tagline) gsap.set(tagline, { opacity: 0, y: 15, filter: 'blur(3px)' })

    const flyObj = { index: 0 }
    const startTimer = setTimeout(() => {
      if (loadingDots) {
        gsap.to(loadingDots, { opacity: 0, y: 8, duration: 0.35, ease: 'power2.in' })
      }
      if (overline) {
        gsap.to(overline, { opacity: 0.6, duration: 0.5, ease: 'power2.out' })
      }

      gsap.to(flyObj, {
        index: SLOT_PHRASES.length,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          const idx = Math.floor(flyObj.index)
          const phrase = SLOT_PHRASES[Math.min(idx, SLOT_PHRASES.length - 1)]
          if (slotText.textContent !== phrase) {
            slotText.textContent = phrase
            slotText.style.fontFamily = fontFor(phrase)
            slotText.style.direction = /[\u0600-\u06FF]/.test(phrase) ? 'rtl' : 'ltr'
            
            gsap.fromTo(slotText,
              { scale: 0.94, filter: 'blur(2px)', opacity: 0.85 },
              { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 0.08, ease: 'power1.out' }
            )
          }
        },
        onComplete: () => {
          slotText.textContent = ARABIC_FINAL
          slotText.style.fontFamily = fontFor(ARABIC_FINAL)
          slotText.style.direction = 'rtl'
          
          gsap.fromTo(slotText,
            { scale: 0.92, filter: 'blur(4px)', opacity: 0.75 },
            { 
              scale: 1, filter: 'blur(0px)', opacity: 1, 
              duration: 0.5, ease: 'power2.out',
              onComplete: () => {
                if (arabicLine) {
                  gsap.to(arabicLine, { width: 80, duration: 0.5, ease: 'power3.out' })
                }
                if (overline) {
                  gsap.to(overline, { opacity: 0, duration: 0.35, ease: 'power2.in' })
                }

                // Wait, then morph to English final letters
                setTimeout(() => {
                  gsap.to(slotText, {
                    opacity: 0,
                    filter: 'blur(8px)',
                    scale: 0.96,
                    duration: 0.35,
                    ease: 'power2.inOut',
                    onComplete: () => {
                      if (slotViewRef.current) slotViewRef.current.style.display = 'none'
                      setShowMorphLetters(true)
                      if (morphViewRef.current) {
                        gsap.set(morphViewRef.current, { opacity: 0, display: 'flex' })
                        gsap.to(morphViewRef.current, {
                          opacity: 1,
                          duration: 0.4,
                          ease: 'power2.out',
                          onComplete: () => {
                            if (tagline) {
                              gsap.to(tagline, {
                                opacity: 0.8, y: 0, filter: 'blur(0px)',
                                duration: 0.6, ease: 'power3.out'
                              })
                            }
                            if (morphLine) {
                              gsap.to(morphLine, { width: 100, duration: 0.6, delay: 0.15, ease: 'power3.out' })
                            }
                          }
                        })
                      }
                    }
                  })
                  if (arabicLine) {
                    gsap.to(arabicLine, { opacity: 0, duration: 0.35, ease: 'power2.inOut' })
                  }
                }, 750)
              }
            }
          )
        }
      })
    }, 450)

    return () => clearTimeout(startTimer)
  }, [])

  // Toggle mood selector
  const toggleMood = (id) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  // Scroll to setup section
  const scrollToSetup = () => {
    setupSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Execute passage startup with a wipe transition
  const handleBeginPassage = async () => {
    if (selectedMoods.length === 0) return
    setIsWiping(true)

    // Trigger background generation immediately
    generateItinerary(selectedMoods, duration, tier)

    // Run custom GSAP wipe overlay
    gsap.fromTo(wipeRef.current,
      { y: '100%' },
      { 
        y: '0%', 
        duration: 0.85, 
        ease: 'power4.inOut',
        onComplete: () => {
          // Instantly advance state step to 5 (Journal)
          setStep(5)
        }
      }
    )
  }

  // Quick start handler
  const handleQuickStart = () => {
    setIsWiping(true)
    gsap.fromTo(wipeRef.current,
      { y: '100%' },
      { 
        y: '0%', 
        duration: 0.85, 
        ease: 'power4.inOut',
        onComplete: () => {
          quickStart()
        }
      }
    )
  }

  const noneSelected = selectedMoods.length === 0
  const allSelected = selectedMoods.length === MOODS.length

  return (
    <div 
      ref={containerRef}
      data-lenis-prevent
      className="onboarding-root snap-y snap-mandatory h-screen overflow-y-auto bg-[#0F0C0B] scroll-smooth text-[#FCFBF8]"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Cinematic Wipe Transition Overlay */}
      <div 
        ref={wipeRef}
        className="fixed inset-0 bg-[#FCFBF8] z-[9999] pointer-events-none transform translate-y-full"
        style={{
          boxShadow: '0 -20px 40px rgba(0,0,0,0.15)'
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1C1917]">
          <Loader className="w-8 h-8 animate-spin text-[var(--bp-primary)] mb-4" />
          <span className="font-serif text-lg italic tracking-wider">Opening Travelogue Folio...</span>
        </div>
      </div>

      {/* ── Background Video & Gradient Overlays ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <video
          autoPlay muted loop playsInline
          className="w-full h-full object-cover opacity-35 filter brightness-[0.4] saturate-[0.8]"
          poster="/assets/images/bahrain_skyline.webp"
        >
          <source src="/assets/videos/bahrain_timelapse.mp4" type="video/mp4" />
        </video>
        {/* Dark radial gradient overlay */}
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
        {/* Mouse interactive ambient glow overlay */}
        <div className="onboarding-glow absolute inset-0 opacity-40" />
      </div>

      {/* ════════════════════ SECTION 1: HERO OVERLAY ════════════════════ */}
      <section className="snap-start relative h-screen w-full flex flex-col items-center justify-center text-center p-6 z-10">
        {/* Watermarked rotating compass behind content */}
        <div 
          ref={compassRef}
          className="absolute w-[240px] md:w-[380px] h-[240px] md:h-[380px] opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' stroke='%23C4A265' stroke-width='0.5' fill='none'/><path d='M50,2 L52,40 L98,50 L52,60 L50,98 L48,60 L2,50 L48,40 Z' fill='%23C4A265'/></svg>")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        <div className="space-y-6 max-w-xl">
          <div ref={overlineRef} className="text-[10px] md:text-xs tracking-[0.25em] uppercase font-bold text-[#C4A265]">
            Chronicles of the Archipelago
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight select-none">
            Bahrain Passage
          </h1>

          {/* Dynamic Language Scramble Segment */}
          <div className="h-16 flex items-center justify-center relative">
            {/* Phase 1: Center Fly-Through */}
            <div ref={slotViewRef} className="absolute inset-x-0 text-center">
              <span ref={slotTextRef} className="text-xl md:text-2xl font-bold tracking-wide italic text-white/95" />
              <div ref={arabicLineRef} className="h-[1px] bg-[#BA0C2F] mx-auto mt-2 opacity-50" />
            </div>

            {/* Phase 2: Render settled letters */}
            <div ref={morphViewRef} className="absolute inset-x-0 hidden justify-center gap-0.5 text-xl md:text-2xl font-bold tracking-wide italic text-white/90">
              {showMorphLetters && ENGLISH_CHARS.map((char, index) => (
                <span 
                  key={index}
                  className="inline-block animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p ref={taglineRef} className="font-sans text-xs md:text-sm max-w-md mx-auto text-[#A8A29E] leading-relaxed">
              An immersive digital companion mapping the archaeology, shoreline, and hidden paths of Dilmun.
            </p>
            <div ref={morphLineRef} className="h-[1.5px] bg-[#C4A265] mt-3" style={{ width: 0 }} />
          </div>
        </div>

        {/* Scroll arrow prompt */}
        <button 
          onClick={scrollToSetup}
          className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer text-[#C4A265] hover:text-white transition-colors duration-300 animate-bounce"
        >
          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">Customize Passage</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </section>

      {/* ════════════════════ SECTION 2: SETUP SETUP PANEL ════════════════════ */}
      <section 
        ref={setupSectionRef}
        className="snap-start relative min-h-screen w-full flex items-center justify-center p-4 md:p-12 z-10 bg-[#F9F7F4]/95"
      >
        <div className="max-w-2xl w-full p-6 md:p-10 rounded-3xl border border-stone-200 bg-white shadow-2xl space-y-8 my-8 text-[#1C1917]">
          
          {/* Header */}
          <div className="text-center md:text-left border-b border-stone-200 pb-6">
            <h2 className="font-serif text-3xl font-bold text-[#1C1917] tracking-wide">
              Customize Your Passage
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Select your traveling vibes, trip duration, and budget tier to calibrate your ledger
            </p>
          </div>

          {/* Setup Form Container */}
          <div className="space-y-6">
            
            {/* 1. Vibes Selection */}
            <div className="space-y-3">
              <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#C41E3A] font-bold">
                1. Select Traveling Vibes
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((m) => {
                  const Icon = m.icon
                  const active = selectedMoods.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMood(m.id)}
                      className={`relative flex flex-col items-start p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 overflow-hidden select-none hover:scale-[1.01] active:scale-[0.99] ${
                        active 
                          ? 'border-[#C41E3A] bg-[#C41E3A]/5 text-[#C41E3A] shadow-sm' 
                          : 'border-stone-200 bg-[#F9F7F4]/40 text-stone-500 hover:border-[#C41E3A]/30'
                      }`}
                    >
                      {/* Pattern backdrop */}
                      <div 
                        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay transition-opacity duration-300"
                        style={{ backgroundImage: active ? m.bgPatternActive : m.bgPatternInactive, backgroundSize: '40px' }}
                      />
                      
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <Icon className={`w-5 h-5 ${active ? 'text-[#C41E3A]' : 'text-stone-400'}`} />
                        {active && <span className="text-[10px] font-bold uppercase tracking-wider text-[#C41E3A]">Selected</span>}
                      </div>

                      <div className="relative z-10 mt-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#C4A265] block">{m.arabic}</span>
                        <h4 className={`font-serif text-sm font-bold mt-0.5 ${active ? 'text-[#C41E3A]' : 'text-stone-800'}`}>{m.label}</h4>
                        <p className="text-[10px] leading-relaxed mt-1 text-stone-500 font-sans">
                          {m.tagline}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Duration Choice */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#C41E3A] font-bold">
                  2. Trip Duration
                </label>
                <span className="text-xs text-stone-700 font-bold">{duration} {duration === 1 ? 'Day' : 'Days'} Itinerary</span>
              </div>

              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setDuration(prev => Math.max(1, prev - 1))}
                  className="shrink-0 w-8 h-8 rounded-full border border-stone-200 hover:border-[#C41E3A]/40 hover:bg-[#C41E3A]/5 flex items-center justify-center cursor-pointer transition-colors text-stone-600"
                >
                  <ChevronLeft size={16} />
                </button>

                <div 
                  className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
                    const active = duration === d
                    return (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`snap-center flex-shrink-0 w-12 py-2 rounded-xl border text-center font-sans text-xs font-semibold cursor-pointer transition-all duration-300 ${
                          active
                            ? 'text-[#C41E3A] border-[#C41E3A] bg-[#C41E3A]/5 font-bold scale-[1.03]'
                            : 'border-stone-250/60 bg-[#F9F7F4]/30 text-stone-655 hover:border-stone-300'
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setDuration(prev => Math.min(10, prev + 1))}
                  className="shrink-0 w-8 h-8 rounded-full border border-stone-200 hover:border-[#C41E3A]/40 hover:bg-[#C41E3A]/5 flex items-center justify-center cursor-pointer transition-colors text-stone-600"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* 3. Budget Tier Segmented Picker */}
            <div className="space-y-3">
              <label className="text-[10px] md:text-xs uppercase tracking-widest text-[#C41E3A] font-bold block">
                3. Budget & Experience Level
              </label>

              <div className="grid grid-cols-2 gap-3 p-1 rounded-xl bg-stone-100 border border-stone-200">
                <button
                  onClick={() => setTier('Wandering')}
                  className={`py-3 rounded-lg font-sans text-xs tracking-wider uppercase font-semibold cursor-pointer transition-all duration-300 border-none ${
                    tier === 'Wandering'
                      ? 'bg-white text-[#C41E3A] shadow-sm font-bold'
                      : 'text-stone-500 hover:text-stone-850 bg-transparent'
                  }`}
                >
                  Wandering (Budget-Conscious)
                </button>
                <button
                  onClick={() => setTier('Elite')}
                  className={`py-3 rounded-lg font-sans text-xs tracking-wider uppercase font-semibold cursor-pointer transition-all duration-300 border-none ${
                    tier === 'Elite'
                      ? 'bg-white text-[#C41E3A] shadow-sm font-bold'
                      : 'text-stone-500 hover:text-stone-850 bg-transparent'
                  }`}
                >
                  Elite (Luxury/Premium)
                </button>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-3 pt-4 border-t border-stone-200">
              <button
                onClick={handleBeginPassage}
                disabled={noneSelected}
                className={`w-full py-4 rounded-xl font-sans font-bold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed hover:scale-[1.005] active:scale-[0.995] h-[52px] border-none ${
                  noneSelected
                    ? 'bg-stone-200 text-stone-400'
                    : 'bg-[#C41E3A] hover:bg-[#A3162C] text-white shadow-md'
                }`}
              >
                {noneSelected
                  ? 'Select at least one vibe'
                  : 'Begin Passage →'}
              </button>

              <button
                onClick={handleQuickStart}
                className="w-full py-3.5 rounded-xl font-sans font-bold text-xs tracking-widest uppercase transition-all duration-200 cursor-pointer border border-[#C41E3A]/30 bg-[#C41E3A]/5 hover:bg-[#C41E3A]/10 text-[#C41E3A] hover:scale-[1.005] active:scale-[0.995] h-[48px] flex items-center justify-center gap-1 shadow-sm"
              >
                Standard Route (Quick Start)
              </button>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
