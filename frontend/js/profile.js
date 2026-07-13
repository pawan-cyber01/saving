// profile.js — User profile, settings, and notification preferences

const Profile = {
  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div>
        <h1 class="page-title">Profile</h1>
        <p class="page-subtitle">Manage your account & preferences</p>
      </div>

      <!-- Profile Card -->
      <div class="card text-center">
        <div id="pr-avatar-area" class="mb-4">
          <div class="w-20 h-20 rounded-3xl logo-gradient mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-violet-500/30" id="pr-avatar">U</div>
        </div>
        <h2 class="font-outfit font-bold text-xl" id="pr-name">Loading...</h2>
        <p class="text-sm mt-1" style="color:var(--text-secondary)" id="pr-email">...</p>
        <div class="flex items-center justify-center gap-3 mt-3">
          <span class="badge badge-violet" id="pr-streak-badge">🔥 0 days</span>
          <span class="badge badge-teal" id="pr-member-since">Member</span>
        </div>
      </div>

      <!-- Edit Profile -->
      <div class="card">
        <h2 class="section-title">Edit Profile</h2>
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="pr-inp-name" class="form-input" placeholder="Your name">
          </div>
          <div class="form-group">
            <label class="form-label">Email (read-only)</label>
            <input type="email" id="pr-inp-email" class="form-input" disabled style="opacity:0.6">
          </div>
          <div class="form-group">
            <label class="form-label">Default Daily Saving (₹)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 font-outfit font-bold" style="color:var(--color-teal)">₹</span>
              <input type="number" id="pr-inp-daily-saving" class="form-input pl-7" placeholder="100" min="1">
            </div>
          </div>
          <button onclick="Profile.saveProfile()" id="pr-save-btn" class="btn-primary w-full justify-center">
            Save Profile
          </button>
        </div>
      </div>

      <!-- Notification Settings -->
      <div class="card">
        <h2 class="section-title">Daily Reminder</h2>
        <div class="space-y-4">
          <p class="text-sm" style="color:var(--text-secondary)">Get reminded 3 times a day — only buzzes if you haven't saved yet. Adjust times below.</p>

          <div class="p-4 rounded-2xl space-y-3" style="background:var(--glass-bg);border:1px solid var(--color-border)">
            ${[['🌅 Morning', 'pr-time-1', '08:00'], ['☀️ Afternoon', 'pr-time-2', '14:00'], ['🌙 Evening', 'pr-time-3', '20:00']].map(([label, id, def]) => `
              <div class="flex items-center justify-between gap-3">
                <span class="text-sm font-medium" style="min-width:100px">${label}</span>
                <input type="time" id="${id}" class="form-input text-center font-outfit font-bold" style="max-width:130px;color:var(--color-violet)" value="${def}">
              </div>
            `).join('<div class="divider" style="margin:4px 0"></div>')}
          </div>
          <button onclick="Profile.saveReminderTimes()" class="btn-primary w-full justify-center text-sm py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Set 3 Daily Reminders
          </button>
          <p class="text-xs text-center" id="pr-reminder-status" style="color:var(--text-secondary)">Notifications off. Tap above to enable.</p>
        </div>
      </div>

      <!-- App Stats -->
      <div class="card">
        <h2 class="section-title">Your Stats</h2>
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-xl text-center" style="background:var(--glass-bg)">
            <p class="font-outfit font-bold text-xl" style="color:var(--color-green)" id="pr-total-saved">₹0</p>
            <p class="text-xs mt-1" style="color:var(--text-secondary)">Total Saved</p>
          </div>
          <div class="p-3 rounded-xl text-center" style="background:var(--glass-bg)">
            <p class="font-outfit font-bold text-xl" style="color:var(--color-red)" id="pr-total-spent">₹0</p>
            <p class="text-xs mt-1" style="color:var(--text-secondary)">Total Spent</p>
          </div>
          <div class="p-3 rounded-xl text-center" style="background:var(--glass-bg)">
            <p class="font-outfit font-bold text-xl" style="color:var(--color-gold)" id="pr-best-streak">0</p>
            <p class="text-xs mt-1" style="color:var(--text-secondary)">Best Streak</p>
          </div>
          <div class="p-3 rounded-xl text-center" style="background:var(--glass-bg)">
            <p class="font-outfit font-bold text-xl" style="color:var(--color-violet)" id="pr-total-tx">0</p>
            <p class="text-xs mt-1" style="color:var(--text-secondary)">Transactions</p>
          </div>
        </div>
      </div>

      <!-- App Settings -->
      <div class="card">
        <h2 class="section-title">App Settings</h2>
        <div class="space-y-3">
          <button onclick="Profile.installPWA()" class="btn-primary w-full justify-center text-sm py-3 bg-blue-600 hover:bg-blue-700 border-none">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Install SaveLock App
          </button>
          <button onclick="App.logout()" class="btn-secondary w-full justify-center text-sm py-3 text-red-500 border-red-500/30 hover:bg-red-500/10">
            Log Out
          </button>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="card">
        <h2 class="section-title">Account</h2>
        <div class="space-y-3">
          <button onclick="Profile.changePassword()" class="btn-secondary w-full justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Change Password
          </button>
          <button onclick="App.logout()" class="btn-danger w-full justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>

      <!-- App Info -->
      <div class="text-center py-4">
        <div class="w-10 h-10 rounded-2xl logo-gradient mx-auto mb-2 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-8v4h4l-5 8z" fill="white"/></svg>
        </div>
        <p class="font-outfit font-bold">SaveLock</p>
        <p class="text-xs mt-1" style="color:var(--text-tertiary)">v1.0.0 · Made with ❤️ for saving</p>
      </div>
    </div>
    `;
  },

  async init() {
    const uid = getUID();
    if (!uid) return;
    await Promise.all([this.loadProfile(uid), this.loadStats(uid)]);
  },

  async loadProfile(uid) {
    const user = AUTH.currentUser;
    try {
      const snap = await FS.profileRef(uid).get();
      const data = snap.data() || {};
      const name = data.name || user?.displayName || 'Friend';
      const email = user?.email || '';

      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
      set('pr-name', name);
      set('pr-email', email);
      setVal('pr-inp-name', name);
      setVal('pr-inp-email', email);
      setVal('pr-inp-daily-saving', data.defaultDailySaving || 100);

      // Avatar
      const avatarArea = document.getElementById('pr-avatar-area');
      if (avatarArea && user?.photoURL) {
        avatarArea.innerHTML = `<img src="${user.photoURL}" class="w-20 h-20 rounded-3xl object-cover mx-auto shadow-xl" alt="Profile photo">`;
      } else {
        const avatar = document.getElementById('pr-avatar');
        if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
      }

      // Member since
      const memberEl = document.getElementById('pr-member-since');
      if (memberEl && data.createdAt) {
        const d = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        memberEl.textContent = `Since ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
      }

      // Reminder times
      const savedTimes = Notifications.getSavedTimes();
      const timeIds = ['pr-time-1', 'pr-time-2', 'pr-time-3'];
      savedTimes.forEach((t, i) => {
        const el = document.getElementById(timeIds[i]);
        if (el) el.value = `${String(t.hour).padStart(2,'0')}:${String(t.minute).padStart(2,'0')}`;
      });
      const statusEl = document.getElementById('pr-reminder-status');
      if (statusEl && Notification?.permission === 'granted') {
        statusEl.textContent = `✅ 3 daily reminders active`;
        statusEl.style.color = 'var(--color-green)';
      }
    } catch(e) {}
  },

  async saveReminderTimes() {
    const t1 = document.getElementById('pr-time-1')?.value || '08:00';
    const t2 = document.getElementById('pr-time-2')?.value || '14:00';
    const t3 = document.getElementById('pr-time-3')?.value || '20:00';
    const parse = v => ({ hour: parseInt(v.split(':')[0]), minute: parseInt(v.split(':')[1]), label: '' });
    const times = [parse(t1), parse(t2), parse(t3)];
    await Notifications.setReminderTimes(times);
    const statusEl = document.getElementById('pr-reminder-status');
    if (statusEl && Notification?.permission === 'granted') {
      statusEl.textContent = `✅ 3 daily reminders active (${t1}, ${t2}, ${t3})`;
      statusEl.style.color = 'var(--color-green)';
    }
  },

  async loadStats(uid) {
    try {
      const [streakSnap, expSnap, savSnap] = await Promise.all([
        FS.streakRef(uid).get(),
        FS.expensesCol(uid).get(),
        FS.savingsCol(uid).get(),
      ]);
      const streak = streakSnap.data() || {};
      let totalSpent = 0, totalSaved = 0;
      expSnap.forEach(d => { totalSpent += d.data().amount || 0; });
      savSnap.forEach(d => { totalSaved += d.data().amount || 0; });

      const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
      set('pr-total-saved', formatCurrency(totalSaved));
      set('pr-total-spent', formatCurrency(totalSpent));
      set('pr-best-streak', streak.longestStreak || 0);
      set('pr-total-tx', expSnap.size);
      set('pr-streak-badge', `🔥 ${streak.currentStreak || 0} days`);
    } catch(e) {}
  },

  async saveProfile() {
    const uid = getUID();
    if (!uid) return;
    const name = sanitize(document.getElementById('pr-inp-name')?.value.trim());
    const dailySaving = parseAmount(document.getElementById('pr-inp-daily-saving')?.value);

    if (!name) { showToast('Enter your name', 'warning'); return; }
    const btn = document.getElementById('pr-save-btn');
    setLoading(btn, true);
    try {
      await AUTH.currentUser.updateProfile({ displayName: name });
      await FS.profileRef(uid).set({ name, defaultDailySaving: dailySaving || 100 }, { merge: true });
      document.getElementById('pr-name').textContent = name;
      const sidebarAvatar = document.getElementById('sidebar-avatar');
      if (sidebarAvatar && sidebarAvatar.tagName !== 'IMG') sidebarAvatar.textContent = name.charAt(0).toUpperCase();
      showToast('Profile updated! 🎉', 'success');
    } catch(e) { showToast('Failed to update profile', 'error'); }
    finally { setLoading(btn, false); }
  },

  async saveNotifSetting(key, value) {
    const uid = getUID();
    if (!uid) return;
    try {
      await FS.profileRef(uid).set({ [key]: value }, { merge: true });
    } catch(e) {}
  },

  changePassword() {
    const user = AUTH.currentUser;
    if (!user?.email) return;
    showConfirm({
      title: 'Reset Password',
      message: `Send a password reset email to ${user.email}?`,
      confirmText: 'Send Email',
      onConfirm: async () => {
        try {
          await AUTH.sendPasswordResetEmail(user.email);
          showToast('Password reset email sent! Check your inbox 📧', 'success');
        } catch(e) { showToast('Failed to send email', 'error'); }
      }
    });
  },

  async installPWA() {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('SaveLock installed! 🎉', 'success');
        const navBtn = document.getElementById('nav-install-btn');
        if (navBtn) navBtn.classList.add('hidden');
      }
      window.deferredPrompt = null;
    } else {
      showToast('App is already installed or not supported by your browser.', 'info');
    }
  }
};
