import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/** Bump this if you ever want to confirm you’re seeing the newest JS in console */
const APP_VERSION = "2026-01-17-autosave-v1";
console.log("ANG Character Sheet JS:", APP_VERSION);

// Supabase creds (publishable/anon is fine for frontend)
const SUPABASE_URL = "https://dumirslpqthoageqbgrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hCrE4pwKX_CAb5M0JGTf3g_a2wUhCPg";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * URL style:
 *   /dnd/chars/character.html?troy
 * Optional cache-bust allowed:
 *   /dnd/chars/character.html?troy&v=3
 */
function getSlugFromUrl() {
  const q = window.location.search;
  if (!q || q === "?") return "";
  const raw = q.slice(1);              // remove "?"
  const first = raw.split("&")[0];     // take "troy" from "troy&v=3"
  return decodeURIComponent(first).trim();
}
const slug = getSlugFromUrl();

const $ = (id) => document.getElementById(id);

const els = {
  sheetTitle: $("sheetTitle"),
  slugLine: $("slugLine"),
  saveBtn: $("saveBtn"),
  status: $("status"),
  lastSaved: $("lastSaved"),

  name: $("name"),
  klass: $("class"),
  level: $("level"),
  player: $("player"),
  mainStat: $("main_stat"),

  // ability scores
  str: $("str"), dex: $("dex"), con: $("con"), int: $("int"), wis: $("wis"), cha: $("cha"),
  strMod: $("str_mod"), dexMod: $("dex_mod"), conMod: $("con_mod"),
  intMod: $("int_mod"), wisMod: $("wis_mod"), chaMod: $("cha_mod"),

  speed: $("speed"),
  passive: $("passive"),

  // saves
  saveStr: $("save_str"), saveDex: $("save_dex"), saveCon: $("save_con"),
  saveInt: $("save_int"), saveWis: $("save_wis"), saveCha: $("save_cha"),

  // armor/hp
  armorType: $("armor_type"),
  shield: $("shield"),
  ac: $("ac"),
  hpMax: $("hp_max"),
  hpCurrent: $("hp_current"),
  hpTemp: $("hp_temp"),

  // left column textareas
  classTraits: $("class_traits"),
  backgroundTags: $("background_tags"),
  commonActivities: $("common_activities"),

  // rites
  ritesL1Uses: $("rites_l1_uses"),
  ritesL3Uses: $("rites_l3_uses"),
  ritesL6Uses: $("rites_l6_uses"),
  ritesL1Known: $("rites_l1_known"),
  ritesL3Known: $("rites_l3_known"),
  ritesL6Known: $("rites_l6_known"),

  // weapons
  weaponsBody: $("weaponsBody"),

  // split fields (NEW IDs in your HTML)
  equipment: $("equipment"),
  notes: $("notes"),
};

let isReady = false;

// ---------- autosave state ----------
let autosaveTimer = null;
let isSaving = false;
let pendingSave = false;
const AUTOSAVE_DELAY_MS = 1500;

// ---------- helpers ----------
function setStatus(msg) { els.status.textContent = msg; }

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function calcMod(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return "";
  const mod = Math.floor((s - 10) / 2);
  return (mod >= 0 ? `+${mod}` : `${mod}`);
}

function renderLastSaved(iso) {
  if (!iso) { els.lastSaved.textContent = "—"; return; }
  const d = new Date(iso);
  els.lastSaved.textContent = d.toLocaleString();
}

function ensureWeaponsRows(count = 4) {
  els.weaponsBody.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input data-w="${i}" data-k="name" /></td>
      <td><input data-w="${i}" data-k="type" /></td>
      <td><input data-w="${i}" data-k="damage" /></td>
      <td><input data-w="${i}" data-k="range" /></td>
      <td><input data-w="${i}" data-k="notes" /></td>
    `;
    els.weaponsBody.appendChild(tr);
  }
}

function setWeapons(weapons) {
  const w = Array.isArray(weapons) ? weapons : [];
  const inputs = els.weaponsBody.querySelectorAll("input[data-w]");
  inputs.forEach((inp) => {
    const i = Number(inp.dataset.w);
    const k = inp.dataset.k;
    inp.value = (w[i] && w[i][k]) ? String(w[i][k]) : "";
  });
}

function getWeapons() {
  const rows = [];
  for (let i = 0; i < 4; i++) rows.push({ name:"", type:"", damage:"", range:"", notes:"" });

  const inputs = els.weaponsBody.querySelectorAll("input[data-w]");
  inputs.forEach((inp) => {
    const i = Number(inp.dataset.w);
    const k = inp.dataset.k;
    rows[i][k] = inp.value ?? "";
  });

  return rows.filter(r => (r.name + r.type + r.damage + r.range + r.notes).trim() !== "");
}

function updateModsUI() {
  els.strMod.value = calcMod(els.str.value);
  els.dexMod.value = calcMod(els.dex.value);
  els.conMod.value = calcMod(els.con.value);
  els.intMod.value = calcMod(els.int.value);
  els.wisMod.value = calcMod(els.wis.value);
  els.chaMod.value = calcMod(els.cha.value);
}

// ---------- autosave wiring ----------
function scheduleAutosave() {
  if (!isReady) return;

  setStatus("Unsaved…");

  if (autosaveTimer) clearTimeout(autosaveTimer);

  autosaveTimer = setTimeout(async () => {
    if (isSaving) {
      pendingSave = true;
      return;
    }

    isSaving = true;
    try {
      await saveCharacter(); // uses existing save logic
    } finally {
      isSaving = false;
    }

    if (pendingSave) {
      pendingSave = false;
      scheduleAutosave();
    }
  }, AUTOSAVE_DELAY_MS);
}

function wireAutosave() {
  const fields = document.querySelectorAll("input, textarea, select");
  fields.forEach(el => {
    el.addEventListener("input", scheduleAutosave);
    el.addEventListener("change", scheduleAutosave);
  });
}

// ---------- load/save ----------
async function loadCharacter() {
  ensureWeaponsRows(4);

  if (!slug) {
    els.slugLine.textContent = "Missing character key. Use: character.html?troy";
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
    console.error(error);
    setStatus("Not found in DB. Create a row with this slug in Supabase.");
    return;
  }

  const c = data.data_json || {};

  // top
  els.name.value = c.name ?? "";
  els.klass.value = c.class ?? "";
  els.level.value = c.level ?? 1;
  els.player.value = c.player ?? "";
  els.mainStat.value = c.main_stat ?? "";

  // ability scores
  const a = c.ability || {};
  els.str.value = a.STR ?? "";
  els.dex.value = a.DEX ?? "";
  els.con.value = a.CON ?? "";
  els.int.value = a.INT ?? "";
  els.wis.value = a.WIS ?? "";
  els.cha.value = a.CHA ?? "";
  updateModsUI();

  // misc
  els.speed.value = c.speed ?? "";
  els.passive.value = c.passive_perception ?? "";

  els.classTraits.value = c.class_traits ?? "";
  els.backgroundTags.value = c.background_tags ?? "";
  els.commonActivities.value = c.common_activities ?? "";

  // saves
  const s = c.saves || {};
  els.saveStr.value = s.STR ?? "";
  els.saveDex.value = s.DEX ?? "";
  els.saveCon.value = s.CON ?? "";
  els.saveInt.value = s.INT ?? "";
  els.saveWis.value = s.WIS ?? "";
  els.saveCha.value = s.CHA ?? "";

  // armor/hp
  const ar = c.armor || {};
  els.armorType.value = ar.type ?? "";
  els.shield.checked = !!ar.shield;
  els.ac.value = c.ac ?? "";

  const hp = c.hp || {};
  els.hpMax.value = hp.max ?? "";
  els.hpCurrent.value = hp.current ?? "";
  els.hpTemp.value = hp.temp ?? "";

  // weapons
  setWeapons(c.weapons);

  // rites
  const r = c.rites || {};
  els.ritesL1Uses.value = r.l1_uses ?? "";
  els.ritesL3Uses.value = r.l3_uses ?? "";
  els.ritesL6Uses.value = r.l6_uses ?? "";
  els.ritesL1Known.value = r.l1_known ?? "";
  els.ritesL3Known.value = r.l3_known ?? "";
  els.ritesL6Known.value = r.l6_known ?? "";

  // split fields
  els.equipment.value = c.equipment ?? "";
  els.notes.value = c.notes ?? "";

  renderLastSaved(data.updated_at);

  els.saveBtn.disabled = false;
  isReady = true;

  wireAutosave();

  setStatus("Ready.");
}

async function saveCharacter() {
  if (!isReady) return;

  setStatus("Saving…");

  const payload = {
    name: els.name.value.trim(),
    class: els.klass.value.trim(),
    level: safeNum(els.level.value, 1),
    player: els.player.value.trim(),
    main_stat: els.mainStat.value || "",

    ability: {
      STR: safeNum(els.str.value, ""),
      DEX: safeNum(els.dex.value, ""),
      CON: safeNum(els.con.value, ""),
      INT: safeNum(els.int.value, ""),
      WIS: safeNum(els.wis.value, ""),
      CHA: safeNum(els.cha.value, ""),
    },

    speed: safeNum(els.speed.value, ""),
    passive_perception: safeNum(els.passive.value, ""),

    class_traits: els.classTraits.value ?? "",
    background_tags: els.backgroundTags.value ?? "",
    common_activities: els.commonActivities.value ?? "",

    saves: {
      STR: safeNum(els.saveStr.value, ""),
      DEX: safeNum(els.saveDex.value, ""),
      CON: safeNum(els.saveCon.value, ""),
      INT: safeNum(els.saveInt.value, ""),
      WIS: safeNum(els.saveWis.value, ""),
      CHA: safeNum(els.saveCha.value, ""),
    },

    armor: {
      type: els.armorType.value ?? "",
      shield: !!els.shield.checked,
    },
    ac: safeNum(els.ac.value, ""),

    hp: {
      max: safeNum(els.hpMax.value, ""),
      current: safeNum(els.hpCurrent.value, ""),
      temp: safeNum(els.hpTemp.value, ""),
    },

    weapons: getWeapons(),

    rites: {
      l1_uses: safeNum(els.ritesL1Uses.value, ""),
      l3_uses: safeNum(els.ritesL3Uses.value, ""),
      l6_uses: safeNum(els.ritesL6Uses.value, ""),
      l1_known: els.ritesL1Known.value ?? "",
      l3_known: els.ritesL3Known.value ?? "",
      l6_known: els.ritesL6Known.value ?? "",
    },

    equipment: els.equipment.value ?? "",
    notes: els.notes.value ?? "",
  };

  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("characters")
    .update({
      data_json: payload,
      updated_at: nowIso
    })
    .eq("slug", slug);

  if (error) {
    console.error(error);
    setStatus("Save failed (check console).");
    return;
  }

  renderLastSaved(nowIso);
  setStatus("Saved ✔");
}

// manual save still works (and triggers autosave status correctly too)
els.saveBtn.addEventListener("click", async () => {
  pendingSave = false;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  await saveCharacter();
});

// modifier live update
["str","dex","con","int","wis","cha"].forEach((k) => {
  $(k).addEventListener("input", updateModsUI);
});

// boot
loadCharacter();
