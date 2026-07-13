// theme.js — Dynamic Sky Theme Management

window.Theme = {
  mode: 'auto', // 'auto', 'light', 'dark'
  timeOfDay: 'afternoon', // 'morning', 'afternoon', 'evening', 'night'
  
  init() {
    const saved = localStorage.getItem('savelock-theme-mode');
    this.mode = saved || 'auto';
    this.updateTimeOfDay();
    this.apply();
    this.bindToggles();
    
    // Check time every minute if auto
    setInterval(() => {
      if (this.mode === 'auto') {
        const oldTime = this.timeOfDay;
        this.updateTimeOfDay();
        if (oldTime !== this.timeOfDay) this.apply();
      }
    }, 60000);
  },

  updateTimeOfDay() {
    if (this.mode === 'light') {
      this.timeOfDay = 'afternoon';
      return;
    }
    if (this.mode === 'dark') {
      this.timeOfDay = 'night';
      return;
    }
    
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      this.timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      this.timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 20) {
      this.timeOfDay = 'evening';
    } else {
      this.timeOfDay = 'night';
    }
  },

  apply() {
    const html = document.documentElement;
    // Remove old classes
    html.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-night', 'dark', 'light');
    
    // Add new class
    html.classList.add(`theme-${this.timeOfDay}`);
    
    // Add 'dark' class for text contrast if it's evening or night
    if (this.timeOfDay === 'night' || this.timeOfDay === 'evening') {
      html.classList.add('dark');
    }
    
    this.updateIcons();
    
    // Tell the background canvas to update if it exists
    if (window.DynamicBG) {
      window.DynamicBG.setTheme(this.timeOfDay);
    }
  },

  toggle() {
    // Cycle through: auto -> light -> dark -> auto
    if (this.mode === 'auto') this.mode = 'light';
    else if (this.mode === 'light') this.mode = 'dark';
    else this.mode = 'auto';
    
    localStorage.setItem('savelock-theme-mode', this.mode);
    this.updateTimeOfDay();
    this.apply();
  },

  updateIcons() {
    const autoSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    const sunSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

    const sidebarIcon = document.getElementById('sidebar-theme-icon');
    const sidebarLabel = document.getElementById('sidebar-theme-label');
    const mobileIcon = document.getElementById('mobile-theme-icon');

    let iconHtml, labelText;
    if (this.mode === 'auto') {
      iconHtml = autoSvg; labelText = 'Auto Theme';
    } else if (this.mode === 'light') {
      iconHtml = sunSvg; labelText = 'Light Mode';
    } else {
      iconHtml = moonSvg; labelText = 'Dark Mode';
    }

    if (sidebarIcon) sidebarIcon.outerHTML = iconHtml.replace('svg', 'svg id="sidebar-theme-icon"');
    if (sidebarLabel) sidebarLabel.textContent = labelText;
    if (mobileIcon) mobileIcon.outerHTML = iconHtml.replace('svg', 'svg id="mobile-theme-icon" width="18" height="18"');
  },

  bindToggles() {
    document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => this.toggle());
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', () => this.toggle());
  }
};
