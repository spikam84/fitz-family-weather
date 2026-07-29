// Fitz Family Weather HQ - Local NWS alerts and navigation badge
const FITZ_ALERT_COUNTIES = {
  IA: ["Scott", "Muscatine", "Clinton", "Louisa"],
  IL: ["Rock Island", "Henry", "Mercer"]
};
const FITZ_ALERT_CACHE_KEY = "fitzLocalAlerts";
const FITZ_ALERT_CACHE_TIME_KEY = "fitzLocalAlertsTime";

function normalizeAlertArea(area) {
  return area
    .trim()
    .replace(/\s+(County|Parish)$/i, "")
    .split(",")[0]
    .trim();
}

function isLocalFitzAlert(alert) {
  const allowed = FITZ_ALERT_COUNTIES[alert.sourceState] || [];
  return (alert.properties?.areaDesc || "")
    .split(";")
    .map(normalizeAlertArea)
    .some(area => allowed.includes(area));
}

async function fetchLocalFitzAlerts() {
  try {
    const responses = await Promise.all([
      fetch("https://api.weather.gov/alerts/active?area=IA"),
      fetch("https://api.weather.gov/alerts/active?area=IL")
    ]);

    if (responses.some(response => !response.ok)) {
      throw new Error("NWS alert request failed");
    }

    const [iowaData, illinoisData] = await Promise.all(
      responses.map(response => response.json())
    );

    const alerts = [
      ...(iowaData.features || []).map(alert => ({ ...alert, sourceState: "IA" })),
      ...(illinoisData.features || []).map(alert => ({ ...alert, sourceState: "IL" }))
    ].filter(isLocalFitzAlert);

    const uniqueAlerts = [...new Map(
      alerts.map(alert => [
        alert.id || `${alert.properties?.event}-${alert.properties?.areaDesc}`,
        alert
      ])
    ).values()];

    localStorage.setItem(FITZ_ALERT_CACHE_KEY, JSON.stringify(uniqueAlerts));
    localStorage.setItem(FITZ_ALERT_CACHE_TIME_KEY, new Date().toISOString());

    return { alerts: uniqueAlerts, source: "live", updatedAt: new Date() };
  } catch (error) {
    console.error("Unable to load NWS alerts:", error);
    const cached = localStorage.getItem(FITZ_ALERT_CACHE_KEY);
    const cachedTime = localStorage.getItem(FITZ_ALERT_CACHE_TIME_KEY);

    if (cached) {
      return {
        alerts: JSON.parse(cached),
        source: "cache",
        updatedAt: cachedTime ? new Date(cachedTime) : null
      };
    }

    return { alerts: [], source: "unavailable", updatedAt: null };
  }
}

function setAlertBadge(count, unavailable = false) {
  document.querySelectorAll(".alert-badge").forEach(badge => {
    if (unavailable) {
      badge.textContent = "!";
      badge.classList.add("show", "unavailable");
      return;
    }

    badge.classList.remove("unavailable");
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.classList.toggle("show", count > 0);
  });

  document.querySelectorAll('a[href="alerts.html"]').forEach(link => {
    link.setAttribute(
      "aria-label",
      unavailable
        ? "Alerts unavailable"
        : count === 0
          ? "Alerts, none active"
          : `Alerts, ${count} active`
    );
  });
}

function addAlertDetail(parent, label, value) {
  if (!value) return;
  const row = document.createElement("div");
  const labelElement = document.createElement("span");
  const valueElement = document.createElement("strong");
  labelElement.textContent = label;
  valueElement.textContent = value;
  row.append(labelElement, valueElement);
  parent.appendChild(row);
}

function formatAlertTime(value) {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not listed";
  return date.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function renderAlertsPage(result) {
  const status = document.getElementById("alerts-status");
  const summary = document.getElementById("alerts-summary");
  const updated = document.getElementById("alerts-updated");
  const list = document.getElementById("alerts-list");
  if (!status || !summary || !updated || !list) return;

  list.replaceChildren();

  if (result.source === "unavailable") {
    status.textContent = "UNAVAILABLE";
    status.className = "alerts-status unavailable";
    summary.textContent = "The National Weather Service could not be reached.";
    updated.textContent = "No cached alert information is available.";
    return;
  }

  const count = result.alerts.length;
  status.textContent = count ? `${count} ACTIVE` : "ALL CLEAR";
  status.className = count ? "alerts-status active-alerts" : "alerts-status all-clear";
  summary.textContent = count
    ? "Active NWS alerts affecting the Quad Cities area."
    : "No active NWS watches, warnings, or advisories for the local area.";
  updated.textContent = result.updatedAt
    ? `${result.source === "cache" ? "Cached" : "Updated"} ${result.updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "";

  if (!count) {
    const empty = document.createElement("div");
    empty.className = "alerts-empty";
    empty.innerHTML = "<span>✅</span><strong>No active local alerts</strong><p>We’ll keep watching Scott, Muscatine, Clinton, Louisa, Rock Island, Henry, and Mercer counties.</p>";
    list.appendChild(empty);
    return;
  }

  result.alerts.forEach(alert => {
    const details = alert.properties || {};
    const card = document.createElement("article");
    card.className = `alert-card severity-${(details.severity || "unknown").toLowerCase()}`;

    const header = document.createElement("header");
    const icon = document.createElement("span");
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    const headline = document.createElement("p");
    icon.className = "alert-card-icon";
    icon.textContent = details.severity === "Extreme" || details.severity === "Severe" ? "🚨" : "⚠️";
    title.textContent = details.event || "Weather Alert";
    headline.textContent = details.headline || "National Weather Service alert";
    heading.append(title, headline);
    header.append(icon, heading);

    const facts = document.createElement("div");
    facts.className = "alert-facts";
    addAlertDetail(facts, "Area", details.areaDesc || "Quad Cities region");
    addAlertDetail(facts, "Severity", details.severity || "Not listed");
    addAlertDetail(facts, "Urgency", details.urgency || "Not listed");
    addAlertDetail(facts, "Expires", formatAlertTime(details.expires || details.ends));

    const description = document.createElement("p");
    description.className = "alert-description";
    description.textContent = details.description || "See the National Weather Service for details.";

    card.append(header, facts, description);

    if (details.instruction) {
      const instruction = document.createElement("div");
      instruction.className = "alert-instruction";
      const instructionTitle = document.createElement("strong");
      const instructionText = document.createElement("p");
      instructionTitle.textContent = "What to do";
      instructionText.textContent = details.instruction;
      instruction.append(instructionTitle, instructionText);
      card.appendChild(instruction);
    }

    list.appendChild(card);
  });
}

async function updateFitzAlerts() {
  const result = await fetchLocalFitzAlerts();
  setAlertBadge(result.alerts.length, result.source === "unavailable");
  renderAlertsPage(result);
  return result;
}

updateFitzAlerts();

const alertsRefreshButton = document.querySelector(".alerts-refresh");
if (alertsRefreshButton) {
  alertsRefreshButton.addEventListener("click", async () => {
    alertsRefreshButton.classList.add("spinning");
    await updateFitzAlerts();
    alertsRefreshButton.classList.remove("spinning");
  });
}
