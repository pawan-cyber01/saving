// theme.js — Dark/light mode management

const Theme = {
  isDark: true,

  init() {
    const saved = localStorage.getItem('savelock-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDark = saved ? saved === 'dark' : prefersDark;
    this.apply();
    this.bindToggles();
  },

  apply() {
    const html = document.documentElement;
    if (this.isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
    }
    this.updateIcons();
    // Update meta theme-color
    const meta = document.getElementById('meta-theme-color');
    if (meta) meta.content = this.isDark ? '#07091a' : '#eef2ff';
  },

  toggle() {
    this.isDark = !this.isDark;
    localStorage.setItem('savelock-theme', this.isDark ? 'dark' : 'light');
    this.apply();
  },

  updateIcons() {
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    const sidebarIcon = document.getElementById('sidebar-theme-icon');
    const sidebarLabel = document.getElementById('sidebar-theme-label');
    const mobileIcon = document.getElementById('mobile-theme-icon');

    if (this.isDark) {
      if (sidebarIcon) sidebarIcon.outerHTML = sunSvg.replace('svg', 'svg id="sidebar-theme-icon"');
      if (sidebarLabel) sidebarLabel.textContent = 'Light Mode';
      if (mobileIcon) mobileIcon.outerHTML = sunSvg.replace('svg', 'svg id="mobile-theme-icon" width="18" height="18"');
    } else {
      if (sidebarIcon) sidebarIcon.outerHTML = moonSvg.replace('svg', 'svg id="sidebar-theme-icon"');
      if (sidebarLabel) sidebarLabel.textContent = 'Dark Mode';
      if (mobileIcon) mobileIcon.outerHTML = moonSvg.replace('svg', 'svg id="mobile-theme-icon" width="18" height="18"');
    }
  },

  bindToggles() {
    document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => this.toggle());
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => this.toggle());
  }
};
