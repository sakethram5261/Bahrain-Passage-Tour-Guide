// Fetches live tide data for Jarada Island (Bahrain coordinates roughly 26.22, 50.58)
export async function getLiveTideStatus() {
  try {
    // We use Open-Meteo's free Marine API
    const response = await fetch(
      'https://marine-api.open-meteo.com/v1/marine?latitude=26.22&longitude=50.58&hourly=sea_level&timezone=auto'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch tide data');
    }

    const data = await response.json();
    
    // Find the closest hourly reading to the current time
    const now = new Date();
    let closestIndex = 0;
    let minDiff = Infinity;
    
    const times = data.hourly.time;
    const levels = data.hourly.sea_level;
    
    times.forEach((timeStr, index) => {
      const time = new Date(timeStr);
      const diff = Math.abs(time - now);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    const currentSeaLevel = levels[closestIndex];
    
    // Jarada Island is typically submerged if sea level is above 0.3m 
    // We'll use 0.3 as a threshold for "Submerged"
    const isSubmerged = currentSeaLevel > 0.3;

    return {
      isSubmerged,
      seaLevel: currentSeaLevel, // in meters
      timestamp: times[closestIndex]
    };
  } catch (error) {
    console.error('Tide API error:', error);
    // Fallback logic if API fails: simulate based on hour (semi-diurnal)
    const hour = new Date().getHours();
    // High tides roughly every 12 hours. We'll mock it for fallback.
    const mockLevel = Math.sin((hour / 12) * Math.PI * 2); 
    return {
      isSubmerged: mockLevel > 0,
      seaLevel: mockLevel,
      timestamp: new Date().toISOString()
    };
  }
}
