import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useVibe } from '../hooks/useVibe'
import { fetchAICuratedItinerary } from '../services/openrouter'

const questions = [
  {
    id: 'vibe',
    text: 'What draws you to Bahrain?',
    options: ['Ancient History', 'Modern Culture', 'Seaside Escapes', 'Culinary Adventures']
  },
  {
    id: 'pace',
    text: 'How do you prefer to explore?',
    options: ['Serene & Meditative', 'Balanced & Steady', 'Energetic & Quick', 'Off the Beaten Path']
  },
  {
    id: 'duration',
    text: 'How many days do you have?',
    options: ['1 Day', '2-3 Days', '4-5 Days', '6+ Days']
  },
  {
    id: 'budget',
    text: 'What&apos;s your travel style?',
    options: ['Budget Explorer', 'Mid-Range Traveler', 'Premium Experience', 'Luxury Journey']
  }
]

export default function OnboardingQuestionnaire() {
  const { setStep, setSelectedMoods, setTier, setDuration, setPace, setAiItinerary } = useVibe()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [animating, setAnimating] = useState(false)
  const [bookSliding, setBookSliding] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  
  const containerRef = useRef(null)
  const questionBoxRef = useRef(null)
  const bookRef = useRef(null)
  const bookCoverRef = useRef(null)

  const currentQuestion = questions[currentQuestionIndex]

  const handleAnswer = (answer) => {
    if (animating) return
    setAnimating(true)

    const newAnswers = { ...answers, [currentQuestion.id]: answer }
    setAnswers(newAnswers)

    gsap.to(questionBoxRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
          gsap.from(questionBoxRef.current, {
            opacity: 0,
            y: 20,
            duration: 0.3,
            onComplete: () => setAnimating(false)
          })
        } else {
          submitAnswers(newAnswers)
        }
      }
    })
  }

  const submitAnswers = async (finalAnswers) => {
    setLoadingAI(true)
    
    const moodMap = {
      'Ancient History': ['empires', 'mystique'],
      'Modern Culture': ['lights', 'architecture'],
      'Seaside Escapes': ['sea', 'relaxation'],
      'Culinary Adventures': ['spice', 'culture']
    }

    const paceMap = {
      'Serene & Meditative': 'Serene',
      'Balanced & Steady': 'Moderate',
      'Energetic & Quick': 'Dynamic',
      'Off the Beaten Path': 'Explorer'
    }

    const durationMap = {
      '1 Day': 1,
      '2-3 Days': 2,
      '4-5 Days': 4,
      '6+ Days': 6
    }

    const budgetMap = {
      'Budget Explorer': 'Wandering',
      'Mid-Range Traveler': 'Curated',
      'Premium Experience': 'Curated',
      'Luxury Journey': 'Exquisite'
    }

    const moods = moodMap[finalAnswers.vibe] || ['empires']
    const pace = paceMap[finalAnswers.pace] || 'Moderate'
    const duration = durationMap[finalAnswers.duration] || 3
    const tier = budgetMap[finalAnswers.budget] || 'Curated'

    setSelectedMoods(moods)
    setPace(pace)
    setDuration(duration)
    setTier(tier)

    const itinerary = await fetchAICuratedItinerary(moods, tier, duration, pace)
    if (itinerary) setAiItinerary(itinerary)

    triggerBookAnimation()
  }

  const triggerBookAnimation = () => {
    setBookSliding(true)

    gsap.fromTo(bookRef.current,
      { y: '-120vh', opacity: 0, rotationZ: 15 },
      {
        y: 0,
        opacity: 1,
        rotationZ: 0,
        duration: 1.4,
        ease: 'back.out(1.2)',
        onComplete: () => {
          gsap.to(bookCoverRef.current, {
            rotationY: 180,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: () => {
              setTimeout(() => {
                gsap.to(containerRef.current, {
                  opacity: 0,
                  duration: 0.5,
                  onComplete: () => {
                    setLoadingAI(false)
                    setStep(5)
                  }
                })
              }, 600)
            }
          })
        }
      }
    )
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pearl-bg to-pearl-border overflow-hidden w-screen h-screen"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(0deg, rgba(209,26,56,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(209,26,56,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 w-full h-full px-4 sm:px-6 md:px-12 flex flex-col items-center justify-center py-8 sm:py-12">
        {!bookSliding && (
          <div ref={questionBoxRef} className="w-full max-w-xl">
            <div className="mb-8 sm:mb-12">
              <div className="flex justify-between items-center mb-2 sm:mb-3 text-xs sm:text-sm">
                <span className="uppercase tracking-widest text-bahrain-red font-bold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <span className="uppercase tracking-widest text-bronze-muted font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 bg-pearl-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-bahrain-red to-bahrain-dark transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="text-center mb-8 sm:mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-bronze-charcoal mb-2">
                {currentQuestion.text}
              </h2>
              <p className="text-xs sm:text-sm text-bronze-muted">
                This helps us craft your perfect Bahrain experience
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  disabled={animating || loadingAI}
                  className="group relative p-4 sm:p-5 md:p-6 bg-white border-2 border-pearl-border rounded-xl sm:rounded-2xl hover:border-bahrain-red hover:bg-bahrain-light transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 min-h-fit"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-bahrain-red/0 to-bahrain-red/0 group-hover:from-bahrain-red/5 group-hover:to-bahrain-red/10 rounded-xl sm:rounded-2xl transition-all duration-300" />
                  <div className="relative font-serif text-base sm:text-lg md:text-xl text-bronze-charcoal group-hover:text-bahrain-red font-semibold">
                    {option}
                  </div>
                </button>
              ))}
            </div>

            {loadingAI && (
              <div className="mt-8 sm:mt-12 flex justify-center">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-bahrain-red rounded-full"
                      style={{
                        animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bookSliding && (
          <div ref={bookRef} className="relative w-40 h-56 sm:w-56 sm:h-80 md:w-72 md:h-96" style={{ perspective: '1000px' }}>
            <div
              ref={bookCoverRef}
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.8s ease-in-out'
              }}
            >
              <div className="absolute w-full h-full bg-bahrain-red border-4 sm:border-6 md:border-8 border-bronze-charcoal rounded-lg sm:rounded-2xl shadow-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
              >
                <div className="text-2xl sm:text-3xl md:text-5xl font-serif text-pearl-bg mb-2 sm:mb-3">Bahrain</div>
                <div className="text-lg sm:text-2xl md:text-3xl font-serif italic text-pearl-bg">Passage</div>
                <div className="w-8 sm:w-12 h-0.5 bg-pearl-bg/40 my-2 sm:my-4" />
                <div className="text-xs sm:text-sm text-pearl-bg/80 font-serif">Your journey awaits...</div>
              </div>

              <div className="absolute w-full h-full bg-pearl-bg border-4 sm:border-6 md:border-8 border-bronze-charcoal rounded-lg sm:rounded-2xl shadow-2xl flex items-center justify-center p-4 sm:p-6"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center">
                  <div className="font-serif text-xl sm:text-2xl md:text-3xl text-bahrain-red mb-2">Discovering</div>
                  <div className="text-xs sm:text-sm text-bronze-muted">Your personalized itinerary</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
