(() => {
  'use strict';

  const STORAGE_KEY = 'weddingSeatingPlanner.v1';
  const GRID = 10;
  const CANVAS_W = 1220;
  const CANVAS_H = 760;

  const ROOM_BOUNDS = {
    east:   { x: 35,  y: 170, w: 370, h: 420 },
    center: { x: 399, y: 92,  w: 430, h: 410 },
    west:   { x: 823, y: 170, w: 360, h: 420 }
  };

  const els = {
    floorCanvas: document.getElementById('floorCanvas'),
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
    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    canvasZoom: document.getElementById('canvasZoom')
  };

  let dragPayload = null;
  let movingTable = null;
  let saveFlashTimer = null;

  let state = loadState() || {
    version: 1,
    guests: [],
    tables: [],
    counters: { table: 1 },
    settings: { zoom: 100 }
  };

  normalizeState();
  bindEvents();
  renderAll();

  function uid(prefix) {
    if (crypto && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function normalizeState() {
    state.version = 1;
    state.guests = Array.isArray(state.guests) ? state.guests : [];
    state.tables = Array.isArray(state.tables) ? state.tables : [];
    state.counters = state.counters || { table: state.tables.length + 1 };
    state.settings = state.settings || { zoom: 100 };
    if (!Number.isFinite(state.settings.zoom)) state.settings.zoom = 100;

    state.tables.forEach(table => {
      table.seats = Array.isArray(table.seats) ? table.seats : Array(table.capacity || 10).fill(null);
      while (table.seats.length < table.capacity) table.seats.push(null);
      if (table.seats.length > table.capacity) table.seats = table.seats.slice(0, table.capacity);
    });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Could not load seating chart', err);
      return null;
    }
  }

  function saveState(message = 'Saved locally') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const now = new Date();
      els.saveStatus.querySelector('span:last-child').textContent = `${message} · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      els.saveStatus.classList.add('saved-flash');
      clearTimeout(saveFlashTimer);
      saveFlashTimer = setTimeout(() => els.saveStatus.classList.remove('saved-flash'), 600);
    } catch (err) {
      els.saveStatus.querySelector('span:last-child').textContent = 'Could not save locally';
      console.error(err);
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
      lines.forEach(line => {
        const [name, group = '', meal = ''] = line.split('|').map(v => v.trim());
        if (name) state.guests.push({ id: uid('guest'), name, group, meal });
      });
      els.bulkGuestText.value = '';
      els.bulkDialog.close();
      commit({ message: `Added ${lines.length} guests` });
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
      if (!table) return;
      const occupied = table.seats.filter(Boolean).length;
      const warning = occupied ? ` This will unseat ${occupied} guest${occupied === 1 ? '' : 's'}.` : '';
      if (!confirm(`Delete ${table.name}?${warning}`)) return;
      state.tables = state.tables.filter(t => t.id !== table.id);
      els.tableDialog.close();
      commit({ message: 'Table deleted' });
    });

    els.exportBtn.addEventListener('click', exportBackup);
    els.importFile.addEventListener('change', importBackup);
    els.resetBtn.addEventListener('click', resetAll);

    els.zoomRange.addEventListener('input', () => {
      state.settings.zoom = Number(els.zoomRange.value);
      applyZoom();
      saveState('Zoom saved');
    });

    window.addEventListener('beforeunload', () => saveState());
    window.addEventListener('pointermove', onTablePointerMove);
    window.addEventListener('pointerup', onTablePointerUp);
  }

  function addGuest({ name, group = '', meal = '' }) {
    const clean = name.trim();
    if (!clean) return;
    state.guests.push({ id: uid('guest'), name: clean, group, meal });
    commit({ message: 'Guest added' });
  }

  function removeGuest(guestId) {
    const guest = getGuest(guestId);
    if (!guest) return;
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return;
    state.tables.forEach(t => t.seats = t.seats.map(id => id === guestId ? null : id));
    state.guests = state.guests.filter(g => g.id !== guestId);
    commit({ message: 'Guest removed' });
  }

  function addTable(type, capacity, room) {
    if (type === 'head' && state.tables.some(t => t.type === 'head')) {
      if (!confirm('A head table already exists. Add another one anyway?')) return;
    }

    const position = getDefaultPosition(room, type);
    const number = state.counters.table++;
    const table = {
      id: uid('table'),
      type,
      capacity,
      room,
      name: type === 'head' ? 'Head Table' : `Table ${number}`,
      x: position.x,
      y: position.y,
      seats: Array(capacity).fill(null)
    };
    state.tables.push(table);
    commit({ guests: false, message: 'Table added' });
  }

  function getDefaultPosition(room, type) {
    const bounds = ROOM_BOUNDS[room];
    const isHead = type === 'head';
    const w = isHead ? 460 : 164;
    const h = isHead ? 150 : 164;
    const sameRoomCount = state.tables.filter(t => t.room === room).length;
    const col = sameRoomCount % (isHead ? 1 : 2);
    const row = Math.floor(sameRoomCount / (isHead ? 1 : 2));
    const x = clamp(bounds.x + 35 + col * 170, bounds.x - 20, bounds.x + bounds.w - w + 25);
    const y = clamp(bounds.y + 70 + row * 165, bounds.y - 20, bounds.y + bounds.h - h + 25);
    return { x: snap(x), y: snap(y) };
  }

  function autoPlaceTables() {
    const roomTables = {
      east: state.tables.filter(t => t.room === 'east'),
      center: state.tables.filter(t => t.room === 'center'),
      west: state.tables.filter(t => t.room === 'west')
    };

    Object.entries(roomTables).forEach(([room, tables]) => {
      const bounds = ROOM_BOUNDS[room];
      const heads = tables.filter(t => t.type === 'head');
      const rounds = tables.filter(t => t.type !== 'head');
      let startY = bounds.y + 70;

      heads.forEach((table, i) => {
        table.x = snap(clamp(bounds.x + (bounds.w - 460) / 2, 0, CANVAS_W - 460));
        table.y = snap(clamp(Math.max(20, bounds.y + 42 + i * 145), 0, CANVAS_H - 150));
        startY = Math.max(startY, table.y + 155);
      });

      const cols = Math.max(1, Math.floor((bounds.w - 25) / 165));
      rounds.forEach((table, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        table.x = snap(bounds.x + 8 + col * 170);
        table.y = snap(startY + row * 168);
        table.x = clamp(table.x, 0, CANVAS_W - 164);
        table.y = clamp(table.y, 0, CANVAS_H - 164);
      });
    });

    commit({ guests: false, message: 'Tables auto-placed' });
    toast('Tables arranged by room. You can still drag them anywhere.');
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
        const haystack = `${guest.name} ${guest.group || ''} ${guest.meal || ''} ${a ? a.table.name : ''}`.toLowerCase();
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
      handle.innerHTML = `<strong></strong><span>${count}/${table.capacity} seated</span>`;
      handle.querySelector('strong').textContent = table.name;
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
        const firstEmpty = table.seats.findIndex(v => !v);
        if (firstEmpty === -1) return toast(`${table.name} is full.`);
        assignGuestToSeat(dragPayload.guestId, table.id, firstEmpty);
      });
      wrapper.appendChild(handle);

      const menu = document.createElement('button');
      menu.className = 'table-menu';
      menu.type = 'button';
      menu.title = 'Edit table';
      menu.textContent = '⋯';
      menu.addEventListener('pointerdown', e => e.stopPropagation());
      menu.addEventListener('click', () => openTableDialog(table.id));
      wrapper.appendChild(menu);

      if (table.type === 'head') renderHeadSeats(wrapper, table);
      else renderRoundSeats(wrapper, table);

      els.tableLayer.appendChild(wrapper);
    });
  }

  function renderRoundSeats(wrapper, table) {
    const centerX = 82;
    const centerY = 82;
    const radius = 67;
    for (let i = 0; i < table.capacity; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI / table.capacity);
      const x = centerX + Math.cos(angle) * radius - 17;
      const y = centerY + Math.sin(angle) * radius - 17;
      wrapper.appendChild(createSeat(table, i, x, y));
    }
  }

  function renderHeadSeats(wrapper, table) {
    // 22 seats total: 12 on the couple's side, 10 opposite with a central gap.
    // The two central top positions are marked Bride/Groom; no seats are placed directly opposite that gap.
    const topXs = Array.from({ length: 12 }, (_, i) => 18 + i * 36.5);
    const bottomXs = [18, 56, 94, 132, 170, 272, 310, 348, 386, 424];

    topXs.forEach((x, i) => {
      const special = i === 5 ? 'Bride' : i === 6 ? 'Groom' : '';
      wrapper.appendChild(createSeat(table, i, x, 1, special));
    });
    bottomXs.forEach((x, i) => {
      wrapper.appendChild(createSeat(table, 12 + i, x, 115));
    });
  }

  function createSeat(table, seatIndex, x, y, specialLabel = '') {
    const seat = document.createElement('div');
    const guestId = table.seats[seatIndex];
    const guest = guestId ? getGuest(guestId) : null;

    seat.className = 'seat';
    seat.dataset.tableId = table.id;
    seat.dataset.seatIndex = String(seatIndex);
    seat.dataset.occupied = guest ? 'true' : 'false';
    if (specialLabel) seat.dataset.special = 'true';
    seat.style.left = `${x}px`;
    seat.style.top = `${y}px`;
    seat.title = guest ? `${guest.name} — ${table.name}, seat ${seatIndex + 1}` : `${table.name}, seat ${seatIndex + 1}`;

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
    } else {
      const num = document.createElement('span');
      num.className = 'seat-number';
      num.textContent = seatIndex + 1;
      seat.appendChild(num);
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

    // Double-click an occupied seat to unseat that person.
    seat.addEventListener('dblclick', () => {
      if (!table.seats[seatIndex]) return;
      table.seats[seatIndex] = null;
      commit({ message: 'Guest unseated' });
    });

    return seat;
  }

  function startGuestDrag(event, guestId) {
    dragPayload = { type: 'guest', guestId };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', guestId);
    event.currentTarget.classList.add('dragging');
  }

  function endGuestDrag(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.drag-over, .table-drop-target').forEach(el => el.classList.remove('drag-over', 'table-drop-target'));
    dragPayload = null;
  }

  function assignGuestToSeat(guestId, destinationTableId, destinationSeatIndex) {
    const destTable = getTable(destinationTableId);
    if (!destTable || !getGuest(guestId)) return;

    const current = findGuestSeat(guestId);
    const displacedGuestId = destTable.seats[destinationSeatIndex];

    if (current && current.table.id === destinationTableId && current.seatIndex === destinationSeatIndex) return;

    // If destination is occupied and dragged guest was already seated, swap.
    if (displacedGuestId && current) {
      current.table.seats[current.seatIndex] = displacedGuestId;
      destTable.seats[destinationSeatIndex] = guestId;
    } else {
      // Otherwise remove dragged guest from their old seat, and unseat destination occupant if any.
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
    const scale = state.settings.zoom / 100;
    movingTable = {
      table,
      el,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: table.x,
      startY: table.y,
      scale
    };
    el.classList.add('is-moving');
  }

  function onTablePointerMove(event) {
    if (!movingTable) return;
    const { table, el, startClientX, startClientY, startX, startY, scale } = movingTable;
    const dx = (event.clientX - startClientX) / scale;
    const dy = (event.clientY - startClientY) / scale;
    const w = table.type === 'head' ? 460 : 164;
    const h = table.type === 'head' ? 150 : 164;
    table.x = snap(clamp(startX + dx, 0, CANVAS_W - w));
    table.y = snap(clamp(startY + dy, 0, CANVAS_H - h));
    el.style.left = `${table.x}px`;
    el.style.top = `${table.y}px`;
    highlightRoomForTable(table);
  }

  function onTablePointerUp() {
    if (!movingTable) return;
    const table = movingTable.table;
    movingTable.el.classList.remove('is-moving');
    document.querySelectorAll('.room').forEach(r => r.classList.remove('drag-over'));
    const detected = detectRoom(table);
    if (detected) table.room = detected;
    movingTable = null;
    commit({ guests: false, message: 'Table position saved' });
  }

  function detectRoom(table) {
    const w = table.type === 'head' ? 460 : 164;
    const h = table.type === 'head' ? 150 : 164;
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
    if (!confirm('Reset the entire seating chart? This removes all guests and tables from this browser. Export a backup first if you may need it.')) return;
    state = { version: 1, guests: [], tables: [], counters: { table: 1 }, settings: { zoom: 100 } };
    renderAll();
    saveState('Chart reset');
  }

  function applyZoom() {
    const zoom = clamp(Number(state.settings.zoom) || 100, 70, 125);
    state.settings.zoom = zoom;
    els.zoomRange.value = String(zoom);
    els.zoomValue.textContent = `${zoom}%`;
    els.canvasZoom.style.transform = `scale(${zoom / 100})`;
    // Maintain scrollable extents after CSS transform.
    els.canvasZoom.style.width = `${CANVAS_W * zoom / 100}px`;
    els.canvasZoom.style.height = `${CANVAS_H * zoom / 100}px`;
  }

  function getGuest(id) { return state.guests.find(g => g.id === id); }
  function getTable(id) { return state.tables.find(t => t.id === id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function snap(v) { return Math.round(v / GRID) * GRID; }

  function shortName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 6);
    return `${parts[0].slice(0, 4)} ${parts.at(-1).charAt(0)}.`;
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
