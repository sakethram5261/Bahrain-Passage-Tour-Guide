import { useEffect, useState } from 'react'
import { Sun, Cloud, CloudRain, Wind, Droplets, RefreshCw } from 'lucide-react'
import { fetchLiveWeather } from '../services/weatherService'

export default function LiveWeatherCard() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadWeather = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLiveWeather()
      setWeather(data)
    } catch (err) {
      console.warn('[LiveWeather] Failed to fetch weather:', err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWeather()
  }, [])

  const getWeatherIcon = (main) => {
    switch (main?.toLowerCase()) {
      case 'clear':
        return <Sun className="w-8 h-8 text-amber-500" style={{ animation: 'spin 20s linear infinite' }} />
      case 'clouds':
        return <Cloud className="w-8 h-8 text-stone-400" />
      case 'rain':
      case 'drizzle':
      case 'thunderstorm':
        return <CloudRain className="w-8 h-8 text-blue-500" />
      default:
        return <Sun className="w-8 h-8 text-amber-500" />
    }
  }

  if (loading) {
    return (
      <div className="jn-almanac-card items-center justify-center p-6 animate-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <RefreshCw className="w-5 h-5 text-stone-400 animate-spin" />
        <span className="text-xs text-stone-500 mt-2 font-sans">Syncing live weather...</span>
      </div>
    )
  }

  if (error || !weather) {
    return (
      <div className="jn-almanac-card p-4" style={{ borderStyle: 'dashed', borderColor: 'var(--bp-gold-muted, #ccc)' }}>
        <span className="jn-almanac-label text-[10px] text-stone-400">Live Weather Status</span>
        <span className="text-xs text-stone-500 mt-1 font-sans leading-normal">
          {error?.includes('401') 
            ? 'Key activating on server (returns 401). Falling back to historical average.'
            : 'Weather API currently offline. Using seasonal averages.'}
        </span>
      </div>
    )
  }

  const temp = Math.round(weather.main?.temp)
  const feelsLike = Math.round(weather.main?.feels_like)
  const description = weather.weather?.[0]?.description
  const condition = weather.weather?.[0]?.main
  const humidity = weather.main?.humidity
  const windSpeed = weather.wind?.speed

  return (
    <div className="jn-almanac-card p-4 relative overflow-hidden" style={{ background: 'var(--bp-parchment-light, #FAF6F0)', border: '1px solid rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <span className="jn-almanac-label text-[10px]" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Live Bahrain Weather
          </span>
          <h4 className="font-serif text-sm font-bold text-stone-800 capitalize mt-1 mb-0.5" style={{ margin: '4px 0 2px 0' }}>
            {description || 'Manama'}
          </h4>
        </div>
        {getWeatherIcon(condition)}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
        <span className="text-3xl font-serif font-extrabold text-[#BA0C2F]" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bp-primary)' }}>
          {temp}°C
        </span>
        <span className="text-xs text-stone-500 font-sans" style={{ fontSize: '11px', color: 'var(--bp-ink-muted)' }}>
          Feels like {feelsLike}°C
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Droplets className="w-3.5 h-3.5 text-blue-500" size={14} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bp-ink-faint)', fontWeight: 'bold', lineHeight: 1 }}>Humidity</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--bp-font-body)', fontWeight: 600, marginTop: '2px' }}>{humidity}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Wind className="w-3.5 h-3.5 text-stone-400" size={14} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bp-ink-faint)', fontWeight: 'bold', lineHeight: 1 }}>Wind</span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--bp-font-body)', fontWeight: 600, marginTop: '2px' }}>{windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
