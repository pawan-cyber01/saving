// upi.js — UPI payment intent generator with QR code fallback

const UPI = {
  openModal(prefillAmount) {
    const body = document.getElementById('upi-modal-body');
    if (!body) return;
    const uid = getUID();

    body.innerHTML = `
    <div class="space-y-4 pb-4">
      <!-- UPI Instructions -->
      <div class="p-3 rounded-xl text-sm" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)">
        <p class="font-medium mb-1" style="color:#fbbf24">💡 How UPI Payment Works</p>
        <p style="color:var(--text-secondary)">Fill in the details below, tap "Pay Now" to open your UPI app, then come back and mark as paid.</p>
      </div>

      <!-- UPI Fields -->
      <div class="form-group">
        <label class="form-label">UPI ID *</label>
        <input type="text" id="upi-inp-id" class="form-input" placeholder="yourname@upi" id="upi-id-inp">
      </div>
      <div class="form-group">
        <label class="form-label">Receiver Name *</label>
        <input type="text" id="upi-inp-name" class="form-input" placeholder="Savings Account">
      </div>
      <div class="form-group">
        <label class="form-label">Amount (₹) *</label>
        <div class="relative">
          <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-gold)">₹</span>
          <input type="number" id="upi-inp-amount" class="form-input pl-7" placeholder="100" value="${prefillAmount || ''}" min="1">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" id="upi-inp-note" class="form-input" placeholder="Daily Savings" value="Daily Savings - SaveLock">
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button onclick="UPI.generateLink()" id="upi-gen-btn" class="btn-primary justify-center py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Generate
        </button>
        <button onclick="UPI.showQR()" class="btn-secondary justify-center py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01"/></svg>
          Show QR
        </button>
      </div>

      <!-- Generated Link Area -->
      <div id="upi-link-area" class="hidden space-y-3">
        <hr class="divider">

        <!-- Intent link display -->
        <div class="p-3 rounded-xl" style="background:var(--glass-bg);border:1px solid var(--color-border)">
          <p class="text-xs mb-1.5 font-medium" style="color:var(--text-secondary)">Generated UPI Link</p>
          <p class="text-xs font-mono break-all" id="upi-link-display" style="color:var(--color-violet)"></p>
        </div>

        <!-- Pay Now Button -->
        <a id="upi-pay-link" href="#" class="btn-gold w-full justify-center py-3" style="text-decoration:none;display:flex;align-items:center;gap:8px" target="_blank">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          Pay Now via UPI App
        </a>

        <!-- Supported apps -->
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <p class="text-xs w-full text-center mb-1" style="color:var(--text-secondary)">Opens: Google Pay · PhonePe · Paytm · BHIM · Any UPI app</p>
        </div>

        <!-- Mark as Paid -->
        <div class="p-3 rounded-xl" style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2)">
          <p class="text-xs mb-2" style="color:var(--text-secondary)">After completing payment, mark it as done to update your savings record.</p>
          <button onclick="UPI.markPaid()" id="upi-mark-paid-btn" class="btn-primary w-full justify-center py-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Mark as Paid ✓
          </button>
        </div>
      </div>

      <!-- QR Code Area -->
      <div id="upi-qr-area" class="hidden space-y-3">
        <hr class="divider">
        <p class="text-sm text-center" style="color:var(--text-secondary)">Scan QR code with any UPI app</p>
        <div id="upi-qrcode" class="flex justify-center p-4 rounded-xl" style="background:white"></div>
        <button onclick="UPI.markPaid()" class="btn-primary w-full justify-center py-2.5">
          ✓ Mark as Paid
        </button>
      </div>
    </div>
    `;

    // Load saved UPI details
    this.loadSavedDetails();
    openModal('upi-modal');
  },

  async loadSavedDetails() {
    const uid = getUID();
    if (!uid) return;
    try {
      const snap = await FS.profileRef(uid).get();
      const data = snap.data() || {};
      if (data.savedUpiId) {
        const el = document.getElementById('upi-inp-id');
        if (el) el.value = data.savedUpiId;
      }
      if (data.savedUpiName) {
        const el = document.getElementById('upi-inp-name');
        if (el) el.value = data.savedUpiName;
      }
      if (data.defaultDailySaving) {
        const amtEl = document.getElementById('upi-inp-amount');
        if (amtEl && !amtEl.value) amtEl.value = data.defaultDailySaving;
      }
    } catch(e) {}
  },

  generateLink() {
    const upiId = document.getElementById('upi-inp-id')?.value.trim();
    const name = document.getElementById('upi-inp-name')?.value.trim();
    const amount = parseAmount(document.getElementById('upi-inp-amount')?.value);
    const note = document.getElementById('upi-inp-note')?.value.trim() || 'Savings';

    if (!upiId) { showToast('Enter UPI ID', 'warning'); return; }
    if (!name) { showToast('Enter receiver name', 'warning'); return; }
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'warning'); return; }

    const encodedName = encodeURIComponent(name);
    const encodedNote = encodeURIComponent(note);
    const link = `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amount}&cu=INR&tn=${encodedNote}`;

    this._link = link;
    this._amount = amount;
    this._upiId = upiId;

    const linkArea = document.getElementById('upi-link-area');
    const display = document.getElementById('upi-link-display');
    const payLink = document.getElementById('upi-pay-link');

    if (display) display.textContent = link.slice(0, 80) + (link.length > 80 ? '...' : '');
    if (payLink) payLink.href = link;
    if (linkArea) linkArea.classList.remove('hidden');

    // Save UPI details for next time
    this.saveUpiDetails(upiId, name);

    showToast('UPI link generated! Tap "Pay Now" to open your app 💳', 'success');
  },

  showQR() {
    const upiId = document.getElementById('upi-inp-id')?.value.trim();
    const name = document.getElementById('upi-inp-name')?.value.trim();
    const amount = parseAmount(document.getElementById('upi-inp-amount')?.value);
    const note = document.getElementById('upi-inp-note')?.value.trim() || 'Savings';

    if (!upiId || !amount) { showToast('Fill in UPI ID and amount first', 'warning'); return; }

    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name || 'Savings')}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    this._link = link;
    this._amount = amount;

    const qrArea = document.getElementById('upi-qr-area');
    const qrDiv = document.getElementById('upi-qrcode');
    if (qrArea) qrArea.classList.remove('hidden');
    if (qrDiv) {
      qrDiv.innerHTML = '';
      if (window.QRCode) {
        new QRCode(qrDiv, { text: link, width: 180, height: 180, colorDark: '#000', colorLight: '#fff' });
      } else {
        qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}" alt="QR Code" class="rounded-xl">`;
      }
    }
  },

  async markPaid() {
    const uid = getUID();
    if (!uid) return;
    const amount = this._amount;
    if (!amount) { showToast('Generate a UPI link first', 'warning'); return; }

    const btn = document.getElementById('upi-mark-paid-btn');
    setLoading(btn, true);

    try {
      const today = getTodayStr();
      await FS.savingDoc(uid, today).set({
        amount,
        date: today,
        method: 'upi',
        upiId: this._upiId || '',
        // paymentRef: 'PENDING_VERIFICATION', // Razorpay webhook can update this later
        timestamp: TS.now(),
      });

      await Savings.updateStreak(uid, today);
      await Savings.addToLocked(uid, amount);

      showToast(`₹${amount} payment recorded! 🎉 Savings updated.`, 'success');
      closeModal('upi-modal');
    } catch(e) {
      showToast('Failed to record payment', 'error');
    } finally { if (btn) setLoading(btn, false); }
  },

  async saveUpiDetails(upiId, name) {
    const uid = getUID();
    if (!uid) return;
    try {
      await FS.profileRef(uid).set({ savedUpiId: upiId, savedUpiName: name }, { merge: true });
      window.SAVED_UPI_ID = upiId;
      window.SAVED_UPI_NAME = name;
      const upiEl = document.getElementById('sv-saved-upi');
      if (upiEl) upiEl.textContent = `${upiId} (${name})`;
    } catch(e) {}
  },

  quickShowQR() {
    const upiId = window.SAVED_UPI_ID;
    const name = window.SAVED_UPI_NAME || 'Savings';
    const amount = parseAmount(document.getElementById('sv-amount-input')?.value);

    if (!upiId) {
      showToast('Please set your Saved UPI to Pay first.', 'warning');
      this.openModal(amount);
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount to save today.', 'warning');
      return;
    }

    const note = 'Daily Savings';
    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    this._amount = amount;
    this._upiId = upiId;

    const body = document.getElementById('upi-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div class="space-y-4 pb-4">
        <p class="text-sm text-center" style="color:var(--text-secondary)">Scan QR code to pay <b>₹${amount}</b></p>
        <div id="upi-qrcode" class="flex justify-center p-4 rounded-xl" style="background:white"></div>
        <button onclick="UPI.markPaid()" class="btn-primary w-full justify-center py-3 text-lg mt-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Mark as Saved
        </button>
      </div>
    `;

    openModal('upi-modal');
    setTimeout(() => {
      const qrDiv = document.getElementById('upi-qrcode');
      if (qrDiv) {
        qrDiv.innerHTML = '';
        if (window.QRCode) {
          new QRCode(qrDiv, { text: link, width: 220, height: 220, colorDark: '#000', colorLight: '#fff' });
        } else {
          qrDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}" alt="QR Code" class="rounded-xl">`;
        }
      }
    }, 100);
  },

  quickPay() {
    const upiId = window.SAVED_UPI_ID;
    const name = window.SAVED_UPI_NAME || 'Savings';
    const amount = parseAmount(document.getElementById('sv-amount-input')?.value);

    if (!upiId) {
      showToast('Please set your Saved UPI to Pay first.', 'warning');
      this.openModal(amount);
      return;
    }
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount to save today.', 'warning');
      return;
    }

    const note = 'Daily Savings';
    const link = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    
    // Open the popup behind the scenes so "Mark as Saved" is ready when they return
    this.quickShowQR();
    
    // Attempt to open intent
    window.location.href = link;
  },
};
