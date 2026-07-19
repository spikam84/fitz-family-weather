// ============================================
// Fitz Family Weather HQ
// Shared Weather Engine
// ============================================

// ----------------------------
// Location
// ----------------------------
const WEATHER_LAT = 41.5245;
const WEATHER_LON = -90.5157;

// ----------------------------
// Weather Lookup Tables
// ----------------------------
const WEATHER_CODES = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Showers",
  95: "Thunderstorms",
  96: "Thunderstorms",
  99: "Severe Storms"
};

const WEATHER_ICONS = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};
// ----------------------------
// Fetch Weather Data
// ----------------------------
async function fetchWeatherData() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,cloud_cover,uv_index` +
    `&daily=sunrise,sunset` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather request failed: ${response.status}`);
    }

    const data = await response.json();

    // Save successful weather data for offline fallback
    localStorage.setItem("cachedWeather", JSON.stringify(data));
    localStorage.setItem("cachedWeatherTime", new Date().toISOString());

    return {
      data: data,
      source: "live",
      updatedAt: new Date()
    };

  } catch (error) {
    console.error("Weather failed to load:", error);

    const cached = localStorage.getItem("cachedWeather");
    const cachedTime = localStorage.getItem("cachedWeatherTime");

    if (cached) {
      return {
        data: JSON.parse(cached),
        source: "cache",
        updatedAt: cachedTime ? new Date(cachedTime) : null
      };
    }

    return {
      data: null,
      source: "unavailable",
      updatedAt: null
    };
  }
}
// ----------------------------
// Normalize Weather Data
// ----------------------------
function normalizeWeatherData(data) {
  if (!data || !data.current) {
    return null;
  }

  const current = data.current;
  const code = current.weather_code;

  return {
    current: {
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: code,
      condition: WEATHER_CODES[code] || "Unknown",
      icon: WEATHER_ICONS[code] || "🌤️"
    },

    hourly: data.hourly || null,
    daily: data.daily || null
  };
}
// ----------------------------
// Shared Weather Getter
// ----------------------------
async function getWeather() {
  const result = await fetchWeatherData();

  if (!result.data) {
    return {
      weather: null,
      source: result.source,
      updatedAt: result.updatedAt
    };
  }

  return {
    weather: normalizeWeatherData(result.data),
    raw: result.data,
    source: result.source,
    updatedAt: result.updatedAt
  };
}