// app.js — Main router and application bootstrap for SaveLock

const App = {
  currentPage: null,
  currentDestroy: null,
  unsubscribers: [],

  // Page module map
  pages: {
    '/dashboard': Dashboard,
    '/savings':   Savings,
    '/expenses':  Expenses,
    '/income':    Income,
    '/budget':    Budget,
    '/goals':     Goals,
    '/locked':    Locked,
    '/analytics': Analytics,
    '/calendar':  CalendarView,
    '/reports':   Reports,
    '/profile':   Profile,
    '/admin':     Admin,
  },

  navigate(path) {
    // Clean up previous page
    if (this.currentDestroy) {
      try { this.currentDestroy(); } catch(e) {}
    }
    // Clean Firestore listeners
    this.unsubscribers.forEach(fn => { try { fn(); } catch(e) {} });
    this.unsubscribers = [];

    const route = this.pages[path];
    if (!route) { this.navigate('/dashboard'); return; }

    // Guard admin route
    if (path === '/admin') {
      const user = AUTH.currentUser;
      if (!user) { this.navigate('/dashboard'); return; }
    }

    const outlet = document.getElementById('page-outlet');
    outlet.innerHTML = `<div class="animate-fade-in">${route.render()}</div>`;

    // Scroll top
    document.getElementById('main-content')?.scrollTo(0, 0);
    window.scrollTo(0, 0);

    // Update active nav
    this.updateNav(path);

    // Initialize page
    requestAnimationFrame(() => {
      if (route.init) {
        const result = route.init();
        if (result && result.then) {
          result.catch(err => console.error('Page init error:', err));
        }
      }
      if (route.destroy) this.currentDestroy = route.destroy.bind(route);
      else this.currentDestroy = null;
    });

    this.currentPage = path;
  },

  updateNav(path) {
    // Sidebar nav
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      const page = '/' + el.dataset.page;
      el.classList.toggle('active', page === path);
    });
    // Bottom nav
    document.querySelectorAll('.bottom-nav-item[data-page]').forEach(el => {
      const page = '/' + el.dataset.page;
      el.classList.toggle('active', page === path);
    });
  },

  start() {
    // Apply theme first
    Theme.init();

    // Auth state listener
    AUTH.onAuthStateChanged(async user => {
      if (user) {
        await this.onLogin(user);
      } else {
        this.onLogout();
      }
    });
  },

  async onLogin(user) {
    // Show main app
    // Show main app
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');

    // Update avatar
    const initials = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
    const avatarEl = document.getElementById('sidebar-avatar');
    if (avatarEl) {
      if (user.photoURL) {
        avatarEl.outerHTML = `<img id="sidebar-avatar" src="${user.photoURL}" class="w-5 h-5 rounded-full object-cover" alt="avatar">`;
      } else {
        avatarEl.textContent = initials;
      }
    }

    // Check admin status (force refresh to ensure latest claims)
    try {
      const tokenResult = await user.getIdTokenResult(true);
      if (tokenResult.claims.admin) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
      }
    } catch(e) {}

    // Check if profile exists, create if not
    await this.ensureProfile(user);

    // Request notification permission
    Notifications.requestPermission();

    // Route to current hash or savings (default)
    const hash = window.location.hash;
    const path = hash ? hash.slice(1) : '/savings';
    this.navigate(path);

    // Set up hash change listener
    window.onhashchange = () => {
      const p = window.location.hash.slice(1) || '/savings';
      if (p !== this.currentPage) this.navigate(p);
    };

    // Logout buttons
    document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => this.logout());
  },

  onLogout() {
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    Auth.renderLogin();
  },

  async ensureProfile(user) {
    try {
      const ref = FS.profileRef(user.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          defaultDailySaving: 100,
          currency: 'INR',
          notifDailySaving: true,
          notifBudgetExceeded: true,
          notifGoalCompleted: true,
          createdAt: TS.now(),
        });
      }
    } catch(e) { console.warn('ensureProfile:', e); }
  },

  async logout() {
    showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      danger: true,
      onConfirm: async () => {
        try { await AUTH.signOut(); } catch(e) { showToast('Logout failed', 'error'); }
      }
    });
  }
};

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.start();

  // Register Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          window._swRegistration = reg;
          console.log('[SW] Registered:', reg.scope);
          // Re-register daily reminder alarm with SW
          Notifications.init();
        })
        .catch(err => console.warn('[SW] Registration failed:', err));
    });
  }

  // PWA Install prompt
  window.deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    window.deferredPrompt = e;
    
    // Unhide install buttons
    const navBtn = document.getElementById('nav-install-btn');
    if (navBtn) navBtn.classList.remove('hidden');

    // Show install banner after 3 seconds
    setTimeout(() => {
      if (window.deferredPrompt && AUTH.currentUser) {
        showToast('📲 Install SaveLock as an app for the best experience!', 'info', 8000);
        const container = document.getElementById('toast-container');
        if (container) {
          const lastToast = container.lastElementChild;
          if (lastToast) {
            const installBtn = document.createElement('button');
            installBtn.textContent = 'Install';
            installBtn.className = 'btn-sm btn-primary ml-2 flex-shrink-0';
            installBtn.style.pointerEvents = 'all';
            installBtn.onclick = async () => {
              window.deferredPrompt.prompt();
              const { outcome } = await window.deferredPrompt.userChoice;
              if (outcome === 'accepted') showToast('SaveLock installed! 🎉', 'success');
              window.deferredPrompt = null;
            };
            lastToast.appendChild(installBtn);
          }
        }
      }
    }, 3000);
  });
});
