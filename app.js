(function () {
  'use strict';

  var STORAGE_KEY = 'calendar.days';
  var LEGACY_KEY = 'calendar.selectedDays';
  var ACTIVE_KEY = 'calendar.activeCategory';
  var ALL = 'all';
  var CATEGORIES = [
    { id: 'vacation', label: 'Vacation' },
    { id: 'on-duty', label: 'On-Duty' }
  ];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function dateKey(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

  // ISO 8601 week number: weeks start Monday, week 1 contains Jan 4.
  function isoWeek(y, m, d) {
    var date = new Date(Date.UTC(y, m, d));
    var dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum); // Thursday of this week
    var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  }

  function isCategory(id) {
    return CATEGORIES.some(function (c) { return c.id === id; });
  }

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  function loadDays() {
    try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* ignore */ }
    var days = new Map();
    try {
      var obj = JSON.parse(storageGet(STORAGE_KEY) || '{}');
      Object.keys(obj).forEach(function (k) { if (isCategory(obj[k])) days.set(k, obj[k]); });
    } catch (e) { /* corrupt data: start empty */ }
    return days;
  }

  function saveDays() {
    var obj = {};
    days.forEach(function (cat, k) { obj[k] = cat; });
    storageSet(STORAGE_KEY, JSON.stringify(obj));
  }

  var days = loadDays();
  var storedActive = storageGet(ACTIVE_KEY);
  var active = storedActive === ALL || isCategory(storedActive) ? storedActive : CATEGORIES[0].id;
  var now = new Date();
  var todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  var currentYear = now.getFullYear();

  var calendarEl = document.getElementById('calendar');
  var titleEl = document.getElementById('year-title');
  var countEl = document.getElementById('selected-count');
  var yearCountEl = document.getElementById('selected-year-count');
  var catCountsEl = document.getElementById('category-counts');
  var pickerEl = document.getElementById('category-picker');

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function applyDayState(btn) {
    var cat = days.get(btn.dataset.date) || null;
    btn.classList.toggle('selected', !!cat);
    if (cat) btn.dataset.cat = cat; else delete btn.dataset.cat;
    btn.setAttribute('aria-pressed', String(!!cat));
  }

  function renderMonth(year, month) {
    var section = el('section', 'month');
    section.appendChild(el('h2', null, MONTHS[month]));

    var table = el('table');
    var headRow = el('tr');
    headRow.appendChild(el('th', 'week-num', 'Wk'));
    WEEKDAYS.forEach(function (w) { headRow.appendChild(el('th', null, w)); });
    table.appendChild(el('thead')).appendChild(headRow);

    var tbody = el('tbody');
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
    var day = 1 - offset;

    while (day <= daysInMonth) {
      var row = el('tr');
      // Use the first in-month day of the row for the week number.
      var weekNo = isoWeek(year, month, Math.max(day, 1));
      var weekBtn = el('button', 'week-btn', String(weekNo));
      weekBtn.type = 'button';
      weekBtn.setAttribute('aria-label', 'Toggle working days of week ' + weekNo);
      // Disable when no Mon–Fri of this row falls inside the month.
      if (Math.max(day, 1) > Math.min(day + 4, daysInMonth)) weekBtn.disabled = true;
      row.appendChild(el('td', 'week-num')).appendChild(weekBtn);
      for (var i = 0; i < 7; i++, day++) {
        var cell = el('td');
        if (day >= 1 && day <= daysInMonth) {
          var btn = el('button', 'day', String(day));
          btn.type = 'button';
          btn.dataset.date = dateKey(year, month, day);
          if (i >= 5) btn.classList.add('weekend');
          if (btn.dataset.date === todayKey) btn.classList.add('today');
          btn.setAttribute('aria-label', day + ' ' + MONTHS[month] + ' ' + year);
          applyDayState(btn);
          cell.appendChild(btn);
        }
        row.appendChild(cell);
      }
      refreshWeekState(row);
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    section.appendChild(table);
    return section;
  }

  function render() {
    titleEl.textContent = String(currentYear);
    document.title = 'Calendar ' + currentYear;
    var frag = document.createDocumentFragment();
    for (var m = 0; m < 12; m++) frag.appendChild(renderMonth(currentYear, m));
    calendarEl.replaceChildren(frag);
    applyFilter();
    updateCounter();
  }

  function renderPicker() {
    var options = [{ id: ALL, label: 'All' }].concat(CATEGORIES);
    var frag = document.createDocumentFragment();
    options.forEach(function (o) {
      var chip = el('button', 'chip chip-' + o.id, o.label);
      chip.type = 'button';
      chip.dataset.cat = o.id;
      frag.appendChild(chip);
    });
    pickerEl.replaceChildren(frag);
  }

  function applyFilter() {
    CATEGORIES.forEach(function (c) {
      calendarEl.classList.toggle('filter-' + c.id, active === c.id);
    });
    calendarEl.classList.toggle('mode-all', active === ALL);
    Array.prototype.forEach.call(pickerEl.querySelectorAll('button.chip'), function (chip) {
      var on = chip.dataset.cat === active;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  }

  function updateCounter() {
    var prefix = currentYear + '-';
    var inYear = 0;
    var perCat = {};
    CATEGORIES.forEach(function (c) { perCat[c.id] = 0; });
    days.forEach(function (cat, k) {
      perCat[cat]++;
      if (k.indexOf(prefix) === 0) inYear++;
    });
    countEl.textContent = String(days.size);
    yearCountEl.textContent = inYear !== days.size ? '(' + inYear + ' in ' + currentYear + ')' : '';
    catCountsEl.textContent = CATEGORIES.map(function (c) {
      return c.label + ' ' + perCat[c.id];
    }).join(' · ');
  }

  function setCategory(btn, cat) {
    if (cat) days.set(btn.dataset.date, cat); else days.delete(btn.dataset.date);
    applyDayState(btn);
  }

  function workdayButtons(row) {
    return Array.prototype.filter.call(row.querySelectorAll('button.day'), function (b) {
      return !b.classList.contains('weekend');
    });
  }

  // Full = all in-month weekdays carry the active category (any category in "All" mode).
  function refreshWeekState(row) {
    var weekBtn = row.querySelector('button.week-btn');
    var wd = workdayButtons(row);
    var full = wd.length > 0 && wd.every(function (b) {
      var cat = days.get(b.dataset.date);
      return active === ALL ? !!cat : cat === active;
    });
    weekBtn.classList.toggle('full', full);
    weekBtn.setAttribute('aria-pressed', String(full));
  }

  function commit(row) {
    refreshWeekState(row);
    saveDays();
    updateCounter();
  }

  calendarEl.addEventListener('click', function (e) {
    if (active === ALL) return;
    var weekBtn = e.target.closest('button.week-btn');
    if (weekBtn) {
      var row = weekBtn.closest('tr');
      var wd = workdayButtons(row);
      if (wd.length === 0) return;
      var allActive = wd.every(function (b) { return days.get(b.dataset.date) === active; });
      wd.forEach(function (b) { setCategory(b, allActive ? null : active); });
      commit(row);
      return;
    }
    var btn = e.target.closest('button.day');
    if (!btn) return;
    setCategory(btn, days.get(btn.dataset.date) === active ? null : active);
    commit(btn.closest('tr'));
  });

  pickerEl.addEventListener('click', function (e) {
    var chip = e.target.closest('button.chip');
    if (!chip || chip.dataset.cat === active) return;
    active = chip.dataset.cat;
    storageSet(ACTIVE_KEY, active);
    render();
  });

  document.getElementById('prev-year').addEventListener('click', function () {
    currentYear--; render();
  });
  document.getElementById('next-year').addEventListener('click', function () {
    currentYear++; render();
  });
  document.getElementById('clear-all').addEventListener('click', function () {
    if (days.size === 0) return;
    if (!window.confirm('Clear all ' + days.size + ' selected day(s)?')) return;
    days.clear();
    saveDays();
    render();
  });

  renderPicker();
  render();
})();
