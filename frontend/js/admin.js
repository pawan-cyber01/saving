// admin.js — Admin panel (requires admin custom claim in Firebase)

const Admin = {
  render() {
    return `
    <div class="space-y-5 animate-stagger">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="page-title">Admin Panel</h1>
          <p class="page-subtitle">Manage users and app settings</p>
        </div>
        <span class="badge badge-violet">🛡️ Admin</span>
      </div>

      <!-- App Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3" id="admin-stats">
        ${['Total Users','Active Today','Total Savings','Total Expenses'].map((label, i) =>
          `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value" id="ad-stat-${i}">—</div></div>`
        ).join('')}
      </div>

      <!-- Announcement -->
      <div class="card">
        <h2 class="section-title">Send Announcement</h2>
        <div class="space-y-3">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" id="ad-ann-title" class="form-input" placeholder="Announcement title">
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea id="ad-ann-body" class="form-input" rows="3" placeholder="Type your announcement..."></textarea>
          </div>
          <button onclick="Admin.sendAnnouncement()" id="ad-ann-btn" class="btn-primary w-full justify-center">
            Send Announcement
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Registered Users</h2>
          <button onclick="Admin.loadUsers()" class="btn-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="admin-table min-w-full">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody id="ad-users-table">
              <tr><td colspan="5" class="text-center py-8" style="color:var(--text-secondary)">
                <button onclick="Admin.loadUsers()" class="btn-secondary btn-sm">Load Users</button>
              </td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Announcements -->
      <div class="card">
        <h2 class="section-title">Recent Announcements</h2>
        <div id="ad-announcements" class="space-y-3">
          <div class="skeleton h-16 rounded-xl"></div>
        </div>
      </div>
    </div>
    `;
  },

  async init() {
    const user = AUTH.currentUser;
    if (!user) { showToast('Access denied', 'error'); App.navigate('/dashboard'); return; }

    // Verify admin claim
    const token = await user.getIdTokenResult();
    if (!token.claims.admin) {
      showToast('Admin access required', 'error');
      App.navigate('/dashboard');
      return;
    }

    await Promise.all([this.loadAnnouncements()]);
    // Note: loadUsers requires Firebase Admin SDK from backend
    // For MVP, we show a message
    this.showAdminInfo();
  },

  showAdminInfo() {
    const tbody = document.getElementById('ad-users-table');
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center">
        <p class="text-sm" style="color:var(--text-secondary)">User management requires the backend API.</p>
        <p class="text-xs mt-1" style="color:var(--text-tertiary)">Connect to Render backend to enable.</p>
        <a href="#/reports" class="btn-sm btn-secondary mt-2" style="display:inline-flex">View Reports Instead</a>
      </td></tr>`;
    }
    // Set placeholder stats
    const setEl = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
    setEl('ad-stat-0', '—');
    setEl('ad-stat-1', '—');
    setEl('ad-stat-2', '—');
    setEl('ad-stat-3', '—');
  },

  async loadUsers() {
    showToast('User list requires backend API (Render)', 'info');
  },

  async sendAnnouncement() {
    const title = sanitize(document.getElementById('ad-ann-title')?.value.trim());
    const body = sanitize(document.getElementById('ad-ann-body')?.value.trim());
    if (!title || !body) { showToast('Fill in title and message', 'warning'); return; }

    const btn = document.getElementById('ad-ann-btn');
    setLoading(btn, true);
    try {
      await FS.announcementsCol().add({
        title, body,
        createdAt: TS.now(),
        createdBy: AUTH.currentUser?.uid,
      });
      showToast('Announcement sent!', 'success');
      document.getElementById('ad-ann-title').value = '';
      document.getElementById('ad-ann-body').value = '';
      this.loadAnnouncements();
    } catch(e) {
      showToast('Failed to send announcement', 'error');
    } finally { setLoading(btn, false); }
  },

  async loadAnnouncements() {
    const container = document.getElementById('ad-announcements');
    if (!container) return;
    try {
      const snap = await FS.announcementsCol().orderBy('createdAt', 'desc').limit(5).get();
      if (snap.empty) {
        container.innerHTML = '<p class="text-sm text-center py-4" style="color:var(--text-secondary)">No announcements yet</p>';
        return;
      }
      container.innerHTML = snap.docs.map(d => {
        const data = d.data();
        return `<div class="p-3 rounded-xl" style="background:var(--glass-bg);border:1px solid var(--color-border)">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="font-medium text-sm">${data.title}</p>
              <p class="text-xs mt-0.5" style="color:var(--text-secondary)">${data.body}</p>
            </div>
            <button onclick="Admin.deleteAnnouncement('${d.id}')" class="btn-icon btn-sm ml-2 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
          ${data.createdAt ? `<p class="text-xs mt-2" style="color:var(--text-tertiary)">${relativeTime(data.createdAt)}</p>` : ''}
        </div>`;
      }).join('');
    } catch(e) {}
  },

  async deleteAnnouncement(id) {
    try {
      await FS.announcementsCol().doc(id).delete();
      showToast('Announcement deleted', 'success');
      this.loadAnnouncements();
    } catch(e) { showToast('Failed to delete', 'error'); }
  },
};
