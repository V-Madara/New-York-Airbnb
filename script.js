// =====================================================================
// Config
// =====================================================================

// Same-origin by default (FastAPI serves the UI + /predict together).
// Override via the footer input; remembered in localStorage.
const DEFAULT_API_URL = "https://new-york-airbnb.onrender.com";

// Fallback labels if the API response omits `classes`.
// Model classes (alphabetical): Entire home/apt, Private room, Shared room.
const CLASS_LABELS = ["Entire home/apt", "Private room", "Shared room"];

// Representative NYC neighbourhoods per borough, for the datalist.
const NEIGHBOURHOODS = {
  "Manhattan": ["Harlem", "East Village", "Upper West Side", "Hell's Kitchen", "Chelsea", "Midtown", "Financial District", "Washington Heights"],
  "Brooklyn": ["Williamsburg", "Bedford-Stuyvesant", "Bushwick", "Park Slope", "Crown Heights", "Greenpoint", "Sunset Park", "Flatbush"],
  "Queens": ["Astoria", "Long Island City", "Flushing", "Ridgewood", "Jamaica", "Sunnyside", "Elmhurst"],
  "Bronx": ["Mott Haven", "Fordham", "Riverdale", "Concourse", "Kingsbridge"],
  "Staten Island": ["St. George", "Tompkinsville", "Stapleton", "New Brighton"]
};

// A plausible sample listing, used by "Fill sample listing".
const SAMPLE = {
  latitude: 40.7306,
  longitude: -73.9352,
  neighbourhood_group: "Brooklyn",
  neighbourhood: "Williamsburg",
  price: 145,
  minimum_nights: 2,
  number_of_reviews: 38,
  reviews_per_month: 1.7,
  calculated_host_listings_count: 1,
  availability_365: 210
};

// =====================================================================
// Building illustration — geometry + selection logic
// =====================================================================

// Must match the x/y/width/height of the .b-window rects in index.html.
const WINDOW_RECTS = [
  { x: 55,  y: 75  }, { x: 100, y: 75  }, { x: 145, y: 75  },
  { x: 55,  y: 110 }, { x: 100, y: 110 }, { x: 145, y: 110 },
  { x: 55,  y: 145 }, { x: 100, y: 145 }, { x: 145, y: 145 },
  { x: 55,  y: 180 }, { x: 100, y: 180 }, { x: 145, y: 180 }
];
const WIN_W = 30, WIN_H = 25;

const DOOR_BOX = { x: 100, y: 205, w: 40, h: 35 };
const WHOLE_BUILDING_BOX = { x: 36, y: 11, w: 168, h: 233 };

// Horizontally-adjacent window pairs, for the "shared room" case.
const ADJACENT_PAIRS = [[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[9,10],[10,11]];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function boxAroundWindows(indices) {
  const pad = 4;
  const xs = indices.map(i => WINDOW_RECTS[i].x);
  const ys = indices.map(i => WINDOW_RECTS[i].y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  const right = Math.max(...xs) + WIN_W + pad;
  const bottom = Math.max(...ys) + WIN_H + pad;
  return { x, y, w: right - x, h: bottom - y };
}

// Decides which part of the building represents the predicted room type.
// "private"/"shared" pick a window (or pair) seeded by the neighbourhood
// name, purely so repeat predictions for the same listing feel consistent
// rather than random on every click.
function pickSelection(label, seed) {
  const l = (label || "").toLowerCase();
  const h = hashString(seed || "listing");

  if (l.includes("entire")) {
    return { box: WHOLE_BUILDING_BOX, windows: WINDOW_RECTS.map((_, i) => i), door: true, sign: false };
  }
  if (l.includes("hotel")) {
    return { box: DOOR_BOX, windows: [], door: true, sign: true };
  }
  if (l.includes("shared")) {
    const pair = ADJACENT_PAIRS[h % ADJACENT_PAIRS.length];
    return { box: boxAroundWindows(pair), windows: pair, door: false, sign: false };
  }
  // "private" or anything unrecognized: a single window.
  const idx = h % WINDOW_RECTS.length;
  return { box: boxAroundWindows([idx]), windows: [idx], door: false, sign: false };
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function resetBuilding() {
  document.querySelectorAll(".b-window").forEach(w => w.classList.remove("lit", "flicker"));
  document.getElementById("b-door").classList.remove("lit");
  document.getElementById("b-sign").classList.remove("lit");
  const sel = document.getElementById("b-selection");
  sel.classList.remove("show");
  sel.setAttribute("width", "0");
  sel.setAttribute("height", "0");
}

function applySelection(sel) {
  const windowEls = document.querySelectorAll(".b-window");
  sel.windows.forEach(i => windowEls[i] && windowEls[i].classList.add("lit"));
  document.getElementById("b-door").classList.toggle("lit", sel.door);
  document.getElementById("b-sign").classList.toggle("lit", sel.sign);

  const box = document.getElementById("b-selection");
  box.setAttribute("x", sel.box.x);
  box.setAttribute("y", sel.box.y);
  box.setAttribute("width", sel.box.w);
  box.setAttribute("height", sel.box.h);
  requestAnimationFrame(() => box.classList.add("show"));
}

// A quick "scanning" flicker across a few random windows before the real
// selection lands — skipped entirely if the visitor prefers reduced motion.
function animateBuildingSelection(label, seed) {
  resetBuilding();
  const sel = pickSelection(label, seed);

  if (prefersReducedMotion()) {
    applySelection(sel);
    return;
  }

  const windowEls = Array.from(document.querySelectorAll(".b-window"));
  const scanCount = 4;
  const shuffled = [...windowEls].sort(() => Math.random() - 0.5).slice(0, scanCount);

  shuffled.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add("flicker");
      setTimeout(() => el.classList.remove("flicker"), 300);
    }, i * 110);
  });

  setTimeout(() => applySelection(sel), scanCount * 110 + 150);
}

// =====================================================================
// Elements
// =====================================================================
const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const sampleBtn = document.getElementById("sample-btn");
const boroughSelect = document.getElementById("neighbourhood_group");
const neighbourhoodInput = document.getElementById("neighbourhood");
const neighbourhoodList = document.getElementById("neighbourhood-list");
const apiUrlInput = document.getElementById("api-url");

const stateIdle = document.getElementById("state-idle");
const stateError = document.getElementById("state-error");
const stateResult = document.getElementById("state-result");
const errorDetail = document.getElementById("error-detail");
const resultType = document.getElementById("result-type");
const resultConfidence = document.getElementById("result-confidence");
const barsContainer = document.getElementById("bars");

// =====================================================================
// API url persistence
// =====================================================================
function loadApiUrl() {
  try {
    const stored = localStorage.getItem("predictApiUrl");
    // Ignore stale local-dev URLs from earlier versions of this UI.
    if (stored && /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/predict\/?$/i.test(stored.trim())) {
      return DEFAULT_API_URL;
    }
    return stored || DEFAULT_API_URL;
  } catch (e) {
    return DEFAULT_API_URL;
  }
}
apiUrlInput.value = loadApiUrl();
apiUrlInput.addEventListener("change", () => {
  try { localStorage.setItem("predictApiUrl", apiUrlInput.value.trim()); } catch (e) {}
});

// =====================================================================
// Borough -> neighbourhood datalist
// =====================================================================
boroughSelect.addEventListener("change", () => {
  const list = NEIGHBOURHOODS[boroughSelect.value] || [];
  neighbourhoodList.innerHTML = list.map(n => `<option value="${n}"></option>`).join("");
  neighbourhoodInput.value = "";
  neighbourhoodInput.placeholder = list.length ? `e.g. ${list[0]}` : "e.g. Williamsburg";
});

// =====================================================================
// Sample fill
// =====================================================================
sampleBtn.addEventListener("click", () => {
  document.getElementById("latitude").value = SAMPLE.latitude;
  document.getElementById("longitude").value = SAMPLE.longitude;
  boroughSelect.value = SAMPLE.neighbourhood_group;
  boroughSelect.dispatchEvent(new Event("change"));
  neighbourhoodInput.value = SAMPLE.neighbourhood;
  document.getElementById("price").value = SAMPLE.price;
  document.getElementById("minimum_nights").value = SAMPLE.minimum_nights;
  document.getElementById("number_of_reviews").value = SAMPLE.number_of_reviews;
  document.getElementById("reviews_per_month").value = SAMPLE.reviews_per_month;
  document.getElementById("calculated_host_listings_count").value = SAMPLE.calculated_host_listings_count;
  document.getElementById("availability_365").value = SAMPLE.availability_365;
});

// =====================================================================
// State switching
// =====================================================================
function showState(state) {
  stateIdle.hidden = state !== "idle";
  stateError.hidden = state !== "error";
  stateResult.hidden = state !== "result";
}

// =====================================================================
// Submit
// =====================================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!form.reportValidity()) return;

  const payload = {
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    price: parseFloat(document.getElementById("price").value),
    minimum_nights: parseInt(document.getElementById("minimum_nights").value, 10),
    number_of_reviews: parseInt(document.getElementById("number_of_reviews").value, 10),
    reviews_per_month: parseFloat(document.getElementById("reviews_per_month").value),
    calculated_host_listings_count: parseInt(document.getElementById("calculated_host_listings_count").value, 10),
    availability_365: parseInt(document.getElementById("availability_365").value, 10),
    neighbourhood_group: boroughSelect.value,
    neighbourhood: neighbourhoodInput.value.trim()
  };

  const apiUrl = (apiUrlInput.value || DEFAULT_API_URL).trim();

  setLoading(true);
  resetBuilding();

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let detail = `The server responded with ${res.status}.`;
      try {
        const body = await res.json();
        if (body && body.detail) {
          detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch (_) {}
      throw new Error(detail);
    }

    const data = await res.json();
    renderResult(data, payload.neighbourhood);

  } catch (err) {
    errorDetail.textContent = err.message && err.message !== "Failed to fetch"
      ? err.message
      : `Couldn't reach ${apiUrl}. Is the server running?`;
    showState("error");
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.classList.toggle("loading", isLoading);
  submitBtn.disabled = isLoading;
}

// =====================================================================
// Render result
// =====================================================================
function renderResult(data, seed) {
  const predicted = data.Predicted_room_type ?? data.predicted_room_type ?? "Unknown";
  const probs = Array.isArray(data.Probability ?? data.probability)
    ? (data.Probability ?? data.probability)
    : [];
  const apiClasses = Array.isArray(data.classes) ? data.classes : null;

  animateBuildingSelection(predicted, seed);

  resultType.textContent = predicted;

  // Prefer class names from the API; fall back to known labels / generic names.
  const labels = apiClasses && apiClasses.length === probs.length
    ? apiClasses
    : (probs.length === CLASS_LABELS.length
        ? CLASS_LABELS
        : probs.map((_, i) => `Class ${i + 1}`));

  const rows = labels.map((label, i) => ({ label, value: probs[i] ?? 0 }))
                      .sort((a, b) => b.value - a.value);

  const topValue = rows.length ? rows[0].value : 0;
  resultConfidence.textContent = rows.length
    ? `${Math.round(topValue * 100)}% confidence`
    : "";

  barsContainer.innerHTML = rows.map((row, i) => `
    <div class="bar-row ${i === 0 ? "is-top" : ""}">
      <div class="bar-label"><span>${row.label}</span><strong>${Math.round(row.value * 100)}%</strong></div>
      <div class="bar-track"><div class="bar-fill" data-width="${row.value * 100}"></div></div>
    </div>
  `).join("");

  showState("result");

  // Animate bars in on the next frame so the CSS transition actually runs.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barsContainer.querySelectorAll(".bar-fill").forEach(el => {
        el.style.width = el.dataset.width + "%";
      });
    });
  });
}
