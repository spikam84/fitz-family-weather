// ----------------------------
// Weather Engine
// ----------------------------
async function loadWeather() {
  try {
    const result = await getWeather();

const data = result.raw;
const weatherSource = result.source;
const weatherUpdatedAt = result.updatedAt;

if (!data) {
  throw new Error("No live or cached weather data available");
}

    const current = data.current;
    const code = current.weather_code;

    document.querySelector(".temperature").textContent =
      `${Math.round(current.temperature_2m)}°F`;

    document.querySelector(".weather-icon").textContent =
      WEATHER_ICONS[code] || "🌤️";

    document.querySelector(".weather-card h2").textContent =
      WEATHER_CODES[code] || "Current Weather";

    document.querySelector(".weather-card p").textContent =
      `Feels like ${Math.round(current.apparent_temperature)}°`;

    const detailCards = document.querySelectorAll(".weather-details div");

    document.querySelector(".weather-details").style.opacity = "1";

    document.querySelector(".score-word").style.color = "var(--green)";
document.querySelector(".big-stars").style.opacity = "1";
document.querySelector(".score-reasons").style.opacity = "1";

    detailCards[0].querySelector("strong").textContent =
      `${Math.round(current.relative_humidity_2m)}%`;

    detailCards[1].querySelector("strong").textContent =
      `${Math.round(current.wind_speed_10m)} mph`;

    detailCards[2].querySelector("strong").textContent =
      formatTime(data.daily.sunrise[0]);

    detailCards[3].querySelector("strong").textContent =
      formatTime(data.daily.sunset[0]);

    const displayTime = weatherUpdatedAt
  ? weatherUpdatedAt.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })
  : "--";

document.querySelector(".brand p").textContent =
  weatherSource === "cache"
    ? `Bettendorf, IA · Cached weather · ${displayTime}`
    : `Bettendorf, IA · Updated ${displayTime}`;
updateOutdoorScore(data);
updateGeneralOutdoors(data);
updateDadStormWatching(data);
updateDadDogWalking(data);
updateNathanGardening(data);
updateNathanGrilling(data);
updateBoatingCards(data);
updateKelsey6AMWalk(data);
updateFireworksForecast(data);
updateStormHighlight(data);
updateFireworksHighlight();
updateUVHighlight(data);
updateKelseyUVIndex(data);
updateHeatComfortCards(data);
updateMicahMotorcycle(data);
updateMomShooting(data);
updateThreeDayForecast(data);
updateDailyScores();
} catch (error) {
  console.error("Weather failed to load", error);


document.querySelector(".temperature").textContent = "--°";
document.querySelector(".weather-icon").textContent = "📡";

document.querySelector(".weather-card h2").textContent =
    "Weather Unavailable";

document.querySelector(".weather-card p").textContent =
    "Waiting for weather service";

// Fade the weather details
document.querySelector(".weather-details").style.opacity = "0.25";

// Clear the detail values
const detailCards = document.querySelectorAll(".weather-details div");

detailCards[0].querySelector("strong").textContent = "--";
detailCards[1].querySelector("strong").textContent = "--";
detailCards[2].querySelector("strong").textContent = "--";
detailCards[3].querySelector("strong").textContent = "--";

// Outdoor Score
document.querySelector(".big-stars").textContent = "☆☆☆☆☆";
document.querySelector(".score-word").textContent = "Offline";

document.querySelector(".score-word").style.color = "var(--muted)";
document.querySelector(".big-stars").style.opacity = "0.45";
document.querySelector(".score-reasons").style.opacity = "0.75";

document.querySelector(".score-reasons").innerHTML = `
<p>📡 Weather service unavailable</p>
<p>💾 No cached weather available</p>
<p>↻ Tap Refresh when service returns</p>
`;
}}
// ----------------------------
// Utilities
// ----------------------------
function formatTime(timeString) {
  return new Date(timeString).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}
// ----------------------------
// Outdoor Score
// ----------------------------
function getGeneralOutdoorsWeather(data) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const hourly = data.hourly;

  const upcoming = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= now && item.time <= cutoff);

  if (upcoming.length === 0) {
    return {
      temp: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      wind: data.current.wind_speed_10m,
      rainChance: 0,
      code: data.current.weather_code,
      forecastCodes: [data.current.weather_code]
    };
  }

  const feelsLikeValues = upcoming.map(item =>
    hourly.apparent_temperature[item.index] ?? data.current.apparent_temperature
  );
  const lowestFeelsLike = Math.min(...feelsLikeValues);
  const highestFeelsLike = Math.max(...feelsLikeValues);
  const worstFeelsLike =
    calculateOutdoorScore({
      feelsLike: lowestFeelsLike,
      humidity: 0,
      wind: 0,
      rainChance: 0,
      code: 0,
      forecastCodes: [0]
    }) <
    calculateOutdoorScore({
      feelsLike: highestFeelsLike,
      humidity: 0,
      wind: 0,
      rainChance: 0,
      code: 0,
      forecastCodes: [0]
    })
      ? lowestFeelsLike
      : highestFeelsLike;

  return {
    temp: data.current.temperature_2m,
    feelsLike: worstFeelsLike,
    humidity: data.current.relative_humidity_2m,
    wind: Math.max(
      data.current.wind_speed_10m,
      ...upcoming.map(item => hourly.wind_speed_10m[item.index] ?? 0)
    ),
    rainChance: Math.max(
      ...upcoming.map(item =>
        hourly.precipitation_probability[item.index] ?? 0
      )
    ),
    code: data.current.weather_code,
    forecastCodes: [
      data.current.weather_code,
      ...upcoming.map(item => hourly.weather_code[item.index])
    ]
  };
}

function updateOutdoorScore(data) {
  const weather = getGeneralOutdoorsWeather(data);
  const score = calculateOutdoorScore(weather);
  const rating = getRating(score);

  document.querySelector(".big-stars").textContent = rating.stars;
  document.querySelector(".score-word").textContent = rating.word;

  document.querySelector(".score-reasons").innerHTML = `
    ${getOutdoorReasons(weather).map(reason => `<p>${reason}</p>`).join("")}
  `;
}

function updateGeneralOutdoors(data) {
  const weather = getGeneralOutdoorsWeather(data);
  const rating = getRating(calculateOutdoorScore(weather));

  const cards = [
    ["mom-general-outdoors-stars", "mom-general-outdoors-rating"],
    ["nathan-general-outdoors-stars", "nathan-general-outdoors-rating"]
  ];

  cards.forEach(([starsId, ratingId]) => {
    const stars = document.getElementById(starsId);
    const ratingText = document.getElementById(ratingId);

    if (!stars || !ratingText) return;

    stars.textContent = rating.stars;
    ratingText.textContent = rating.word;
  });
}

// ----------------------------
// Fireworks Forecast
// ----------------------------
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

const fireworksStatus = document.getElementById("fireworks-status");
const fireworksMessage = document.getElementById("fireworks-message");
const fireworksReasons = document.getElementById("fireworks-reasons");

if (fireworksStatus && fireworksMessage && fireworksReasons) {
  fireworksStatus.textContent = status;
  fireworksMessage.textContent = message;
  fireworksReasons.innerHTML =
    reasons.map(reason => `<p>${reason}</p>`).join("");
}
}

// ----------------------------
// Storm Highlight
// ----------------------------
function updateStormHighlight(data) {
  const hourly = data.hourly;
  const now = new Date();

  const tonight = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => {
      const hour = item.time.getHours();
      return item.time >= now && hour >= 18 && hour <= 23;
    });

  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82];

  const thunderstormsExpected = tonight.some(hour =>
    stormCodes.includes(hourly.weather_code[hour.index])
  );

  const highestRainChance = tonight.length
    ? Math.max(
        ...tonight.map(hour =>
          hourly.precipitation_probability[hour.index] ?? 0
        )
      )
    : 0;

  const rainExpected = tonight.some(hour =>
    rainCodes.includes(hourly.weather_code[hour.index])
  );

  let title = "No Thunderstorms Expected";
  let message = "Quiet through the evening";
  let icon = "⛈️";

  if (thunderstormsExpected) {
    title = "Storm Risk";
    message = "Storms possible this evening";
    icon = "🌩️";
  } else if (rainExpected || highestRainChance >= 60) {
    message = "Rain likely tonight";
    icon = "🌧️";
  } else if (highestRainChance >= 30) {
    message = "Rain possible this evening";
    icon = "🌦️";
  }

  document.getElementById("storm-title").textContent = title;
  document.getElementById("storm-message").textContent = message;
  document.getElementById("storm-icon").textContent = icon;
}
// ----------------------------
// Fireworks Highlight
// ----------------------------
function updateFireworksHighlight() {
  const statusElement = document.getElementById("fireworks-status");
  const messageElement = document.getElementById("fireworks-message");
  const highlightTitle = document.getElementById("fireworks-highlight-title");
  const highlightMessage = document.getElementById("fireworks-highlight-message");

  if (
    !statusElement ||
    !messageElement ||
    !highlightTitle ||
    !highlightMessage
  ) {
    return;
  }

  highlightTitle.textContent = statusElement.textContent
    .replace("🟢 ", "")
    .replace("🟡 ", "")
    .replace("🔴 ", "");

  highlightMessage.textContent = messageElement.textContent;
}

// ----------------------------
// UV Highlight
// Uses the live hourly forecast for both the UV level and protection timing.
// ----------------------------
function updateUVHighlight(data) {
  const hourly = data.hourly;
  const now = new Date();

  const todayHours = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item =>
      item.time.toDateString() === now.toDateString() &&
      item.time.getHours() >= 10 &&
      item.time.getHours() <= 16
    );

  if (todayHours.length === 0) return;

  const maxUV = Math.max(
    ...todayHours.map(item => hourly.uv_index[item.index] ?? 0)
  );

  const highUVHours = todayHours.filter(
    item => (hourly.uv_index[item.index] ?? 0) >= 6
  );

  let title = "UV Low";
  let message = "Low UV risk today";

  if (maxUV >= 8) {
    title = "UV Very High";
  } else if (maxUV >= 6) {
    title = "UV High";
  } else if (maxUV >= 3) {
    title = "UV Moderate";
    message = "Some sun protection recommended";
  }

  if (highUVHours.length > 0) {
    const highUVStart = highUVHours[0].time;
    const highUVEnd = new Date(
      highUVHours[highUVHours.length - 1].time.getTime() + 60 * 60 * 1000
    );

    if (now < highUVStart) {
      message = `Use sun protection after ${formatTime(highUVStart)}`;
    } else if (now < highUVEnd) {
      message = "Use sun protection now";
    } else {
      message = "High UV period has ended";
    }
  }

  document.getElementById("uv-title").textContent = title;
  document.getElementById("uv-message").textContent = message;
}
// ----------------------------
// Page Startup and Refresh
// ----------------------------
loadWeather();
// ----------------------------
// 3-Day Forecast
// ----------------------------
function updateThreeDayForecast(data) {
  const daily = data.daily;

  if (
    !daily?.time ||
    !daily?.weather_code ||
    !daily?.temperature_2m_max ||
    !daily?.temperature_2m_min ||
    !daily?.precipitation_probability_max
  ) {
    return;
  }

  const dayLabels = ["Today", "Tomorrow"];

  for (let day = 0; day < 3; day++) {
    const cardNumber = day + 1;
    const date = new Date(`${daily.time[day]}T12:00:00`);
    const code = daily.weather_code[day];
    const high = Math.round(daily.temperature_2m_max[day]);
    const low = Math.round(daily.temperature_2m_min[day]);
    const rain = Math.round(
      daily.precipitation_probability_max[day] ?? 0
    );

    const dayName =
      dayLabels[day] ||
      date.toLocaleDateString([], {
        weekday: "long"
      });

    let score = 5;

    const stormCodes = [95, 96, 99];
    const heavyRainCodes = [63, 65, 81, 82];
    const snowOrIceCodes = [66, 67, 71, 73, 75, 77, 85, 86];

    if (stormCodes.includes(code)) {
      score = 1;
    } else if (
      heavyRainCodes.includes(code) ||
      snowOrIceCodes.includes(code) ||
      rain >= 70
    ) {
      score = 2;
    } else if (rain >= 50) {
      score = 3;
    } else if (rain >= 30 || high >= 95 || high <= 35) {
      score = 4;
    }

    let bestActivity = "Outdoor activities";

    if (stormCodes.includes(code) || rain >= 70) {
      bestActivity = "Indoor plans";
    } else if (high >= 90) {
      bestActivity = "Early morning walk";
    } else if (high <= 40) {
      bestActivity = "Midday walk";
    } else if (rain >= 40) {
      bestActivity = "Morning walk";
    } else if (rain <= 20 && high >= 65 && high <= 85) {
      bestActivity = "Boating or gardening";
    }

    document.getElementById(`forecast-day-${cardNumber}`).textContent =
      dayName;

    document.getElementById(`forecast-icon-${cardNumber}`).textContent =
      WEATHER_ICONS[code] || "🌤️";

    document.getElementById(
      `forecast-condition-${cardNumber}`
    ).textContent =
      WEATHER_CODES[code] || "Forecast available";

    document.getElementById(`forecast-high-${cardNumber}`).textContent =
      `${high}°`;

    document.getElementById(`forecast-low-${cardNumber}`).textContent =
      `${low}°`;

    document.getElementById(`forecast-rain-${cardNumber}`).textContent =
      `💧 Rain: ${rain}%`;

    document.getElementById(`forecast-stars-${cardNumber}`).innerHTML =
  `<span class="filled-stars">${"★".repeat(score)}</span>` +
  `<span class="empty-stars">${"★".repeat(5 - score)}</span>`;

    document.getElementById(
      `forecast-activity-${cardNumber}`
    ).textContent =
      `Best: ${bestActivity}`;
  }
    const rainChances =
    daily.precipitation_probability_max.slice(0, 3);

  const highs =
    daily.temperature_2m_max.slice(0, 3);

  const wetDays =
    rainChances.filter(chance => (chance ?? 0) >= 50).length;

  const hottestHigh =
    Math.round(Math.max(...highs));

  let summary =
    "A generally pleasant three-day outlook for outdoor activities.";

  if (wetDays === 3) {
    summary =
      "Rain is likely throughout the next three days, so keep indoor plans ready.";
  } else if (wetDays === 2) {
    summary =
      "Several rainy periods are possible, with limited outdoor opportunities.";
  } else if (wetDays === 1) {
    summary =
      "Mostly usable weather with one wetter day in the three-day outlook.";
  } else if (hottestHigh >= 95) {
    summary =
      "Mostly dry, but dangerous heat may limit afternoon outdoor activities.";
  } else if (hottestHigh >= 88) {
    summary =
      "Mostly dry with warmer afternoons—mornings and evenings will be most comfortable.";
  }

  document.getElementById("forecast-summary").textContent =
    summary;
}
// ----------------------------
// Dad Storm Watching
// ----------------------------
function updateDadStormWatching(data) {
  const current = data.current;
  const hourly = data.hourly;

  const cards = [
  {
    stars: document.getElementById("dad-storm-stars"),
    rating: document.getElementById("dad-storm-rating")
  },
  {
    stars: document.getElementById("micah-storm-stars"),
    rating: document.getElementById("micah-storm-rating")
  }
];


  const now = new Date();

  const nextHour = hourly.time
    .map((time, index) => ({
      time: new Date(time),
      index
    }))
    .find(item => item.time >= now);

  const rainChance = nextHour
    ? hourly.precipitation_probability[nextHour.index] ?? 0
    : 0;

  const details = getStormWatchingDetails({
    code: current.weather_code,
    rainChance,
    wind: current.wind_speed_10m
  });

  cards.forEach(card => {
  if (!card.stars || !card.rating) return;

  card.stars.textContent = details.stars;
  card.rating.textContent = details.rating;
});
}
const refreshButton = document.querySelector(".refresh-button");

refreshButton.addEventListener("click", async () => {
  refreshButton.classList.add("spinning");

  await loadWeather();

  refreshButton.classList.remove("spinning");
});
// ----------------------------
// Dad Dog Walking
// Two walks per day: morning and evening
// ----------------------------
function updateDadDogWalking(data) {
  const hourly = data.hourly;

  const stars = document.getElementById("dad-dog-walking-stars");
  const rating = document.getElementById("dad-dog-walking-rating");
  const morningText = document.getElementById("dad-dog-walking-morning");
  const eveningText = document.getElementById("dad-dog-walking-evening");

  if (!stars || !rating || !morningText || !eveningText) return;

  const now = new Date();
  const todaySunrise = new Date(data.daily.sunrise[0]);
  const todaySunset = new Date(data.daily.sunset[0]);
  const todayNoon = new Date(todaySunrise);
  todayNoon.setHours(12, 0, 0, 0);

  const todayEveningStart = new Date(todaySunrise);
  todayEveningStart.setHours(16, 0, 0, 0);

  const todayEveningCutoff = new Date(
    todaySunset.getTime() - 30 * 60 * 1000
  );

  function buildWeather(index) {
    return {
      temp: hourly.temperature_2m[index],
      feelsLike: hourly.apparent_temperature[index],
      humidity: hourly.relative_humidity_2m[index],
      wind: hourly.wind_speed_10m[index],
      rainChance: hourly.precipitation_probability[index],
      code: hourly.weather_code[index]
    };
  }

  function findBestWalk(startTime, endTime) {
    const candidates = hourly.time
      .map((time, index) => ({
        time: new Date(time),
        index
      }))
      .filter(item =>
        item.time >= startTime &&
        item.time <= endTime
      );

    if (candidates.length === 0) return null;

    let best = null;

    candidates.forEach(candidate => {
      const details = getDogWalkingDetails(
        buildWeather(candidate.index)
      );

      if (!best || details.score > best.score) {
        best = {
          ...details,
          time: candidate.time,
          weather: buildWeather(candidate.index)
        };
      }
    });

    return best;
  }

  function formatWalkMessage(label, walk) {
    if (!walk) {
      return `${label}: No forecast available`;
    }

    const stormCodes = [95, 96, 99];
    const rainChance = walk.weather.rainChance ?? 0;
    const feelsLike = walk.weather.feelsLike ?? 70;
    const wind = walk.weather.wind ?? 0;

    if (
      stormCodes.includes(walk.weather.code) ||
      rainChance >= 70
    ) {
      return `${label}: Skip—storms expected`;
    }

    if (feelsLike >= 95) {
      return `${label}: Skip—too hot for Dad and the corgi`;
    }

    if (feelsLike <= 15) {
      return `${label}: Skip—too cold`;
    }

    if (wind >= 30) {
      return `${label}: Skip—too windy`;
    }

    if (walk.score < 30) {
      return `${label}: Skip—poor conditions`;
    }

    const formattedTime = walk.time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    });

    return `${label}: Best around ${formattedTime}`;
  }

  let morning = findBestWalk(
    new Date(Math.max(now.getTime(), todaySunrise.getTime())),
    todayNoon
  );

  let evening = findBestWalk(
    new Date(Math.max(now.getTime(), todayEveningStart.getTime())),
    todayEveningCutoff
  );

  // If today's morning window is over, use tomorrow morning.
  if (!morning && data.daily.sunrise?.[1]) {
    const tomorrowSunrise = new Date(data.daily.sunrise[1]);
    const tomorrowNoon = new Date(tomorrowSunrise);
    tomorrowNoon.setHours(12, 0, 0, 0);

    morning = findBestWalk(tomorrowSunrise, tomorrowNoon);

    morningText.textContent = formatWalkMessage(
      "🌅 Tomorrow morning",
      morning
    );
  } else {
    morningText.textContent = formatWalkMessage(
      "🌅 Morning",
      morning
    );
  }

  // If today's evening window is over, use tomorrow evening.
  if (
    !evening &&
    data.daily.sunrise?.[1] &&
    data.daily.sunset?.[1]
  ) {
    const tomorrowBase = new Date(data.daily.sunrise[1]);
    const tomorrowEveningStart = new Date(tomorrowBase);
    tomorrowEveningStart.setHours(16, 0, 0, 0);

    const tomorrowEveningCutoff = new Date(
      new Date(data.daily.sunset[1]).getTime() - 30 * 60 * 1000
    );

    evening = findBestWalk(
      tomorrowEveningStart,
      tomorrowEveningCutoff
    );

    eveningText.textContent = formatWalkMessage(
      "🌆 Tomorrow evening",
      evening
    );
  } else {
    eveningText.textContent = formatWalkMessage(
      "🌆 Evening",
      evening
    );
  }

  const availableWalks = [morning, evening].filter(Boolean);

  if (availableWalks.length === 0) {
    stars.textContent = "☆☆☆☆☆";
    rating.textContent = "Unavailable";
    return;
  }

  const overallScore = Math.round(
    availableWalks.reduce((total, walk) => total + walk.score, 0) /
    availableWalks.length
  );

  const overallRating = getRating(overallScore);

  stars.textContent = overallRating.stars;
  rating.textContent = overallRating.word;
}
// ----------------------------
// Nathan Gardening
// Uses the same Garden Conditions score as the Garden Center
// ----------------------------
function updateNathanGardening(data) {
  const stars = document.getElementById("nathan-garden-stars");
  const rating = document.getElementById("nathan-garden-rating");

  if (!stars || !rating || !data?.current || !data?.hourly) return;

  const now = new Date();
  const next24Hours = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item =>
      item.time >= now &&
      item.time < new Date(now.getTime() + 24 * 60 * 60 * 1000)
    );

  const rainChance = next24Hours.length
    ? Math.max(...next24Hours.map(item =>
        data.hourly.precipitation_probability[item.index] ?? 0
      ))
    : 0;

  const details = getGardenDetails({
    feelsLike: data.current.apparent_temperature,
    wind: data.current.wind_speed_10m,
    rainChance,
    code: data.current.weather_code
  });

  stars.textContent = details.stars;
  rating.textContent = details.rating;
}

// ----------------------------
// Nathan Grilling
// Scores the next 6 hours for a practical grilling window
// ----------------------------
function updateNathanGrilling(data) {
  const stars = document.getElementById("nathan-grilling-stars");
  const rating = document.getElementById("nathan-grilling-rating");

  if (!stars || !rating || !data?.current || !data?.hourly?.time) return;

  const weather = getGeneralOutdoorsWeather(data);
  const details = getGrillingDetails(weather);

  stars.textContent = details.stars;
  rating.textContent = details.rating;
}

// ----------------------------
// Kelsey UV Index
// Uses the highest remaining daylight UV, then rolls to tomorrow after sunset.
// ----------------------------
function updateKelseyUVIndex(data) {
  const stars = document.getElementById("kelsey-uv-stars");
  const rating = document.getElementById("kelsey-uv-rating");

  if (!stars || !rating || !data?.hourly?.time || !data?.daily?.sunset) return;

  const now = new Date();
  const todaySunset = new Date(data.daily.sunset[0]);
  const targetDay = now <= todaySunset ? 0 : 1;
  const targetSunrise = new Date(data.daily.sunrise[targetDay]);
  const targetSunset = new Date(data.daily.sunset[targetDay]);
  const windowStart = targetDay === 0 && now > targetSunrise ? now : targetSunrise;

  const daylightHours = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= windowStart && item.time <= targetSunset);

  if (daylightHours.length === 0) {
    stars.textContent = "☆☆☆☆☆";
    rating.textContent = "Unavailable";
    return;
  }

  const maxUV = Math.max(
    ...daylightHours.map(item => data.hourly.uv_index[item.index] ?? 0)
  );
  const details = getUVIndexDetails(maxUV);

  stars.textContent = details.stars;
  rating.textContent = details.rating;
}


// ----------------------------
// Micah Motorcycle
// Uses the next six usable daylight hours and rolls to tomorrow after sunset.
// ----------------------------
function updateMicahMotorcycle(data) {
  const stars = document.getElementById("micah-motorcycle-stars");
  const rating = document.getElementById("micah-motorcycle-rating");
  if (!stars || !rating || !data?.current || !data?.hourly?.time ||
      !data?.daily?.sunrise || !data?.daily?.sunset) return;

  const now = new Date();
  const todaySunset = new Date(data.daily.sunset[0]);
  const targetDay = now <= todaySunset ? 0 : 1;
  const sunrise = new Date(data.daily.sunrise[targetDay]);
  const sunset = new Date(data.daily.sunset[targetDay]);
  const windowStart = targetDay === 0 && now > sunrise ? now : sunrise;
  const sixHoursLater = new Date(windowStart.getTime() + 6 * 60 * 60 * 1000);
  const windowEnd = sixHoursLater < sunset ? sixHoursLater : sunset;
  const upcoming = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= windowStart && item.time <= windowEnd);

  if (upcoming.length === 0) {
    stars.textContent = "☆☆☆☆☆";
    rating.textContent = "Unavailable";
    return;
  }

  const hourly = data.hourly;
  const weather = {
    feelsLike: Math.max(...upcoming.map(item => hourly.apparent_temperature[item.index] ?? 70)),
    wind: Math.max(...upcoming.map(item => hourly.wind_speed_10m[item.index] ?? 0)),
    gusts: Math.max(...upcoming.map(item => hourly.wind_gusts_10m[item.index] ?? 0)),
    visibility: Math.min(...upcoming.map(item => hourly.visibility[item.index] ?? 16093)),
    rainChance: Math.max(...upcoming.map(item => hourly.precipitation_probability[item.index] ?? 0)),
    code: hourly.weather_code[upcoming[0].index],
    forecastCodes: upcoming.map(item => hourly.weather_code[item.index])
  };

  const details = getMotorcycleDetails(weather);
  stars.textContent = details.stars;
  rating.textContent = details.rating;
  updateMotorcycleHighlight(details);
}

function updateMotorcycleHighlight(details) {
  const title = document.getElementById("motorcycle-highlight-title");
  const message = document.getElementById("motorcycle-highlight-message");
  if (!title || !message) return;

  title.textContent = details.rating;

  if (details.score >= 80) {
    message.textContent = "Excellent conditions for the next daylight ride";
    message.className = "good";
  } else if (details.score >= 65) {
    message.textContent = "Good riding conditions with minor concerns";
    message.className = "good";
  } else if (details.score >= 30) {
    message.textContent = "Check wind, rain, and visibility before riding";
    message.className = "watch";
  } else {
    message.textContent = "Unsafe riding conditions in the next daylight window";
    message.className = "bad";
  }
}

// ----------------------------
// Kelsey and Micah Heat Comfort
// Uses the hottest remaining daylight feels-like temperature,
// then rolls to tomorrow after sunset.
// ----------------------------
function updateHeatComfortCards(data) {
  if (!data?.hourly?.time || !data?.daily?.sunrise || !data?.daily?.sunset) return;

  const cards = [
    ["kelsey-heat-comfort-stars", "kelsey-heat-comfort-rating"],
    ["micah-heat-comfort-stars", "micah-heat-comfort-rating"]
  ];
  const now = new Date();
  const todaySunset = new Date(data.daily.sunset[0]);
  const targetDay = now <= todaySunset ? 0 : 1;
  const targetSunrise = new Date(data.daily.sunrise[targetDay]);
  const targetSunset = new Date(data.daily.sunset[targetDay]);
  const windowStart = targetDay === 0 && now > targetSunrise ? now : targetSunrise;

  const daylightHours = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= windowStart && item.time <= targetSunset);

  const hottestFeelsLike = daylightHours.length
    ? Math.max(
        ...daylightHours.map(item =>
          data.hourly.apparent_temperature[item.index] ?? Number.NEGATIVE_INFINITY
        )
      )
    : null;
  const details = getHeatComfortDetails(hottestFeelsLike);

  cards.forEach(([starsId, ratingId]) => {
    const stars = document.getElementById(starsId);
    const rating = document.getElementById(ratingId);
    if (!stars || !rating) return;

    stars.textContent = details.stars;
    rating.textContent = details.rating;
  });
}

// ----------------------------
// Kelsey 6 AM Walk
// Uses the next upcoming 6:00 AM hourly forecast
// ----------------------------
function updateKelsey6AMWalk(data) {
  const stars = document.getElementById("kelsey-6am-walk-stars");
  const rating = document.getElementById("kelsey-6am-walk-rating");

  if (!stars || !rating || !data?.hourly?.time) return;

  const now = new Date();
  const next6AM = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .find(item =>
      item.time >= now &&
      item.time.getHours() === 6
    );

  if (!next6AM) {
    stars.textContent = "☆☆☆☆☆";
    rating.textContent = "Unavailable";
    return;
  }

  const i = next6AM.index;
  const details = get6AMWalkDetails({
    temp: data.hourly.temperature_2m[i],
    feelsLike: data.hourly.apparent_temperature[i],
    humidity: data.hourly.relative_humidity_2m[i],
    wind: data.hourly.wind_speed_10m[i],
    rainChance: data.hourly.precipitation_probability[i],
    code: data.hourly.weather_code[i]
  });

  stars.textContent = details.stars;
  rating.textContent = details.rating;
}


// ----------------------------
// Dad and Mom Boating
// Both cards use the same shared six-hour boating result.
// ----------------------------
function updateBoatingCards(data) {
  const forecast = getBoatingForecast(data);
  if (!forecast) return;

  const details = getBoatingDetails(forecast.weather);
  const cards = [
    ["dad-boating-stars", "dad-boating-rating"],
    ["mom-boating-stars", "mom-boating-rating"]
  ];

  cards.forEach(([starsId, ratingId]) => {
    const stars = document.getElementById(starsId);
    const rating = document.getElementById(ratingId);
    if (!stars || !rating) return;

    stars.textContent = details.stars;
    rating.textContent = details.rating;
  });
}


// ----------------------------
// Mom Shooting
// Uses the next six usable daylight hours and rolls to tomorrow after sunset.
// ----------------------------
function updateMomShooting(data) {
  const stars = document.getElementById("mom-shooting-stars");
  const rating = document.getElementById("mom-shooting-rating");

  if (!stars || !rating || !data?.hourly?.time ||
      !data?.daily?.sunrise || !data?.daily?.sunset) return;

  const now = new Date();
  const todaySunset = new Date(data.daily.sunset[0]);
  const targetDay = now <= todaySunset ? 0 : 1;
  const sunrise = new Date(data.daily.sunrise[targetDay]);
  const sunset = new Date(data.daily.sunset[targetDay]);
  const windowStart = targetDay === 0 && now > sunrise ? now : sunrise;
  const sixHoursLater = new Date(windowStart.getTime() + 6 * 60 * 60 * 1000);
  const windowEnd = sixHoursLater < sunset ? sixHoursLater : sunset;
  const upcoming = data.hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= windowStart && item.time <= windowEnd);

  if (upcoming.length === 0) {
    stars.textContent = "☆☆☆☆☆";
    rating.textContent = "Unavailable";
    return;
  }

  const hourly = data.hourly;
  const feelsLikeValues = upcoming.map(item =>
    hourly.apparent_temperature[item.index] ?? 70
  );
  const coldest = Math.min(...feelsLikeValues);
  const hottest = Math.max(...feelsLikeValues);
  const feelsLike = calculateShootingScore({ feelsLike: coldest }) <
    calculateShootingScore({ feelsLike: hottest }) ? coldest : hottest;

  const weather = {
    feelsLike,
    wind: Math.max(...upcoming.map(item => hourly.wind_speed_10m[item.index] ?? 0)),
    gusts: Math.max(...upcoming.map(item => hourly.wind_gusts_10m[item.index] ?? 0)),
    visibility: Math.min(...upcoming.map(item => hourly.visibility[item.index] ?? 16093)),
    rainChance: Math.max(...upcoming.map(item =>
      hourly.precipitation_probability[item.index] ?? 0
    )),
    code: hourly.weather_code[upcoming[0].index],
    forecastCodes: upcoming.map(item => hourly.weather_code[item.index])
  };

  const details = getShootingDetails(weather);
  stars.textContent = details.stars;
  rating.textContent = details.rating;
}


// ----------------------------
// Family Daily Scores
// Each score is the average of that person's three live activity cards.
// ----------------------------
function updateDailyScores() {
  const people = {
    dad: ["dad-dog-walking-stars", "dad-boating-stars", "dad-storm-stars"],
    mom: ["mom-boating-stars", "mom-shooting-stars", "mom-general-outdoors-stars"],
    nathan: ["nathan-garden-stars", "nathan-grilling-stars", "nathan-general-outdoors-stars"],
    kelsey: ["kelsey-uv-stars", "kelsey-heat-comfort-stars", "kelsey-6am-walk-stars"],
    micah: ["micah-motorcycle-stars", "micah-heat-comfort-stars", "micah-storm-stars"]
  };

  Object.entries(people).forEach(([person, activityIds]) => {
    const activityStars = activityIds
      .map(id => document.getElementById(id)?.textContent || "")
      .filter(stars => stars.includes("★") || stars.includes("☆"));

    if (activityStars.length !== activityIds.length) return;

    const averageStars = activityStars.reduce(
      (total, stars) => total + [...stars].filter(star => star === "★").length,
      0
    ) / activityStars.length;

    const roundedStars = Math.max(0, Math.min(5, Math.round(averageStars)));
    const starsText = "★".repeat(roundedStars) + "☆".repeat(5 - roundedStars);
    let rating = "Skip";

    if (averageStars >= 4.5) rating = "Perfect";
    else if (averageStars >= 3.5) rating = "Great";
    else if (averageStars >= 2.5) rating = "Good";
    else if (averageStars >= 1.5) rating = "Fair";
    else if (averageStars >= 0.5) rating = "Poor";

    const starsElement = document.getElementById(`${person}-daily-stars`);
    const ratingElement = document.getElementById(`${person}-daily-rating`);

    if (starsElement) starsElement.textContent = starsText;
    if (ratingElement) ratingElement.textContent = rating;
  });
}
