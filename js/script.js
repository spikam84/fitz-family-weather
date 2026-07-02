const LAT = 41.5245;
const LON = -90.5157;

const weatherCodes = {
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

const weatherIcons = {
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

async function loadWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=sunrise,sunset` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const current = data.current;
    const code = current.weather_code;

    document.querySelector(".temperature").textContent =
      `${Math.round(current.temperature_2m)}°F`;

    document.querySelector(".weather-icon").textContent =
      weatherIcons[code] || "🌤️";

    document.querySelector(".weather-card h2").textContent =
      weatherCodes[code] || "Current Weather";

    document.querySelector(".weather-card p").textContent =
      `Feels like ${Math.round(current.apparent_temperature)}°`;

    const detailCards = document.querySelectorAll(".weather-details div");

    detailCards[0].querySelector("strong").textContent =
      `${Math.round(current.relative_humidity_2m)}%`;

    detailCards[1].querySelector("strong").textContent =
      `${Math.round(current.wind_speed_10m)} mph`;

    detailCards[2].querySelector("strong").textContent =
      formatTime(data.daily.sunrise[0]);

    detailCards[3].querySelector("strong").textContent =
      formatTime(data.daily.sunset[0]);

    document.querySelector(".brand p").textContent =
      `Bettendorf, IA · Updated ${new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit"
      })}`;

  } catch (error) {
    console.error("Weather failed to load", error);
    document.querySelector(".weather-card h2").textContent =
      "Weather unavailable";
  }
}

function formatTime(timeString) {
  return new Date(timeString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

loadWeather();