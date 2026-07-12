// income.js — Monthly Income tracking and Extra Income logging

const Income = {
  _unsub: null,
  _currentMonth: null,
  _totalIncome: 0,
  _expectedIncome: 0,

  render() {
    const monthStr = getMonthStr();
    return `
    <div class="space-y-6 animate-stagger">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Income</h1>
          <p class="page-subtitle">${monthStr}</p>
        </div>
        <button onclick="Income.openSettingsModal()" class="btn-sm btn-secondary">Settings</button>
      </div>

      <!-- Overview Card -->
      <div class="card" style="background:linear-gradient(135deg,rgba(34,197,94,0.1),rgba(20,184,166,0.1));border-color:rgba(34,197,94,0.2)">
        <div class="flex justify-between items-start mb-4">
          <div>
            <p class="text-xs uppercase tracking-widest font-semibold mb-1" style="color:var(--color-green)">Total Received</p>
            <p class="font-outfit font-bold text-4xl" id="inc-total">₹0</p>
          </div>
          <div class="text-right">
            <p class="text-xs mb-1" style="color:var(--text-secondary)">Expected</p>
            <p class="font-outfit font-semibold text-lg" id="inc-expected">₹0</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-black/20 rounded-full h-2 mb-2 overflow-hidden">
          <div id="inc-progress" class="bg-green-500 h-2 rounded-full transition-all duration-500" style="width:0%"></div>
        </div>
        <p class="text-xs text-right" id="inc-remaining" style="color:var(--text-secondary)">₹0 remaining to target</p>
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button onclick="Income.openAddModal('regular')" class="btn-primary justify-center py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Income
        </button>
        <button onclick="Income.openAddModal('extra')" class="btn-gold justify-center py-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Extra Income
        </button>
      </div>

      <!-- Recent Income -->
      <div class="card">
        <h2 class="section-title">Income History</h2>
        <div id="inc-history" class="space-y-3">
          <!-- Populated by JS -->
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    this._currentMonth = getMonthStr();

    // Listen to income documents for this month
    this._unsub = FS.incomeRef(uid).where('month', '==', this._currentMonth)
      .orderBy('timestamp', 'desc')
      .onSnapshot(snap => {
        this.updateUI(snap);
      }, err => console.error('Income listener error:', err));
  },

  destroy() {
    if (this._unsub) this._unsub();
  },

  updateUI(snap) {
    let total = 0;
    let expected = 0;
    const historyHtml = [];

    snap.forEach(doc => {
      const data = doc.data();
      if (data.type === 'settings') {
        expected = data.expected || 0;
        return;
      }
      total += data.amount;
      
      const isExtra = data.type === 'extra';
      const icon = isExtra ? '🎁' : '💰';
      const colorClass = isExtra ? 'text-yellow-500' : 'text-green-500';
      
      historyHtml.push(`
        <div class="flex items-center justify-between p-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--glass-bg)] hover:bg-[color:var(--glass-bg-hover)] transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center bg-black/20 text-xl">${icon}</div>
            <div>
              <p class="font-medium text-sm">${data.note || (isExtra ? 'Extra Income' : 'Income')}</p>
              <p class="text-xs" style="color:var(--text-secondary)">${formatDate(data.date)}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-outfit font-semibold ${colorClass}">+${formatCurrency(data.amount)}</p>
            <button onclick="Income.deleteIncome('${doc.id}')" class="text-xs text-red-400 opacity-60 hover:opacity-100 uppercase font-semibold tracking-wider mt-1">Delete</button>
          </div>
        </div>
      `);
    });

    this._totalIncome = total;
    this._expectedIncome = expected;

    const totalEl = document.getElementById('inc-total');
    if (totalEl) totalEl.textContent = formatCurrency(total);
    
    const expectedEl = document.getElementById('inc-expected');
    if (expectedEl) expectedEl.textContent = formatCurrency(expected);

    const progressEl = document.getElementById('inc-progress');
    const remainingEl = document.getElementById('inc-remaining');
    if (progressEl && remainingEl) {
      if (expected === 0) {
        progressEl.style.width = '100%';
        remainingEl.textContent = 'Target not set';
      } else {
        const percent = Math.min((total / expected) * 100, 100);
        progressEl.style.width = percent + '%';
        if (total >= expected) {
          remainingEl.textContent = '🎉 Target reached!';
          remainingEl.style.color = 'var(--color-green)';
        } else {
          remainingEl.textContent = formatCurrency(expected - total) + ' remaining';
          remainingEl.style.color = 'var(--text-secondary)';
        }
      }
    }

    const historyContainer = document.getElementById('inc-history');
    if (historyContainer) {
      historyContainer.innerHTML = historyHtml.length ? historyHtml.join('') : '<p class="text-sm text-center text-gray-500 py-4">No income recorded this month</p>';
    }
  },

  openSettingsModal() {
    const body = document.getElementById('income-modal-body');
    const title = document.getElementById('income-modal-title');
    if (!body || !title) return;

    title.textContent = 'Income Settings';
    body.innerHTML = `
      <div class="space-y-4 pb-4">
        <p class="text-sm" style="color:var(--text-secondary)">Set the total amount of money you expect to receive this month.</p>
        <div class="form-group">
          <label class="form-label">Expected Monthly Income</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-green)">₹</span>
            <input type="number" id="inc-set-amount" class="form-input pl-7" placeholder="20000" value="${this._expectedIncome || ''}" min="0">
          </div>
        </div>
        <button onclick="Income.saveSettings()" class="btn-primary w-full justify-center py-3 mt-2">Save Settings</button>
      </div>
    `;
    openModal('income-modal');
  },

  async saveSettings() {
    const amount = parseAmount(document.getElementById('inc-set-amount')?.value);
    if (amount < 0) { showToast('Invalid amount', 'warning'); return; }

    const uid = getUID();
    if (!uid) return;

    try {
      await FS.incomeRef(uid).doc('settings_' + this._currentMonth).set({
        type: 'settings',
        month: this._currentMonth,
        expected: amount || 0,
        updatedAt: TS.now()
      });
      showToast('Settings saved!', 'success');
      closeModal('income-modal');
    } catch(e) { showToast('Failed to save settings', 'error'); }
  },

  openAddModal(type) {
    const body = document.getElementById('income-modal-body');
    const title = document.getElementById('income-modal-title');
    if (!body || !title) return;

    title.textContent = type === 'extra' ? '🎁 Add Extra Income' : '💰 Add Income';
    body.innerHTML = `
      <div class="space-y-4 pb-4">
        <div class="form-group">
          <label class="form-label">Amount</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-green)">₹</span>
            <input type="number" id="inc-add-amount" class="form-input pl-7" placeholder="1000" min="1">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Source / Note</label>
          <input type="text" id="inc-add-note" class="form-input" placeholder="${type === 'extra' ? 'Bonus, Gift, etc.' : 'Salary, Pocket Money'}">
        </div>
        <button onclick="Income.addIncome('${type}')" class="${type === 'extra' ? 'btn-gold' : 'btn-primary'} w-full justify-center py-3 mt-2">
          ${type === 'extra' ? 'Add Extra Income' : 'Add Income'}
        </button>
      </div>
    `;
    openModal('income-modal');
  },

  async addIncome(type) {
    const amount = parseAmount(document.getElementById('inc-add-amount')?.value);
    const note = document.getElementById('inc-add-note')?.value.trim();

    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'warning'); return; }

    const uid = getUID();
    if (!uid) return;

    const btn = event.currentTarget;
    setLoading(btn, true);

    try {
      await FS.incomeRef(uid).add({
        type: type,
        amount: amount,
        note: note || (type === 'extra' ? 'Extra Income' : 'Income'),
        date: getTodayStr(),
        month: this._currentMonth,
        timestamp: TS.now()
      });
      showToast('Income added!', 'success');
      closeModal('income-modal');
    } catch(e) {
      showToast('Failed to add income', 'error');
    } finally { setLoading(btn, false); }
  },

  async deleteIncome(docId) {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    const uid = getUID();
    if (!uid) return;

    try {
      await FS.incomeRef(uid).doc(docId).delete();
      showToast('Income deleted', 'info');
    } catch(e) { showToast('Failed to delete', 'error'); }
  }
};
