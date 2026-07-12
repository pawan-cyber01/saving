// reports.js — Generate and export PDF, Excel, CSV reports

const Reports = {
  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Export your financial data</p>
      </div>

      <!-- Report Type -->
      <div class="card">
        <h2 class="section-title">Report Type</h2>
        <div class="grid grid-cols-2 gap-3">
          ${[['daily','Daily','📅'],['weekly','Weekly','📊'],['monthly','Monthly','📆'],['yearly','Yearly','📋']].map(([val, label, icon]) =>
            `<button onclick="Reports.selectType('${val}', this)" class="report-type-btn p-4 rounded-2xl border text-left transition-all" data-type="${val}" style="background:var(--glass-bg);border-color:var(--color-border)">
              <span class="text-2xl block mb-1">${icon}</span>
              <span class="font-outfit font-semibold text-sm">${label} Report</span>
            </button>`
          ).join('')}
        </div>
      </div>

      <!-- Date Range -->
      <div class="card">
        <h2 class="section-title">Date Range</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="form-group mb-0">
            <label class="form-label">From</label>
            <input type="date" id="rp-from" class="form-input" value="${getDateStr(getStartOfMonth())}">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">To</label>
            <input type="date" id="rp-to" class="form-input" value="${getTodayStr()}">
          </div>
        </div>
      </div>

      <!-- Generate Button -->
      <button onclick="Reports.generate()" id="rp-generate-btn" class="btn-primary w-full justify-center py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Generate Report
      </button>

      <!-- Preview -->
      <div id="rp-preview" class="hidden">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <h2 class="section-title mb-0" id="rp-preview-title">Report Preview</h2>
            <span class="badge badge-violet" id="rp-records-count">0 records</span>
          </div>

          <!-- Summary Cards -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 rounded-xl" style="background:var(--glass-bg)">
              <p class="text-xs mb-1" style="color:var(--text-secondary)">Total Expenses</p>
              <p class="font-outfit font-bold" style="color:var(--color-red)" id="rp-total-expenses">₹0</p>
            </div>
            <div class="p-3 rounded-xl" style="background:var(--glass-bg)">
              <p class="text-xs mb-1" style="color:var(--text-secondary)">Total Saved</p>
              <p class="font-outfit font-bold" style="color:var(--color-green)" id="rp-total-saved">₹0</p>
            </div>
            <div class="p-3 rounded-xl" style="background:var(--glass-bg)">
              <p class="text-xs mb-1" style="color:var(--text-secondary)">Transactions</p>
              <p class="font-outfit font-bold" id="rp-tx-count">0</p>
            </div>
            <div class="p-3 rounded-xl" style="background:var(--glass-bg)">
              <p class="text-xs mb-1" style="color:var(--text-secondary)">Days Period</p>
              <p class="font-outfit font-bold" id="rp-days-count">0</p>
            </div>
          </div>

          <!-- Export Buttons -->
          <div class="space-y-2">
            <h3 class="text-sm font-semibold mb-2" style="color:var(--text-secondary)">Export As</h3>
            <div class="grid grid-cols-3 gap-2">
              <button onclick="Reports.exportPDF()" class="btn-secondary justify-center py-2.5 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                PDF
              </button>
              <button onclick="Reports.exportExcel()" class="btn-secondary justify-center py-2.5 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                Excel
              </button>
              <button onclick="Reports.exportCSV()" class="btn-secondary justify-center py-2.5 text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                CSV
              </button>
            </div>
          </div>

          <!-- Data Table Preview -->
          <div class="mt-4 overflow-x-auto">
            <table class="admin-table min-w-full text-xs">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th>Method</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody id="rp-table-body">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    `;
  },

  selectedType: 'monthly',
  reportData: [],

  async init() {
    this.uid = getUID();
    // Pre-select monthly
    const btn = document.querySelector('[data-type="monthly"]');
    if (btn) this.selectType('monthly', btn);
  },

  selectType(type, btn) {
    this.selectedType = type;
    document.querySelectorAll('.report-type-btn').forEach(b => {
      b.style.borderColor = 'var(--color-border)';
      b.style.background = 'var(--glass-bg)';
    });
    if (btn) {
      btn.style.borderColor = 'var(--color-violet)';
      btn.style.background = 'rgba(139,92,246,0.1)';
    }
    // Auto-set date range
    const today = getTodayStr();
    const fromEl = document.getElementById('rp-from');
    const toEl = document.getElementById('rp-to');
    if (!fromEl || !toEl) return;
    toEl.value = today;
    switch(type) {
      case 'daily': fromEl.value = today; break;
      case 'weekly': fromEl.value = getDateStr(getStartOfWeek()); break;
      case 'monthly': fromEl.value = getDateStr(getStartOfMonth()); break;
      case 'yearly': fromEl.value = getDateStr(getStartOfYear()); break;
    }
  },

  async generate() {
    const uid = this.uid;
    if (!uid) return;
    const from = document.getElementById('rp-from')?.value;
    const to = document.getElementById('rp-to')?.value;
    if (!from || !to) { showToast('Select date range', 'warning'); return; }

    const btn = document.getElementById('rp-generate-btn');
    setLoading(btn, true);
    try {
      // Fetch expenses
      const exSnap = await FS.expensesCol(uid).where('date', '>=', from).where('date', '<=', to).orderBy('date', 'asc').get();
      // Fetch savings
      const savSnap = await FS.savingsCol(uid)
        .where(firebase.firestore.FieldPath.documentId(), '>=', from)
        .where(firebase.firestore.FieldPath.documentId(), '<=', to)
        .get();

      const rows = [];
      let totalExpenses = 0, totalSaved = 0;

      // Add savings rows
      savSnap.forEach(d => {
        rows.push({ date: d.id, type: 'Saving', category: '💰 Savings', note: 'Daily Saving', method: d.data().method || 'Manual', amount: d.data().amount || 0 });
        totalSaved += d.data().amount || 0;
      });

      // Add expense rows
      exSnap.forEach(d => {
        const data = d.data();
        const cat = getCategoryInfo(data.category);
        rows.push({ date: data.date, type: 'Expense', category: `${cat.emoji} ${cat.label}`, note: data.note || '', method: data.paymentMethod || 'UPI', amount: data.amount || 0 });
        totalExpenses += data.amount || 0;
      });

      // Sort by date
      rows.sort((a,b) => a.date.localeCompare(b.date));
      this.reportData = rows;
      this.fromDate = from;
      this.toDate = to;

      // Show preview
      document.getElementById('rp-preview').classList.remove('hidden');
      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      set('rp-preview-title', `${this.selectedType.charAt(0).toUpperCase() + this.selectedType.slice(1)} Report`);
      set('rp-records-count', `${rows.length} records`);
      set('rp-total-expenses', formatCurrencyFull(totalExpenses));
      set('rp-total-saved', formatCurrencyFull(totalSaved));
      set('rp-tx-count', exSnap.size);
      const days = Math.ceil((new Date(to) - new Date(from)) / 86400000) + 1;
      set('rp-days-count', days + ' days');

      // Table
      const tbody = document.getElementById('rp-table-body');
      if (tbody) {
        tbody.innerHTML = rows.slice(0, 50).map(row => `
          <tr>
            <td>${formatDateShort(row.date)}</td>
            <td><span class="badge ${row.type === 'Saving' ? 'badge-green' : 'badge-red'}">${row.type}</span></td>
            <td>${row.category}</td>
            <td class="max-w-[100px] truncate">${row.note}</td>
            <td>${row.method}</td>
            <td class="text-right font-outfit font-semibold" style="color:${row.type === 'Saving' ? 'var(--color-green)' : 'var(--color-red)'}">
              ${row.type === 'Saving' ? '+' : '-'}${formatCurrency(row.amount)}
            </td>
          </tr>
        `).join('');
        if (rows.length > 50) tbody.innerHTML += `<tr><td colspan="6" class="text-center py-2" style="color:var(--text-secondary)">...and ${rows.length-50} more rows in export</td></tr>`;
      }

      document.getElementById('rp-preview').scrollIntoView({ behavior: 'smooth' });
    } catch(e) {
      showToast('Failed to generate report', 'error');
    } finally { setLoading(btn, false); }
  },

  exportCSV() {
    if (!this.reportData.length) { showToast('Generate a report first', 'warning'); return; }
    const headers = ['Date','Type','Category','Note','Payment Method','Amount'];
    const rows = this.reportData.map(r => [r.date, r.type, r.category, r.note, r.method, r.amount]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SaveLock_${this.selectedType}_${this.fromDate}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV downloaded!', 'success');
  },

  exportExcel() {
    if (!this.reportData.length) { showToast('Generate a report first', 'warning'); return; }
    if (!window.XLSX) { showToast('Excel library loading...', 'info'); return; }
    const wb = XLSX.utils.book_new();
    const data = [
      ['Date', 'Type', 'Category', 'Note', 'Payment Method', 'Amount'],
      ...this.reportData.map(r => [r.date, r.type, r.category, r.note, r.method, r.amount])
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `SaveLock_${this.selectedType}_${this.fromDate}.xlsx`);
    showToast('Excel downloaded!', 'success');
  },

  exportPDF() {
    if (!this.reportData.length) { showToast('Generate a report first', 'warning'); return; }
    if (!window.jspdf) { showToast('PDF library loading...', 'info'); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('SaveLock Financial Report', 14, 16);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${formatDate(this.fromDate)} to ${formatDate(this.toDate)}`, 14, 33);
    doc.text(`Generated: ${formatDate(getTodayStr())}`, 14, 40);

    // Summary
    const totalExp = this.reportData.filter(r => r.type === 'Expense').reduce((s,r) => s + r.amount, 0);
    const totalSav = this.reportData.filter(r => r.type === 'Saving').reduce((s,r) => s + r.amount, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Expenses: Rs.${totalExp.toLocaleString('en-IN')}`, 14, 50);
    doc.text(`Total Savings:  Rs.${totalSav.toLocaleString('en-IN')}`, 14, 57);

    // Table
    let y = 70;
    doc.setFontSize(8);
    const cols = [['Date',25],['Type',20],['Category',30],['Note',50],['Method',25],['Amount',25]];
    // Header row
    doc.setFillColor(240, 235, 255);
    doc.rect(14, y-5, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    let x = 14;
    cols.forEach(([label, w]) => { doc.text(label, x, y); x += w; });
    y += 6;
    doc.setFont('helvetica', 'normal');

    this.reportData.slice(0, 60).forEach((row, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) { doc.setFillColor(249, 248, 255); doc.rect(14, y-4, 182, 7, 'F'); }
      x = 14;
      const vals = [row.date, row.type, row.category.slice(0,15), row.note.slice(0,20), row.method.slice(0,12), `Rs.${row.amount}`];
      cols.forEach(([,w], idx) => { doc.text(vals[idx] || '', x, y); x += w; });
      y += 7;
    });

    doc.save(`SaveLock_${this.selectedType}_${this.fromDate}.pdf`);
    showToast('PDF downloaded!', 'success');
  },
};
