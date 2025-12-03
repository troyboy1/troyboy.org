document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("characterForm");
  const randomPortraitBtn = document.getElementById("randomPortraitBtn");
  const portraitImg = document.getElementById("portraitPreview");
  const portraitUrlInput = document.getElementById("portraitUrl");

  const sheetPortrait = document.getElementById("sheetPortrait");
  const emptyState = document.getElementById("emptyState");

  // If we're on the builder page:
  if (form) {
    // Initialize hidden portrait URL with current preview
    portraitUrlInput.value = portraitImg.src;

    randomPortraitBtn.addEventListener("click", () => {
      const race = (document.getElementById("race").value || "fantasy").trim();
      const charClass = (document.getElementById("charClass").value || "adventurer").trim();

      // Build Unsplash query for realistic fantasy portrait
      const keywords = [
        "fantasy",
        "character",
        "portrait",
        race.toLowerCase(),
        charClass.toLowerCase()
      ]
        .filter(Boolean)
        .join(",");

      const url =
        "https://source.unsplash.com/400x600/?" +
        encodeURIComponent(keywords) +
        "&t=" +
        Date.now(); // bust cache

      portraitImg.src = url;
      portraitUrlInput.value = url;
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = {
        name: form.charName.value.trim(),
        playerName: form.playerName.value.trim(),
        class: form.charClass.value.trim(),
        subclass: form.subClass.value.trim(),
        race: form.race.value.trim(),
        background: form.background.value.trim(),
        alignment: form.alignment.value.trim(),
        level: form.level.value.trim(),
        portraitUrl: portraitUrlInput.value,

        stats: {
          str: form.str.value.trim(),
          dex: form.dex.value.trim(),
          con: form.con.value.trim(),
          int: form.int.value.trim(),
          wis: form.wis.value.trim(),
          cha: form.cha.value.trim()
        },
        combat: {
          hp: form.hp.value.trim(),
          ac: form.ac.value.trim(),
          init: form.init.value.trim(),
          speed: form.speed.value.trim(),
          profBonus: form.profBonus.value.trim(),
          passivePerc: form.passivePerc.value.trim()
        },
        features: form.features.value.trim(),
        spellSlots: form.spellSlots.value.trim(),
        spells: form.spells.value.trim(),
        weapons: form.weapons.value.trim(),
        armor: form.armor.value.trim(),
        items: form.items.value.trim(),
        coins: {
          gp: form.gold.value.trim(),
          sp: form.silver.value.trim(),
          cp: form.copper.value.trim()
        },
        backstory: form.backstory.value.trim()
      };

      try {
        localStorage.setItem("dndCharacter", JSON.stringify(data));
      } catch (err) {
        console.error("Failed to save character:", err);
        alert("Could not save character to this browser.");
        return;
      }

      // Redirect to character sheet
      window.location.href = "character.html";
    });
  }

  // If we're on the character sheet page:
  if (sheetPortrait) {
    let data = null;
    try {
      const raw = localStorage.getItem("dndCharacter");
      if (raw) {
        data = JSON.parse(raw);
      }
    } catch (err) {
      console.error("Error loading character:", err);
    }

    if (!data) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    // Helper to safely set text
    const setText = (id, value, fallback = "—") => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = value && value.length ? value : fallback;
    };

    // Hero header
    const heroName = data.name || "Unnamed Hero";
    const heroClass = data.class || "Classless Wanderer";
    const heroLevel = data.level ? `Level ${data.level}` : "";

    setText("sheetCharName", heroName + " – Character Sheet");
    setText("sheetNameClass", `${heroName} · ${heroClass} ${heroLevel ? `(${heroLevel})` : ""}`);
    setText("sheetPlayer", data.playerName ? `Player: ${data.playerName}` : "");

    const raceBg = [data.race, data.background].filter(Boolean).join(" · ");
    setText("sheetRaceBackground", raceBg);
    const alignLvl = [data.alignment, heroLevel].filter(Boolean).join(" · ");
    setText("sheetAlignmentLevel", alignLvl);

    if (data.portraitUrl) {
      sheetPortrait.src = data.portraitUrl;
    }

    // Overview card
    setText("ovName", heroName);
    setText("ovPlayer", data.playerName);
    setText("ovClass", heroClass);
    setText("ovSubclass", data.subclass);
    setText("ovRace", data.race);
    setText("ovBackground", data.background);
    setText("ovAlignment", data.alignment);
    setText("ovLevel", data.level);

    // Stats
    const s = data.stats || {};
    setText("stStr", s.str);
    setText("stDex", s.dex);
    setText("stCon", s.con);
    setText("stInt", s.int);
    setText("stWis", s.wis);
    setText("stCha", s.cha);

    const c = data.combat || {};
    setText("stHp", c.hp);
    setText("stAc", c.ac);
    setText("stInit", c.init);
    setText("stSpeed", c.speed);
    setText("stProf", c.profBonus);
    setText("stPassive", c.passivePerc);

    // Features
    setText("ftFeatures", data.features, "No features listed.");

    // Spells
    setText("spSlots", data.spellSlots, "—");
    setText("spSpells", data.spells, "No spells listed.");

    // Equipment
    setText("eqWeapons", data.weapons, "No weapons listed.");
    setText("eqArmor", data.armor, "No armor listed.");
    setText("eqItems", data.items, "No items listed.");

    const coins = data.coins || {};
    const coinText = [
      coins.gp ? `${coins.gp} gp` : null,
      coins.sp ? `${coins.sp} sp` : null,
      coins.cp ? `${coins.cp} cp` : null
    ]
      .filter(Boolean)
      .join(" · ");
    setText("eqCoins", coinText || "No coins recorded.");

    // Backstory
    setText("bsBackstory", data.backstory, "No backstory provided.");
  }
});
