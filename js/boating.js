function directionLabel(degrees) {
  if (!Number.isFinite(degrees)) return "--";
  const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(degrees / 45) % 8];
}

function milesFromMeters(meters) {
  return Number.isFinite(meters) ? meters / 1609.344 : null;
}

function boatingStatusClass(score) {
  if (score >= 80) return "safe";
  if (score >= 50) return "caution";
  return "danger";
}

function buildBoatingWeather(data, items, includeCurrent = true) {
  const current = data.current;
  const hourly = data.hourly;
  const values = (field, fallback) =>
    items.map(item => hourly[field]?.[item.index] ?? fallback);
  const currentValue = (value) => includeCurrent ? [value] : [];

  const feels = [
    ...currentValue(current.apparent_temperature),
    ...values("apparent_temperature", current.apparent_temperature)
  ];

  return {
    feelsLike: Math.max(...feels),
    wind: Math.max(...currentValue(current.wind_speed_10m), ...values("wind_speed_10m", 0)),
    gusts: Math.max(...currentValue(current.wind_gusts_10m ?? current.wind_speed_10m), ...values("wind_gusts_10m", 0)),
    visibility: Math.min(...currentValue(current.visibility ?? 16093), ...values("visibility", 16093)),
    rainChance: Math.max(0, ...values("precipitation_probability", 0)),
    code: includeCurrent ? current.weather_code : hourly.weather_code[items[0].index],
    forecastCodes: [
      ...currentValue(current.weather_code),
      ...values("weather_code", current.weather_code)
    ]
  };
}

function boatingSummary(weather, details) {
  const storms = weather.forecastCodes.some(code => [95, 96, 99].includes(code));
  if (storms) return "Lightning is possible. Stay off the water.";
  if (details.score < 50) return "Conditions are not suitable for boating.";
  if (details.score < 80) return "Boating may be possible, but review the cautions below.";
  return "Wind, visibility, and weather look favorable for the shared boat.";
}

function hourlyBoatDetails(data, item) {
  const h = data.hourly;
  const weather = {
    feelsLike: h.apparent_temperature[item.index],
    wind: h.wind_speed_10m[item.index],
    gusts: h.wind_gusts_10m[item.index],
    visibility: h.visibility[item.index],
    rainChance: h.precipitation_probability[item.index] ?? 0,
    code: h.weather_code[item.index],
    forecastCodes: [h.weather_code[item.index]]
  };
  return { weather, details: getBoatingDetails(weather) };
}

function findBestWindow(data, items) {
  const results = items.map(item => ({ item, ...hourlyBoatDetails(data, item) }));
  if (!results.length) return null;
  let bestStart = 0;
  let bestAverage = -1;
  const width = Math.min(3, results.length);
  for (let i = 0; i <= results.length - width; i += 1) {
    const average = results.slice(i, i + width).reduce((sum, result) => sum + result.details.score, 0) / width;
    if (average > bestAverage) {
      bestAverage = average;
      bestStart = i;
    }
  }
  return { group: results.slice(bestStart, bestStart + width), score: Math.round(bestAverage) };
}

function showUnavailable() {
  document.getElementById("boating-status").textContent = "Weather Unavailable";
  document.getElementById("boating-summary").textContent = "Live and cached weather could not be loaded. Try refreshing.";
  document.getElementById("boating-hero").className = "boating-hero large-card danger";
  document.getElementById("boating-updated").textContent = "Weather service unavailable";
}

async function loadBoating() {
  try {
    const result = await getWeather();
    const data = result.raw;
    if (!data?.current || !data?.hourly?.time) throw new Error("No boating forecast available");

    const forecast = getBoatingForecast(data);
    if (!forecast) throw new Error("No daylight boating forecast available");

    const daylight = forecast;
    const items = forecast.items;
    const weather = forecast.weather;
    const details = getBoatingDetails(weather);
    const state = boatingStatusClass(details.score);

    document.getElementById("boating-window-label").textContent =
      `${forecast.dayLabel} · Next 6 Daylight Hours`;
    document.getElementById("best-window-day").textContent = forecast.dayLabel;
    document.getElementById("boating-status").textContent = details.rating;
    document.getElementById("boating-stars").textContent = details.stars;
    document.getElementById("boating-score").textContent = details.score;
    document.getElementById("boating-summary").textContent = boatingSummary(weather, details);
    document.getElementById("boating-hero").className = `boating-hero large-card ${state}`;
    const stamp = result.updatedAt ? result.updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--";
    document.getElementById("boating-updated").textContent =
      result.source === "cache" ? `Bettendorf, IA · Cached weather · ${stamp}` : `Bettendorf, IA · Updated ${stamp}`;

    const gusts = Math.round(weather.gusts);
    const wind = Math.round(weather.wind);
    document.getElementById("boat-wind").textContent = `${wind} mph · Gusts ${gusts}`;
    document.getElementById("boat-wind-note").textContent = gusts >= 30 ? "Strong gusts—stay ashore" : gusts >= 20 ? "Choppy handling possible" : "Manageable for the shared boat";
    document.getElementById("boat-direction").textContent = `${directionLabel(data.current.wind_direction_10m)} · ${Math.round(data.current.wind_direction_10m)}°`;
    const visibility = milesFromMeters(weather.visibility);
    document.getElementById("boat-visibility").textContent = visibility === null ? "--" : `${visibility.toFixed(visibility < 10 ? 1 : 0)} mi`;
    document.getElementById("boat-visibility-note").textContent = visibility !== null && visibility < 3 ? "Poor visibility—use caution" : "Good visibility";
    const storms = weather.forecastCodes.some(code => [95, 96, 99].includes(code));
    document.getElementById("boat-storms").textContent = storms ? "Stay Ashore" : "No Storms Forecast";
    document.getElementById("boat-storms-note").textContent = storms ? "Lightning risk in the next 6 hours" : "Continue monitoring radar";
    document.getElementById("boat-rain").textContent = `${Math.round(weather.rainChance)}%`;
    document.getElementById("boat-rain-note").textContent = weather.rainChance >= 50 ? "Rain could interrupt boating" : "Low interruption risk";
    document.getElementById("boat-temperature").textContent = `${Math.round(data.current.temperature_2m)}°F`;
    document.getElementById("boat-temperature-note").textContent = `Feels as high as ${Math.round(weather.feelsLike)}°`;
    document.getElementById("boat-daylight").textContent = `${formatBoatTime(daylight.sunrise)}–${formatBoatTime(daylight.sunset)}`;
    document.getElementById("boat-daylight-note").textContent = daylight.rolledToNextDay
      ? `Next boating hours · Tomorrow at sunrise`
      : `Boating ends at sunset · ${formatBoatTime(daylight.sunset)}`;

    const best = findBestWindow(data, items);
    if (best) {
      const start = best.group[0].item.time;
      const lastHourEnd = best.group[best.group.length - 1].item.time.getTime() + 60 * 60 * 1000;
      const end = new Date(Math.min(lastHourEnd, forecast.end.getTime()));
      const bestDetails = getBoatingDetails({ ...best.group[0].weather, forecastCodes: best.group.map(r => r.weather.code), wind: Math.max(...best.group.map(r => r.weather.wind)), gusts: Math.max(...best.group.map(r => r.weather.gusts)), visibility: Math.min(...best.group.map(r => r.weather.visibility)), rainChance: Math.max(...best.group.map(r => r.weather.rainChance)) });
      document.getElementById("best-window").textContent = `${formatBoatTime(start)}–${formatBoatTime(end)} · ${bestDetails.rating} · Average score ${best.score}/100`;
      document.getElementById("best-window-status").textContent = bestDetails.rating;
      document.getElementById("best-window-status").className = boatingStatusClass(bestDetails.score);
    }

    document.getElementById("boating-timeline").innerHTML = items.map(item => {
      const { weather: hour, details: hourDetails } = hourlyBoatDetails(data, item);
      const condition = WEATHER_CODES[hour.code] || "Forecast";
      return `<article class="boating-hour ${boatingStatusClass(hourDetails.score)}">
        <time>${formatBoatTime(item.time)}</time>
        <span>${WEATHER_ICONS[hour.code] || "🌤️"}</span>
        <strong>${hourDetails.rating}</strong>
        <p>${condition}</p>
        <small>Wind ${Math.round(hour.wind)} · Gusts ${Math.round(hour.gusts)} mph<br>Rain ${Math.round(hour.rainChance)}% · ${Math.round(hour.feelsLike)}°</small>
      </article>`;
    }).join("");
  } catch (error) {
    console.error("Boating Center failed to load", error);
    showUnavailable();
  }
}

function formatBoatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const refresh = document.querySelector(".refresh-button");
refresh.addEventListener("click", async () => {
  refresh.classList.add("spinning");
  await loadBoating();
  refresh.classList.remove("spinning");
});
loadBoating();
