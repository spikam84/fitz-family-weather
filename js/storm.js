// ----------------------------
// Timeline Functions
// ----------------------------
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
// ----------------------------
// Main Storm Status
// ----------------------------
function updateStormStatusFromCache() {
    clearStormTimeline();
  const cached = localStorage.getItem("cachedWeather");

if (!cached) {
    document.getElementById("storm-status-icon").style.background = "#808080";
    document.getElementById("storm-status-word").textContent = "OFFLINE";
    document.getElementById("storm-status-message").textContent =
        "No saved weather data available yet.";

    updateStormWatching("OFFLINE");
    addStormTimelineItem("STATUS", "No saved weather data available yet.");
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

document.getElementById("storm-last-updated").textContent =
    formatStormTime(new Date());
    
updateStormWatching(word);

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
// ----------------------------
// Storm Watching
// ----------------------------
function updateStormWatching(word) {
    const rating = document.getElementById("storm-watching-rating");
    const comfort = document.getElementById("storm-watching-comfort");
    const rain = document.getElementById("storm-watching-rain");
    const lightning = document.getElementById("storm-watching-lightning");
    const safety = document.getElementById("storm-watching-safety");

    if (!rating) return;

    if (word === "STORM RISK") {
        rating.textContent = "★★☆☆☆ Watch From Inside";
        comfort.textContent = "Comfort: Storm risk nearby";
        rain.textContent = "Rain: Likely";
        lightning.textContent = "Lightning: Possible";
        safety.textContent = "Safety: Stay weather aware";
        return;
    }

    if (word === "WATCHING") {
        rating.textContent = "★★★☆☆ Fair";
        comfort.textContent = "Comfort: Okay";
        rain.textContent = "Rain: Possible soon";
        lightning.textContent = "Lightning: Not confirmed";
        safety.textContent = "Safety: Keep radar open";
        return;
    }

    if (word === "QUIET") {
        rating.textContent = "★★★★☆ Good";
        comfort.textContent = "Comfort: Good for watching";
        rain.textContent = "Rain: Not expected over us right now";
        lightning.textContent = "Lightning: Not expected";
        safety.textContent = "Safety: Continue monitoring radar";
        return;
    }

    rating.textContent = "Checking...";
    comfort.textContent = "Comfort: --";
    rain.textContent = "Rain: --";
    lightning.textContent = "Lightning: --";
    safety.textContent = "Safety: --";
}
// ----------------------------
// Radar Awareness
// ----------------------------
async function updateRadarAwareness() {
    const status = document.getElementById("radar-status");
    const distance = document.getElementById("radar-distance");
    const movement = document.getElementById("radar-movement");
    const eta = document.getElementById("radar-eta");

    if (!status || !distance || !movement || !eta) return;

    status.textContent = "Checking...";
    distance.textContent = "Searching...";
    movement.textContent = "Not calculated yet";
    eta.textContent = "Not calculated yet";

    const centerLat = 41.5245;
    const centerLon = -90.5157;

    const milesPerLatitudeDegree = 69;
    const milesPerLongitudeDegree =
        69 * Math.cos(centerLat * Math.PI / 180);

    const directions = [
        { name: "N", north: 1, east: 0 },
        { name: "NE", north: 1, east: 1 },
        { name: "E", north: 0, east: 1 },
        { name: "SE", north: -1, east: 1 },
        { name: "S", north: -1, east: 0 },
        { name: "SW", north: -1, east: -1 },
        { name: "W", north: 0, east: -1 },
        { name: "NW", north: 1, east: -1 }
    ];

    const scanDistances = [10, 25, 50];

    const scanPoints = [
        {
            direction: "HERE",
            miles: 0,
            latitude: centerLat,
            longitude: centerLon
        }
    ];

    for (const miles of scanDistances) {
        for (const direction of directions) {
            const isDiagonal =
                direction.north !== 0 && direction.east !== 0;

            const componentMiles = isDiagonal
                ? miles / Math.sqrt(2)
                : miles;

            scanPoints.push({
                direction: direction.name,
                miles,
                latitude:
                    centerLat +
                    (direction.north * componentMiles) /
                    milesPerLatitudeDegree,
                longitude:
                    centerLon +
                    (direction.east * componentMiles) /
                    milesPerLongitudeDegree
            });
        }
    }

    async function sampleRadarPoint(point) {
const params = new URLSearchParams({
    geometry: JSON.stringify({
        x: point.longitude,
        y: point.latitude,
        spatialReference: { wkid: 4326 }
    }),
    geometryType: "esriGeometryPoint",
    returnGeometry: "false",
    returnCatalogItems: "false",
    returnAllPixelValues: "true",
    f: "json"
});

const radarUrl =
    "https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer/identify?" +
    params.toString();

const response = await fetch(radarUrl);

if (!response.ok) {
    throw new Error(`Radar request failed: ${response.status}`);
}

        const data = await response.json();

       const precipitationDetected =
    data.value !== "NoData";

      return {
    direction: point.direction,
    miles: point.miles,
    precipitation: precipitationDetected
};
    }

    try {
        const results = await Promise.all(
            scanPoints.map(sampleRadarPoint)
        );

console.table(
    results.map(result => ({
        direction: result.direction,
        miles: result.miles,
        precipitation: result.precipitation
    }))
);

const precipitationPoints = results
    .filter(result => result.precipitation)
    .sort((a, b) => a.miles - b.miles);

        if (precipitationPoints.length === 0) {
    status.textContent = "No precipitation detected";
    distance.textContent = "None within 50 miles";
    movement.textContent = "No movement to track";
    eta.textContent = "--";
    return;
        }

        const nearest = precipitationPoints[0];

        status.textContent = "Nearby precipitation detected";

if (nearest.miles === 0) {
    distance.textContent = "Over the Quad Cities";
} else {
    distance.textContent =
        `About ${nearest.miles} mi ${nearest.direction}`;
}

movement.textContent = "Tracking coming soon";
eta.textContent = "ETA unavailable";
        

    } catch (error) {
        console.error("Unable to scan MRMS radar:", error);

        status.textContent = "No precipitation detected";
distance.textContent = "Clear within 50 miles";
movement.textContent = "No movement to track";
eta.textContent = "--";
return;
    }
}

// ----------------------------
// Watches & Warnings
// ----------------------------

async function updateWarnings() {
    const title = document.getElementById("storm-alert-title");
    const message = document.getElementById("storm-alert-message");
    const box = document.getElementById("storm-alert-box");
    const activeWatches = document.getElementById("storm-active-watches");

    if (!title || !message || !box) return;

    title.textContent = "Checking alerts...";
    message.textContent = "Contacting the National Weather Service.";
    box.style.borderLeft = "6px solid #808080";

    try {
        const quadCitiesAreas = [
            "Scott",
            "Rock Island",
            "Muscatine",
            "Clinton",
            "Henry",
            "Mercer",
            "Louisa"
        ];

        const [iowaResponse, illinoisResponse] = await Promise.all([
            fetch("https://api.weather.gov/alerts/active?area=IA"),
            fetch("https://api.weather.gov/alerts/active?area=IL")
        ]);

        if (!iowaResponse.ok || !illinoisResponse.ok) {
            throw new Error("NWS alert request failed.");
        }

        const iowaData = await iowaResponse.json();
        const illinoisData = await illinoisResponse.json();

const iowaAlerts = (iowaData.features || []).map(alert => ({
    ...alert,
    sourceState: "IA"
}));

const illinoisAlerts = (illinoisData.features || []).map(alert => ({
    ...alert,
    sourceState: "IL"
}));

const allAlerts = [
    ...iowaAlerts,
    ...illinoisAlerts
];

const quadCitiesCounties = {
    IA: ["Scott", "Muscatine", "Clinton", "Louisa"],
    IL: ["Rock Island", "Henry", "Mercer"]
};

const localAlerts = allAlerts.filter(alert => {
    const areaNames = (alert.properties.areaDesc || "")
        .split(";")
        .map(area => area.trim());

    const allowedCounties =
        quadCitiesCounties[alert.sourceState] || [];

    return areaNames.some(area =>
        allowedCounties.includes(area)
    );
});


        if (activeWatches) {
            activeWatches.textContent = localAlerts.length;
        }

        if (localAlerts.length === 0) {
            title.textContent = "No Active Warnings";
            message.textContent =
                "No NWS watches or warnings for the Quad Cities region.";
            box.style.borderLeft = "6px solid #24d324";
            return;
        }

title.textContent = `Active Alerts (${localAlerts.length})`;

message.innerHTML = localAlerts
    .map(alert => {
        const details = alert.properties;

        return `
            <div class="storm-alert-item">
                <strong>${details.event || "Weather Alert"}</strong>
                <span>${details.areaDesc || "Quad Cities region"}</span>
            </div>
        `;
    })
    .join("");

box.style.borderLeft = "6px solid #e53935";

        addStormTimelineItem(
            "ALERT",
            alert.event || "Active NWS weather alert."
        );

    } catch (error) {
        console.error("Unable to load NWS alerts:", error);

        title.textContent = "Alerts Unavailable";
        message.textContent =
            "Unable to contact the National Weather Service.";
        box.style.borderLeft = "6px solid #808080";
    }
}
// ----------------------------
// Page Startup and Refresh
// ----------------------------
updateStormStatusFromCache();
updateRadarAwareness();
updateWarnings();

const refreshButton = document.querySelector(".refresh-button");

if (refreshButton) {
refreshButton.addEventListener("click", () => {
    refreshButton.classList.add("spinning");

    updateStormStatusFromCache();
updateRadarAwareness();
updateWarnings();

    setTimeout(() => {
        refreshButton.classList.remove("spinning");
    }, 800);
});
}