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

      <!-- Overspend Alert Banner (hidden by default) -->
      <div id="sv-overspend-banner" class="hidden rounded-2xl p-4 flex items-start gap-3" style="background:linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.08));border:1.5px solid rgba(239,68,68,0.5);animation:pulse-red 1.5s infinite">
        <span style="font-size:1.5rem;flex-shrink:0">🚨</span>
        <div>
          <p class="font-outfit font-bold text-sm" style="color:#ef4444">Overspend Alert!</p>
          <p class="text-xs mt-0.5" id="sv-overspend-msg" style="color:var(--text-secondary)"></p>
        </div>
      </div>

      <!-- Visual Savings Jar -->
      <div class="card text-center" style="background:linear-gradient(135deg,rgba(20,184,166,0.08),rgba(124,58,237,0.06));border-color:rgba(20,184,166,0.2)">
        <h2 class="section-title mb-1">Monthly Savings Jar</h2>
        <p class="text-xs mb-4" style="color:var(--text-secondary)" id="sv-jar-label">Loading...</p>
        <div class="flex justify-center">
          <div class="relative" style="width:130px;height:180px">
            <!-- Jar SVG -->
            <svg viewBox="0 0 130 180" width="130" height="180" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;z-index:2">
              <!-- Lid -->
              <rect x="20" y="0" width="90" height="18" rx="6" fill="rgba(124,58,237,0.7)" stroke="rgba(124,58,237,1)" stroke-width="2"/>
              <rect x="35" y="6" width="60" height="8" rx="4" fill="rgba(167,139,250,0.5)"/>
              <!-- Jar body outline -->
              <path d="M15 30 Q10 40 10 55 L10 155 Q10 168 25 170 L105 170 Q120 168 120 155 L120 55 Q120 40 115 30 Z" fill="none" stroke="rgba(124,58,237,0.8)" stroke-width="2.5"/>
              <!-- Shine -->
              <path d="M25 45 Q22 80 24 120" stroke="rgba(255,255,255,0.25)" stroke-width="4" stroke-linecap="round" fill="none"/>
              <!-- Coins emoji at bottom -->
              <text x="65" y="155" text-anchor="middle" font-size="18" opacity="0.7">💰</text>
            </svg>
            <!-- Fill layer (clipped inside jar) -->
            <svg viewBox="0 0 130 180" width="130" height="180" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;z-index:1">
              <defs>
                <clipPath id="jar-clip">
                  <path d="M16 30 Q11 40 11 55 L11 155 Q11 167 25 169 L105 169 Q119 167 119 155 L119 55 Q119 40 114 30 Z"/>
                </clipPath>
              </defs>
              <!-- Fill rect clipped to jar shape -->
              <rect id="sv-jar-fill" x="11" y="169" width="108" height="0" clip-path="url(#jar-clip)" fill="url(#jar-gradient)" style="transition:all 1.2s cubic-bezier(0.34,1.56,0.64,1)"/>
              <defs>
                <linearGradient id="jar-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.9"/>
                  <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.85"/>
                </linearGradient>
              </defs>
              <!-- Animated wave on top of fill -->
              <path id="sv-jar-wave" d="" clip-path="url(#jar-clip)" fill="rgba(20,184,166,0.3)" style="transition:all 1.2s cubic-bezier(0.34,1.56,0.64,1)"/>
            </svg>
          </div>
        </div>
        <!-- Percentage label -->
        <div class="mt-3">
          <p class="font-outfit font-bold text-3xl" id="sv-jar-pct" style="color:var(--color-teal)">0%</p>
          <p class="text-xs mt-1" style="color:var(--text-secondary)">of monthly goal</p>
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
          <div class="flex items-center justify-center gap-2 mt-4">
            <button onclick="Savings.editToday()" class="btn-sm btn-secondary">Edit</button>
            <button onclick="Savings.deleteToday()" class="btn-sm" style="background:rgba(239,68,68,0.1);color:var(--color-red)">Delete</button>
          </div>
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
      this.loadJar(uid),
      this.loadOverspendAlert(uid),
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

  async loadJar(uid) {
    try {
      // Get monthly savings goal from profile (defaultDailySaving * days in month)
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const today = getTodayStr();
      const startOfMonth = today.substring(0, 7) + '-01';

      const [profileSnap, savSnap] = await Promise.all([
        FS.profileRef(uid).get(),
        FS.savingsCol(uid).where('date', '>=', startOfMonth).where('date', '<=', today).get()
      ]);

      const profileData = profileSnap.data() || {};
      const dailyGoal = profileData.defaultDailySaving || 100;
      const monthlyGoal = dailyGoal * daysInMonth;

      let totalSaved = 0;
      savSnap.forEach(d => { totalSaved += d.data().amount || 0; });

      const pct = Math.min(100, Math.round((totalSaved / monthlyGoal) * 100));

      // Update label
      const label = document.getElementById('sv-jar-label');
      if (label) label.textContent = `${formatCurrency(totalSaved)} of ${formatCurrency(monthlyGoal)} monthly goal`;

      const pctEl = document.getElementById('sv-jar-pct');
      if (pctEl) pctEl.textContent = pct + '%';

      // Animate jar fill
      // Jar interior: y from 31 to 169 = 138px total
      const jarHeight = 138;
      const fillHeight = Math.round((pct / 100) * jarHeight);
      const fillY = 169 - fillHeight;

      setTimeout(() => {
        const fillEl = document.getElementById('sv-jar-fill');
        if (fillEl) {
          fillEl.setAttribute('y', fillY);
          fillEl.setAttribute('height', fillHeight);
        }
        // Wave path on top of fill
        const waveEl = document.getElementById('sv-jar-wave');
        if (waveEl && fillHeight > 0) {
          const wy = fillY;
          waveEl.setAttribute('d', `M11 ${wy} Q35 ${wy - 6} 65 ${wy} Q95 ${wy + 6} 119 ${wy} L119 ${wy + 8} Q95 ${wy + 2} 65 ${wy + 8} Q35 ${wy + 14} 11 ${wy + 8} Z`);
        }

        // Change pct color based on fill
        if (pctEl) {
          if (pct >= 100) pctEl.style.color = '#fbbf24';
          else if (pct >= 50) pctEl.style.color = 'var(--color-teal)';
          else pctEl.style.color = 'var(--color-violet)';
        }
      }, 300);
    } catch(e) { console.error('loadJar:', e); }
  },

  async loadOverspendAlert(uid) {
    try {
      const budgetSnap = await FS.budgetRef(uid).get();
      const budget = budgetSnap.data() || {};
      const pocketMoney = budget.monthlyPocketMoney;
      if (!pocketMoney) return;

      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const today = getTodayStr();
      const startOfMonth = today.substring(0, 7) + '-01';
      const dayOfMonth = now.getDate();
      const remainingDays = daysInMonth - dayOfMonth + 1;
      const baseDaily = pocketMoney / daysInMonth;

      // Get today's spending
      const expSnap = await FS.expensesCol(uid)
        .where('date', '>=', startOfMonth)
        .where('date', '<=', today)
        .get();

      let totalSpentMonth = 0;
      let todaySpent = 0;
      expSnap.forEach(d => {
        const amt = d.data().amount || 0;
        totalSpentMonth += amt;
        if (d.data().date === today) todaySpent += amt;
      });

      const banner = document.getElementById('sv-overspend-banner');
      const msg = document.getElementById('sv-overspend-msg');
      if (!banner || !msg) return;

      if (todaySpent > baseDaily) {
        const over = todaySpent - baseDaily;
        const remainingBudget = pocketMoney - totalSpentMonth;
        const newDaily = Math.max(0, remainingBudget / Math.max(1, remainingDays - 1));
        msg.textContent = `You spent ${formatCurrency(todaySpent)} today (${formatCurrency(over)} over limit). Tomorrow's limit adjusted to ${formatCurrency(newDaily)}.`;
        banner.classList.remove('hidden');
        // Apply red theme overlay on document body
        document.body.classList.add('overspend-mode');
      } else {
        banner.classList.add('hidden');
        document.body.classList.remove('overspend-mode');
      }
    } catch(e) { console.error('loadOverspendAlert:', e); }
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
      this.loadJar(uid);
      // ⭐ Star burst effect!
      if (window.SpaceBG) SpaceBG.burstStars(document.getElementById('sv-today-card'));
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

  async deleteToday() {
    const uid = getUID();
    if (!uid) return;
    
    showConfirm({
      title: 'Delete Saving',
      message: "Are you sure you want to delete today's saving?",
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const today = getTodayStr();
          const docRef = FS.savingDoc(uid, today);
          const snap = await docRef.get();
          
          if (!snap.exists) return;
          const amount = snap.data().amount || 0;
          
          // Delete document
          await docRef.delete();
          
          // Decrement locked
          await FS.lockedRef(uid).set({ totalLocked: TS.increment(-amount), lastUpdated: TS.now() }, { merge: true });
          
          // Fix streak (fully reset)
          const streakSnap = await FS.streakRef(uid).get();
          if (streakSnap.exists) {
            const streakData = streakSnap.data();
            if (streakData.lastSavedDate === today) {
              await FS.streakRef(uid).set({
                currentStreak: 0,
                lastSavedDate: null
              }, { merge: true });
            }
          }
          
          showToast('Saving deleted', 'success');
          
          // Reset UI
          const badge = document.getElementById('sv-today-badge');
          const actionArea = document.getElementById('sv-action-area');
          const savedState = document.getElementById('sv-saved-state');
          if (badge) { badge.textContent = 'Not Saved'; badge.className = 'badge badge-red'; }
          if (actionArea) actionArea.classList.remove('hidden');
          if (savedState) savedState.classList.add('hidden');
          
          this.loadMonthHeatmap(uid);
          this.loadHistory(uid);
          this.loadStreak(uid);
        } catch(e) {
          console.error(e);
          showToast('Failed to delete saving', 'error');
        }
      }
    });
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
    } catch(e) { console.error('updateStreak:', e); }
  },

  async addToLocked(uid, amount) {
    try {
      const ref = FS.lockedRef(uid);
      await ref.set({ totalLocked: TS.increment(amount), lastUpdated: TS.now() }, { merge: true });
    } catch(e) { console.error('addToLocked:', e); }
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
        .where('date', '>=', startOfMonth)
        .where('date', '<=', today)
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
    } catch(e) { console.error('loadMonthHeatmap:', e); }
  },

  async loadHistory(uid) {
    const container = document.getElementById('sv-history');
    if (!container) return;
    try {
      const snap = await FS.savingsCol(uid)
        .orderBy('date', 'desc')
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
    } catch(e) { 
      console.error('loadHistory:', e); 
      container.innerHTML = '<p class="text-sm text-red-500 py-4 text-center">Failed to load history</p>';
    }
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
