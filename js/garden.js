// Fitz Garden Center: vegetable garden and lawn weather guidance
const GARDEN_LAT = 41.5245;
const GARDEN_LON = -90.5157;
const STORMS = [95, 96, 99];

const $ = id => document.getElementById(id);
const put = (id, value) => { if ($(id)) $(id).textContent = value; };
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const sum = values => (values || []).reduce((total, value) => total + number(value), 0);
const max = values => values?.length ? Math.max(...values.map(value => number(value))) : 0;

function answer(id, value) {
  put(id, value);
  const element = $(id);
  if (!element) return;
  element.classList.remove("good", "watch", "poor");
  element.classList.add(/wait|hold|wet|poor|high/i.test(value) ? "poor" : /fair|spot|optional|moderate|check/i.test(value) ? "watch" : "good");
}

function bestWindow(hourly, start) {
  const candidates = hourly.time.map((time, index) => ({ time: new Date(time), index }))
    .filter(item => item.time >= start && item.time < new Date(start.getTime() + 24 * 3600000))
    .filter(item => item.time.getHours() >= 6 && item.time.getHours() <= 21)
    .map(item => {
      const rain = number(hourly.precipitation_probability[item.index]);
      const temp = number(hourly.apparent_temperature[item.index]);
      const wind = number(hourly.wind_speed_10m[item.index]);
      const uv = number(hourly.uv_index[item.index]);
      const storm = STORMS.includes(number(hourly.weather_code[item.index]));
      return { ...item, score: 100 - rain * .55 - Math.max(0,temp-82)*3 - Math.max(0,wind-12)*2 - Math.max(0,uv-6)*3 - (storm ? 60 : 0) };
    }).sort((a,b) => b.score-a.score);
  if (!candidates.length) return "No clear window";
  const startTime = candidates[0].time;
  const endTime = new Date(startTime.getTime() + 3 * 3600000);
  const format = date => date.toLocaleTimeString([], { hour: "numeric" });
  return `${format(startTime)}–${format(endTime)}`;
}

function renderDays(daily) {
  $("garden-forecast").innerHTML = daily.time.slice(0,4).map((day,index) => {
    const rain = number(daily.precipitation_probability_max[index]);
    const amount = number(daily.precipitation_sum[index]);
    const high = Math.round(number(daily.temperature_2m_max[index]));
    const code = number(daily.weather_code[index]);
    const garden = STORMS.includes(code) || rain >= 70 ? "Wait" : high >= 94 ? "Morning" : rain >= 40 ? "Fair" : "Good";
    const lawn = STORMS.includes(code) || amount >= .2 ? "Wait" : high >= 94 ? "Evening" : "Good";
    const label = index === 0 ? "Today" : new Date(day+"T12:00").toLocaleDateString([], { weekday: "short" });
    return `<div class="garden-day"><strong>${label}</strong><span>${high}° · ${rain}% rain</span><small>Vegetables</small><b>${garden}</b><small>Lawn</small><b>${lawn}</b><p>${rain >= 65 ? "Let rain water" : "Mow or garden"}</p></div>`;
  }).join("");
}

async function updateGarden() {
  const button = document.querySelector(".refresh-button");
  button?.classList.add("spinning");
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${GARDEN_LAT}&longitude=${GARDEN_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability,precipitation,uv_index,soil_temperature_0cm,soil_moisture_0_to_1cm&past_days=1&forecast_days=5&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=America%2FChicago`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
    const data = await response.json();
    const now = new Date(data.current.time);
    const indexes = data.hourly.time.map((time,index) => ({time:new Date(time),index}));
    const past = indexes.filter(x => x.time >= new Date(now-86400000) && x.time < now).map(x => x.index);
    const future = indexes.filter(x => x.time >= now && x.time < new Date(now.getTime()+86400000)).map(x => x.index);
    const currentIndex = indexes.find(x => x.time >= now)?.index || 0;
    const pick = (field,list) => list.map(index => data.hourly[field][index]);
    const temp = number(data.current.temperature_2m);
    const feels = number(data.current.apparent_temperature);
    const humidity = number(data.current.relative_humidity_2m);
    const wind = number(data.current.wind_speed_10m);
    const code = number(data.current.weather_code);
    const rainPast = sum(pick("precipitation",past));
    const rainNext = sum(pick("precipitation",future));
    const rainChance = max(pick("precipitation_probability",future));
    const soilTemp = number(data.hourly.soil_temperature_0cm[currentIndex],NaN);
    const soilValue = number(data.hourly.soil_moisture_0_to_1cm[currentIndex],NaN);
    const uv = max(pick("uv_index",future));
    const window = bestWindow(data.hourly,now);
    const storm = STORMS.includes(code);
    const ground = rainPast >= .5 || soilValue >= .36 ? "Muddy" : rainPast >= .15 || soilValue >= .27 ? "Damp" : rainPast < .03 && soilValue < .16 ? "Dry" : "Workable";
    const soil = soilValue >= .36 ? "Wet" : soilValue >= .25 ? "Moist" : soilValue >= .16 ? "Moderate" : "Dry";

    let score = 100 - (storm ? 55 : rainChance >= 55 ? 25 : 0) - (feels >= 100 ? 45 : feels >= 92 ? 28 : feels >= 85 ? 12 : 0) - (wind >= 25 ? 30 : wind >= 18 ? 15 : 0);
    const rating = getRating(Math.max(0,Math.round(score)));
    let water = rainNext >= .2 || rainChance >= 65 || rainPast >= .25 ? "HOLD OFF" : soilValue < .15 || feels >= 90 ? "WATER" : soilValue < .22 ? "SPOT WATER" : "CHECK SOIL";
    let mow = storm || rainChance >= 75 ? "WAIT" : ground === "Muddy" || rainPast >= .25 ? "TOO WET" : feels >= 95 ? "WAIT FOR EVENING" : "GOOD";
    let plant = storm || ground === "Muddy" || wind >= 25 ? "WAIT" : feels >= 92 || rainChance >= 60 || ground === "Dry" ? "FAIR" : "GOOD";

    put("garden-rating",rating.word.toUpperCase()); put("garden-stars",rating.stars);
    put("garden-summary",mow === "GOOD" ? "Good opportunity for vegetable garden work and lawn care." : water === "HOLD OFF" ? "Let the weather help today; focus on lighter jobs." : "Some jobs need a better weather window.");
    put("garden-window",`Best work time: ${window}`); put("garden-temp",`${Math.round(temp)}°F`);
    put("garden-humidity",`${Math.round(humidity)}%`); put("garden-wind",`${Math.round(wind)} mph`); put("garden-rain",`${Math.round(rainChance)}%`);
    put("garden-updated",`Updated ${new Date().toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}`);
    answer("water-answer",water); put("water-detail",water === "HOLD OFF" ? "Recent or expected rain should provide moisture." : "Check the soil a few inches down first.");
    answer("mow-answer",mow); put("mow-detail",mow === "GOOD" ? `Best opportunity: ${window}.` : "Wetness, heat, or rain limits mowing.");
    answer("plant-answer",plant); put("plant-detail",plant === "GOOD" ? "Soil and weather look suitable." : "Use care with wet soil, heat, or wind.");
    answer("work-answer",rating.word.toUpperCase()); put("work-detail",`${window} is the best estimated window.`);
    put("ground",ground); put("soil-temp",Number.isFinite(soilTemp)?`${Math.round(soilTemp)}°F`:"Unavailable");
    put("plant-stress",feels>=95||wind>=25||uv>=9?"High":feels>=86||wind>=16||uv>=7?"Moderate":"Low");
    put("disease",humidity>=80&&(rainPast>=.1||rainNext>=.1)?"High":humidity>=65?"Moderate":"Low");
    put("pollinators",storm||rainChance>=70||wind>=20?"Low":temp>=65&&temp<=88&&wind<12?"High":"Moderate");
    put("grass",ground==="Muddy"?"Wet":ground==="Damp"?"Damp":"Dry"); put("mow-window",window);
    put("lawn-water",water==="WATER"?"Water":water==="SPOT WATER"?"Optional":"Hold Off");
    put("lawn-stress",feels>=95&&rainPast<.1?"High":feels>=86||ground==="Dry"?"Moderate":"Low");
    put("treatment",storm||rainChance>=55||wind>=15?"Wait":"Good");
    put("rain-past",`${rainPast.toFixed(2)} in`); put("rain-next",`${rainNext.toFixed(2)} in`);
    put("soil-moisture",soil); put("drying",wind>=15||feels>=88?"Fast":humidity>=75?"Slow":"Moderate");
    renderDays(data.daily);
  } catch (error) {
    console.error(error);
    put("garden-summary","Garden weather is unavailable right now.");
  } finally {
    setTimeout(() => button?.classList.remove("spinning"),700);
  }
}

document.querySelector(".refresh-button")?.addEventListener("click",updateGarden);
updateGarden();
