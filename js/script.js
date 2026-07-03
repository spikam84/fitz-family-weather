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
  `&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,cloud_cover` +
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
updateOutdoorScore({
  temp: current.temperature_2m,
  feelsLike: current.apparent_temperature,
  humidity: current.relative_humidity_2m,
  wind: current.wind_speed_10m,
  code: current.weather_code
});
updateFireworksForecast(data);
updateStormHighlight(data);
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
function updateOutdoorScore(weather) {
  let score = 100;

  // Temperature comfort
  if (weather.feelsLike >= 90) score -= 18;
  else if (weather.feelsLike >= 85) score -= 10;
  else if (weather.feelsLike <= 32) score -= 20;
  else if (weather.feelsLike <= 45) score -= 10;

  // Humidity comfort
  if (weather.humidity >= 75) score -= 10;
  else if (weather.humidity >= 65) score -= 5;

  // Wind comfort
  if (weather.wind >= 25) score -= 18;
  else if (weather.wind >= 18) score -= 10;
  else if (weather.wind >= 12) score -= 5;

  // Weather condition penalty
  const rainyOrStormyCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
  const snowyCodes = [71, 73, 75];

  if (rainyOrStormyCodes.includes(weather.code)) score -= 25;
  if (snowyCodes.includes(weather.code)) score -= 30;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const rating = getRating(score);

document.querySelector(".big-stars").textContent = rating.stars;
document.querySelector(".score-word").textContent = rating.word;

document.querySelector(".score-reasons").innerHTML = `
  ${getOutdoorReasons(weather).map(reason => `<p>${reason}</p>`).join("")}
`;

}

function getRating(score) {
  if (score >= 90) {
    return { stars: "★★★★★", word: "Perfect", message: "Excellent outdoor day!" };
  }

  if (score >= 80) {
    return { stars: "★★★★☆", word: "Great", message: "Great day to be outside." };
  }

  if (score >= 65) {
    return { stars: "★★★☆☆", word: "Good", message: "Good, but check details." };
  }

  if (score >= 50) {
    return { stars: "★★☆☆☆", word: "Fair", message: "Okay with some caution." };
  }

  if (score >= 30) {
    return { stars: "★☆☆☆☆", word: "Poor", message: "Not ideal outside." };
  }

  return { stars: "☆☆☆☆☆", word: "Skip", message: "Better indoor plans today." };
}function getOutdoorReasons(weather) {
  const reasons = [];

  if (weather.wind < 12) {
    reasons.push("✅ Comfortable wind");
  } else if (weather.wind < 20) {
    reasons.push("⚠️ Breezy conditions");
  } else {
    reasons.push("⚠️ Wind may limit outdoor plans");
  }

  const rainyOrStormyCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];

  if (!rainyOrStormyCodes.includes(weather.code)) {
    reasons.push("✅ Dry conditions");
  } else {
    reasons.push("⚠️ Rain or storms possible");
  }

  if (weather.feelsLike >= 90) {
    reasons.push("⚠️ Heat index above 90°");
  } else if (weather.feelsLike <= 45) {
    reasons.push("⚠️ Chilly outside");
  } else {
    reasons.push("✅ Comfortable temperature");
  }

  return reasons;
}
function updateFireworksForecast(data) {
  const hourly = data.hourly;
  const now = new Date();

  const eveningHours = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => {
      const hour = item.time.getHours();
      return item.time >= now && hour >= 20 && hour <= 23;
    });

  if (eveningHours.length === 0) return;

  const best = eveningHours[0];
  const i = best.index;

  const wind = hourly.wind_speed_10m[i];
  const rainChance = hourly.precipitation_probability[i];
  const code = hourly.weather_code[i];
  const feelsLike = hourly.apparent_temperature[i];

  let status = "🟢 Go For It";
  let message = "Looks like a great night to light them off.";
  const reasons = [];

  const stormCodes = [95, 96, 99];
  const rainCodes = [61, 63, 65, 80, 81, 82];

  if (stormCodes.includes(code) || rainChance >= 60) {
    status = "🔴 Not Tonight";
    message = "I'd save them for another evening.";
    reasons.push("✖ Storms or rain risk is too high");
  } else if (wind >= 15 || rainChance >= 30) {
    status = "🟡 Maybe Wait";
    message = "I'd wait another hour. The wind should settle down.";
    reasons.push("⚠ Wind or rain chance may be an issue");
  } else {
    reasons.push("✔ Dry conditions");
    reasons.push("✔ Light wind");
  }

  if (feelsLike >= 90) {
    reasons.push("⚠ Warm evening");
  } else {
    reasons.push("✔ Comfortable evening");
  }

  reasons.push(`🕘 Best lighting time: ${formatTime(hourly.time[i])}`);

  document.getElementById("fireworks-status").textContent = status;
  document.getElementById("fireworks-message").textContent = message;
  document.getElementById("fireworks-reasons").innerHTML =
    reasons.map(reason => `<p>${reason}</p>`).join("");
}
function updateStormHighlight(data) {
  const hourly = data.hourly;
  const now = new Date();

  const tonight = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => {
      const hour = item.time.getHours();
      return item.time >= now && hour >= 18 && hour <= 23;
    });

  let title = "Storms Not Expected";
  let message = "Quiet through the evening";
  let icon = "⛈️";

  for (const hour of tonight) {
    const code = hourly.weather_code[hour.index];
    const rain = hourly.precipitation_probability[hour.index];

    // Thunderstorms
    if ([95, 96, 99].includes(code)) {
      title = "Storm Risk";
      message = "Storms possible this evening";
      icon = "🌩️";
      break;
    }

    // Heavy rain
    if (rain >= 60) {
      title = "Storms Possible";
      message = "Keep an eye on the radar";
      icon = "🌧️";
    }
  }

  document.getElementById("storm-title").textContent = title;
  document.getElementById("storm-message").textContent = message;
  document.getElementById("storm-icon").textContent = icon;
}
loadWeather();