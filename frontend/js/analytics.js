// analytics.js — Interactive charts for spending, savings, and categories

const Analytics = {
  charts: {},

  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Analytics</h1>
        <p class="page-subtitle">Understand your money patterns</p>
      </div>

      <!-- Period Selector -->
      <div class="tab-container">
        <button class="tab-btn active" onclick="Analytics.setPeriod('week', this)">Week</button>
        <button class="tab-btn" onclick="Analytics.setPeriod('month', this)">Month</button>
        <button class="tab-btn" onclick="Analytics.setPeriod('year', this)">Year</button>
      </div>

      <!-- Summary Banner -->
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-card text-center">
          <div class="stat-label text-center">Income</div>
          <div class="stat-value text-center text-base" style="color:var(--color-green)" id="an-income">₹0</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-label text-center">Spent</div>
          <div class="stat-value text-center text-base" style="color:var(--color-red)" id="an-spent">₹0</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-label text-center">Saved</div>
          <div class="stat-value text-center text-base" style="color:var(--color-teal)" id="an-saved">₹0</div>
        </div>
      </div>

      <!-- Daily Spending Chart -->
      <div class="card">
        <h3 class="section-title">Spending Trend</h3>
        <div class="chart-wrapper">
          <canvas id="chart-spending-trend"></canvas>
        </div>
      </div>

      <!-- Income vs Spending -->
      <div class="card">
        <h3 class="section-title">Income vs Spending</h3>
        <div class="chart-wrapper">
          <canvas id="chart-income-spending"></canvas>
        </div>
      </div>

      <!-- Category Donut -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <h3 class="section-title">Spending by Category</h3>
          <div style="height:220px;display:flex;align-items:center;justify-content:center">
            <canvas id="chart-categories" style="max-height:220px"></canvas>
          </div>
          <div id="chart-categories-legend" class="mt-3 grid grid-cols-2 gap-1.5"></div>
        </div>

        <!-- Savings Growth -->
        <div class="card">
          <h3 class="section-title">Savings Growth</h3>
          <div class="chart-wrapper" style="height:220px">
            <canvas id="chart-savings-growth"></canvas>
          </div>
        </div>
      </div>

      <!-- Monthly Comparison -->
      <div class="card">
        <h3 class="section-title">Monthly Comparison</h3>
        <div class="chart-wrapper">
          <canvas id="chart-monthly-comparison"></canvas>
        </div>
      </div>

      <!-- Top Spending Categories -->
      <div class="card">
        <h3 class="section-title">Top Spending Categories</h3>
        <div id="an-top-categories" class="space-y-3">
          <div class="skeleton h-8 rounded-xl"></div>
          <div class="skeleton h-8 rounded-xl"></div>
          <div class="skeleton h-8 rounded-xl"></div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    this.period = 'week';
    this.uid = uid;
    await this.loadData();
  },

  setPeriod(period, btn) {
    this.period = period;
    document.querySelectorAll('.tab-container .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.destroyCharts();
    this.loadData();
  },

  destroyCharts() {
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch(e) {} });
    this.charts = {};
  },

  async loadData() {
    const uid = this.uid;
    const today = getTodayStr();
    let startDate;
    const now = new Date();

    if (this.period === 'week') startDate = getDateStr(getStartOfWeek());
    else if (this.period === 'month') startDate = getDateStr(getStartOfMonth());
    else startDate = getDateStr(getStartOfYear());

    try {
      // Expenses
      const exSnap = await FS.expensesCol(uid).where('date', '>=', startDate).where('date', '<=', today).orderBy('date', 'asc').get();
      const expenses = exSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      // Savings
      const savSnap = await FS.savingsCol(uid)
        .where(firebase.firestore.FieldPath.documentId(), '>=', startDate)
        .where(firebase.firestore.FieldPath.documentId(), '<=', today)
        .get();

      // Budget
      const budgetSnap = await FS.budgetRef(uid).get();
      const budget = budgetSnap.data() || {};

      // Aggregate
      const dailySpending = {};
      const catTotals = {};
      let totalSpent = 0;

      expenses.forEach(ex => {
        dailySpending[ex.date] = (dailySpending[ex.date] || 0) + ex.amount;
        catTotals[ex.category] = (catTotals[ex.category] || 0) + ex.amount;
        totalSpent += ex.amount;
      });

      const dailySavings = {};
      let totalSaved = 0;
      savSnap.forEach(d => {
        dailySavings[d.id] = d.data().amount || 0;
        totalSaved += d.data().amount || 0;
      });

      const income = budget.monthlyIncome || 0;
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = typeof val === 'string' ? val : formatCurrency(val); };
      set('an-income', income);
      set('an-spent', totalSpent);
      set('an-saved', totalSaved);

      // Generate date labels
      const labels = this.generateDateLabels(startDate, today);

      // Render charts
      requestAnimationFrame(() => {
        this.renderSpendingTrend(labels, dailySpending);
        this.renderIncomeSpending(income, totalSpent, totalSaved);
        this.renderCategories(catTotals, totalSpent);
        this.renderSavingsGrowth(labels, dailySavings);
        this.renderTopCategories(catTotals, totalSpent);
        this.renderMonthlyComparison(uid);
      });
    } catch(e) { console.error('Analytics error:', e); }
  },

  generateDateLabels(startDate, endDate) {
    const labels = [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(getDateStr(new Date(d)));
    }
    return labels;
  },

  chartDefaults() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
      textColor: isDark ? '#8895b3' : '#64748b',
      gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    };
  },

  renderSpendingTrend(labels, dailySpending) {
    const ctx = document.getElementById('chart-spending-trend');
    if (!ctx) return;
    const { textColor, gridColor } = this.chartDefaults();
    const data = labels.map(d => dailySpending[d] || 0);
    const displayLabels = labels.map(d => formatDateShort(d));

    this.charts.spendingTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [{
          label: 'Daily Spending',
          data,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` } } },
        scales: {
          x: { ticks: { color: textColor, maxTicksLimit: 7 }, grid: { color: gridColor } },
          y: { ticks: { color: textColor, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) }, grid: { color: gridColor } }
        }
      }
    });
  },

  renderIncomeSpending(income, spent, saved) {
    const ctx = document.getElementById('chart-income-spending');
    if (!ctx) return;
    const { textColor } = this.chartDefaults();

    this.charts.incomeSpending = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Income', 'Spent', 'Saved'],
        datasets: [{
          data: [income, spent, saved],
          backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)', 'rgba(20,184,166,0.7)'],
          borderColor: ['#22c55e', '#ef4444', '#14b8a6'],
          borderWidth: 2, borderRadius: 8,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` } } },
        scales: {
          x: { ticks: { color: textColor } },
          y: { ticks: { color: textColor, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) } }
        }
      }
    });
  },

  renderCategories(catTotals, total) {
    const ctx = document.getElementById('chart-categories');
    if (!ctx) return;
    const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 8);
    const labels = sorted.map(([id]) => getCategoryInfo(id).label);
    const data = sorted.map(([,v]) => v);
    const colors = sorted.map(([id]) => getCategoryInfo(id).color);

    this.charts.categories = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors.map(c => c + 'cc'), borderColor: colors, borderWidth: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')} (${pct(ctx.raw, total)}%)` } }
        }
      }
    });

    // Legend
    const legend = document.getElementById('chart-categories-legend');
    if (legend) {
      legend.innerHTML = sorted.map(([id, amt]) => {
        const cat = getCategoryInfo(id);
        return `<div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full flex-shrink-0" style="background:${cat.color}"></span>
          <span class="text-xs truncate" style="color:var(--text-secondary)">${cat.emoji} ${cat.label}</span>
        </div>`;
      }).join('');
    }
  },

  renderSavingsGrowth(labels, dailySavings) {
    const ctx = document.getElementById('chart-savings-growth');
    if (!ctx) return;
    const { textColor, gridColor } = this.chartDefaults();

    // Cumulative sum
    let cumulative = 0;
    const data = labels.map(d => { cumulative += (dailySavings[d] || 0); return cumulative; });
    const displayLabels = labels.map(d => formatDateShort(d));

    this.charts.savingsGrowth = new Chart(ctx, {
      type: 'line',
      data: {
        labels: displayLabels,
        datasets: [{
          label: 'Cumulative Savings',
          data,
          borderColor: '#14b8a6',
          backgroundColor: 'rgba(20,184,166,0.1)',
          fill: true, tension: 0.4,
          pointBackgroundColor: '#14b8a6', pointRadius: 3,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `₹${ctx.raw.toLocaleString('en-IN')}` } } },
        scales: {
          x: { ticks: { color: textColor, maxTicksLimit: 6 }, grid: { display: false } },
          y: { ticks: { color: textColor, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) }, grid: { color: gridColor } }
        }
      }
    });
  },

  async renderMonthlyComparison(uid) {
    const ctx = document.getElementById('chart-monthly-comparison');
    if (!ctx) return;
    const { textColor, gridColor } = this.chartDefaults();

    // Last 6 months
    const months = [];
    const spentData = [];
    const savedData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = getDateStr(d);
      const end = getDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      months.push(d.toLocaleDateString('en-IN', { month: 'short' }));

      try {
        const exSnap = await FS.expensesCol(uid).where('date', '>=', start).where('date', '<=', end).get();
        let spent = 0; exSnap.forEach(doc => { spent += doc.data().amount || 0; });
        spentData.push(spent);

        const savSnap = await FS.savingsCol(uid)
          .where(firebase.firestore.FieldPath.documentId(), '>=', start)
          .where(firebase.firestore.FieldPath.documentId(), '<=', end).get();
        let saved = 0; savSnap.forEach(doc => { saved += doc.data().amount || 0; });
        savedData.push(saved);
      } catch(e) { spentData.push(0); savedData.push(0); }
    }

    this.charts.monthlyComparison = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Spent', data: spentData, backgroundColor: 'rgba(239,68,68,0.6)', borderColor: '#ef4444', borderWidth: 2, borderRadius: 6 },
          { label: 'Saved', data: savedData, backgroundColor: 'rgba(20,184,166,0.6)', borderColor: '#14b8a6', borderWidth: 2, borderRadius: 6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}` } }
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { display: false } },
          y: { ticks: { color: textColor, callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'K' : v) }, grid: { color: gridColor } }
        }
      }
    });
  },

  renderTopCategories(catTotals, total) {
    const container = document.getElementById('an-top-categories');
    if (!container) return;
    const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 5);
    if (sorted.length === 0) {
      container.innerHTML = '<p class="text-sm text-center" style="color:var(--text-secondary)">No expenses in this period</p>';
      return;
    }
    container.innerHTML = sorted.map(([id, amt], i) => {
      const cat = getCategoryInfo(id);
      const catPct = pct(amt, total);
      return `<div class="flex items-center gap-3">
        <span class="text-sm font-bold w-5" style="color:var(--text-secondary)">${i+1}</span>
        <span class="text-xl">${cat.emoji}</span>
        <div class="flex-1">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-medium">${cat.label}</span>
            <span class="text-sm font-semibold" style="color:var(--color-red)">${formatCurrency(amt)}</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${catPct}%;background:${cat.color}"></div>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  destroy() {
    this.destroyCharts();
  },
};
