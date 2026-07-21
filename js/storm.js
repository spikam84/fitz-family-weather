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
  item.classList.add(`timeline-${title.toLowerCase()}`);

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

    updateStormWatching({ word: "OFFLINE" });
    addStormTimelineItem("STATUS", "No saved weather data available yet.");
    return;
}

  const data = JSON.parse(cached);
  const hourly = data.hourly;
  const now = new Date();
  const current = data.current;

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
const previousStatus = localStorage.getItem("lastStormStatus");

const statusLight = document.getElementById("storm-status-icon");

statusLight.style.background = color;
document.getElementById("storm-status-word").textContent = word;
document.getElementById("storm-status-message").textContent = message;

document.getElementById("storm-last-updated").textContent =
    formatStormTime(new Date());
    
updateStormWatching({
  word: word,
  code: current.weather_code,
  rainChance: hourly.precipitation_probability?.[0] ?? 0,
  wind: current.wind_speed_10m
});



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
        previousStatus && previousStatus !== "QUIET"
            ? "Conditions returned to Quiet."
            : "Conditions remain Quiet."
    );

}

localStorage.setItem("lastStormStatus", word);
}
// ----------------------------
// Storm Watching
// ----------------------------
function updateStormWatching(weather) {
  const rating = document.getElementById("storm-watching-rating");
  const comfort = document.getElementById("storm-watching-comfort");
  const rain = document.getElementById("storm-watching-rain");
  const lightning = document.getElementById("storm-watching-lightning");
  const safety = document.getElementById("storm-watching-safety");

  if (!rating) return;

  if (!weather || weather.word === "OFFLINE") {
    rating.textContent = "Checking...";
    comfort.textContent = "Comfort: --";
    rain.textContent = "Rain: --";
    lightning.textContent = "Lightning: --";
    safety.textContent = "Safety: --";
    return;
  }

  const details = getStormWatchingDetails(weather);

  rating.textContent = `${details.stars} ${details.rating}`;
  comfort.textContent = `Comfort: ${details.comfort}`;
  rain.textContent = `Rain: ${details.rain}`;
  lightning.textContent = `Lightning: ${details.lightning}`;
  safety.textContent = `Safety: ${details.safety}`;
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
    const detectionRadiusMiles = 50;
    const imageRadiusMiles = 60;
    const imageSize = 256;
    const radarIntervalMinutes = 15;
    const milesPerLatitudeDegree = 69;
    const milesPerLongitudeDegree =
        69 * Math.cos(centerLat * Math.PI / 180);
    const latitudeRadius = imageRadiusMiles / milesPerLatitudeDegree;
    const longitudeRadius = imageRadiusMiles / milesPerLongitudeDegree;
    const radarService =
        "https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer/exportImage";

    function buildRadarImageUrl(radarTime = null) {
        const params = new URLSearchParams({
            bbox: [
                centerLon - longitudeRadius,
                centerLat - latitudeRadius,
                centerLon + longitudeRadius,
                centerLat + latitudeRadius
            ].join(","),
            bboxSR: "4326",
            imageSR: "4326",
            size: `${imageSize},${imageSize}`,
            adjustAspectRatio: "false",
            format: "png32",
            interpolation: "RSP_NearestNeighbor",
            f: "image"
        });

        if (radarTime !== null) {
            params.set("time", radarTime.toString());
        } else {
            // NOAA exports can be cached for hours. A five-minute URL bucket keeps
            // the latest frame current while still allowing short-term caching.
            params.set("_", Math.floor(Date.now() / (5 * 60 * 1000)).toString());
        }

        return `${radarService}?${params.toString()}`;
    }

    async function drawBlobToPixelData(imageBlob) {
        const canvas = document.createElement("canvas");
        canvas.width = imageSize;
        canvas.height = imageSize;

        const context = canvas.getContext("2d", {
            alpha: true,
            willReadFrequently: true
        });

        if (!context) {
            throw new Error("Unable to create radar image canvas.");
        }

        if (typeof createImageBitmap === "function") {
            const radarImage = await createImageBitmap(imageBlob);
            context.drawImage(radarImage, 0, 0, imageSize, imageSize);
            radarImage.close();
        } else {
            const imageUrl = URL.createObjectURL(imageBlob);

            try {
                const radarImage = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = () => reject(
                        new Error("Unable to decode radar image.")
                    );
                    image.src = imageUrl;
                });
                context.drawImage(radarImage, 0, 0, imageSize, imageSize);
            } finally {
                URL.revokeObjectURL(imageUrl);
            }
        }

        return context.getImageData(0, 0, imageSize, imageSize).data;
    }

    async function loadRadarPixels(radarTime = null) {
        const response = await fetch(buildRadarImageUrl(radarTime), {
            mode: "cors",
            credentials: "omit"
        });

        if (!response.ok) {
            throw new Error(`Radar image request failed: ${response.status}`);
        }

        const imageBlob = await response.blob();
        if (!imageBlob.type.startsWith("image/")) {
            throw new Error("Radar service did not return an image.");
        }

        return drawBlobToPixelData(imageBlob);
    }

    function pixelPosition(index) {
        const x = index % imageSize;
        const y = Math.floor(index / imageSize);
        const eastMiles =
            ((x + 0.5) / imageSize - 0.5) * imageRadiusMiles * 2;
        // PNG rows run from north at the top to south at the bottom.
        const northMiles =
            (0.5 - (y + 0.5) / imageSize) * imageRadiusMiles * 2;

        return {
            eastMiles,
            northMiles,
            distance: Math.hypot(eastMiles, northMiles)
        };
    }

    function createPrecipitationMask(pixelData) {
        const pixelCount = imageSize * imageSize;
        const candidates = new Uint8Array(pixelCount);
        const strongCandidates = new Uint8Array(pixelCount);
        const mask = new Uint8Array(pixelCount);
        const strongMask = new Uint8Array(pixelCount);

        for (let index = 0; index < pixelCount; index += 1) {
            const red = pixelData[index * 4];
            const green = pixelData[index * 4 + 1];
            const blue = pixelData[index * 4 + 2];
            const alpha = pixelData[index * 4 + 3];
            const insideRadarArea =
                pixelPosition(index).distance <= imageRadiusMiles;

            // NOAA's PNG is an opaque 95-color reflectivity raster. Alpha marks
            // raster coverage, not rain. The blue/green portion of its color ramp
            // includes weak returns and clutter; meaningful echoes begin where the
            // ramp changes to olive/yellow/red (red >= 34 and blue <= 10).
            const isEchoColor =
                alpha > 0 && red >= 34 && blue <= 10;
            const isStrongEchoColor =
                isEchoColor && red >= 230 && green <= 177 && blue <= 2;

            if (insideRadarArea && isEchoColor) {
                candidates[index] = 1;
                if (isStrongEchoColor) strongCandidates[index] = 1;
            }
        }

        // Keep small showers, but remove isolated one- and two-pixel artifacts.
        for (let y = 0; y < imageSize; y += 1) {
            for (let x = 0; x < imageSize; x += 1) {
                const index = y * imageSize + x;
                if (!candidates[index]) continue;

                let neighbors = 0;
                for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                    const neighborY = y + offsetY;
                    if (neighborY < 0 || neighborY >= imageSize) continue;

                    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
                        const neighborX = x + offsetX;
                        if (neighborX < 0 || neighborX >= imageSize) continue;
                        neighbors += candidates[
                            neighborY * imageSize + neighborX
                        ];
                    }
                }

                if (neighbors >= 3) {
                    mask[index] = 1;
                    strongMask[index] = strongCandidates[index];
                }
            }
        }

        return { mask, strongMask };
    }

    function findPrecipitationRegions(mask, strongMask) {
        const visited = new Uint8Array(mask.length);
        const regions = [];
        const neighborOffsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],           [1, 0],
            [-1, 1],  [0, 1],  [1, 1]
        ];

        for (let start = 0; start < mask.length; start += 1) {
            if (!mask[start] || visited[start]) continue;

            const queue = [start];
            const pixels = [];
            visited[start] = 1;
            let queueIndex = 0;
            let eastTotal = 0;
            let northTotal = 0;
            let nearestDistance = Infinity;
            let strongPixelCount = 0;

            while (queueIndex < queue.length) {
                const index = queue[queueIndex++];
                pixels.push(index);
                strongPixelCount += strongMask[index];

                const position = pixelPosition(index);
                eastTotal += position.eastMiles;
                northTotal += position.northMiles;
                nearestDistance = Math.min(nearestDistance, position.distance);

                const x = index % imageSize;
                const y = Math.floor(index / imageSize);

                for (const [offsetX, offsetY] of neighborOffsets) {
                    const neighborX = x + offsetX;
                    const neighborY = y + offsetY;
                    if (
                        neighborX < 0 || neighborX >= imageSize ||
                        neighborY < 0 || neighborY >= imageSize
                    ) {
                        continue;
                    }

                    const neighborIndex = neighborY * imageSize + neighborX;
                    if (!mask[neighborIndex] || visited[neighborIndex]) continue;

                    visited[neighborIndex] = 1;
                    queue.push(neighborIndex);
                }
            }

            const strongPixelFraction = strongPixelCount / pixels.length;

            // A real precipitation area must be spatially coherent and contain a
            // meaningful stronger core. This rejects small warm-color speckles and
            // broad low-level clutter without relying on alpha transparency.
            if (
                pixels.length >= 20 &&
                strongPixelCount >= 8 &&
                strongPixelFraction >= 0.05
            ) {
                regions.push({
                    pixels,
                    area: pixels.length,
                    strongPixelCount,
                    centroidEast: eastTotal / pixels.length,
                    centroidNorth: northTotal / pixels.length,
                    nearestDistance
                });
            }
        }

        return regions;
    }

    function getCompassDirection(eastMiles, northMiles) {
        const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
        const bearing =
            (Math.atan2(eastMiles, northMiles) * 180 / Math.PI + 360) % 360;
        return directions[Math.round(bearing / 45) % directions.length];
    }

    function analyzeRadarFrame(pixelData) {
        const { mask, strongMask } = createPrecipitationMask(pixelData);
        const regions = findPrecipitationRegions(mask, strongMask);
        const nearbyRegions = regions.filter(
            region => region.nearestDistance <= detectionRadiusMiles
        );
        const directionScores = new Map();
        let nearestDistance = Infinity;

        for (const region of nearbyRegions) {
            for (const index of region.pixels) {
                const position = pixelPosition(index);
                if (position.distance > detectionRadiusMiles) continue;

                nearestDistance = Math.min(nearestDistance, position.distance);
                if (position.distance <= 2) continue;

                const direction = getCompassDirection(
                    position.eastMiles,
                    position.northMiles
                );
                const weight = 1 / (1 + position.distance / 25);
                directionScores.set(
                    direction,
                    (directionScores.get(direction) || 0) + weight
                );
            }
        }

        const sortedDirections = [...directionScores.entries()]
            .sort((a, b) => b[1] - a[1]);
        let dominantDirection = sortedDirections[0]?.[0] || "HERE";

        if (sortedDirections.length > 1) {
            const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
            const [primaryDirection, primaryScore] = sortedDirections[0];
            const [secondaryDirection, secondaryScore] = sortedDirections[1];
            const primaryIndex = directions.indexOf(primaryDirection);
            const secondaryIndex = directions.indexOf(secondaryDirection);
            const sectorDifference = Math.min(
                Math.abs(primaryIndex - secondaryIndex),
                directions.length - Math.abs(primaryIndex - secondaryIndex)
            );

            if (
                sectorDifference === 1 &&
                secondaryScore >= primaryScore * 0.15
            ) {
                dominantDirection =
                    `${primaryDirection}/${secondaryDirection}`;
            }
        }

        return {
            regions,
            nearbyRegions,
            nearestDistance,
            dominantDirection
        };
    }

    function findMatchingPastRegion(currentRegion, pastRegions) {
        let bestMatch = null;
        let bestScore = Infinity;

        for (const pastRegion of pastRegions) {
            const centroidShift = Math.hypot(
                currentRegion.centroidEast - pastRegion.centroidEast,
                currentRegion.centroidNorth - pastRegion.centroidNorth
            );
            const areaRatio = currentRegion.area / pastRegion.area;

            if (centroidShift > 25 || areaRatio < 0.35 || areaRatio > 2.85) {
                continue;
            }

            const score = centroidShift + Math.abs(Math.log(areaRatio)) * 5;
            if (score < bestScore) {
                bestScore = score;
                bestMatch = { region: pastRegion, centroidShift, areaRatio };
            }
        }

        return bestMatch;
    }

    function calculateRadarMotion(currentAnalysis, pastAnalysis) {
        const currentRegion = [...currentAnalysis.nearbyRegions]
            .sort((a, b) => a.nearestDistance - b.nearestDistance)[0];

        if (!currentRegion || !pastAnalysis) {
            return {
                movementText: "No clear movement detected",
                etaText: "Unable to estimate"
            };
        }

        const match = findMatchingPastRegion(currentRegion, pastAnalysis.regions);
        if (!match) {
            return {
                movementText: "New precipitation detected",
                etaText: "Unable to estimate"
            };
        }

        const distanceChange =
            match.region.nearestDistance - currentRegion.nearestDistance;
        const movementThresholdMiles = 1.5;

        if (distanceChange < -movementThresholdMiles) {
            return {
                movementText: "Moving away",
                etaText: "Unable to estimate"
            };
        }

        if (distanceChange <= movementThresholdMiles) {
            return {
                movementText: "No clear movement detected",
                etaText: "Unable to estimate"
            };
        }

        const movementText =
            `Approaching from ${currentAnalysis.dominantDirection}`;
        const radialSpeed = distanceChange * (60 / radarIntervalMinutes);
        const currentCentroidDistance = Math.hypot(
            currentRegion.centroidEast,
            currentRegion.centroidNorth
        );
        const pastCentroidDistance = Math.hypot(
            match.region.centroidEast,
            match.region.centroidNorth
        );
        const centroidDistanceChange =
            pastCentroidDistance - currentCentroidDistance;
        const highConfidence =
            currentRegion.area >= 8 &&
            match.region.area >= 8 &&
            match.centroidShift >= movementThresholdMiles &&
            match.centroidShift <= 20 &&
            match.areaRatio >= 0.6 &&
            match.areaRatio <= 1.67 &&
            centroidDistanceChange > 0.75 &&
            Math.abs(distanceChange - centroidDistanceChange) <= 5 &&
            radialSpeed >= 5 &&
            radialSpeed <= 80 &&
            currentRegion.nearestDistance >= 3;

        if (!highConfidence) {
            return { movementText, etaText: "Unable to estimate" };
        }

        const etaMinutes =
            (currentRegion.nearestDistance / radialSpeed) * 60;
        if (etaMinutes <= 0 || etaMinutes > 120) {
            return { movementText, etaText: "Unable to estimate" };
        }

        const roundedEta = Math.ceil(etaMinutes / 15) * 15;
        let etaText;

        if (roundedEta >= 75) {
            etaText = "More than 1 hour";
        } else if (roundedEta === 60) {
            etaText = "About 1 hour";
        } else {
            etaText = `About ${roundedEta} minutes`;
        }

        return { movementText, etaText };
    }

    try {
        const pastRadarTime =
            Date.now() - (radarIntervalMinutes * 60 * 1000);
        const [currentResult, pastResult] = await Promise.allSettled([
            loadRadarPixels(),
            loadRadarPixels(pastRadarTime)
        ]);

        if (currentResult.status !== "fulfilled") {
            throw currentResult.reason;
        }

        const currentAnalysis = analyzeRadarFrame(currentResult.value);
        const pastAnalysis = pastResult.status === "fulfilled"
            ? analyzeRadarFrame(pastResult.value)
            : null;

        if (currentAnalysis.nearbyRegions.length === 0) {
            status.textContent = "No precipitation detected";
            distance.textContent = "None within 50 miles";
            movement.textContent = "No movement to track";
            eta.textContent = "--";
            addStormTimelineItem(
                "RADAR",
                "No precipitation detected within 50 miles."
            );
            return;
        }

        const nearestMiles = currentAnalysis.nearestDistance;
        const displayMiles = Math.max(5, Math.round(nearestMiles / 5) * 5);
        const direction = currentAnalysis.dominantDirection;
        const motion = calculateRadarMotion(currentAnalysis, pastAnalysis);

        status.textContent = "Nearby precipitation detected";

        if (nearestMiles <= 2) {
            distance.textContent = "Over the Quad Cities";
            movement.textContent = "Over the area now";
            eta.textContent = "Already here";
            addStormTimelineItem(
                "RADAR",
                "Precipitation detected over the Quad Cities."
            );
        } else {
            distance.textContent = `About ${displayMiles} mi ${direction}`;
            movement.textContent = motion.movementText;
            eta.textContent = motion.etaText;
            addStormTimelineItem(
                "RADAR",
                `Precipitation detected about ${displayMiles} mi ${direction}.`
            );
        }
    } catch (error) {
        console.error("Unable to analyze MRMS radar image:", error);
        status.textContent = "Radar unavailable";
        distance.textContent = "--";
        movement.textContent = "Not calculated yet";
        eta.textContent = "--";
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

        box.style.borderLeft = "6px solid #e53935";

addStormTimelineItem(
    "ALERT",
    localAlerts[0].properties?.event || "Active NWS weather alert."
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
