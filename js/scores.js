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