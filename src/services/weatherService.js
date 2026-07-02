const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'cf28ef57337fcf6b6bbd6b0c27a0459c';

/**
 * Fetches the current weather for a given city from OpenWeatherMap.
 * Default is Manama, Bahrain (BH).
 * 
 * @param {string} city - The city name (e.g., 'Manama,bh')
 * @returns {Promise<object>} The raw weather JSON from the API
 */
export async function fetchLiveWeather(city = 'Manama,bh') {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Weather fetch failed: ${response.status}`);
  }
  return await response.json();
}
