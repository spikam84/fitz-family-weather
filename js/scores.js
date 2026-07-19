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
// ----------------------------
// Outdoor Score
// ----------------------------
function calculateOutdoorScore(weather) {
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
  const rainyOrStormyCodes = [
    51, 53, 55, 61, 63, 65,
    80, 81, 82, 95, 96, 99
  ];

  const snowyCodes = [71, 73, 75];

  if (rainyOrStormyCodes.includes(weather.code)) score -= 25;
  if (snowyCodes.includes(weather.code)) score -= 30;

  return Math.max(0, Math.min(100, Math.round(score)));
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
