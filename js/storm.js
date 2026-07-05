function updateStormStatusFromCache() {
  const cached = localStorage.getItem("cachedWeather");

  if (!cached) {
    document.getElementById("storm-status-icon").textContent = "⚪";
    document.getElementById("storm-status-word").textContent = "OFFLINE";
    document.getElementById("storm-status-message").textContent =
      "No saved weather data available yet.";
    return;
  }

  const data = JSON.parse(cached);
  const hourly = data.hourly;
  const now = new Date();

  const nextHours = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= now)
    .slice(0, 6);

  let icon = "🟢";
  let word = "QUIET";
  let message = "No storms expected in the next several hours.";

  for (const hour of nextHours) {
    const code = hourly.weather_code[hour.index];
    const rain = hourly.precipitation_probability[hour.index];

    if ([95, 96, 99].includes(code)) {
      icon = "🔴";
      word = "STORM RISK";
      message = "Thunderstorms are possible in the next few hours.";
      break;
    }

    if (rain >= 60) {
      icon = "🟡";
      word = "WATCHING";
      message = "Rain chances are elevated. Keep an eye on radar.";
    }
  }

  document.getElementById("storm-status-icon").textContent = icon;
  document.getElementById("storm-status-word").textContent = word;
  document.getElementById("storm-status-message").textContent = message;
}

updateStormStatusFromCache();