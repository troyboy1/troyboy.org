(() => {
  'use strict';

  const STORAGE_KEY = 'weddingSeatingPlanner.v1';
  const ACCESS_CODE_KEY = 'weddingSeatingPlanner.accessCode.v1';
  const ZOOM_KEY = 'weddingSeatingPlanner.zoom.v2';
  const CLOUD_SAVE_DELAY = 650;
  const GRID = 10;

  // V2 layout: larger ballroom drawing + substantially smaller round tables.
  // This lets each room comfortably display roughly 9–12 round tables instead of ~4.
  const CANVAS_W = 1480;
  const CANVAS_H = 850;
  const ROUND_W = 112;
  const ROUND_H = 112;
  const HEAD_W = 520;
  const HEAD_H = 128;
  const ROUND_GAP = 115;

  const ROOM_BOUNDS = {
    east:   { x: 30,   y: 185, w: 445, h: 520 },
    center: { x: 470,  y: 90,  w: 540, h: 520 },
    west:   { x: 1005, y: 185, w: 445, h: 520 }
  };

  const OLD_ROOM_BOUNDS = {
    east:   { x: 35,  y: 170, w: 370, h: 420 },
    center: { x: 399, y: 92,  w: 430, h: 410 },
    west:   { x: 823, y: 170, w: 360, h: 420 }
  };

  const els = {
    floorCanvas: document.getElementById('floorCanvas'),
    canvasScroll: document.getElementById('canvasScroll'),
    tableLayer: document.getElementById('tableLayer'),
    guestList: document.getElementById('guestList'),
    guestSearch: document.getElementById('guestSearch'),
    guestFilter: document.getElementById('guestFilter'),
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddName: document.getElementById('quickAddName'),
    targetRoom: document.getElementById('targetRoom'),
    saveStatus: document.getElementById('saveStatus'),
    totalGuests: document.getElementById('totalGuests'),
    seatedGuests: document.getElementById('seatedGuests'),
    unseatedGuests: document.getElementById('unseatedGuests'),
    add8Btn: document.getElementById('add8Btn'),
    add10Btn: document.getElementById('add10Btn'),
    addHeadBtn: document.getElementById('addHeadBtn'),
    autoPlaceBtn: document.getElementById('autoPlaceBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importFile: document.getElementById('importFile'),
    resetBtn: document.getElementById('resetBtn'),
    openBulkBtn: document.getElementById('openBulkBtn'),
    bulkDialog: document.getElementById('bulkDialog'),
    bulkForm: document.getElementById('bulkForm'),
    bulkGuestText: document.getElementById('bulkGuestText'),
    cancelBulkBtn: document.getElementById('cancelBulkBtn'),
    tableDialog: document.getElementById('tableDialog'),
    tableForm: document.getElementById('tableForm'),
    editingTableId: document.getElementById('editingTableId'),
    tableDialogTitle: document.getElementById('tableDialogTitle'),
    tableNameInput: document.getElementById('tableNameInput'),
    tableRoomInput: document.getElementById('tableRoomInput'),
    deleteTableBtn: document.getElementById('deleteTableBtn'),
    cancelTableBtn: document.getElementById('cancelTableBtn'),
    guestDialog: document.getElementById('guestDialog'),
    guestForm: document.getElementById('guestForm'),
    editingGuestId: document.getElementById('editingGuestId'),
    guestDialogTitle: document.getElementById('guestDialogTitle'),
    guestAssignmentSummary: document.getElementById('guestAssignmentSummary'),
    guestNameInput: document.getElementById('guestNameInput'),
    guestGroupInput: document.getElementById('guestGroupInput'),
    guestMealInput: document.getElementById('guestMealInput'),
    guestNotesInput: document.getElementById('guestNotesInput'),
    unseatGuestBtn: document.getElementById('unseatGuestBtn'),
    deleteGuestBtn: document.getElementById('deleteGuestBtn'),
    cancelGuestBtn: document.getElementById('cancelGuestBtn'),
    assignDialog: document.getElementById('assignDialog'),
    assignDialogTitle: document.getElementById('assignDialogTitle'),
    assignSeatSummary: document.getElementById('assignSeatSummary'),
    assignGuestSearch: document.getElementById('assignGuestSearch'),
    assignGuestList: document.getElementById('assignGuestList'),
    closeAssignBtn: document.getElementById('closeAssignBtn'),
    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    canvasZoom: document.getElementById('canvasZoom'),
    fitRoomBtn: document.getElementById('fitRoomBtn')
  };

  let dragPayload = null;
  let movingTable = null;
  let pointerGuestDrag = null;
  let highlightedDropSeat = null;
  let saveFlashTimer = null;
  let cloudSaveTimer = null;
  let cloudClient = null;
  let cloudReady = false;
  let pendingSeat = null;
  let accessCode = localStorage.getItem(ACCESS_CODE_KEY) || '';
  let state = loadLocalState() || emptyState();
  let uiZoom = clamp(Number(localStorage.getItem(ZOOM_KEY)) || Number(state?.settings?.zoom) || 100, 45, 140);

  normalizeState();
  bindEvents();
  renderAll();
  bootstrapCloud();

  function emptyState() {
    return {
      version: 2,
      guests: [],
      tables: [],
      counters: { table: 1 },
      settings: { zoom: 100 }
    };
  }

  function uid(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function normalizeState() {
    const previousVersion = Number(state.version) || 1;
    state.guests = Array.isArray(state.guests) ? state.guests : [];
    state.tables = Array.isArray(state.tables) ? state.tables : [];
    state.counters = state.counters || { table: state.tables.length + 1 };
    state.settings = state.settings || { zoom: 100 };

    state.guests.forEach(guest => {
      guest.name = guest.name || 'Unnamed Guest';
      guest.group = guest.group || '';
      guest.meal = guest.meal || '';
      guest.notes = guest.notes || '';
    });

    state.tables.forEach(table => {
      table.capacity = Number(table.capacity) || 10;
      table.room = ROOM_BOUNDS[table.room] ? table.room : 'center';
      table.type = table.type === 'head' ? 'head' : 'round';
      table.seats = Array.isArray(table.seats) ? table.seats : Array(table.capacity).fill(null);
      while (table.seats.length < table.capacity) table.seats.push(null);
      if (table.seats.length > table.capacity) table.seats = table.seats.slice(0, table.capacity);
    });

    if (previousVersion < 2 && state.tables.length) migrateLegacyTablePositions();
    state.version = 2;
  }

  function migrateLegacyTablePositions() {
    state.tables.forEach(table => {
      const oldBounds = OLD_ROOM_BOUNDS[table.room] || OLD_ROOM_BOUNDS.center;
      const newBounds = ROOM_BOUNDS[table.room] || ROOM_BOUNDS.center;
      const oldW = table.type === 'head' ? 460 : 164;
      const oldH = table.type === 'head' ? 150 : 164;
      const newW = table.type === 'head' ? HEAD_W : ROUND_W;
      const newH = table.type === 'head' ? HEAD_H : ROUND_H;
      const centerX = (Number(table.x) || oldBounds.x) + oldW / 2;
      const centerY = (Number(table.y) || oldBounds.y) + oldH / 2;
      const fx = clamp((centerX - oldBounds.x) / oldBounds.w, 0, 1);
      const fy = clamp((centerY - oldBounds.y) / oldBounds.h, 0, 1);
      table.x = snap(clamp(newBounds.x + fx * newBounds.w - newW / 2, 0, CANVAS_W - newW));
      table.y = snap(clamp(newBounds.y + fy * newBounds.h - newH / 2, 0, CANVAS_H - newH));
    });
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Could not load local seating chart backup', err);
      return null;
    }
  }

  function setSaveStatus(message, flash = false) {
    const target = els.saveStatus.querySelector('span:last-child');
    if (target) target.textContent = message;
    if (flash) {
      els.saveStatus.classList.add('saved-flash');
      clearTimeout(saveFlashTimer);
      saveFlashTimer = setTimeout(() => els.saveStatus.classList.remove('saved-flash'), 600);
    }
  }

  function saveState(message = 'Saved') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save local backup', err);
    }

    if (!cloudReady) {
      const now = new Date();
      setSaveStatus(`${message} locally · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
      return;
    }

    setSaveStatus('Saving to Supabase…');
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => saveCloudState(message), CLOUD_SAVE_DELAY);
  }

  async function bootstrapCloud() {
    const cfg = window.SEATING_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.key || !window.supabase?.createClient) {
      setSaveStatus('Local mode · add Supabase config to sync devices');
      return;
    }

    try {
      cloudClient = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      if (!accessCode) {
        accessCode = prompt('Enter the wedding seating chart access code:') || '';
        if (!accessCode) {
          setSaveStatus('Local mode · cloud access code not entered');
          return;
        }
        localStorage.setItem(ACCESS_CODE_KEY, accessCode);
      }

      setSaveStatus('Loading seating chart from Supabase…');
      const { data, error } = await cloudClient.rpc('wedding_seating_load', {
        p_slug: cfg.chartSlug || 'troy-wedding-2026',
        p_secret: accessCode
      });
      if (error) throw error;
      if (data === null) {
        localStorage.removeItem(ACCESS_CODE_KEY);
        accessCode = '';
        setSaveStatus('Supabase access denied · reload to try again');
        alert('The Supabase seating chart could not be opened. The access code may be incorrect.');
        return;
      }

      let migratedCloudLayout = false;
      if (data && Array.isArray(data.guests) && Array.isArray(data.tables)) {
        const cloudVersion = Number(data.version) || 1;
        state = data;
        normalizeState();
        migratedCloudLayout = cloudVersion < 2;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
      }

      cloudReady = true;
      if (migratedCloudLayout) saveState('Layout upgraded');
      const now = new Date();
      setSaveStatus(`Synced with Supabase · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
    } catch (err) {
      console.error('Supabase startup failed', err);
      setSaveStatus('Supabase unavailable · using local backup');
    }
  }

  async function saveCloudState(message = 'Saved') {
    const cfg = window.SEATING_SUPABASE_CONFIG || {};
    if (!cloudClient || !cloudReady || !accessCode) return;
    try {
      const { data, error } = await cloudClient.rpc('wedding_seating_save', {
        p_slug: cfg.chartSlug || 'troy-wedding-2026',
        p_secret: accessCode,
        p_state: state
      });
      if (error) throw error;
      if (data !== true) {
        setSaveStatus('Cloud save rejected · check access code');
        return;
      }
      const now = new Date();
      setSaveStatus(`${message} to Supabase · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
    } catch (err) {
      console.error('Supabase save failed', err);
      setSaveStatus('Cloud save failed · local backup is safe');
    }
  }

  function commit({ tables = true, guests = true, message } = {}) {
    if (guests) renderGuests();
    if (tables) renderTables();
    renderStats();
    saveState(message);
  }

  function bindEvents() {
    els.add8Btn.addEventListener('click', () => addTable('round', 8, els.targetRoom.value));
    els.add10Btn.addEventListener('click', () => addTable('round', 10, els.targetRoom.value));
    els.addHeadBtn.addEventListener('click', () => addTable('head', 22, els.targetRoom.value));
    els.autoPlaceBtn.addEventListener('click', autoPlaceTables);

    els.quickAddForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = els.quickAddName.value.trim();
      if (!name) return;
      addGuest({ name });
      els.quickAddName.value = '';
      els.quickAddName.focus();
    });

    els.guestSearch.addEventListener('input', renderGuests);
    els.guestFilter.addEventListener('change', renderGuests);

    els.openBulkBtn.addEventListener('click', () => els.bulkDialog.showModal());
    els.cancelBulkBtn.addEventListener('click', () => els.bulkDialog.close());
    els.bulkForm.addEventListener('submit', e => {
      e.preventDefault();
      const lines = els.bulkGuestText.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      if (!lines.length) return;
      let added = 0;
      lines.forEach(line => {
        const [name, group = '', meal = ''] = line.split('|').map(v => v.trim());
        if (name) {
          state.guests.push({ id: uid('guest'), name, group, meal, notes: '' });
          added++;
        }
      });
      els.bulkGuestText.value = '';
      els.bulkDialog.close();
      commit({ message: `Added ${added} guests` });
    });

    els.tableForm.addEventListener('submit', e => {
      e.preventDefault();
      const table = getTable(els.editingTableId.value);
      if (!table) return;
      table.name = els.tableNameInput.value.trim() || table.name;
      const newRoom = els.tableRoomInput.value;
      if (newRoom !== table.room) {
        table.room = newRoom;
        const pos = getDefaultPosition(newRoom, table.type);
        table.x = pos.x;
        table.y = pos.y;
      }
      els.tableDialog.close();
      commit({ guests: false, message: 'Table updated' });
    });

    els.cancelTableBtn.addEventListener('click', () => els.tableDialog.close());
    els.deleteTableBtn.addEventListener('click', () => {
      const table = getTable(els.editingTableId.value);
      if (table) deleteTable(table.id);
    });

    els.guestForm.addEventListener('submit', e => {
      e.preventDefault();
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      const name = els.guestNameInput.value.trim();
      if (!name) return;
      guest.name = name;
      guest.group = els.guestGroupInput.value.trim();
      guest.meal = els.guestMealInput.value.trim();
      guest.notes = els.guestNotesInput.value.trim();
      els.guestDialog.close();
      commit({ message: 'Guest profile saved' });
    });

    els.cancelGuestBtn.addEventListener('click', () => els.guestDialog.close());
    els.unseatGuestBtn.addEventListener('click', () => {
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      const assignment = findGuestSeat(guest.id);
      if (!assignment) return;
      assignment.table.seats[assignment.seatIndex] = null;
      els.guestDialog.close();
      commit({ message: 'Guest unseated' });
    });
    els.deleteGuestBtn.addEventListener('click', () => {
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      if (removeGuest(guest.id)) els.guestDialog.close();
    });

    els.closeAssignBtn.addEventListener('click', () => els.assignDialog.close());
    els.assignGuestSearch.addEventListener('input', renderAssignGuestList);

    els.exportBtn.addEventListener('click', exportBackup);
    els.importFile.addEventListener('change', importBackup);
    els.resetBtn.addEventListener('click', resetAll);

    els.zoomRange.addEventListener('input', () => {
      uiZoom = clamp(Number(els.zoomRange.value), 45, 140);
      localStorage.setItem(ZOOM_KEY, String(uiZoom));
      applyZoom();
    });
    els.fitRoomBtn.addEventListener('click', fitSelectedRoom);

    document.querySelectorAll('[data-jump-room]').forEach(button => {
      button.addEventListener('click', () => {
        const room = button.dataset.jumpRoom;
        els.targetRoom.value = room;
        scrollToRoom(room);
      });
    });

    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    });
    window.addEventListener('pointermove', onTablePointerMove);
    window.addEventListener('pointerup', onTablePointerUp);
    window.addEventListener('pointercancel', onTablePointerUp);
    window.addEventListener('pointermove', onGuestPointerMove, { passive: false });
    window.addEventListener('pointerup', onGuestPointerUp);
    window.addEventListener('pointercancel', cancelGuestPointerDrag);
  }

  function addGuest({ name, group = '', meal = '', notes = '' }) {
    const clean = name.trim();
    if (!clean) return;
    state.guests.push({ id: uid('guest'), name: clean, group, meal, notes });
    commit({ message: 'Guest added' });
  }

  function removeGuest(guestId) {
    const guest = getGuest(guestId);
    if (!guest) return false;
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return false;
    state.tables.forEach(t => { t.seats = t.seats.map(id => id === guestId ? null : id); });
    state.guests = state.guests.filter(g => g.id !== guestId);
    commit({ message: 'Guest removed' });
    return true;
  }

  function addTable(type, capacity, room) {
    if (type === 'head' && state.tables.some(t => t.type === 'head')) {
      if (!confirm('A head table already exists. Add another one anyway?')) return;
    }

    const position = getDefaultPosition(room, type);
    const number = state.counters.table++;
    state.tables.push({
      id: uid('table'),
      type,
      capacity,
      room,
      name: type === 'head' ? 'Head Table' : `Table ${number}`,
      x: position.x,
      y: position.y,
      seats: Array(capacity).fill(null)
    });
    commit({ guests: false, message: 'Table added' });
  }

  function deleteTable(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    const occupied = table.seats.filter(Boolean).length;
    const warning = occupied ? ` This will unseat ${occupied} guest${occupied === 1 ? '' : 's'}.` : '';
    if (!confirm(`Delete ${table.name}?${warning}`)) return;
    state.tables = state.tables.filter(t => t.id !== table.id);
    if (els.tableDialog.open) els.tableDialog.close();
    commit({ message: 'Table deleted' });
  }

  function getDefaultPosition(room, type) {
    const bounds = ROOM_BOUNDS[room];
    const isHead = type === 'head';
    const w = isHead ? HEAD_W : ROUND_W;
    const h = isHead ? HEAD_H : ROUND_H;
    const sameRoom = state.tables.filter(t => t.room === room && t.type === type);

    if (isHead) {
      const x = clamp(bounds.x + (bounds.w - w) / 2, 0, CANVAS_W - w);
      const y = clamp(bounds.y + 54 + sameRoom.length * (HEAD_H + 10), 0, CANVAS_H - h);
      return { x: snap(x), y: snap(y) };
    }

    const cols = Math.max(1, Math.floor((bounds.w - 24) / ROUND_GAP));
    const index = state.tables.filter(t => t.room === room && t.type !== 'head').length;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = clamp(bounds.x + 14 + col * ROUND_GAP, 0, CANVAS_W - w);
    const y = clamp(bounds.y + 55 + row * ROUND_GAP, 0, CANVAS_H - h);
    return { x: snap(x), y: snap(y) };
  }

  function autoPlaceTables() {
    ['east', 'center', 'west'].forEach(room => {
      const bounds = ROOM_BOUNDS[room];
      const tables = state.tables.filter(t => t.room === room);
      const heads = tables.filter(t => t.type === 'head');
      const rounds = tables.filter(t => t.type !== 'head');
      let startY = bounds.y + 55;

      heads.forEach((table, i) => {
        table.x = snap(clamp(bounds.x + (bounds.w - HEAD_W) / 2, 0, CANVAS_W - HEAD_W));
        table.y = snap(clamp(bounds.y + 48 + i * (HEAD_H + 10), 0, CANVAS_H - HEAD_H));
        startY = Math.max(startY, table.y + HEAD_H + 8);
      });

      const cols = Math.max(1, Math.floor((bounds.w - 24) / ROUND_GAP));
      rounds.forEach((table, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        table.x = snap(bounds.x + 14 + col * ROUND_GAP);
        table.y = snap(startY + row * ROUND_GAP);
        table.x = clamp(table.x, 0, CANVAS_W - ROUND_W);
        table.y = clamp(table.y, 0, CANVAS_H - ROUND_H);
      });
    });

    commit({ guests: false, message: 'Tables auto-placed' });
    toast('Tables arranged with the new compact spacing.');
  }

  function renderAll() {
    applyZoom();
    renderGuests();
    renderTables();
    renderStats();
  }

  function renderStats() {
    const seated = new Set();
    state.tables.forEach(t => t.seats.forEach(id => id && seated.add(id)));
    els.totalGuests.textContent = state.guests.length;
    els.seatedGuests.textContent = seated.size;
    els.unseatedGuests.textContent = Math.max(0, state.guests.length - seated.size);
  }

  function renderGuests() {
    const query = els.guestSearch.value.trim().toLowerCase();
    const filter = els.guestFilter.value;
    const assignments = getAssignments();

    const guests = [...state.guests]
      .filter(guest => {
        const a = assignments.get(guest.id);
        if (filter === 'seated' && !a) return false;
        if (filter === 'unseated' && a) return false;
        if (!query) return true;
        const haystack = `${guest.name} ${guest.group || ''} ${guest.meal || ''} ${guest.notes || ''} ${a ? a.table.name : ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    els.guestList.innerHTML = '';
    if (!guests.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = state.guests.length
        ? 'No guests match this search/filter.'
        : '<strong>No guests yet.</strong><br>Use “Add one guest” or the + button to paste the full list.';
      els.guestList.appendChild(empty);
      return;
    }

    const template = document.getElementById('guestTemplate');
    guests.forEach(guest => {
      const node = template.content.firstElementChild.cloneNode(true);
      const assignment = assignments.get(guest.id);
      node.dataset.guestId = guest.id;
      node.querySelector('.guest-name').textContent = guest.name;
      node.querySelector('.guest-meta').textContent = assignment
        ? `${assignment.table.name} · Seat ${assignment.seatIndex + 1}`
        : [guest.group, guest.meal].filter(Boolean).join(' · ') || 'Unseated';
      node.classList.toggle('is-seated', !!assignment);

      node.addEventListener('dragstart', e => startGuestDrag(e, guest.id));
      node.addEventListener('dragend', endGuestDrag);
      node.querySelector('.guest-open').addEventListener('click', () => openGuestDialog(guest.id));
      node.querySelector('.guest-drag-grip').addEventListener('pointerdown', e => startGuestPointerDrag(e, guest.id));
      node.querySelector('.guest-remove').addEventListener('click', e => {
        e.stopPropagation();
        removeGuest(guest.id);
      });
      els.guestList.appendChild(node);
    });
  }

  function renderTables() {
    els.tableLayer.innerHTML = '';
    state.tables.forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = `table-item ${table.type === 'head' ? 'head-table' : 'round-table'} room-${table.room}`;
      wrapper.dataset.tableId = table.id;
      wrapper.style.left = `${table.x}px`;
      wrapper.style.top = `${table.y}px`;

      const surface = document.createElement('div');
      surface.className = 'table-surface';
      wrapper.appendChild(surface);

      const handle = document.createElement('div');
      handle.className = 'table-drag-handle';
      const count = table.seats.filter(Boolean).length;
      const name = document.createElement('strong');
      name.textContent = table.name;
      const seated = document.createElement('span');
      seated.textContent = `${count}/${table.capacity}`;
      const actions = document.createElement('div');
      actions.className = 'table-inline-actions';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'table-mini-btn';
      edit.textContent = 'Edit';
      edit.title = `Edit ${table.name}`;
      edit.addEventListener('pointerdown', e => e.stopPropagation());
      edit.addEventListener('click', e => { e.stopPropagation(); openTableDialog(table.id); });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'table-mini-btn table-mini-delete';
      del.textContent = '×';
      del.title = `Delete ${table.name}`;
      del.setAttribute('aria-label', `Delete ${table.name}`);
      del.addEventListener('pointerdown', e => e.stopPropagation());
      del.addEventListener('click', e => { e.stopPropagation(); deleteTable(table.id); });

      actions.append(edit, del);
      handle.append(name, seated, actions);
      handle.addEventListener('pointerdown', e => startTableMove(e, table.id));
      handle.addEventListener('dragover', e => {
        if (dragPayload?.type !== 'guest') return;
        e.preventDefault();
        wrapper.classList.add('table-drop-target');
      });
      handle.addEventListener('dragleave', () => wrapper.classList.remove('table-drop-target'));
      handle.addEventListener('drop', e => {
        if (dragPayload?.type !== 'guest') return;
        e.preventDefault();
        wrapper.classList.remove('table-drop-target');
        assignGuestToFirstEmpty(dragPayload.guestId, table.id);
      });
      wrapper.appendChild(handle);

      if (table.type === 'head') renderHeadSeats(wrapper, table);
      else renderRoundSeats(wrapper, table);

      els.tableLayer.appendChild(wrapper);
    });
  }

  function renderRoundSeats(wrapper, table) {
    const centerX = ROUND_W / 2;
    const centerY = ROUND_H / 2;
    const seatSize = 24;
    const radius = 44;
    for (let i = 0; i < table.capacity; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI / table.capacity);
      const x = centerX + Math.cos(angle) * radius - seatSize / 2;
      const y = centerY + Math.sin(angle) * radius - seatSize / 2;
      wrapper.appendChild(createSeat(table, i, x, y));
    }
  }

  function renderHeadSeats(wrapper, table) {
    const topXs = Array.from({ length: 12 }, (_, i) => 8 + i * 44);
    const bottomXs = [8, 58, 108, 158, 208, 288, 338, 388, 438, 488];

    topXs.forEach((x, i) => {
      const special = i === 5 ? 'Bride' : i === 6 ? 'Groom' : '';
      wrapper.appendChild(createSeat(table, i, x, 0, special));
    });
    bottomXs.forEach((x, i) => {
      wrapper.appendChild(createSeat(table, 12 + i, x, 104));
    });
  }

  function createSeat(table, seatIndex, x, y, specialLabel = '') {
    const seat = document.createElement('button');
    const guestId = table.seats[seatIndex];
    const guest = guestId ? getGuest(guestId) : null;

    seat.type = 'button';
    seat.className = 'seat';
    seat.dataset.tableId = table.id;
    seat.dataset.seatIndex = String(seatIndex);
    seat.dataset.occupied = guest ? 'true' : 'false';
    if (specialLabel) seat.dataset.special = 'true';
    seat.style.left = `${x}px`;
    seat.style.top = `${y}px`;
    seat.title = guest
      ? `${guest.name} — ${table.name}, seat ${seatIndex + 1}. Click for profile.`
      : `${table.name}, seat ${seatIndex + 1}. Click to assign.`;

    const num = document.createElement('span');
    num.className = 'seat-number';
    num.textContent = seatIndex + 1;
    seat.appendChild(num);

    if (specialLabel) {
      const badge = document.createElement('span');
      badge.className = 'special-badge';
      badge.textContent = specialLabel;
      seat.appendChild(badge);
    }

    if (guest) {
      const label = document.createElement('span');
      label.className = 'seat-name';
      label.textContent = shortName(guest.name);
      seat.appendChild(label);
      seat.draggable = true;
      seat.addEventListener('dragstart', e => startGuestDrag(e, guest.id));
      seat.addEventListener('dragend', endGuestDrag);
    }

    seat.addEventListener('dragover', e => {
      if (dragPayload?.type !== 'guest') return;
      e.preventDefault();
      e.stopPropagation();
      seat.classList.add('drag-over');
    });
    seat.addEventListener('dragleave', () => seat.classList.remove('drag-over'));
    seat.addEventListener('drop', e => {
      if (dragPayload?.type !== 'guest') return;
      e.preventDefault();
      e.stopPropagation();
      seat.classList.remove('drag-over');
      assignGuestToSeat(dragPayload.guestId, table.id, seatIndex);
    });

    seat.addEventListener('click', () => {
      const currentGuestId = getTable(table.id)?.seats?.[seatIndex];
      if (currentGuestId) openGuestDialog(currentGuestId);
      else openAssignDialog(table.id, seatIndex);
    });

    return seat;
  }

  function startGuestDrag(event, guestId) {
    dragPayload = { type: 'guest', guestId };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', guestId);
    }
    event.currentTarget.classList.add('dragging');
  }

  function endGuestDrag(event) {
    event.currentTarget.classList.remove('dragging');
    clearDropHighlights();
    dragPayload = null;
  }

  function startGuestPointerDrag(event, guestId) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    cancelGuestPointerDrag();

    const guest = getGuest(guestId);
    if (!guest) return;

    const ghost = document.createElement('div');
    ghost.className = 'guest-drag-ghost';
    ghost.textContent = guest.name;
    document.body.appendChild(ghost);

    pointerGuestDrag = {
      guestId,
      pointerId: event.pointerId,
      source: event.currentTarget,
      ghost
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    positionGuestGhost(event.clientX, event.clientY);
    document.body.classList.add('guest-pointer-dragging');
  }

  function onGuestPointerMove(event) {
    if (!pointerGuestDrag || event.pointerId !== pointerGuestDrag.pointerId) return;
    event.preventDefault();
    positionGuestGhost(event.clientX, event.clientY);

    pointerGuestDrag.ghost.style.display = 'none';
    const target = document.elementFromPoint(event.clientX, event.clientY);
    pointerGuestDrag.ghost.style.display = '';
    const seat = target?.closest?.('.seat');

    if (highlightedDropSeat && highlightedDropSeat !== seat) highlightedDropSeat.classList.remove('drag-over');
    highlightedDropSeat = seat || null;
    if (highlightedDropSeat) highlightedDropSeat.classList.add('drag-over');
  }

  function onGuestPointerUp(event) {
    if (!pointerGuestDrag || event.pointerId !== pointerGuestDrag.pointerId) return;
    pointerGuestDrag.ghost.style.display = 'none';
    const target = document.elementFromPoint(event.clientX, event.clientY);
    pointerGuestDrag.ghost.style.display = '';

    const seat = target?.closest?.('.seat');
    const tableItem = target?.closest?.('.table-item');
    const guestId = pointerGuestDrag.guestId;

    if (seat) {
      assignGuestToSeat(guestId, seat.dataset.tableId, Number(seat.dataset.seatIndex));
    } else if (tableItem) {
      assignGuestToFirstEmpty(guestId, tableItem.dataset.tableId);
    }
    cancelGuestPointerDrag();
  }

  function cancelGuestPointerDrag() {
    if (pointerGuestDrag?.ghost) pointerGuestDrag.ghost.remove();
    pointerGuestDrag = null;
    clearDropHighlights();
    document.body.classList.remove('guest-pointer-dragging');
  }

  function positionGuestGhost(clientX, clientY) {
    if (!pointerGuestDrag) return;
    pointerGuestDrag.ghost.style.left = `${clientX + 14}px`;
    pointerGuestDrag.ghost.style.top = `${clientY + 14}px`;
  }

  function clearDropHighlights() {
    highlightedDropSeat = null;
    document.querySelectorAll('.drag-over, .table-drop-target').forEach(el => el.classList.remove('drag-over', 'table-drop-target'));
  }

  function assignGuestToFirstEmpty(guestId, tableId) {
    const table = getTable(tableId);
    if (!table) return;
    const firstEmpty = table.seats.findIndex(v => !v);
    if (firstEmpty === -1) return toast(`${table.name} is full.`);
    assignGuestToSeat(guestId, table.id, firstEmpty);
  }

  function assignGuestToSeat(guestId, destinationTableId, destinationSeatIndex) {
    const destTable = getTable(destinationTableId);
    if (!destTable || !getGuest(guestId) || destinationSeatIndex < 0 || destinationSeatIndex >= destTable.capacity) return;

    const current = findGuestSeat(guestId);
    const displacedGuestId = destTable.seats[destinationSeatIndex];

    if (current && current.table.id === destinationTableId && current.seatIndex === destinationSeatIndex) return;

    if (displacedGuestId && current) {
      current.table.seats[current.seatIndex] = displacedGuestId;
      destTable.seats[destinationSeatIndex] = guestId;
    } else {
      if (current) current.table.seats[current.seatIndex] = null;
      destTable.seats[destinationSeatIndex] = guestId;
    }

    commit({ message: 'Seat assignment saved' });
  }

  function findGuestSeat(guestId) {
    for (const table of state.tables) {
      const seatIndex = table.seats.indexOf(guestId);
      if (seatIndex >= 0) return { table, seatIndex };
    }
    return null;
  }

  function getAssignments() {
    const map = new Map();
    state.tables.forEach(table => {
      table.seats.forEach((guestId, seatIndex) => {
        if (guestId) map.set(guestId, { table, seatIndex });
      });
    });
    return map;
  }

  function startTableMove(event, tableId) {
    if (event.button !== 0) return;
    const table = getTable(tableId);
    const el = event.currentTarget.closest('.table-item');
    if (!table || !el) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const scale = uiZoom / 100;
    movingTable = {
      table,
      el,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: table.x,
      startY: table.y,
      scale,
      moved: false
    };
    el.classList.add('is-moving');
  }

  function onTablePointerMove(event) {
    if (!movingTable || event.pointerId !== movingTable.pointerId) return;
    const { table, el, startClientX, startClientY, startX, startY, scale } = movingTable;
    const rawDx = event.clientX - startClientX;
    const rawDy = event.clientY - startClientY;
    if (Math.hypot(rawDx, rawDy) > 4) movingTable.moved = true;
    if (!movingTable.moved) return;

    const dx = rawDx / scale;
    const dy = rawDy / scale;
    const w = table.type === 'head' ? HEAD_W : ROUND_W;
    const h = table.type === 'head' ? HEAD_H : ROUND_H;
    table.x = snap(clamp(startX + dx, 0, CANVAS_W - w));
    table.y = snap(clamp(startY + dy, 0, CANVAS_H - h));
    el.style.left = `${table.x}px`;
    el.style.top = `${table.y}px`;
    highlightRoomForTable(table);
  }

  function onTablePointerUp(event) {
    if (!movingTable || (event.pointerId !== undefined && event.pointerId !== movingTable.pointerId)) return;
    const { table, moved } = movingTable;
    movingTable.el.classList.remove('is-moving');
    document.querySelectorAll('.room').forEach(r => r.classList.remove('drag-over'));

    if (moved) {
      const detected = detectRoom(table);
      if (detected) table.room = detected;
      movingTable = null;
      commit({ guests: false, message: 'Table position saved' });
    } else {
      movingTable = null;
      openTableDialog(table.id);
    }
  }

  function detectRoom(table) {
    const w = table.type === 'head' ? HEAD_W : ROUND_W;
    const h = table.type === 'head' ? HEAD_H : ROUND_H;
    const cx = table.x + w / 2;
    const cy = table.y + h / 2;
    let bestRoom = null;
    let bestDist = Infinity;

    Object.entries(ROOM_BOUNDS).forEach(([name, b]) => {
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        bestRoom = name;
        bestDist = -1;
        return;
      }
      if (bestDist === -1) return;
      const rcx = b.x + b.w / 2;
      const rcy = b.y + b.h / 2;
      const dist = Math.hypot(cx - rcx, cy - rcy);
      if (dist < bestDist) { bestDist = dist; bestRoom = name; }
    });
    return bestRoom;
  }

  function highlightRoomForTable(table) {
    const room = detectRoom(table);
    document.querySelectorAll('.room').forEach(el => el.classList.toggle('drag-over', el.dataset.room === room));
  }

  function openTableDialog(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    els.editingTableId.value = table.id;
    els.tableDialogTitle.textContent = `Edit ${table.name}`;
    els.tableNameInput.value = table.name;
    els.tableRoomInput.value = table.room;
    els.tableDialog.showModal();
    setTimeout(() => els.tableNameInput.select(), 0);
  }

  function openGuestDialog(guestId) {
    const guest = getGuest(guestId);
    if (!guest) return;
    const assignment = findGuestSeat(guest.id);
    els.editingGuestId.value = guest.id;
    els.guestDialogTitle.textContent = guest.name;
    els.guestNameInput.value = guest.name;
    els.guestGroupInput.value = guest.group || '';
    els.guestMealInput.value = guest.meal || '';
    els.guestNotesInput.value = guest.notes || '';
    els.guestAssignmentSummary.textContent = assignment
      ? `${assignment.table.name} · ${roomLabel(assignment.table.room)} · Seat ${assignment.seatIndex + 1}`
      : 'Currently unseated';
    els.unseatGuestBtn.disabled = !assignment;
    els.guestDialog.showModal();
  }

  function openAssignDialog(tableId, seatIndex) {
    const table = getTable(tableId);
    if (!table) return;
    pendingSeat = { tableId, seatIndex };
    els.assignDialogTitle.textContent = `Assign ${table.name} · Seat ${seatIndex + 1}`;
    els.assignSeatSummary.textContent = `Choose a guest below, or close this window and drag a guest directly onto seat ${seatIndex + 1}.`;
    els.assignGuestSearch.value = '';
    renderAssignGuestList();
    els.assignDialog.showModal();
    setTimeout(() => els.assignGuestSearch.focus(), 0);
  }

  function renderAssignGuestList() {
    if (!pendingSeat) return;
    const query = els.assignGuestSearch.value.trim().toLowerCase();
    const assignments = getAssignments();
    const matches = [...state.guests]
      .filter(g => !query || `${g.name} ${g.group || ''} ${g.meal || ''}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    els.assignGuestList.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No guests match that search.';
      els.assignGuestList.appendChild(empty);
      return;
    }

    matches.forEach(guest => {
      const assignment = assignments.get(guest.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'assign-guest-option';
      const strong = document.createElement('strong');
      strong.textContent = guest.name;
      const meta = document.createElement('span');
      meta.textContent = assignment ? `${assignment.table.name} · Seat ${assignment.seatIndex + 1} (will move)` : 'Unseated';
      button.append(strong, meta);
      button.addEventListener('click', () => {
        if (!pendingSeat) return;
        assignGuestToSeat(guest.id, pendingSeat.tableId, pendingSeat.seatIndex);
        els.assignDialog.close();
        pendingSeat = null;
      });
      els.assignGuestList.appendChild(button);
    });
  }

  function fitSelectedRoom() {
    const room = els.targetRoom.value || 'center';
    const bounds = ROOM_BOUNDS[room];
    const available = Math.max(240, els.canvasScroll.clientWidth - 28);
    uiZoom = clamp(Math.floor((available / (bounds.w + 40)) * 100 / 5) * 5, 45, 140);
    localStorage.setItem(ZOOM_KEY, String(uiZoom));
    applyZoom();
    requestAnimationFrame(() => scrollToRoom(room));
  }

  function scrollToRoom(room) {
    const bounds = ROOM_BOUNDS[room];
    if (!bounds) return;
    const scale = uiZoom / 100;
    const targetLeft = Math.max(0, (bounds.x - 20) * scale - 8);
    const targetTop = Math.max(0, (bounds.y - 45) * scale - 8);
    els.canvasScroll.scrollTo({ left: targetLeft, top: targetTop, behavior: 'smooth' });
  }

  function exportBackup() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `wedding-seating-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || !Array.isArray(imported.guests) || !Array.isArray(imported.tables)) throw new Error('Invalid backup');
      if (!confirm('Replace the current seating chart with this backup?')) return;
      state = imported;
      normalizeState();
      renderAll();
      saveState('Backup imported');
      toast('Backup imported successfully.');
    } catch (err) {
      alert('That file does not look like a valid seating planner backup.');
      console.error(err);
    }
  }

  function resetAll() {
    if (!confirm('Reset the entire seating chart? This removes all guests and tables from the shared Supabase chart too. Export a backup first if you may need it.')) return;
    state = emptyState();
    renderAll();
    saveState('Chart reset');
  }

  function applyZoom() {
    uiZoom = clamp(Number(uiZoom) || 100, 45, 140);
    els.zoomRange.value = String(uiZoom);
    els.zoomValue.textContent = `${uiZoom}%`;
    els.canvasZoom.style.transform = `scale(${uiZoom / 100})`;
    els.canvasZoom.style.width = `${CANVAS_W * uiZoom / 100}px`;
    els.canvasZoom.style.height = `${CANVAS_H * uiZoom / 100}px`;
  }

  function getGuest(id) { return state.guests.find(g => g.id === id); }
  function getTable(id) { return state.tables.find(t => t.id === id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function snap(v) { return Math.round(v / GRID) * GRID; }

  function shortName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 5);
    return `${parts[0].slice(0, 3)} ${parts.at(-1).charAt(0)}.`;
  }

  function roomLabel(room) {
    return room === 'east' ? 'East Room' : room === 'west' ? 'West Room' : 'Center Room';
  }

  function toast(message) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
})();
