// ----------------------------
// Shared Star Display
// Converts every five-star rating to yellow filled stars and gray remaining stars.
// It also watches for live score updates made by the page scripts.
// ----------------------------
function styleStarRating(element) {
  if (!element || element.querySelector?.(".filled-stars, .empty-stars")) return;

  const match = element.textContent.trim().match(/^([★☆]{5})(.*)$/s);
  if (!match) return;

  const stars = match[1];
  const suffix = match[2];
  const filledCount = [...stars].filter(star => star === "★").length;

  element.textContent = "";
  element.classList.add("star-rating");
  element.setAttribute(
    "aria-label",
    `${filledCount} out of 5 stars${suffix.trim() ? ` ${suffix.trim()}` : ""}`
  );

  const filled = document.createElement("span");
  filled.className = "filled-stars";
  filled.textContent = "★".repeat(filledCount);

  const empty = document.createElement("span");
  empty.className = "empty-stars";
  empty.textContent = "★".repeat(5 - filledCount);

  element.append(filled, empty);

  if (suffix) {
    element.append(document.createTextNode(suffix));
  }
}

function styleAllStarRatings(root = document) {
  const elements = root.querySelectorAll?.("*") || [];
  elements.forEach(styleStarRating);
}

function startStarRatingObserver() {
  styleAllStarRatings();

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      styleStarRating(mutation.target);

      mutation.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        styleStarRating(node);
        styleAllStarRatings(node);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startStarRatingObserver);
} else {
  startStarRatingObserver();
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
  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];
  const stormCodes = [95, 96, 99];
  const wetCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];

  if (weather.wind < 12) {
    reasons.push("✅ Comfortable wind");
  } else if (weather.wind < 20) {
    reasons.push("⚠️ Breezy during the next 6 hours");
  } else {
    reasons.push("⚠️ Wind may limit outdoor plans");
  }

  if (forecastCodes.some(code => stormCodes.includes(code))) {
    reasons.push("⚠️ Thunderstorms possible within 6 hours");
  } else if (
    forecastCodes.some(code => wetCodes.includes(code)) ||
    rainChance >= 50
  ) {
    reasons.push("⚠️ Rain possible within 6 hours");
  } else if (rainChance >= 30) {
    reasons.push(`⚠️ ${Math.round(rainChance)}% rain chance within 6 hours`);
  } else {
    reasons.push("✅ Dry for the next 6 hours");
  }

  if (weather.feelsLike >= 90) {
    reasons.push("⚠️ Feels-like temperature above 90°");
  } else if (weather.feelsLike <= 45) {
    reasons.push("⚠️ Chilly during the next 6 hours");
  } else {
    reasons.push("✅ Comfortable temperature");
  }

  return reasons;
}

// ----------------------------
// Outdoor Score
// Uses current conditions plus the least comfortable forecast values
// from the next 6 hours.
// ----------------------------
function calculateOutdoorScore(weather) {
  let score = 100;

  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];
  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75];

  // Temperature comfort
  if (weather.feelsLike >= 100) score -= 35;
  else if (weather.feelsLike >= 95) score -= 28;
  else if (weather.feelsLike >= 90) score -= 18;
  else if (weather.feelsLike >= 85) score -= 10;
  else if (weather.feelsLike <= 20) score -= 35;
  else if (weather.feelsLike <= 32) score -= 20;
  else if (weather.feelsLike <= 45) score -= 10;

  // Humidity comfort
  if (weather.humidity >= 80) score -= 10;
  else if (weather.humidity >= 65) score -= 5;

  // Wind comfort
  if (weather.wind >= 30) score -= 28;
  else if (weather.wind >= 25) score -= 18;
  else if (weather.wind >= 18) score -= 10;
  else if (weather.wind >= 12) score -= 5;

  // Forecast hazards
  if (forecastCodes.some(code => stormCodes.includes(code))) {
    score -= 45;
  } else if (forecastCodes.some(code => rainCodes.includes(code))) {
    score -= 25;
  } else if (rainChance >= 70) {
    score -= 25;
  } else if (rainChance >= 50) {
    score -= 18;
  } else if (rainChance >= 30) {
    score -= 8;
  }

  if (forecastCodes.some(code => snowCodes.includes(code))) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ----------------------------
// Garden Conditions Score
// Shared by the Garden Center and Nathan's dashboard card
// ----------------------------
function calculateGardenScore(weather) {
  let score = 100;

  const feelsLike = weather.feelsLike ?? 70;
  const wind = weather.wind ?? 0;
  const rainChance = weather.rainChance ?? 0;
  const code = weather.code;
  const stormCodes = [95, 96, 99];

  if (stormCodes.includes(code)) score -= 55;
  else if (rainChance >= 55) score -= 25;

  if (feelsLike >= 100) score -= 45;
  else if (feelsLike >= 92) score -= 28;
  else if (feelsLike >= 85) score -= 12;

  if (wind >= 25) score -= 30;
  else if (wind >= 18) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getGardenDetails(weather) {
  const score = calculateGardenScore(weather);
  const rating = getRating(score);

  return {
    score,
    stars: rating.stars,
    rating: rating.word
  };
}

// ----------------------------
// Storm Watching Score
// ----------------------------
function calculateStormWatchingScore(weather) {
  let score = 1;

  const code = weather.code;
  const rainChance = weather.rainChance ?? 0;
  const wind = weather.wind ?? 0;

  const thunderstormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];

  // Active thunderstorms = best storm watching
  if (thunderstormCodes.includes(code)) {
    score = 5;
  }

  // High rain chance suggests storms/weather approaching
  else if (rainChance >= 60) {
    score = 4;
  }

  // Rain or moderate precipitation chance
  else if (rainCodes.includes(code) || rainChance >= 30) {
    score = 3;
  }

  // Windy/changeable weather can still be interesting
  else if (wind >= 15) {
    score = 2;
  }

  // Quiet weather
  else {
    score = 1;
  }

  return score;
}
function getStormWatchingDetails(weather) {
  const score = calculateStormWatchingScore(weather);

  if (score === 5) {
    return {
      stars: "★★★★★",
      rating: "Excellent",
      comfort: "Active storm viewing",
      rain: "Storms in the area",
      lightning: "Lightning likely",
      safety: "Watch only from a safe sheltered location"
    };
  }

  if (score === 4) {
    return {
      stars: "★★★★☆",
      rating: "Good",
      comfort: "Good conditions for watching",
      rain: "Storms or heavy rain approaching",
      lightning: "Possible",
      safety: "Keep radar open and stay near shelter"
    };
  }

  if (score === 3) {
    return {
      stars: "★★★☆☆",
      rating: "Fair",
      comfort: "Conditions may become interesting",
      rain: "Rain nearby or possible",
      lightning: "Not confirmed",
      safety: "Continue monitoring radar"
    };
  }

  if (score === 2) {
    return {
      stars: "★★☆☆☆",
      rating: "Quiet",
      comfort: "Some changing weather",
      rain: "Not significant",
      lightning: "Not expected",
      safety: "Normal weather awareness"
    };
  }

  return {
    stars: "★☆☆☆☆",
    rating: "Boring",
    comfort: "Little storm activity",
    rain: "Not expected nearby",
    lightning: "Not expected",
    safety: "No special precautions"
  };
}
// ----------------------------
// Dog Walking Score
// Designed for Dad and the corgi
// ----------------------------
function calculateDogWalkingScore(weather) {
  let score = 100;

  const feelsLike = weather.feelsLike ?? weather.temp ?? 70;
  const humidity = weather.humidity ?? 50;
  const wind = weather.wind ?? 0;
  const rainChance = weather.rainChance ?? 0;
  const code = weather.code;

  const thunderstormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75];

  // Lightning or storms: not safe for walking
  if (thunderstormCodes.includes(code)) {
    return 0;
  }

  // Heat and pavement concerns
  if (feelsLike >= 100) score -= 70;
  else if (feelsLike >= 95) score -= 55;
  else if (feelsLike >= 90) score -= 35;
  else if (feelsLike >= 85) score -= 20;
  else if (feelsLike >= 80) score -= 8;

  // Cold comfort
  if (feelsLike <= 10) score -= 65;
  else if (feelsLike <= 20) score -= 45;
  else if (feelsLike <= 32) score -= 25;
  else if (feelsLike <= 42) score -= 10;

  // Humidity makes heat harder on both walker and dog
  if (humidity >= 85) score -= 15;
  else if (humidity >= 75) score -= 10;
  else if (humidity >= 65) score -= 5;

  // Wind comfort
  if (wind >= 30) score -= 40;
  else if (wind >= 22) score -= 25;
  else if (wind >= 15) score -= 10;

  // Rain and snow
  if (rainCodes.includes(code)) score -= 25;
  if (snowCodes.includes(code)) score -= 30;

  if (rainChance >= 70) score -= 30;
  else if (rainChance >= 50) score -= 20;
  else if (rainChance >= 30) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getDogWalkingDetails(weather) {
  const score = calculateDogWalkingScore(weather);
  const rating = getRating(score);

  return {
    score,
    stars: rating.stars,
    rating: rating.word
  };
}

// ----------------------------
// Kelsey 6 AM Walk Score
// Scores the forecast for the next upcoming 6:00 AM
// ----------------------------
function calculate6AMWalkScore(weather) {
  let score = 100;

  const feelsLike = weather.feelsLike ?? weather.temp ?? 65;
  const humidity = weather.humidity ?? 50;
  const wind = weather.wind ?? 0;
  const rainChance = weather.rainChance ?? 0;
  const code = weather.code;

  const thunderstormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75];
  const fogCodes = [45, 48];

  // Lightning makes the walk unsafe.
  if (thunderstormCodes.includes(code)) return 0;

  // Temperature comfort at 6 AM.
  if (feelsLike >= 95) score -= 55;
  else if (feelsLike >= 90) score -= 35;
  else if (feelsLike >= 85) score -= 18;
  else if (feelsLike >= 80) score -= 8;

  if (feelsLike <= 5) score -= 65;
  else if (feelsLike <= 15) score -= 45;
  else if (feelsLike <= 25) score -= 28;
  else if (feelsLike <= 35) score -= 15;
  else if (feelsLike <= 45) score -= 7;

  // Humidity, wind, precipitation, and visibility concerns.
  if (humidity >= 90) score -= 12;
  else if (humidity >= 80) score -= 7;

  if (wind >= 30) score -= 45;
  else if (wind >= 22) score -= 28;
  else if (wind >= 15) score -= 12;

  if (rainCodes.includes(code)) score -= 25;
  if (snowCodes.includes(code)) score -= 35;
  if (fogCodes.includes(code)) score -= 15;

  if (rainChance >= 70) score -= 30;
  else if (rainChance >= 50) score -= 20;
  else if (rainChance >= 30) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function get6AMWalkDetails(weather) {
  const score = calculate6AMWalkScore(weather);
  const rating = getRating(score);

  let status = "Good to Go";
  if (score < 30) status = "Skip Walk";
  else if (score < 65) status = "Use Caution";

  return {
    score,
    stars: rating.stars,
    rating: status
  };
}

// ----------------------------
// Grilling Score
// Looks ahead 6 hours for a practical grilling window.
// ----------------------------
function calculateGrillingScore(weather) {
  let score = 100;

  const feelsLike = weather.feelsLike ?? 70;
  const wind = weather.wind ?? 0;
  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];

  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75];

  // Lightning makes outdoor grilling unsafe.
  if (forecastCodes.some(code => stormCodes.includes(code))) return 0;

  // Precipitation can interrupt cooking and make the grill unsafe to use.
  if (forecastCodes.some(code => rainCodes.includes(code))) score -= 35;
  else if (rainChance >= 70) score -= 40;
  else if (rainChance >= 50) score -= 28;
  else if (rainChance >= 30) score -= 12;

  if (forecastCodes.some(code => snowCodes.includes(code))) score -= 40;

  // Strong wind affects flame control and can spread sparks.
  if (wind >= 30) score -= 55;
  else if (wind >= 25) score -= 40;
  else if (wind >= 18) score -= 22;
  else if (wind >= 12) score -= 8;

  // Temperature mainly affects the cook's comfort.
  if (feelsLike >= 105) score -= 35;
  else if (feelsLike >= 95) score -= 22;
  else if (feelsLike >= 88) score -= 10;
  else if (feelsLike <= 15) score -= 35;
  else if (feelsLike <= 32) score -= 20;
  else if (feelsLike <= 45) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getGrillingDetails(weather) {
  const score = calculateGrillingScore(weather);
  const rating = getRating(score);

  return {
    score,
    stars: rating.stars,
    rating: rating.word
  };
}

// ----------------------------
// Boating Score
// Shared by Dad and Mom for the same boat.
// Looks ahead 6 hours and prioritizes water safety.
// ----------------------------
function calculateBoatingScore(weather) {
  let score = 100;

  const wind = weather.wind ?? 0;
  const gusts = weather.gusts ?? wind;
  const visibility = weather.visibility ?? 16093;
  const feelsLike = weather.feelsLike ?? 70;
  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];

  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75];
  const fogCodes = [45, 48];

  // Lightning is an automatic stay-ashore condition.
  if (forecastCodes.some(code => stormCodes.includes(code))) return 0;

  // Sustained wind and gusts have the greatest effect on boat handling.
  if (wind >= 25) score -= 70;
  else if (wind >= 20) score -= 50;
  else if (wind >= 15) score -= 30;
  else if (wind >= 10) score -= 12;

  if (gusts >= 35) score -= 65;
  else if (gusts >= 30) score -= 45;
  else if (gusts >= 25) score -= 28;
  else if (gusts >= 20) score -= 12;

  // Visibility is stored in meters: 1 mile is about 1609 meters.
  if (visibility < 805) score -= 65;
  else if (visibility < 1609) score -= 45;
  else if (visibility < 4828) score -= 22;

  if (forecastCodes.some(code => fogCodes.includes(code))) score -= 20;

  // Precipitation can reduce visibility and make conditions change quickly.
  if (forecastCodes.some(code => rainCodes.includes(code))) score -= 30;
  else if (rainChance >= 70) score -= 35;
  else if (rainChance >= 50) score -= 25;
  else if (rainChance >= 30) score -= 12;

  if (forecastCodes.some(code => snowCodes.includes(code))) score -= 45;

  // Temperature affects exposure risk and comfort.
  if (feelsLike >= 105) score -= 30;
  else if (feelsLike >= 95) score -= 18;
  else if (feelsLike <= 25) score -= 35;
  else if (feelsLike <= 40) score -= 20;
  else if (feelsLike <= 50) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getBoatingDetails(weather) {
  const score = calculateBoatingScore(weather);
  const rating = getRating(score);

  let status = "Good to Go";
  if (score < 50) status = "Stay Ashore";
  else if (score < 80) status = "Use Caution";

  return {
    score,
    stars: rating.stars,
    rating: status
  };
}


// ----------------------------
// Motorcycle Riding Score
// Evaluates the next usable daylight riding window.
// ----------------------------
function calculateMotorcycleScore(weather) {
  let score = 100;
  const wind = weather.wind ?? 0;
  const gusts = weather.gusts ?? wind;
  const visibility = weather.visibility ?? 16093;
  const feelsLike = weather.feelsLike ?? 70;
  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];
  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75, 77, 85, 86];
  const fogCodes = [45, 48];

  if (forecastCodes.some(code => stormCodes.includes(code))) return 0;
  if (forecastCodes.some(code => snowCodes.includes(code))) return 0;

  if (forecastCodes.some(code => rainCodes.includes(code))) score -= 55;
  else if (rainChance >= 70) score -= 55;
  else if (rainChance >= 50) score -= 38;
  else if (rainChance >= 30) score -= 20;
  else if (rainChance >= 15) score -= 8;

  if (wind >= 30) score -= 60;
  else if (wind >= 25) score -= 42;
  else if (wind >= 20) score -= 28;
  else if (wind >= 15) score -= 14;

  if (gusts >= 40) score -= 65;
  else if (gusts >= 35) score -= 48;
  else if (gusts >= 30) score -= 32;
  else if (gusts >= 25) score -= 16;

  if (visibility < 805) score -= 65;
  else if (visibility < 1609) score -= 45;
  else if (visibility < 4828) score -= 22;
  if (forecastCodes.some(code => fogCodes.includes(code))) score -= 25;

  if (feelsLike >= 105) score -= 45;
  else if (feelsLike >= 95) score -= 25;
  else if (feelsLike >= 88) score -= 12;
  else if (feelsLike <= 32) score -= 55;
  else if (feelsLike <= 40) score -= 35;
  else if (feelsLike <= 50) score -= 18;
  else if (feelsLike <= 58) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getMotorcycleDetails(weather) {
  const score = calculateMotorcycleScore(weather);
  const rating = getRating(score);
  let status = rating.word;
  if (score < 30) status = "Don't Ride";
  else if (score < 65) status = "Use Caution";
  else if (score >= 90) status = "Perfect Ride";
  else if (score >= 80) status = "Great Ride";
  else status = "Good Ride";
  return { score, stars: rating.stars, rating: status };
}

// ----------------------------
// Heat Comfort
// More stars mean more comfortable conditions in the heat.
// ----------------------------
function getHeatComfortDetails(feelsLike) {
  const temperature = Number(feelsLike);

  if (!Number.isFinite(temperature)) {
    return { feelsLike: null, stars: "☆☆☆☆☆", rating: "Unavailable" };
  }

  if (temperature >= 105) {
    return { feelsLike: temperature, stars: "☆☆☆☆☆", rating: "Dangerous" };
  }

  if (temperature >= 95) {
    return { feelsLike: temperature, stars: "★☆☆☆☆", rating: "Very Hot" };
  }

  if (temperature >= 90) {
    return { feelsLike: temperature, stars: "★★☆☆☆", rating: "Hot" };
  }

  if (temperature >= 85) {
    return { feelsLike: temperature, stars: "★★★☆☆", rating: "Warm" };
  }

  if (temperature >= 80) {
    return { feelsLike: temperature, stars: "★★★★☆", rating: "Mild" };
  }

  return { feelsLike: temperature, stars: "★★★★★", rating: "Comfortable" };
}

// ----------------------------
// UV Index
// More stars mean safer conditions for unprotected sun exposure.
// ----------------------------
function getUVIndexDetails(uvIndex) {
  const uv = Math.max(0, Number(uvIndex) || 0);

  if (uv >= 11) {
    return { uv, stars: "☆☆☆☆☆", rating: "Extreme" };
  }

  if (uv >= 8) {
    return { uv, stars: "★☆☆☆☆", rating: "Very High" };
  }

  if (uv >= 6) {
    return { uv, stars: "★★☆☆☆", rating: "High" };
  }

  if (uv >= 3) {
    return { uv, stars: "★★★☆☆", rating: "Moderate" };
  }

  return { uv, stars: "★★★★★", rating: "Low" };
}


// ----------------------------
// Shooting Conditions Score
// Evaluates the next usable six-hour daylight window.
// ----------------------------
function calculateShootingScore(weather) {
  let score = 100;
  const wind = weather.wind ?? 0;
  const gusts = weather.gusts ?? wind;
  const visibility = weather.visibility ?? 16093;
  const feelsLike = weather.feelsLike ?? 70;
  const rainChance = weather.rainChance ?? 0;
  const forecastCodes = weather.forecastCodes ?? [weather.code];
  const stormCodes = [95, 96, 99];
  const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82];
  const snowCodes = [71, 73, 75, 77, 85, 86];
  const fogCodes = [45, 48];

  // Lightning and thunderstorms make an outdoor range unsafe.
  if (forecastCodes.some(code => stormCodes.includes(code))) return 0;

  // Wind is weighted heavily because it affects safe handling and accuracy.
  if (wind >= 30) score -= 65;
  else if (wind >= 25) score -= 48;
  else if (wind >= 20) score -= 32;
  else if (wind >= 15) score -= 18;
  else if (wind >= 10) score -= 7;

  if (gusts >= 40) score -= 60;
  else if (gusts >= 35) score -= 45;
  else if (gusts >= 30) score -= 30;
  else if (gusts >= 25) score -= 15;

  if (forecastCodes.some(code => rainCodes.includes(code))) score -= 38;
  else if (rainChance >= 70) score -= 40;
  else if (rainChance >= 50) score -= 28;
  else if (rainChance >= 30) score -= 14;

  if (forecastCodes.some(code => snowCodes.includes(code))) score -= 50;
  if (forecastCodes.some(code => fogCodes.includes(code))) score -= 25;

  if (visibility < 805) score -= 65;
  else if (visibility < 1609) score -= 45;
  else if (visibility < 4828) score -= 22;

  if (feelsLike >= 105) score -= 40;
  else if (feelsLike >= 95) score -= 24;
  else if (feelsLike >= 88) score -= 10;
  else if (feelsLike <= 20) score -= 40;
  else if (feelsLike <= 32) score -= 25;
  else if (feelsLike <= 45) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getShootingDetails(weather) {
  const score = calculateShootingScore(weather);
  const rating = getRating(score);
  let status = rating.word;

  if (score < 30) status = "Do Not Shoot";
  else if (score < 65) status = "Use Caution";
  else if (score >= 90) status = "Excellent";
  else if (score >= 80) status = "Great";
  else status = "Good";

  return { score, stars: rating.stars, rating: status };
}
