// expenses.js — Expense tracker with CRUD, categories, and period filters

const Expenses = {
  currentPeriod: 'today',
  selectedCategory: 'food',
  editingId: null,

  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="page-title">Expenses</h1>
          <p class="page-subtitle">Track every rupee you spend</p>
        </div>
        <button onclick="Expenses.openAddModal()" class="btn-primary btn-sm hidden lg:flex">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Expense
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-2 gap-3">
        <div class="stat-card" style="border-color:rgba(239,68,68,0.2)">
          <div class="stat-label">Today</div>
          <div class="stat-value" style="color:var(--color-red)" id="ex-sum-today">₹0</div>
          <div class="stat-sub" id="ex-cnt-today">0 expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">This Week</div>
          <div class="stat-value" id="ex-sum-week">₹0</div>
          <div class="stat-sub" id="ex-cnt-week">0 expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">This Month</div>
          <div class="stat-value" id="ex-sum-month">₹0</div>
          <div class="stat-sub" id="ex-cnt-month">0 expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">This Year</div>
          <div class="stat-value" id="ex-sum-year">₹0</div>
          <div class="stat-sub" id="ex-cnt-year">0 expenses</div>
        </div>
      </div>

      <!-- Category Filter -->
      <div>
        <div class="scroll-tabs" id="ex-cat-filter">
          <button class="tab-btn active flex-shrink-0 px-4" onclick="Expenses.filterCategory('all', this)">All</button>
          ${CATEGORIES.map(c => `<button class="tab-btn flex-shrink-0 px-3" onclick="Expenses.filterCategory('${c.id}', this)">${c.emoji} ${c.label}</button>`).join('')}
        </div>
      </div>

      <!-- Period Tabs -->
      <div class="tab-container">
        <button class="tab-btn active" onclick="Expenses.switchPeriod('today', this)">Today</button>
        <button class="tab-btn" onclick="Expenses.switchPeriod('week', this)">Week</button>
        <button class="tab-btn" onclick="Expenses.switchPeriod('month', this)">Month</button>
        <button class="tab-btn" onclick="Expenses.switchPeriod('year', this)">Year</button>
      </div>

      <!-- Expense List -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="flex items-center justify-between px-4 py-3 border-b" style="border-color:var(--color-border)">
          <h3 class="font-outfit font-semibold text-sm" id="ex-period-label">Today's Expenses</h3>
          <p class="font-outfit font-bold" style="color:var(--color-red)" id="ex-period-total">₹0</p>
        </div>
        <div id="ex-list" class="divide-y" style="border-color:var(--color-border)">
          <div class="p-4"><div class="skeleton h-12 rounded-xl"></div></div>
          <div class="p-4"><div class="skeleton h-12 rounded-xl"></div></div>
          <div class="p-4"><div class="skeleton h-12 rounded-xl"></div></div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    this.currentPeriod = 'today';
    this.filterCategoryId = 'all';
    await Promise.all([
      this.loadSummaries(uid),
      this.loadExpenses(uid),
    ]);
  },

  async loadSummaries(uid) {
    const today = getTodayStr();
    const startWeek = getDateStr(getStartOfWeek());
    const startMonth = getDateStr(getStartOfMonth());
    const startYear = getDateStr(getStartOfYear());

    try {
      const snap = await FS.expensesCol(uid).orderBy('date', 'desc').get();
      let todayTotal = 0, todayCnt = 0;
      let weekTotal = 0, weekCnt = 0;
      let monthTotal = 0, monthCnt = 0;
      let yearTotal = 0, yearCnt = 0;

      snap.forEach(d => {
        const data = d.data();
        const date = data.date;
        const amt = data.amount || 0;
        if (date >= startYear) { yearTotal += amt; yearCnt++; }
        if (date >= startMonth) { monthTotal += amt; monthCnt++; }
        if (date >= startWeek) { weekTotal += amt; weekCnt++; }
        if (date === today) { todayTotal += amt; todayCnt++; }
      });

      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      set('ex-sum-today', formatCurrency(todayTotal));
      set('ex-cnt-today', `${todayCnt} expense${todayCnt !== 1 ? 's' : ''}`);
      set('ex-sum-week', formatCurrency(weekTotal));
      set('ex-cnt-week', `${weekCnt} expenses`);
      set('ex-sum-month', formatCurrency(monthTotal));
      set('ex-cnt-month', `${monthCnt} expenses`);
      set('ex-sum-year', formatCurrency(yearTotal));
      set('ex-cnt-year', `${yearCnt} expenses`);
    } catch(e) {}
  },

  async loadExpenses(uid) {
    const container = document.getElementById('ex-list');
    const totalEl = document.getElementById('ex-period-total');
    if (!container) return;

    const today = getTodayStr();
    let startDate;
    let periodLabel;
    switch (this.currentPeriod) {
      case 'today': startDate = today; periodLabel = "Today's Expenses"; break;
      case 'week': startDate = getDateStr(getStartOfWeek()); periodLabel = "This Week"; break;
      case 'month': startDate = getDateStr(getStartOfMonth()); periodLabel = "This Month"; break;
      case 'year': startDate = getDateStr(getStartOfYear()); periodLabel = "This Year"; break;
      default: startDate = today; periodLabel = "Today's Expenses";
    }

    const labelEl = document.getElementById('ex-period-label');
    if (labelEl) labelEl.textContent = periodLabel;

    try {
      let query = FS.expensesCol(uid).where('date', '>=', startDate).where('date', '<=', today).orderBy('date', 'desc');
      const snap = await query.get();

      let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (this.filterCategoryId && this.filterCategoryId !== 'all') {
        items = items.filter(i => i.category === this.filterCategoryId);
      }

      const total = items.reduce((s, i) => s + (i.amount || 0), 0);
      if (totalEl) totalEl.textContent = formatCurrency(total);

      if (items.length === 0) {
        container.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">🧾</div>
          <p class="empty-state-title">No expenses found</p>
          <p class="empty-state-text">Add your first expense using the + button</p>
        </div>`;
        return;
      }

      container.innerHTML = items.map(tx => {
        const cat = getCategoryInfo(tx.category);
        return `<div class="txn-item px-4 py-3.5" onclick="Expenses.showTxnMenu('${tx.id}', this)">
          <div class="cat-icon" style="background:${cat.bg}">
            <span>${cat.emoji}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">${tx.note || cat.label}</p>
            <p class="text-xs" style="color:var(--text-secondary)">${formatDateShort(tx.date)} · ${tx.paymentMethod || 'UPI'} · ${cat.label}</p>
          </div>
          <div class="text-right">
            <p class="font-outfit font-semibold text-sm" style="color:var(--color-red)">-${formatCurrency(tx.amount)}</p>
            <p class="text-xs" style="color:var(--text-tertiary)">${tx.timestamp ? relativeTime(tx.timestamp) : ''}</p>
          </div>
        </div>`;
      }).join('');
    } catch(e) {
      container.innerHTML = '<p class="p-4 text-sm text-red-400">Failed to load expenses</p>';
    }
  },

  switchPeriod(period, btn) {
    this.currentPeriod = period;
    document.querySelectorAll('.tab-container .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.loadExpenses(getUID());
  },

  filterCategory(catId, btn) {
    this.filterCategoryId = catId;
    document.querySelectorAll('#ex-cat-filter .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.loadExpenses(getUID());
  },

  openAddModal() {
    this.editingId = null;
    const body = document.getElementById('expense-modal-body');
    if (!body) return;
    const today = getTodayStr();
    body.innerHTML = `
      <div class="space-y-4 pb-4">
        <!-- Amount -->
        <div class="form-group">
          <label class="form-label">Amount *</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold text-lg" style="color:var(--color-violet)">₹</span>
            <input type="number" id="ex-inp-amount" class="form-input pl-8 font-outfit text-lg" placeholder="0" min="1" step="0.01" required>
          </div>
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label">Category *</label>
          <div class="category-grid">
            ${CATEGORIES.map(c => `<div class="cat-option ${c.id === 'food' ? 'selected' : ''}" onclick="Expenses.selectCategory('${c.id}', this)">
              <span style="font-size:1.4rem">${c.emoji}</span>
              <span>${c.label}</span>
            </div>`).join('')}
          </div>
          <input type="hidden" id="ex-inp-category" value="food">
        </div>

        <!-- Note -->
        <div class="form-group">
          <label class="form-label">Note</label>
          <input type="text" id="ex-inp-note" class="form-input" placeholder="What did you spend on?">
        </div>

        <!-- Date & Payment -->
        <div class="grid grid-cols-2 gap-3">
          <div class="form-group mb-0">
            <label class="form-label">Date</label>
            <input type="date" id="ex-inp-date" class="form-input" value="${today}">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Payment Method</label>
            <select id="ex-inp-method" class="form-select">
              ${PAYMENT_METHODS.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
        </div>

        <button onclick="Expenses.saveExpense()" id="ex-save-btn" class="btn-primary w-full justify-center py-3 mt-2">
          Save Expense
        </button>
      </div>
    `;
    this.selectedCategory = 'food';
    openModal('expense-modal');
  },

  selectCategory(id, el) {
    this.selectedCategory = id;
    document.querySelectorAll('.cat-option').forEach(c => c.classList.remove('selected'));
    if (el) el.classList.add('selected');
    const inp = document.getElementById('ex-inp-category');
    if (inp) inp.value = id;
  },

  async saveExpense() {
    const uid = getUID();
    if (!uid) return;
    const amount = parseAmount(document.getElementById('ex-inp-amount')?.value);
    const category = document.getElementById('ex-inp-category')?.value || this.selectedCategory;
    const note = sanitize(document.getElementById('ex-inp-note')?.value || '');
    const date = document.getElementById('ex-inp-date')?.value || getTodayStr();
    const paymentMethod = document.getElementById('ex-inp-method')?.value || 'UPI';

    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'warning'); return; }

    const btn = document.getElementById('ex-save-btn');
    setLoading(btn, true);

    try {
      const data = { amount, category, note, date, paymentMethod, timestamp: TS.now() };
      if (this.editingId) {
        await FS.expenseDoc(uid, this.editingId).update(data);
        showToast('Expense updated!', 'success');
      } else {
        await FS.expensesCol(uid).add(data);
        showToast('Expense added!', 'success');
        // ☄️ Meteor effect for expenses!
        if (window.SpaceBG) SpaceBG.spawnExpenseMeteor();
      }
      closeModal('expense-modal');
      this.loadExpenses(uid);
      this.loadSummaries(uid);
    } catch(e) {
      showToast('Failed to save expense', 'error');
    } finally { setLoading(btn, false); }
  },

  showTxnMenu(id, el) {
    showConfirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      confirmText: 'Delete',
      danger: true,
      onConfirm: () => this.deleteExpense(id),
    });
  },

  async deleteExpense(id) {
    const uid = getUID();
    if (!uid) return;
    try {
      await FS.expenseDoc(uid, id).delete();
      showToast('Expense deleted', 'success');
      this.loadExpenses(uid);
      this.loadSummaries(uid);
    } catch(e) { showToast('Failed to delete', 'error'); }
  },
};
