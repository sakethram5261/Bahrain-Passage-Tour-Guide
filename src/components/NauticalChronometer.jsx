import { useState, useEffect } from 'react'

export default function NauticalChronometer({ showSeconds = true, className = "", style = {} }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const secondsAngle = time.getSeconds() * 6
  const minutesAngle = time.getMinutes() * 6 + time.getSeconds() * 0.1
  const hoursAngle = (time.getHours() % 12) * 30 + time.getMinutes() * 0.5

  return (
    <div className={className} style={style} title="Nautical chronometer (synced to local time)">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#d4af37" strokeWidth="4" />
        <circle cx="50" cy="50" r="46" fill="rgba(42,35,33,0.95)" />
        <circle cx="50" cy="2" r="8" fill="none" stroke="#aa7c11" strokeWidth="2" />
        <circle cx="50" cy="50" r="38" fill="#FAF9F6" stroke="#221c1a" strokeWidth="1.5" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="16"
            x2="50"
            y2="20"
            stroke="#1A1412"
            strokeWidth="1.5"
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
        <line x1="50" y1="50" x2="50" y2="30" stroke="#1A1412" strokeWidth="2.8" strokeLinecap="round" transform={`rotate(${hoursAngle} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="20" stroke="#3D3330" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${minutesAngle} 50 50)`} />
        {showSeconds && (
          <line x1="50" y1="55" x2="50" y2="18" stroke="#C1122F" strokeWidth="0.8" strokeLinecap="round" transform={`rotate(${secondsAngle} 50 50)`} />
        )}
        <circle cx="50" cy="50" r="3.2" fill="#d4af37" stroke="#1A1412" strokeWidth="0.8" />
      </svg>
    </div>
  )
}
