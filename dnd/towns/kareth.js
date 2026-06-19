import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/** Bump this if you ever want to confirm you’re seeing the newest JS in console */
const APP_VERSION = "2026-05-21-kareth-town-sheet-v2";
console.log("ANG Kareth Town Sheet JS:", APP_VERSION);

// Supabase creds
const SUPABASE_URL = "https://dumirslpqthoageqbgrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCrE4pwKX_CAb5M0JGTf3g_a2wUhCPg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * URL style:
 *   /dnd/towns/kareth.html?kareth
 * Optional cache-bust allowed:
 *   /dnd/towns/kareth.html?kareth&v=10
 */
function getSlugFromUrl() {
  const q = window.location.search;
  if (!q || q === "?") return "";
  const raw = q.slice(1);
  const first = raw.split("&")[0];
  return decodeURIComponent(first).trim();
}

const slug = getSlugFromUrl();

const $ = (id) => document.getElementById(id);

const els = {
  townKeyLabel: $("townKeyLabel"),
  saveBtn: $("saveBtn"),
  saveStatus: $("saveStatus"),
  lastSaved: $("lastSaved"),
};

const fieldEls = Array.from(document.querySelectorAll("[data-field]"));
const buildingEls = Array.from(document.querySelectorAll("[data-building]"));

let isReady = false;
let autosaveTimer = null;
let isSaving = false;
let pendingSave = false;

const AUTOSAVE_DELAY_MS = 300000;

const DEFAULT_TOWN = {
  name: "Kareth",
  steward: "Selene Vaelor",
  turn: 1,
  authority: "Party Stewardship",
  status: "Saved, Damaged, Rebuilding",
  identity: "Undecided",

  population: {
    citizens: 430,
    children: 85,
    workers: 115,
    militia: 18,
    specialists: 7,
    wounded: 35,
    refugees: 0,
    growthTimer: 0,
  },

  town_stats: {
    loyalty: 4,
    stability: 3,
    security: 1,
    prosperity: 1,
    hope: 4,
  },

  resources: {
    platinum: 350,
    wood: 80,
    stone: 40,
    ore: 25,
    food: 120,
    medicine: 35,
    influence: 4,
    labor: 115,
  },

  threats: {
    templeAttention: 2,
    foodShortage: 1,
    raiderPressure: 1,
    publicFear: 0,
    markedDoorMystery: 2,
    seleneConflict: 0,
  },

  buildings: {
    townhall: 1,
    storehouses: 1,
    smith: 0,
    docks: 1,
    roads: 1,
    windmill: 0,
    healersHouse: 1,
    guardBarracks: 0,
    housingDistrict: 1,
    partyCommandHouse: 0,
  },

  text: {
    townhallStatus: "Command Table: unlocks town policies.",
    townhallNext: "Records Office: +1 Stability, better taxes and reports.",

    storehousesStatus: "Salvage Depot: basic storage for food, wood, and stone.",
    storehousesNext: "Guarded Stores: reduce theft and supply loss events.",

    smithStatus: "Wild Forge: unsafe and not fully usable.",
    smithNext: "Working Forge: basic tools, repairs, and rebuilding support.",

    docksStatus: "Safe Moorings: fishing and local boats resume.",
    docksNext: "Cargo Pier: generates Food and Platinum.",

    roadsStatus: "Cleared Paths: normal movement restored.",
    roadsNext: "Cart Roads: projects cost less Labor.",

    windmillStatus: "Razed Mill: no grain processing.",
    windmillNext: "Temporary Millstone: small Food income.",

    healersHouseStatus: "Healer’s Room: wounded recover each turn.",
    healersHouseNext: "Clinic: better recovery and efficient Medicine use.",

    guardBarracksStatus: "No Barracks: militia disorganized.",
    guardBarracksNext: "Watch Post: unlocks patrols.",

    housingDistrictStatus: "Emergency Shelter: prevents homelessness crisis.",
    housingDistrictNext: "Repaired Homes: supports current population.",

    partyCommandHouseStatus: "Claimed Ruin: symbolic only.",
    partyCommandHouseNext: "Restored House: safe rest in Kareth.",

    activeProjects: "Repair the Smith\nSecure the Storehouses\nClear Main Roads",

    policies: "Labor Policy: Paid Labor First\nRation Policy: Normal Rations\nSecurity Policy: Volunteer Watch\nRefugee Policy: Limited Shelter",

    councilLog: "Turn 1:\n- Party accepted stewardship.\n- Selene appointed acting steward.\n- Kareth began rebuilding.\n- Marked doors remain unexplained.",

    notes: "Kareth is saved, but still vulnerable. Morale is high after the party’s perfect rescue, but security and infrastructure are weak. The city needs priorities before the party leaves: defense, food, roads, labor, and investigation into the marked doors.",
  },
};

const FIELD_PATHS = {
  // top
  name: ["name"],
  steward: ["steward"],
  turn: ["turn"],
  authority: ["authority"],
  status: ["status"],
  identity: ["identity"],

  // population
  citizens: ["population", "citizens"],
  children: ["population", "children"],
  workers: ["population", "workers"],
  militia: ["population", "militia"],
  specialists: ["population", "specialists"],
  wounded: ["population", "wounded"],
  refugees: ["population", "refugees"],
  growthTimer: ["population", "growthTimer"],

  // town stats
  loyalty: ["town_stats", "loyalty"],
  stability: ["town_stats", "stability"],
  security: ["town_stats", "security"],
  prosperity: ["town_stats", "prosperity"],
  hope: ["town_stats", "hope"],

  // resources
  platinum: ["resources", "platinum"],
  wood: ["resources", "wood"],
  stone: ["resources", "stone"],
  ore: ["resources", "ore"],
  food: ["resources", "food"],
  medicine: ["resources", "medicine"],
  influence: ["resources", "influence"],
  labor: ["resources", "labor"],

  // threats
  templeAttention: ["threats", "templeAttention"],
  foodShortage: ["threats", "foodShortage"],
  raiderPressure: ["threats", "raiderPressure"],
  publicFear: ["threats", "publicFear"],
  markedDoorMystery: ["threats", "markedDoorMystery"],
  seleneConflict: ["threats", "seleneConflict"],

  // building text
  townhallStatus: ["text", "townhallStatus"],
  townhallNext: ["text", "townhallNext"],
  storehousesStatus: ["text", "storehousesStatus"],
  storehousesNext: ["text", "storehousesNext"],
  smithStatus: ["text", "smithStatus"],
  smithNext: ["text", "smithNext"],
  docksStatus: ["text", "docksStatus"],
  docksNext: ["text", "docksNext"],
  roadsStatus: ["text", "roadsStatus"],
  roadsNext: ["text", "roadsNext"],
  windmillStatus: ["text", "windmillStatus"],
  windmillNext: ["text", "windmillNext"],
  healersHouseStatus: ["text", "healersHouseStatus"],
  healersHouseNext: ["text", "healersHouseNext"],
  guardBarracksStatus: ["text", "guardBarracksStatus"],
  guardBarracksNext: ["text", "guardBarracksNext"],
  housingDistrictStatus: ["text", "housingDistrictStatus"],
  housingDistrictNext: ["text", "housingDistrictNext"],
  partyCommandHouseStatus: ["text", "partyCommandHouseStatus"],
  partyCommandHouseNext: ["text", "partyCommandHouseNext"],

  // misc text
  activeProjects: ["text", "activeProjects"],
  policies: ["text", "policies"],
  councilLog: ["text", "councilLog"],
  notes: ["text", "notes"],
};

function setStatus(msg) {
  els.saveStatus.textContent = msg;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function renderLastSaved(iso) {
  if (!iso) {
    els.lastSaved.textContent = "—";
    return;
  }

  const d = new Date(iso);
  els.lastSaved.textContent = d.toLocaleString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  const result = deepClone(base);

  if (!isPlainObject(override)) return result;

  for (const key of Object.keys(override)) {
    if (isPlainObject(override[key]) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }

  return result;
}

function getPath(obj, path, fallback = "") {
  let current = obj;

  for (const part of path) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return fallback;
    }

    current = current[part];
  }

  return current ?? fallback;
}

function setPath(obj, path, value) {
  let current = obj;

  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];

    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }

    current = current[part];
  }

  current[path[path.length - 1]] = value;
}

function readElementValue(el) {
  if (el.type === "number") {
    return safeNum(el.value, 0);
  }

  if (el.type === "checkbox") {
    return !!el.checked;
  }

  return el.value ?? "";
}

function writeElementValue(el, value) {
  if (el.type === "checkbox") {
    el.checked = !!value;
    return;
  }

  el.value = value ?? "";
}

function applyTownToUI(town) {
  fieldEls.forEach((el) => {
    const key = el.dataset.field;
    const path = FIELD_PATHS[key];

    if (!path) return;

    writeElementValue(el, getPath(town, path, ""));
  });

  buildingEls.forEach((el) => {
    const key = el.dataset.building;

    writeElementValue(el, getPath(town, ["buildings", key], 0));
  });
}

function readTownFromUI() {
  const town = deepClone(DEFAULT_TOWN);

  fieldEls.forEach((el) => {
    const key = el.dataset.field;
    const path = FIELD_PATHS[key];

    if (!path) return;

    setPath(town, path, readElementValue(el));
  });

  buildingEls.forEach((el) => {
    const key = el.dataset.building;

    setPath(town, ["buildings", key], safeNum(el.value, 0));
  });

  return town;
}

function wireAutosave() {
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", scheduleAutosave);
    el.addEventListener("change", scheduleAutosave);
  });
}

function scheduleAutosave() {
  if (!isReady) return;

  setStatus("Unsaved…");

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(async () => {
    if (isSaving) {
      pendingSave = true;
      return;
    }

    isSaving = true;

    try {
      await saveTown();
    } finally {
      isSaving = false;
    }

    if (pendingSave) {
      pendingSave = false;
      scheduleAutosave();
    }
  }, AUTOSAVE_DELAY_MS);
}

async function loadTown() {
  if (!slug) {
    els.townKeyLabel.textContent = "missing";
    setStatus("No town specified. Use: kareth.html?kareth");
    return;
  }

  els.townKeyLabel.textContent = slug;
  setStatus("Loading…");

  const { data, error } = await supabase
    .from("towns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Load error:", error);
    applyTownToUI(DEFAULT_TOWN);
    renderLastSaved(null);
    setStatus("Load failed. Check console.");
    els.saveBtn.disabled = false;
    isReady = true;
    wireAutosave();
    return;
  }

  if (!data) {
    console.warn("No town row found. Loading defaults. Saving will create it.");
    applyTownToUI(DEFAULT_TOWN);
    renderLastSaved(null);
    setStatus("New town loaded. Save to create DB row.");
    els.saveBtn.disabled = false;
    isReady = true;
    wireAutosave();
    return;
  }

  const town = deepMerge(DEFAULT_TOWN, data.data_json || {});

  applyTownToUI(town);
  renderLastSaved(data.updated_at);

  els.saveBtn.disabled = false;
  isReady = true;
  wireAutosave();

  setStatus("Ready.");
}

async function saveTown() {
  if (!isReady) return;

  if (!slug) {
    setStatus("No town key. Cannot save.");
    return;
  }

  setStatus("Saving…");

  const payload = readTownFromUI();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("towns")
    .upsert(
      {
        slug,
        data_json: payload,
        updated_at: nowIso,
      },
      {
        onConflict: "slug",
      }
    );

  if (error) {
    console.error("Save error:", error);
    setStatus("Save failed. Check console.");
    return;
  }

  renderLastSaved(nowIso);
  setStatus("Saved ✔");
}

els.saveBtn.addEventListener("click", async () => {
  pendingSave = false;

  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  await saveTown();
});

loadTown();
