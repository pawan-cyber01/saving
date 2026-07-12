// savings.js — Daily savings tracking, streak, UPI, and calendar heatmap

const Savings = {
  render() {
    const today = formatDate(getTodayStr());
    return `
    <div class="space-y-6 animate-stagger">
      <!-- Header -->
      <div>
        <h1 class="page-title">Daily Savings</h1>
        <p class="page-subtitle">${today}</p>
      </div>

      <!-- Streak Card -->
      <div class="card" style="background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(249,115,22,0.08));border-color:rgba(245,158,11,0.25)">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:rgba(245,158,11,0.7)">Current Streak</p>
            <div class="flex items-center gap-2">
              <span class="streak-flame" style="font-size:2.5rem">🔥</span>
              <div>
                <p class="font-outfit font-bold text-4xl" style="color:#fbbf24" id="sv-streak-num">0</p>
                <p class="text-xs" style="color:var(--text-secondary)">days in a row</p>
              </div>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs mb-1" style="color:var(--text-secondary)">Best Streak</p>
            <p class="font-outfit font-bold text-xl" style="color:#fbbf24" id="sv-best-streak">0</p>
            <p class="text-xs mt-2" style="color:var(--text-secondary)">This month</p>
            <p class="font-outfit font-semibold" style="color:var(--color-green)" id="sv-month-count">0 days saved</p>
          </div>
        </div>
      </div>

      <!-- Today's Status -->
      <div class="card" id="sv-today-card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Today's Saving</h2>
          <span id="sv-today-badge" class="badge badge-red">Not Saved</span>
        </div>

        <!-- Default amount setting -->
        <div class="flex items-center gap-3 mb-4 p-3 rounded-xl" style="background:var(--glass-bg);border:1px solid var(--color-border)">
          <div class="flex-1">
            <p class="text-xs" style="color:var(--text-secondary)">Default daily saving</p>
            <p class="font-outfit font-semibold text-lg" id="sv-default-amount">₹100</p>
          </div>
          <button onclick="Savings.editDefaultAmount()" class="btn-sm btn-secondary">Edit</button>
        </div>

        <!-- Amount input -->
        <div class="form-group">
          <label class="form-label">Amount to Save Today</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-semibold" style="color:var(--text-secondary)">₹</span>
            <input type="number" id="sv-amount-input" class="form-input pl-7" placeholder="100" min="1" step="1">
          </div>
        </div>

        <!-- UPI ID setting -->
        <div class="flex items-center gap-3 mb-4 p-3 rounded-xl" style="background:var(--glass-bg);border:1px solid var(--color-border)">
          <div class="flex-1">
            <p class="text-xs" style="color:var(--text-secondary)">Saved UPI to Pay</p>
            <p class="font-outfit font-semibold text-sm" id="sv-saved-upi">Not set</p>
          </div>
          <button onclick="UPI.openModal()" class="btn-sm btn-secondary">Settings</button>
        </div>

        <div id="sv-action-area">
          <div class="grid grid-cols-2 gap-3">
            <button onclick="UPI.quickShowQR()" id="sv-qr-btn" class="btn-secondary justify-center py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01"/></svg>
              Show QR
            </button>
            <button onclick="UPI.quickPay()" class="btn-gold justify-center py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              Pay via UPI
            </button>
          </div>
        </div>

        <!-- Already saved state (hidden by default) -->
        <div id="sv-saved-state" class="hidden text-center py-4">
          <div class="text-4xl mb-2">✅</div>
          <p class="font-outfit font-semibold text-lg" style="color:var(--color-green)">Saved today!</p>
          <p class="text-sm mt-1" id="sv-saved-amount-display" style="color:var(--text-secondary)"></p>
          <button onclick="Savings.editToday()" class="btn-sm btn-secondary mt-3">Edit Amount</button>
        </div>
      </div>

      <!-- Calendar Heatmap -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">This Month</h2>
          <div class="flex items-center gap-4 text-xs" style="color:var(--text-secondary)">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:rgba(34,197,94,0.4);display:inline-block"></span>Saved</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded" style="background:rgba(239,68,68,0.3);display:inline-block"></span>Missed</span>
          </div>
        </div>
        <div id="sv-heatmap" class="flex flex-wrap gap-1.5"></div>
        <div class="mt-4 pt-4 border-t" style="border-color:var(--color-border)">
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="font-outfit font-bold text-xl" style="color:var(--color-green)" id="sv-saved-days">0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Saved days</p>
            </div>
            <div>
              <p class="font-outfit font-bold text-xl" style="color:var(--color-red)" id="sv-missed-days">0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Missed days</p>
            </div>
            <div>
              <p class="font-outfit font-bold text-xl" style="color:var(--color-teal)" id="sv-total-saved">₹0</p>
              <p class="text-xs" style="color:var(--text-secondary)">Total saved</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Savings History -->
      <div class="card">
        <h2 class="section-title">Savings History</h2>
        <div id="sv-history" class="space-y-2">
          <div class="skeleton h-12 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    await Promise.all([
      this.loadStreak(uid),
      this.loadTodayStatus(uid),
      this.loadMonthHeatmap(uid),
      this.loadHistory(uid),
    ]);
    this.loadDefaultAmount(uid);
  },

  async loadDefaultAmount(uid) {
    try {
      const snap = await FS.profileRef(uid).get();
      const data = snap.data() || {};
      const amount = data.defaultDailySaving || 100;
      const el = document.getElementById('sv-default-amount');
      if (el) el.textContent = formatCurrency(amount);
      const input = document.getElementById('sv-amount-input');
      if (input) input.value = amount;
      this._defaultAmount = amount;

      window.SAVED_UPI_ID = data.savedUpiId || '';
      window.SAVED_UPI_NAME = data.savedUpiName || 'Savings';
      const upiEl = document.getElementById('sv-saved-upi');
      if (upiEl) {
        upiEl.textContent = window.SAVED_UPI_ID ? `${window.SAVED_UPI_ID} (${window.SAVED_UPI_NAME})` : 'Not set';
      }
    } catch(e) {}
  },

  async loadStreak(uid) {
    try {
      const snap = await FS.streakRef(uid).get();
      const data = snap.data() || {};
      const streak = document.getElementById('sv-streak-num');
      const best = document.getElementById('sv-best-streak');
      if (streak) streak.textContent = data.currentStreak || 0;
      if (best) best.textContent = data.longestStreak || 0;
    } catch(e) {}
  },

  async loadTodayStatus(uid) {
    const today = getTodayStr();
    try {
      const snap = await FS.savingDoc(uid, today).get();
      if (snap.exists && snap.data().amount > 0) {
        this.showSavedState(snap.data().amount);
      }
    } catch(e) {}
  },

  showSavedState(amount) {
    const badge = document.getElementById('sv-today-badge');
    const actionArea = document.getElementById('sv-action-area');
    const savedState = document.getElementById('sv-saved-state');
    const savedDisplay = document.getElementById('sv-saved-amount-display');

    if (badge) { badge.textContent = '✓ Saved'; badge.className = 'badge badge-green'; }
    if (actionArea) actionArea.classList.add('hidden');
    if (savedState) savedState.classList.remove('hidden');
    if (savedDisplay) savedDisplay.textContent = `Saved ${formatCurrencyFull(amount)} today`;
  },

  async markSaved() {
    const uid = getUID();
    if (!uid) return;
    const input = document.getElementById('sv-amount-input');
    const amount = parseAmount(input?.value) || this._defaultAmount || 100;

    if (amount <= 0) { showToast('Enter a valid amount', 'warning'); return; }

    const btn = document.getElementById('sv-save-btn');
    setLoading(btn, true);

    try {
      const today = getTodayStr();
      await FS.savingDoc(uid, today).set({
        amount,
        date: today,
        method: 'manual',
        timestamp: TS.now(),
      });

      // Update streak
      await this.updateStreak(uid, today);

      // Add to locked savings
      await this.addToLocked(uid, amount);

      showToast(`₹${amount} saved! 🎉 Keep the streak going!`, 'success');
      this.showSavedState(amount);
      this.loadMonthHeatmap(uid);
      this.loadStreak(uid);
    } catch(e) {
      showToast('Failed to save. Try again.', 'error');
    } finally {
      setLoading(btn, false);
    }
  },

  async editToday() {
    const badge = document.getElementById('sv-today-badge');
    const actionArea = document.getElementById('sv-action-area');
    const savedState = document.getElementById('sv-saved-state');
    if (badge) { badge.textContent = 'Editing'; badge.className = 'badge badge-gold'; }
    if (actionArea) actionArea.classList.remove('hidden');
    if (savedState) savedState.classList.add('hidden');
  },

  async updateStreak(uid, today) {
    try {
      const snap = await FS.streakRef(uid).get();
      const data = snap.data() || {};
      const yesterday = getDateStr(new Date(Date.now() - 86400000));
      const lastSaved = data.lastSavedDate;

      let newStreak = 1;
      if (lastSaved === yesterday || lastSaved === today) {
        newStreak = lastSaved === today ? (data.currentStreak || 1) : (data.currentStreak || 0) + 1;
      }

      await FS.streakRef(uid).set({
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, data.longestStreak || 0),
        lastSavedDate: today,
        updatedAt: TS.now(),
      }, { merge: true });
    } catch(e) {}
  },

  async addToLocked(uid, amount) {
    try {
      const ref = FS.lockedRef(uid);
      await ref.set({ totalLocked: TS.increment(amount), lastUpdated: TS.now() }, { merge: true });
    } catch(e) {}
  },

  async loadMonthHeatmap(uid) {
    const container = document.getElementById('sv-heatmap');
    if (!container) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = getTodayStr();
    const dates = getMonthDates(year, month);
    const startOfMonth = dates[0];

    try {
      const snap = await FS.savingsCol(uid)
        .where(firebase.firestore.FieldPath.documentId(), '>=', startOfMonth)
        .where(firebase.firestore.FieldPath.documentId(), '<=', today)
        .get();

      const savedMap = {};
      let totalSaved = 0;
      snap.forEach(d => {
        savedMap[d.id] = d.data().amount || 0;
        totalSaved += d.data().amount || 0;
      });

      let savedDays = 0;
      let missedDays = 0;

      container.innerHTML = '';
      // Add day labels
      const labels = ['S','M','T','W','T','F','S'];
      const firstDayOfWeek = new Date(year, month, 1).getDay();

      dates.forEach((dateStr, idx) => {
        const isPast = dateStr < today;
        const isToday = dateStr === today;
        const isSaved = savedMap[dateStr] !== undefined;
        if (isSaved) savedDays++;
        else if (isPast && !isToday) missedDays++;

        const div = document.createElement('div');
        div.className = 'heatmap-day';
        div.title = `${formatDateShort(dateStr)}: ${isSaved ? formatCurrency(savedMap[dateStr]) : isPast ? 'Missed' : 'Future'}`;

        if (isSaved) {
          const levelMap = [1, 2, 3, 4];
          const amt = savedMap[dateStr];
          const def = this._defaultAmount || 100;
          const level = amt >= def * 2 ? 4 : amt >= def * 1.5 ? 3 : amt >= def ? 2 : 1;
          div.classList.add(`level-${level}`);
        } else if (isPast && !isToday) {
          div.classList.add('missed');
        }

        if (isToday) div.style.outline = '2px solid var(--color-violet)';
        container.appendChild(div);
      });

      // Update stats
      const elSaved = document.getElementById('sv-saved-days');
      const elMissed = document.getElementById('sv-missed-days');
      const elTotal = document.getElementById('sv-total-saved');
      const elMonthCount = document.getElementById('sv-month-count');

      if (elSaved) elSaved.textContent = savedDays;
      if (elMissed) elMissed.textContent = missedDays;
      if (elTotal) elTotal.textContent = formatCurrency(totalSaved);
      if (elMonthCount) elMonthCount.textContent = `${savedDays} days saved`;
    } catch(e) {}
  },

  async loadHistory(uid) {
    const container = document.getElementById('sv-history');
    if (!container) return;
    try {
      const snap = await FS.savingsCol(uid)
        .orderBy(firebase.firestore.FieldPath.documentId(), 'desc')
        .limit(10)
        .get();

      if (snap.empty) {
        container.innerHTML = `<div class="empty-state py-6"><div class="empty-state-icon">💰</div>
          <p class="empty-state-title">No savings yet</p>
          <p class="empty-state-text">Save your first amount today!</p></div>`;
        return;
      }

      container.innerHTML = snap.docs.map(d => {
        const data = d.data();
        return `<div class="flex items-center gap-3 p-3 rounded-xl" style="background:var(--glass-bg)">
          <div class="w-8 h-8 rounded-xl gradient-teal flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">${formatDate(d.id)}</p>
            <p class="text-xs" style="color:var(--text-secondary)">${data.method === 'upi' ? '💳 UPI Payment' : '✋ Manual'}</p>
          </div>
          <p class="font-outfit font-semibold" style="color:var(--color-green)">+${formatCurrency(data.amount)}</p>
        </div>`;
      }).join('');
    } catch(e) {}
  },

  async editDefaultAmount() {
    const uid = getUID();
    if (!uid) return;
    const current = this._defaultAmount || 100;
    const newAmount = prompt(`Current default: ₹${current}\nEnter new daily saving amount (₹):`);
    if (!newAmount) return;
    const amount = parseAmount(newAmount);
    if (amount <= 0) { showToast('Invalid amount', 'error'); return; }
    try {
      await FS.profileRef(uid).set({ defaultDailySaving: amount }, { merge: true });
      this._defaultAmount = amount;
      const el = document.getElementById('sv-default-amount');
      if (el) el.textContent = formatCurrency(amount);
      const input = document.getElementById('sv-amount-input');
      if (input) input.value = amount;
      showToast('Default amount updated!', 'success');
    } catch(e) { showToast('Failed to update', 'error'); }
  },
};
