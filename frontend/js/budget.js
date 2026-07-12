// budget.js — Budget planner with income, monthly/daily budgets, and warnings

const Budget = {
  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Budget Planner</h1>
        <p class="page-subtitle">Set your limits and track utilization</p>
      </div>

      <!-- Budget Setup -->
      <div class="card">
        <h2 class="section-title">Budget Settings</h2>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Monthly Income (₹)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-green)">₹</span>
              <input type="number" id="bd-income" class="form-input pl-7" placeholder="50000" min="0">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Budget (₹)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-violet)">₹</span>
              <input type="number" id="bd-monthly" class="form-input pl-7" placeholder="30000" min="0">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Daily Budget (₹)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-teal)">₹</span>
              <input type="number" id="bd-daily" class="form-input pl-7" placeholder="1000" min="0">
            </div>
          </div>
          <button onclick="Budget.save()" id="bd-save-btn" class="btn-primary w-full justify-center">
            Save Budget Settings
          </button>
        </div>
      </div>

      <!-- Budget Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.15)">💰</div>
          <div class="stat-label">Monthly Income</div>
          <div class="stat-value" style="color:var(--color-green)" id="bd-stat-income">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15)">💸</div>
          <div class="stat-label">Spent This Month</div>
          <div class="stat-value" style="color:var(--color-red)" id="bd-stat-spent">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.15)">📊</div>
          <div class="stat-label">Budget Remaining</div>
          <div class="stat-value" id="bd-stat-remaining">₹0</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(20,184,166,0.15)">💹</div>
          <div class="stat-label">Monthly Savings</div>
          <div class="stat-value" style="color:var(--color-teal)" id="bd-stat-savings">₹0</div>
        </div>
      </div>

      <!-- Budget Utilization -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">Monthly Budget Utilization</h2>
          <span class="font-outfit font-bold text-lg" id="bd-pct-label" style="color:var(--color-violet)">0%</span>
        </div>
        <div class="progress-bar-track mb-2" style="height:12px">
          <div id="bd-progress" class="progress-bar-fill" style="width:0%;background:linear-gradient(90deg,#22c55e,#7c3aed)"></div>
        </div>
        <div class="flex justify-between text-xs" style="color:var(--text-secondary)">
          <span>₹0 spent</span>
          <span id="bd-progress-label">of ₹0 budget</span>
        </div>
        <div id="bd-warning" class="hidden mt-3 p-3 rounded-xl flex items-center gap-2" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2)">
          <span class="text-xl">⚠️</span>
          <p class="text-sm font-medium" style="color:var(--color-red)" id="bd-warning-text">Budget exceeded!</p>
        </div>
      </div>

      <!-- Daily Budget Status -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-title mb-0">Today's Budget</h2>
          <span id="bd-daily-status" class="badge badge-green">Under Budget</span>
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <p class="font-outfit font-bold text-xl" id="bd-daily-budget-disp">₹0</p>
            <p class="text-xs" style="color:var(--text-secondary)">Daily Budget</p>
          </div>
          <div>
            <p class="font-outfit font-bold text-xl" style="color:var(--color-red)" id="bd-daily-spent">₹0</p>
            <p class="text-xs" style="color:var(--text-secondary)">Spent Today</p>
          </div>
          <div>
            <p class="font-outfit font-bold text-xl" id="bd-daily-remaining">₹0</p>
            <p class="text-xs" style="color:var(--text-secondary)">Remaining</p>
          </div>
        </div>
        <div class="progress-bar-track mt-3">
          <div id="bd-daily-progress" class="progress-bar-fill" style="width:0%;background:linear-gradient(90deg,#22c55e,#f59e0b)"></div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="card">
        <h2 class="section-title">This Month by Category</h2>
        <div id="bd-categories" class="space-y-3">
          <div class="skeleton h-10 rounded-xl"></div>
          <div class="skeleton h-10 rounded-xl"></div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    await this.load(uid);
    await this.loadStats(uid);
  },

  async load(uid) {
    try {
      const snap = await FS.budgetRef(uid).get();
      const data = snap.data() || {};
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
      setVal('bd-income', data.monthlyIncome);
      setVal('bd-monthly', data.monthlyBudget);
      setVal('bd-daily', data.dailyBudget);

      this._income = data.monthlyIncome || 0;
      this._monthly = data.monthlyBudget || 0;
      this._daily = data.dailyBudget || 0;

      this.updateStatDisplay();
    } catch(e) {}
  },

  async save() {
    const uid = getUID();
    if (!uid) return;
    const income = parseAmount(document.getElementById('bd-income')?.value);
    const monthly = parseAmount(document.getElementById('bd-monthly')?.value);
    const daily = parseAmount(document.getElementById('bd-daily')?.value);

    const btn = document.getElementById('bd-save-btn');
    setLoading(btn, true);
    try {
      await FS.budgetRef(uid).set({
        monthlyIncome: income,
        monthlyBudget: monthly,
        dailyBudget: daily,
        updatedAt: TS.now(),
      }, { merge: true });
      this._income = income; this._monthly = monthly; this._daily = daily;
      showToast('Budget settings saved! 🎯', 'success');
      this.updateStatDisplay();
      await this.loadStats(uid);
    } catch(e) {
      showToast('Failed to save', 'error');
    } finally { setLoading(btn, false); }
  },

  updateStatDisplay() {
    const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = formatCurrency(val); };
    set('bd-stat-income', this._income || 0);
    set('bd-daily-budget-disp', this._daily || 0);
  },

  async loadStats(uid) {
    const startMonth = getDateStr(getStartOfMonth());
    const today = getTodayStr();
    try {
      // Monthly expenses
      const snap = await FS.expensesCol(uid).where('date', '>=', startMonth).where('date', '<=', today).get();
      let monthSpent = 0;
      const catTotals = {};
      snap.forEach(d => {
        const data = d.data();
        monthSpent += data.amount || 0;
        catTotals[data.category] = (catTotals[data.category] || 0) + (data.amount || 0);
      });

      // Today's expenses
      const todaySnap = await FS.expensesCol(uid).where('date', '==', today).get();
      let todaySpent = 0;
      todaySnap.forEach(d => { todaySpent += d.data().amount || 0; });

      const monthly = this._monthly || 0;
      const daily = this._daily || 0;
      const income = this._income || 0;
      const remaining = Math.max(0, monthly - monthSpent);
      const savings = Math.max(0, income - monthSpent);
      const utilPct = pct(monthSpent, monthly);
      const dailyRemaining = Math.max(0, daily - todaySpent);
      const dailyPct = pct(todaySpent, daily);

      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = typeof val === 'string' ? val : formatCurrency(val); };
      set('bd-stat-spent', monthSpent);
      set('bd-stat-remaining', remaining);
      set('bd-stat-savings', savings);
      set('bd-pct-label', utilPct + '%');
      set('bd-progress-label', `of ${formatCurrency(monthly)} budget`);
      set('bd-daily-spent', todaySpent);
      set('bd-daily-remaining', dailyRemaining);

      const prog = document.getElementById('bd-progress');
      if (prog) {
        prog.style.width = utilPct + '%';
        prog.style.background = utilPct > 90 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#22c55e,#7c3aed)';
      }
      const dailyProg = document.getElementById('bd-daily-progress');
      if (dailyProg) {
        dailyProg.style.width = dailyPct + '%';
        dailyProg.style.background = dailyPct > 90 ? 'linear-gradient(90deg,#f59e0b,#ef4444)' : 'linear-gradient(90deg,#22c55e,#f59e0b)';
      }

      // Warnings
      const warning = document.getElementById('bd-warning');
      const warningText = document.getElementById('bd-warning-text');
      if (warning && warningText) {
        if (monthSpent > monthly && monthly > 0) {
          warning.classList.remove('hidden');
          warningText.textContent = `Budget exceeded by ${formatCurrency(monthSpent - monthly)}! You've spent ${utilPct}% of your budget.`;
        } else if (utilPct > 80) {
          warning.classList.remove('hidden');
          warningText.textContent = `Warning: You've used ${utilPct}% of your monthly budget.`;
          warning.style.background = 'rgba(245,158,11,0.1)';
          warning.style.borderColor = 'rgba(245,158,11,0.25)';
          warningText.style.color = 'var(--color-gold)';
        }
      }

      // Daily status
      const dailyStatus = document.getElementById('bd-daily-status');
      if (dailyStatus) {
        if (todaySpent > daily && daily > 0) {
          dailyStatus.textContent = '⚠️ Over Budget';
          dailyStatus.className = 'badge badge-red';
        } else {
          dailyStatus.textContent = '✓ Under Budget';
          dailyStatus.className = 'badge badge-green';
        }
      }

      // Category breakdown
      const catContainer = document.getElementById('bd-categories');
      if (catContainer) {
        const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
        if (sorted.length === 0) {
          catContainer.innerHTML = '<p class="text-sm text-center py-4" style="color:var(--text-secondary)">No expenses this month</p>';
        } else {
          catContainer.innerHTML = sorted.map(([catId, total]) => {
            const cat = getCategoryInfo(catId);
            const catPct = pct(total, monthSpent);
            return `<div>
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span>${cat.emoji}</span>
                  <span class="text-sm font-medium">${cat.label}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs" style="color:var(--text-secondary)">${catPct}%</span>
                  <span class="text-sm font-semibold" style="color:var(--color-red)">${formatCurrency(total)}</span>
                </div>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" style="width:${catPct}%;background:${cat.color}"></div>
              </div>
            </div>`;
          }).join('');
        }
      }
    } catch(e) {}
  },
};
