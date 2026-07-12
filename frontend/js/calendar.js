// calendar.js — Monthly calendar showing saved, missed days, and expenses

const CalendarView = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),

  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Calendar</h1>
        <p class="page-subtitle">Your daily savings and expense history</p>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap items-center gap-4 text-xs" style="color:var(--text-secondary)">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background:rgba(34,197,94,0.4);display:inline-block"></span>Saved</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded" style="background:rgba(239,68,68,0.25);display:inline-block"></span>Missed</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full border-2" style="border-color:var(--color-violet);display:inline-block"></span>Today</span>
        <span class="flex items-center gap-1.5"><span class="text-sm">💸</span>Has expenses</span>
      </div>

      <!-- Calendar Card -->
      <div class="card">
        <!-- Month Navigation -->
        <div class="flex items-center justify-between mb-5">
          <button onclick="CalendarView.prevMonth()" class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="font-outfit font-bold text-lg" id="cal-month-label"></h2>
          <button onclick="CalendarView.nextMonth()" class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <!-- Day Headers -->
        <div class="grid grid-cols-7 mb-2">
          ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
            `<div class="text-center text-xs font-semibold py-1" style="color:var(--text-tertiary)">${d}</div>`
          ).join('')}
        </div>

        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-1" id="cal-grid">
          <div class="skeleton h-10 col-span-7 rounded-xl"></div>
        </div>

        <!-- Month Summary -->
        <div class="mt-4 pt-4 border-t" style="border-color:var(--color-border)">
          <div class="grid grid-cols-4 gap-2 text-center">
            <div>
              <p class="font-outfit font-bold" style="color:var(--color-green)" id="cal-saved-days">0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Saved</p>
            </div>
            <div>
              <p class="font-outfit font-bold" style="color:var(--color-red)" id="cal-missed-days">0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Missed</p>
            </div>
            <div>
              <p class="font-outfit font-bold" style="color:var(--color-teal)" id="cal-total-saved">₹0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Total Saved</p>
            </div>
            <div>
              <p class="font-outfit font-bold" style="color:var(--color-red)" id="cal-total-spent">₹0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Total Spent</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Day Detail Panel -->
      <div id="cal-detail" class="card hidden">
        <div class="flex items-center justify-between mb-3">
          <h3 class="section-title mb-0" id="cal-detail-date">—</h3>
          <button onclick="document.getElementById('cal-detail').classList.add('hidden')" class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div id="cal-detail-body"></div>
      </div>
    </div>
    `;
  },

  async init() {
    this.uid = getUID();
    this.year = new Date().getFullYear();
    this.month = new Date().getMonth();
    await this.renderCalendar();
  },

  prevMonth() {
    this.month--;
    if (this.month < 0) { this.month = 11; this.year--; }
    this.renderCalendar();
  },

  nextMonth() {
    this.month++;
    if (this.month > 11) { this.month = 0; this.year++; }
    this.renderCalendar();
  },

  async renderCalendar() {
    const uid = this.uid;
    const { year, month } = this;
    const today = getTodayStr();

    const label = document.getElementById('cal-month-label');
    if (label) label.textContent = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const grid = document.getElementById('cal-grid');
    if (!grid) return;

    // Fetch this month's data
    const startDate = getDateStr(new Date(year, month, 1));
    const endDate = getDateStr(new Date(year, month + 1, 0));

    try {
      // Savings
      const savSnap = await FS.savingsCol(uid)
        .where(firebase.firestore.FieldPath.documentId(), '>=', startDate)
        .where(firebase.firestore.FieldPath.documentId(), '<=', endDate)
        .get();
      const savedMap = {};
      let totalSaved = 0;
      savSnap.forEach(d => { savedMap[d.id] = d.data().amount || 0; totalSaved += d.data().amount || 0; });

      // Expenses (aggregate by date)
      const exSnap = await FS.expensesCol(uid).where('date', '>=', startDate).where('date', '<=', endDate).get();
      const expenseMap = {};
      let totalSpent = 0;
      exSnap.forEach(d => {
        const dt = d.data().date;
        expenseMap[dt] = (expenseMap[dt] || 0) + (d.data().amount || 0);
        totalSpent += d.data().amount || 0;
      });

      // Build grid
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMon = new Date(year, month + 1, 0).getDate();
      let savedDays = 0, missedDays = 0;

      let html = '';
      // Empty cells before first day
      for (let i = 0; i < firstDay; i++) html += '<div></div>';

      for (let day = 1; day <= daysInMon; day++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isToday = dateStr === today;
        const isPast = dateStr < today;
        const isSaved = savedMap[dateStr] !== undefined;
        const hasExpenses = expenseMap[dateStr] !== undefined;

        if (isSaved) savedDays++;
        else if (isPast && !isToday) missedDays++;

        let cellStyle = '';
        let textStyle = '';
        if (isSaved) { cellStyle = 'background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.2)'; textStyle = 'color:#4ade80'; }
        else if (isPast && !isToday) { cellStyle = 'background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.1)'; textStyle = 'color:#f87171;opacity:0.7'; }
        if (isToday) cellStyle += ';outline:2px solid var(--color-violet);outline-offset:1px';

        html += `<div class="cal-day text-sm relative" style="${cellStyle}" onclick="CalendarView.showDayDetail('${dateStr}', ${savedMap[dateStr] || 0}, ${expenseMap[dateStr] || 0})">
          <span style="${textStyle}">${day}</span>
          ${hasExpenses ? '<span class="absolute bottom-0.5 right-0.5 text-[8px]">💸</span>' : ''}
          ${isSaved ? '<span class="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-green-400"></span>' : ''}
        </div>`;
      }

      grid.innerHTML = html;

      // Update stats
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      set('cal-saved-days', savedDays);
      set('cal-missed-days', missedDays);
      set('cal-total-saved', formatCurrency(totalSaved));
      set('cal-total-spent', formatCurrency(totalSpent));
    } catch(e) {
      grid.innerHTML = '<p class="col-span-7 text-center py-4 text-sm" style="color:var(--text-secondary)">Failed to load calendar</p>';
    }
  },

  showDayDetail(dateStr, savedAmt, spentAmt) {
    const panel = document.getElementById('cal-detail');
    const dateLabel = document.getElementById('cal-detail-date');
    const body = document.getElementById('cal-detail-body');
    if (!panel || !dateLabel || !body) return;

    dateLabel.textContent = formatDate(dateStr);
    body.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3 rounded-xl" style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2)">
          <p class="text-xs mb-1" style="color:var(--text-secondary)">Saved</p>
          <p class="font-outfit font-bold" style="color:var(--color-green)">${savedAmt > 0 ? formatCurrency(savedAmt) : '₹0 (Missed)'}</p>
        </div>
        <div class="p-3 rounded-xl" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">
          <p class="text-xs mb-1" style="color:var(--text-secondary)">Spent</p>
          <p class="font-outfit font-bold" style="color:var(--color-red)">${spentAmt > 0 ? formatCurrency(spentAmt) : '₹0'}</p>
        </div>
      </div>
      <div class="mt-3 flex gap-2">
        <a href="#/savings" class="btn-sm btn-secondary flex-1 justify-center text-center" style="display:block">
          ${savedAmt > 0 ? '✓ Saved' : '+ Save Now'}
        </a>
        <a href="#/expenses" class="btn-sm btn-secondary flex-1 justify-center text-center" style="display:block">View Expenses</a>
      </div>
    `;
    panel.classList.remove('hidden');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
};
