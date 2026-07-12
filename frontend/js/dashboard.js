// dashboard.js — Dashboard page with real-time stats

const Dashboard = {
  unsubscribers: [],

  render() {
    return `
    <div class="animate-stagger space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium" style="color:var(--text-secondary)">Good ${Dashboard.greeting()},</p>
          <h1 class="page-title" id="dash-user-name">Loading...</h1>
        </div>
        <div class="badge badge-violet">
          <span>🔥</span>
          <span id="dash-streak-badge">0 days</span>
        </div>
      </div>

      <!-- Balance Hero Card -->
      <div class="card relative overflow-hidden" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(20,184,166,0.1));border-color:rgba(139,92,246,0.2)">
        <div class="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl" style="background:radial-gradient(circle,#7c3aed,transparent);transform:translate(30%,-30%)"></div>
        <div class="flex items-start justify-between mb-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest mb-1" style="color:var(--text-secondary)">Total Balance</p>
            <p class="font-outfit font-bold text-3xl lg:text-4xl" style="color:var(--text-primary)" id="dash-balance">₹0</p>
            <p class="text-xs mt-1" style="color:var(--text-secondary)">Savings + Remaining Budget</p>
          </div>
          <div class="text-right">
            <p class="text-xs mb-1" style="color:var(--text-secondary)">Monthly Goal</p>
            <p class="font-outfit font-semibold text-lg" style="color:var(--color-teal)" id="dash-goal-pct">0%</p>
          </div>
        </div>
        <!-- Progress Ring -->
        <div class="flex items-center gap-4">
          <svg width="64" height="64" viewBox="0 0 64 64" class="flex-shrink-0">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
            <circle id="dash-progress-ring" cx="32" cy="32" r="28" fill="none" stroke="url(#ring-grad)" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="176" stroke-dashoffset="176"
              style="transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1s ease"/>
            <defs>
              <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7c3aed"/>
                <stop offset="100%" stop-color="#14b8a6"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p class="text-xs" style="color:var(--text-secondary)">Saved this month</p>
              <p class="font-outfit font-semibold" style="color:var(--color-green)" id="dash-month-saved">₹0</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--text-secondary)">Spent this month</p>
              <p class="font-outfit font-semibold" style="color:var(--color-red)" id="dash-month-spent">₹0</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--text-secondary)">Daily budget</p>
              <p class="font-outfit font-semibold" id="dash-daily-budget">₹0</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--text-secondary)">Remaining</p>
              <p class="font-outfit font-semibold" id="dash-remaining">₹0</p>
            </div>
            <div>
              <p class="text-xs" style="color:var(--text-secondary)">Income Received</p>
              <p class="font-outfit font-semibold" id="dash-income">₹0</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stat Cards Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.15)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="stat-label">Locked Savings</div>
          <div class="stat-value" id="dash-locked">₹0</div>
          <div class="stat-sub">Until 1st of month</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.15)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="stat-label">Today's Savings</div>
          <div class="stat-value" id="dash-today-saved">₹0</div>
          <div class="stat-sub" id="dash-today-saved-status">Not saved yet</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>
          </div>
          <div class="stat-label">Today's Spending</div>
          <div class="stat-value" id="dash-today-spent">₹0</div>
          <div class="stat-sub" id="dash-today-tx-count">0 transactions</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 0 0 6.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 0 0 6.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/></svg>
          </div>
          <div class="stat-label">Saving Streak</div>
          <div class="stat-value flex items-center gap-1">
            <span class="streak-flame">🔥</span>
            <span id="dash-streak">0</span>
          </div>
          <div class="stat-sub">days in a row</div>
        </div>
      </div>

      <!-- Goals Section -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">Savings Goals</h2>
          <a href="#/goals" class="text-xs font-medium" style="color:var(--color-violet)">See all →</a>
        </div>
        <div id="dash-goals" class="space-y-3">
          <div class="skeleton h-16 rounded-2xl"></div>
          <div class="skeleton h-16 rounded-2xl"></div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">Recent Transactions</h2>
          <a href="#/expenses" class="text-xs font-medium" style="color:var(--color-violet)">See all →</a>
        </div>
        <div class="card" style="padding:0;overflow:hidden">
          <div id="dash-transactions" class="divide-y" style="border-color:var(--color-border)">
            <div class="p-4"><div class="skeleton h-10 rounded-xl"></div></div>
            <div class="p-4"><div class="skeleton h-10 rounded-xl"></div></div>
            <div class="p-4"><div class="skeleton h-10 rounded-xl"></div></div>
          </div>
        </div>
      </div>
    </div>
    `;
  },

  greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  },

  async init() {
    const uid = getUID();
    if (!uid) return;

    // Load user profile
    this.loadProfile(uid);

    // Load all stats concurrently
    await Promise.all([
      this.loadBudgetStats(uid),
      this.loadTodayData(uid),
      this.loadMonthlyData(uid),
      this.loadStreak(uid),
      this.loadGoals(uid),
      this.loadRecentTransactions(uid),
      this.loadLockedSavings(uid),
      this.loadIncomeStats(uid)
    ]);
  },

  async loadIncomeStats(uid) {
    try {
      const monthStr = getMonthStr();
      const snap = await FS.incomeRef(uid).where('month', '==', monthStr).get();
      let totalIncome = 0;
      snap.forEach(doc => {
        if (doc.data().type !== 'settings') totalIncome += (doc.data().amount || 0);
      });
      const el = document.getElementById('dash-income');
      if (el) el.textContent = formatCurrency(totalIncome);
    } catch (e) { console.error(e); }
  },

  async loadProfile(uid) {
    try {
      const snap = await FS.profileRef(uid).get();
      const data = snap.data() || {};
      const user = AUTH.currentUser;
      const name = data.name || user?.displayName || 'Friend';
      const nameEl = document.getElementById('dash-user-name');
      if (nameEl) nameEl.textContent = name.split(' ')[0];
    } catch(e) {}
  },

  async loadBudgetStats(uid) {
    try {
      const snap = await FS.budgetRef(uid).get();
      const data = snap.data() || {};
      const dailyBudget = data.dailyBudget || 0;
      const monthlyBudget = data.monthlyBudget || 0;

      const el = document.getElementById('dash-daily-budget');
      if (el) el.textContent = formatCurrency(dailyBudget);

      // Store for balance calc
      this._monthlyBudget = monthlyBudget;
      this._dailyBudget = dailyBudget;
    } catch(e) {}
  },

  async loadTodayData(uid) {
    const today = getTodayStr();
    try {
      // Today savings
      const savSnap = await FS.savingDoc(uid, today).get();
      const savedToday = savSnap.exists ? (savSnap.data().amount || 0) : 0;
      const elSaved = document.getElementById('dash-today-saved');
      const elStatus = document.getElementById('dash-today-saved-status');
      if (elSaved) { animateNumber(elSaved, 0, savedToday); }
      if (elStatus) elStatus.textContent = savSnap.exists ? '✓ Saved today!' : 'Not saved yet';

      // Today expenses
      const startOfDay = new Date(today + 'T00:00:00');
      const endOfDay = new Date(today + 'T23:59:59');
      const exSnap = await FS.expensesCol(uid)
        .where('date', '>=', getDateStr(startOfDay))
        .where('date', '<=', getDateStr(endOfDay))
        .get();
      let todaySpent = 0;
      exSnap.forEach(d => { todaySpent += d.data().amount || 0; });

      const elSpent = document.getElementById('dash-today-spent');
      const elCount = document.getElementById('dash-today-tx-count');
      if (elSpent) animateNumber(elSpent, 0, todaySpent);
      if (elCount) elCount.textContent = `${exSnap.size} transaction${exSnap.size !== 1 ? 's' : ''}`;

      // Remaining (budget - spent)
      const remaining = Math.max(0, (this._dailyBudget || 0) - todaySpent);
      const elRemaining = document.getElementById('dash-remaining');
      if (elRemaining) {
        animateNumber(elRemaining, 0, remaining);
        elRemaining.style.color = remaining < 100 ? 'var(--color-red)' : 'var(--color-green)';
      }
    } catch(e) {}
  },

  async loadMonthlyData(uid) {
    const startOfMonth = getDateStr(getStartOfMonth());
    const today = getTodayStr();
    try {
      // Monthly savings
      const savSnap = await FS.savingsCol(uid)
        .where(firebase.firestore.FieldPath.documentId(), '>=', startOfMonth)
        .where(firebase.firestore.FieldPath.documentId(), '<=', today)
        .get();
      let monthSaved = 0;
      savSnap.forEach(d => { monthSaved += d.data().amount || 0; });

      // Monthly expenses
      const exSnap = await FS.expensesCol(uid)
        .where('date', '>=', startOfMonth)
        .where('date', '<=', today)
        .get();
      let monthSpent = 0;
      exSnap.forEach(d => { monthSpent += d.data().amount || 0; });

      const elMSaved = document.getElementById('dash-month-saved');
      const elMSpent = document.getElementById('dash-month-spent');
      if (elMSaved) animateNumber(elMSaved, 0, monthSaved);
      if (elMSpent) animateNumber(elMSpent, 0, monthSpent);

      // Balance
      const monthBudget = this._monthlyBudget || 0;
      const balance = monthSaved + Math.max(0, monthBudget - monthSpent);
      const elBalance = document.getElementById('dash-balance');
      if (elBalance) animateNumber(elBalance, 0, balance);

      // Progress ring
      const goalPct = monthBudget ? pct(monthSpent, monthBudget) : 0;
      const elPct = document.getElementById('dash-goal-pct');
      if (elPct) elPct.textContent = goalPct + '%';
      const ring = document.getElementById('dash-progress-ring');
      if (ring) {
        const circumference = 176;
        const offset = circumference - (goalPct / 100) * circumference;
        setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);
      }
    } catch(e) {}
  },

  async loadStreak(uid) {
    try {
      const snap = await FS.streakRef(uid).get();
      const data = snap.data() || {};
      const streak = data.currentStreak || 0;
      const elStreak = document.getElementById('dash-streak');
      const elBadge = document.getElementById('dash-streak-badge');
      if (elStreak) elStreak.textContent = streak;
      if (elBadge) elBadge.textContent = `${streak} day${streak !== 1 ? 's' : ''}`;
    } catch(e) {}
  },

  async loadGoals(uid) {
    const container = document.getElementById('dash-goals');
    if (!container) return;
    try {
      const snap = await FS.goalsCol(uid).orderBy('createdAt', 'desc').limit(3).get();
      if (snap.empty) {
        container.innerHTML = `<div class="card text-center py-8">
          <div class="text-3xl mb-2">🎯</div>
          <p class="text-sm" style="color:var(--text-secondary)">No goals yet. <a href="#/goals" style="color:var(--color-violet)">Create one →</a></p>
        </div>`;
        return;
      }
      container.innerHTML = snap.docs.map(d => {
        const g = d.data();
        const progress = pct(g.savedAmount || 0, g.targetAmount || 1);
        return `
          <div class="card" style="padding:14px">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-xl">${getGoalIcon(g.name)}</span>
                <span class="font-medium text-sm">${g.name}</span>
              </div>
              <span class="text-sm font-semibold" style="color:var(--color-teal)">${progress}%</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill gradient-teal" style="width:${progress}%"></div>
            </div>
            <div class="flex justify-between mt-1.5">
              <span class="text-xs" style="color:var(--text-secondary)">${formatCurrency(g.savedAmount || 0)}</span>
              <span class="text-xs" style="color:var(--text-secondary)">${formatCurrency(g.targetAmount || 0)}</span>
            </div>
          </div>`;
      }).join('');
    } catch(e) {
      container.innerHTML = '<p class="text-sm" style="color:var(--text-secondary)">Failed to load goals</p>';
    }
  },

  async loadRecentTransactions(uid) {
    const container = document.getElementById('dash-transactions');
    if (!container) return;
    try {
      const snap = await FS.expensesCol(uid)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();
      if (snap.empty) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💸</div>
          <p class="empty-state-title">No transactions yet</p>
          <p class="empty-state-text">Add your first expense to get started</p></div>`;
        return;
      }
      container.innerHTML = snap.docs.map(d => {
        const tx = d.data();
        const cat = getCategoryInfo(tx.category);
        return `<div class="txn-item px-4 py-3">
          <div class="cat-icon" style="background:${cat.bg}">
            <span>${cat.emoji}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">${tx.note || cat.label}</p>
            <p class="text-xs" style="color:var(--text-secondary)">${formatDateShort(tx.date)} · ${tx.paymentMethod || 'UPI'}</p>
          </div>
          <p class="font-outfit font-semibold text-sm" style="color:var(--color-red)">-${formatCurrency(tx.amount)}</p>
        </div>`;
      }).join('');
    } catch(e) {}
  },

  async loadLockedSavings(uid) {
    try {
      const snap = await FS.lockedRef(uid).get();
      const data = snap.data() || {};
      const locked = data.totalLocked || 0;
      const el = document.getElementById('dash-locked');
      if (el) animateNumber(el, 0, locked);
    } catch(e) {}
  },
};
