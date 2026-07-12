// locked.js — Locked savings with countdown timer and withdrawal logic

const Locked = {
  countdownInterval: null,

  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Locked Savings</h1>
        <p class="page-subtitle">Your savings are protected until the 1st</p>
      </div>

      <!-- Locked Amount Card -->
      <div class="card text-center" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(14,148,132,0.1));border-color:rgba(139,92,246,0.25)">
        <div class="w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center" style="background:rgba(139,92,246,0.15)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <p class="text-xs font-semibold uppercase tracking-widest mb-2" style="color:rgba(167,139,250,0.7)">Total Locked</p>
        <p class="font-outfit font-bold text-4xl mb-1" id="lk-total">₹0</p>
        <p class="text-sm" style="color:var(--text-secondary)">Accumulated savings this month</p>
      </div>

      <!-- Countdown Timer -->
      <div class="card" id="lk-countdown-card">
        <div class="text-center mb-4">
          <p class="section-title" id="lk-countdown-title">Time Until Withdrawal Available</p>
          <p class="text-sm" style="color:var(--text-secondary)" id="lk-countdown-subtitle">Savings unlock on the 1st of next month</p>
        </div>
        <div class="flex items-center justify-center gap-3" id="lk-countdown">
          <div class="countdown-unit">
            <div class="countdown-num" id="lk-days">00</div>
            <div class="countdown-label">Days</div>
          </div>
          <div class="font-outfit font-bold text-2xl" style="color:var(--text-tertiary)">:</div>
          <div class="countdown-unit">
            <div class="countdown-num" id="lk-hours">00</div>
            <div class="countdown-label">Hours</div>
          </div>
          <div class="font-outfit font-bold text-2xl" style="color:var(--text-tertiary)">:</div>
          <div class="countdown-unit">
            <div class="countdown-num" id="lk-mins">00</div>
            <div class="countdown-label">Minutes</div>
          </div>
          <div class="font-outfit font-bold text-2xl" style="color:var(--text-tertiary)">:</div>
          <div class="countdown-unit">
            <div class="countdown-num" id="lk-secs">00</div>
            <div class="countdown-label">Seconds</div>
          </div>
        </div>

        <!-- Withdrawal Button Area -->
        <div class="mt-5" id="lk-action-area">
          <button id="lk-withdraw-btn" class="btn-primary w-full justify-center py-3" disabled style="opacity:0.5;cursor:not-allowed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Locked Until 1st
          </button>
          <p class="text-xs text-center mt-2" style="color:var(--text-tertiary)">Withdrawal will be enabled automatically on the 1st of each month</p>
        </div>
      </div>

      <!-- Emergency Withdrawal -->
      <div class="card">
        <div class="flex items-start gap-3 mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(239,68,68,0.15)">
            <span class="text-xl">⚠️</span>
          </div>
          <div>
            <h3 class="font-outfit font-semibold mb-1">Emergency Withdrawal</h3>
            <p class="text-sm" style="color:var(--text-secondary)">Break your lock early with a penalty fee. Use only in emergencies.</p>
          </div>
        </div>

        <div class="p-3 rounded-xl mb-4" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.15)">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm" style="color:var(--text-secondary)">Penalty rate</span>
            <div class="flex items-center gap-2">
              <input type="number" id="lk-penalty-rate" class="form-input w-20 py-1.5 text-center" value="10" min="0" max="50" step="1">
              <span class="text-sm font-medium">%</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm" style="color:var(--text-secondary)">Amount after penalty</span>
            <span class="font-outfit font-semibold" style="color:var(--color-red)" id="lk-penalty-amount">₹0</span>
          </div>
        </div>

        <button onclick="Locked.emergencyWithdraw()" id="lk-emergency-btn" class="btn-danger w-full justify-center">
          Emergency Withdrawal
        </button>
      </div>

      <!-- Savings Lock Rules -->
      <div class="card">
        <h3 class="section-title">How Locked Savings Work</h3>
        <div class="space-y-3">
          ${[
            ['🔒', 'Savings are automatically locked when you save daily'],
            ['📅', 'Your full amount is available for withdrawal on the 1st of each month'],
            ['⚡', 'Emergency withdrawal available anytime with a configurable penalty'],
            ['💹', 'The longer you lock, the better your saving habit becomes'],
            ['🎯', 'Use monthly unlock to fund your savings goals'],
          ].map(([icon, text]) => `
            <div class="flex items-center gap-3">
              <span class="text-xl">${icon}</span>
              <p class="text-sm" style="color:var(--text-secondary)">${text}</p>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Withdrawal History -->
      <div class="card">
        <h3 class="section-title">Withdrawal History</h3>
        <div id="lk-history">
          <div class="empty-state py-6">
            <div class="empty-state-icon">📜</div>
            <p class="empty-state-title">No withdrawals yet</p>
            <p class="empty-state-text">Your withdrawal history will appear here</p>
          </div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    await this.loadLockedAmount(uid);
    this.startCountdown();
    this.updatePenaltyAmount();

    document.getElementById('lk-penalty-rate')?.addEventListener('input', () => this.updatePenaltyAmount());
  },

  async loadLockedAmount(uid) {
    try {
      const snap = await FS.lockedRef(uid).get();
      const data = snap.data() || {};
      const total = data.totalLocked || 0;
      this._total = total;
      const el = document.getElementById('lk-total');
      if (el) animateNumber(el, 0, total);
      this.updatePenaltyAmount();
    } catch(e) {}
  },

  startCountdown() {
    this.tick();
    this.countdownInterval = setInterval(() => this.tick(), 1000);
  },

  tick() {
    const { days, hours, minutes, seconds, isUnlocked } = countdownTo1st();
    const pad = n => String(n).padStart(2, '0');

    const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setEl('lk-days', pad(days));
    setEl('lk-hours', pad(hours));
    setEl('lk-mins', pad(minutes));
    setEl('lk-secs', pad(seconds));

    if (isUnlocked) {
      const btn = document.getElementById('lk-withdraw-btn');
      const title = document.getElementById('lk-countdown-title');
      const subtitle = document.getElementById('lk-countdown-subtitle');
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Withdraw Savings`;
        btn.onclick = () => Locked.withdraw();
      }
      if (title) title.textContent = '🎉 Withdrawal Available!';
      if (subtitle) subtitle.textContent = "Today is the 1st! You can now withdraw your savings.";
      // Color the countdown green
      document.querySelectorAll('.countdown-unit').forEach(el => {
        el.style.background = 'rgba(34,197,94,0.1)';
        el.style.borderColor = 'rgba(34,197,94,0.25)';
      });
    }
  },

  updatePenaltyAmount() {
    const rate = parseAmount(document.getElementById('lk-penalty-rate')?.value) || 10;
    const total = this._total || 0;
    const afterPenalty = total * (1 - rate / 100);
    const el = document.getElementById('lk-penalty-amount');
    if (el) el.textContent = formatCurrency(afterPenalty);
  },

  async withdraw() {
    const uid = getUID();
    if (!uid) return;
    const total = this._total || 0;
    if (total <= 0) { showToast('No savings to withdraw', 'warning'); return; }

    showConfirm({
      title: 'Withdraw Savings',
      message: `Withdraw ${formatCurrency(total)} to your account? This will reset your locked savings.`,
      confirmText: 'Withdraw',
      onConfirm: async () => {
        try {
          await FS.lockedRef(uid).set({
            totalLocked: 0,
            lastWithdrawal: { amount: total, date: getTodayStr(), type: 'normal', timestamp: TS.now() },
          }, { merge: true });
          this._total = 0;
          animateNumber(document.getElementById('lk-total'), total, 0);
          showToast(`${formatCurrency(total)} withdrawn successfully! 💰`, 'success');
        } catch(e) { showToast('Withdrawal failed', 'error'); }
      }
    });
  },

  async emergencyWithdraw() {
    const uid = getUID();
    if (!uid) return;
    const rate = parseAmount(document.getElementById('lk-penalty-rate')?.value) || 10;
    const total = this._total || 0;
    if (total <= 0) { showToast('No savings to withdraw', 'warning'); return; }
    const penalty = total * (rate / 100);
    const afterPenalty = total - penalty;

    showConfirm({
      title: '⚠️ Emergency Withdrawal',
      message: `You'll lose ${formatCurrency(penalty)} (${rate}% penalty).\nYou'll receive: ${formatCurrency(afterPenalty)}\n\nAre you sure?`,
      confirmText: 'Confirm Emergency Withdrawal',
      danger: true,
      onConfirm: async () => {
        try {
          await FS.lockedRef(uid).set({
            totalLocked: 0,
            lastWithdrawal: { amount: afterPenalty, penalty, penaltyRate: rate, date: getTodayStr(), type: 'emergency', timestamp: TS.now() },
          }, { merge: true });
          this._total = 0;
          animateNumber(document.getElementById('lk-total'), total, 0);
          showToast(`Emergency withdrawal: ${formatCurrency(afterPenalty)} (${formatCurrency(penalty)} penalty)`, 'warning');
        } catch(e) { showToast('Withdrawal failed', 'error'); }
      }
    });
  },

  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  },
};
