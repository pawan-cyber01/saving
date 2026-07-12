// goals.js — Savings goals with progress, add savings, and estimated completion

const Goals = {
  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="page-title">Savings Goals</h1>
          <p class="page-subtitle">Dream it, save it, achieve it</p>
        </div>
        <button onclick="Goals.openAddModal()" class="btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Goal
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-3">
        <div class="stat-card text-center">
          <div class="stat-value text-center" id="gl-total-goals">0</div>
          <div class="stat-label text-center">Total Goals</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-center" style="color:var(--color-teal)" id="gl-total-saved">₹0</div>
          <div class="stat-label text-center">Total Saved</div>
        </div>
        <div class="stat-card text-center">
          <div class="stat-value text-center" style="color:var(--color-violet)" id="gl-completed">0</div>
          <div class="stat-label text-center">Completed</div>
        </div>
      </div>

      <!-- Quick Goal Templates -->
      <div>
        <h2 class="section-title">Quick Start</h2>
        <div class="scroll-tabs">
          ${[['🏍️','Bike'],['💻','Laptop'],['✈️','Trip'],['🆘','Emergency'],['📱','Phone'],['🏠','House'],['🚗','Car'],['📚','Education']].map(([emoji, name]) =>
            `<button onclick="Goals.quickCreate('${name}')" class="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium btn-secondary">${emoji} ${name}</button>`
          ).join('')}
        </div>
      </div>

      <!-- Goals List -->
      <div id="gl-list" class="space-y-4">
        <div class="skeleton h-32 rounded-2xl"></div>
        <div class="skeleton h-32 rounded-2xl"></div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    await this.loadGoals(uid);
  },

  async loadGoals(uid) {
    const container = document.getElementById('gl-list');
    if (!container) return;

    try {
      const snap = await FS.goalsCol(uid).orderBy('createdAt', 'desc').get();
      let totalSaved = 0, completed = 0;

      const elTotal = document.getElementById('gl-total-goals');
      const elSaved = document.getElementById('gl-total-saved');
      const elCompleted = document.getElementById('gl-completed');
      if (elTotal) elTotal.textContent = snap.size;

      if (snap.empty) {
        container.innerHTML = `<div class="empty-state card">
          <div class="empty-state-icon">🎯</div>
          <p class="empty-state-title">No goals yet</p>
          <p class="empty-state-text">Create your first savings goal and start working toward it</p>
          <button onclick="Goals.openAddModal()" class="btn-primary btn-sm mt-4">Create First Goal</button>
        </div>`;
        return;
      }

      container.innerHTML = snap.docs.map(d => {
        const g = d.data(); const id = d.id;
        const saved = g.savedAmount || 0;
        const target = g.targetAmount || 1;
        const progress = pct(saved, target);
        const isComplete = saved >= target;
        totalSaved += saved;
        if (isComplete) completed++;

        // Estimated completion
        let etaText = '';
        if (!isComplete && g.targetDate) {
          const daysLeft = Math.ceil((new Date(g.targetDate) - Date.now()) / 86400000);
          etaText = daysLeft > 0 ? `${daysLeft} days left` : 'Overdue!';
        }

        return `
        <div class="goal-card" style="${isComplete ? 'border-color:rgba(34,197,94,0.3)' : ''}">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style="background:var(--glass-bg)">
                ${getGoalIcon(g.name)}
              </div>
              <div>
                <p class="font-outfit font-semibold">${g.name}</p>
                <p class="text-xs" style="color:var(--text-secondary)">${g.targetDate ? 'Target: ' + formatDate(g.targetDate) : 'No deadline'}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${isComplete ? '<span class="badge badge-green">✓ Complete</span>' : `<span class="text-sm font-outfit font-bold" style="color:var(--color-violet)">${progress}%</span>`}
              <div class="relative">
                <button onclick="Goals.showGoalMenu('${id}', event)" class="btn-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="progress-bar-track mb-2">
            <div class="progress-bar-fill" style="width:${progress}%;${isComplete ? 'background:linear-gradient(90deg,#15803d,#22c55e)' : 'background:linear-gradient(90deg,#7c3aed,#14b8a6)'}"></div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <span class="font-outfit font-bold" style="color:var(--color-teal)">${formatCurrency(saved)}</span>
              <span class="text-xs" style="color:var(--text-secondary)"> of ${formatCurrency(target)}</span>
            </div>
            <div class="flex items-center gap-2">
              ${etaText ? `<span class="text-xs" style="color:var(--text-secondary)">${etaText}</span>` : ''}
              ${!isComplete ? `<button onclick="Goals.addToGoal('${id}', '${g.name}', ${target - saved})" class="btn-sm btn-secondary">+ Add</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('');

      if (elSaved) elSaved.textContent = formatCurrency(totalSaved);
      if (elCompleted) elCompleted.textContent = completed;
    } catch(e) {
      container.innerHTML = '<p class="text-sm p-4" style="color:var(--text-secondary)">Failed to load goals</p>';
    }
  },

  quickCreate(name) {
    this.openAddModal(name);
  },

  openAddModal(prefillName = '') {
    const today = getTodayStr();
    document.getElementById('goal-modal-title').textContent = prefillName ? `New ${prefillName} Goal` : 'New Savings Goal';
    document.getElementById('goal-modal-body').innerHTML = `
      <div class="space-y-4 pb-4">
        <div class="form-group">
          <label class="form-label">Goal Name *</label>
          <input type="text" id="gl-inp-name" class="form-input" placeholder="e.g. New Laptop" value="${prefillName}">
        </div>
        <div class="form-group">
          <label class="form-label">Target Amount (₹) *</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-violet)">₹</span>
            <input type="number" id="gl-inp-target" class="form-input pl-7" placeholder="50000" min="1">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Initial Saved Amount (₹)</label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-green)">₹</span>
            <input type="number" id="gl-inp-saved" class="form-input pl-7" placeholder="0" min="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Target Date</label>
          <input type="date" id="gl-inp-date" class="form-input" min="${today}">
        </div>
        <button onclick="Goals.saveGoal()" id="gl-save-btn" class="btn-primary w-full justify-center py-3">
          Create Goal 🎯
        </button>
      </div>
    `;
    openModal('goal-modal');
  },

  async saveGoal() {
    const uid = getUID();
    if (!uid) return;
    const name = sanitize(document.getElementById('gl-inp-name')?.value.trim());
    const target = parseAmount(document.getElementById('gl-inp-target')?.value);
    const saved = parseAmount(document.getElementById('gl-inp-saved')?.value) || 0;
    const targetDate = document.getElementById('gl-inp-date')?.value || null;

    if (!name) { showToast('Enter a goal name', 'warning'); return; }
    if (!target || target <= 0) { showToast('Enter a target amount', 'warning'); return; }

    const btn = document.getElementById('gl-save-btn');
    setLoading(btn, true);
    try {
      await FS.goalsCol(uid).add({
        name, targetAmount: target, savedAmount: saved,
        targetDate: targetDate || null,
        createdAt: TS.now(),
      });
      showToast('Goal created! 🎯', 'success');
      closeModal('goal-modal');
      this.loadGoals(uid);
    } catch(e) {
      showToast('Failed to create goal', 'error');
    } finally { setLoading(btn, false); }
  },

  addToGoal(id, name, remaining) {
    showConfirm({
      title: `Add to "${name}"`,
      message: `How much would you like to add? (Max: ${formatCurrency(remaining)})`,
      confirmText: 'Add',
      onConfirm: async () => {
        const amount = parseAmount(prompt(`Enter amount to add to "${name}" (₹):`));
        if (!amount || amount <= 0) return;
        const uid = getUID();
        try {
          await FS.goalDoc(uid, id).update({ savedAmount: TS.increment(amount) });
          showToast(`${formatCurrency(amount)} added to "${name}" 🎉`, 'success');
          this.loadGoals(uid);
        } catch(e) { showToast('Failed to update goal', 'error'); }
      }
    });
  },

  showGoalMenu(id, event) {
    event.stopPropagation();
    showConfirm({
      title: 'Delete Goal',
      message: 'Are you sure? This cannot be undone.',
      confirmText: 'Delete', danger: true,
      onConfirm: async () => {
        const uid = getUID();
        try {
          await FS.goalDoc(uid, id).delete();
          showToast('Goal deleted', 'success');
          this.loadGoals(uid);
        } catch(e) { showToast('Failed to delete', 'error'); }
      }
    });
  },
};
