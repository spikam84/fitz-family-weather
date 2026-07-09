function formatStormTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function clearStormTimeline() {
  const timeline = document.getElementById("storm-timeline");

  if (!timeline) return;

  timeline.innerHTML = "";
}

function addStormTimelineItem(title, message, time = new Date()) {
  const timeline = document.getElementById("storm-timeline");

  if (!timeline) return;

  const item = document.createElement("div");
  item.className = "storm-timeline-item";

  item.innerHTML = `
    <div class="timeline-time">${formatStormTime(time)}</div>
    <div class="timeline-title">${title}</div>
    <div class="timeline-message">${message}</div>
`;

timeline.prepend(item);

const maxItems = 4;

while (timeline.children.length > maxItems) {
    timeline.removeChild(timeline.lastElementChild);
}}
function updateStormStatusFromCache() {
    clearStormTimeline();
  const cached = localStorage.getItem("cachedWeather");

  if (!cached) {
document.getElementById("storm-status-icon").style.background = "#808080";
    document.getElementById("storm-status-word").textContent = "OFFLINE";
    document.getElementById("storm-status-message").textContent =
      "No saved weather data available yet.";
     addStormTimelineItem("Storm Status Updated", message);
      return;
   
  }

  const data = JSON.parse(cached);
  const hourly = data.hourly;
  const now = new Date();

  const nextHours = hourly.time
    .map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= now)
    .slice(0, 6);

let color = "#24d324";
let word = "QUIET";
let message = "No storms expected in the next several hours.";

  for (const hour of nextHours) {
    const code = hourly.weather_code[hour.index];
    const rain = hourly.precipitation_probability[hour.index];

    if ([95, 96, 99].includes(code)) {
      color = "#e53935";
      word = "STORM RISK";
      message = "Thunderstorms are possible in the next few hours.";
      break;
    }

    if (rain >= 60) {
      color = "#ffd000";
      word = "WATCHING";
      message = "Rain chances are elevated. Keep an eye on radar.";
    }
  }

const statusLight = document.getElementById("storm-status-icon");

statusLight.style.background = color;
document.getElementById("storm-status-word").textContent = word;
document.getElementById("storm-status-message").textContent = message;

// Always log the radar refresh
addStormTimelineItem(
    "RADAR",
    "Radar refreshed."
);

if (word === "WATCHING") {

    addStormTimelineItem(
        "WEATHER",
        "Rain expected around the next few hours."
    );

    addStormTimelineItem(
        "STATUS",
        "Storm probability increased."
    );

}

if (word === "STORM RISK") {

    addStormTimelineItem(
        "ALERT",
        "Thunderstorm risk detected."
    );

}

if (word === "QUIET") {

    addStormTimelineItem(
        "STATUS",
        "Conditions returned to Quiet."
    );

}
}

updateStormStatusFromCache();