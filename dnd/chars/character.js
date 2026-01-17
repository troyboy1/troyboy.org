import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// TODO: paste these from Supabase -> Project Settings -> API
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// URL style: /chars/character.html?troy
const slug = window.location.search.slice(1).trim();

const $ = (id) => document.getElementById(id);

const els = {
  pageTitle: $("pageTitle"),
  slugLine: $("slugLine"),
  saveBtn: $("saveBtn"),
  status: $("status"),
  lastSaved: $("lastSaved"),

  name: $("name"),
  klass: $("class"),
  level: $("level"),
  player: $("player"),
  mainStat: $("main_stat"),
  speed: $("speed"),
  ac: $("ac"),
  passive: $("passive"),

  hpCurrent: $("hp_current"),
  hpMax: $("hp_max"),
  hpTemp: $("hp_temp"),

  statsJson: $("stats_json"),
  inventory: $("inventory"),
  notes: $("notes"),
};

let rowId = null;
let isReady = false;

function setStatus(msg) {
  els.status.textContent = msg;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseStatsJson(text) {
  const t = (text || "").trim();
  if (!t) return {};
  try {
    const obj = JSON.parse(t);
    return (obj && typeof obj === "object") ? obj : {};
  } catch {
    return null; // signal invalid
  }
}

function renderLastSaved(iso) {
  if (!iso) { els.lastSaved.textContent = "—"; return; }
  try {
    const d = new Date(iso);
    els.lastSaved.textContent = d.toLocaleString();
  } catch {
    els.lastSaved.textContent = iso;
  }
}

function setFormFromData(c) {
  els.name.value = c.name ?? "";
  els.klass.value = c.class ?? "";
  els.level.value = c.level ?? 1;
  els.player.value = c.player ?? "";
  els.mainStat.value = c.main_stat ?? "";
  els.speed.value = c.speed ?? 30;
  els.ac.value = c.ac ?? 10;
  els.passive.value = c.passive_perception ?? 10;

  els.hpCurrent.value = c.hp?.current ?? 0;
  els.hpMax.value = c.hp?.max ?? 0;
  els.hpTemp.value = c.hp?.temp ?? 0;

  els.statsJson.value = JSON.stringify(c.stats ?? {}, null, 2);

  els.inventory.value = Array.isArray(c.inventory) ? c.inventory.join("\n") : "";
  els.notes.value = c.notes ?? "";

  els.pageTitle.textContent = c.name ? `Character Sheet — ${c.name}` : "Character Sheet";
}

function getDataFromForm() {
  const stats = parseStatsJson(els.statsJson.value);
  if (stats === null) {
    throw new Error("Ability Scores JSON is invalid (fix it or clear it).");
  }

  return {
    name: els.name.value.trim(),
    class: els.klass.value.trim(),
    level: safeNum(els.level.value, 1),
    player: els.player.value.trim(),
    main_stat: els.mainStat.value || "",
    speed: safeNum(els.speed.value, 30),
    ac: safeNum(els.ac.value, 10),
    passive_perception: safeNum(els.passive.value, 10),
    hp: {
      current: safeNum(els.hpCurrent.value, 0),
      max: safeNum(els.hpMax.value, 0),
      temp: safeNum(els.hpTemp.value, 0),
    },
    stats,
    inventory: (els.inventory.value || "")
      .split("\n").map(s => s.trim()).filter(Boolean),
    notes: els.notes.value ?? "",
  };
}

async function loadCharacter() {
  if (!slug) {
    els.pageTitle.textContent = "Character Sheet";
    els.slugLine.innerHTML = `<span class="warn">Missing character key.</span> Try: <span class="mono">character.html?troy</span>`;
    setStatus("No character specified.");
    return;
  }

  els.slugLine.textContent = `Character key: ${slug}`;

  setStatus("Loading…");

  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
