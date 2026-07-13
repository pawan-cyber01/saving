// notifications.js — Browser notifications and daily reminders

const Notifications = {
  permission: (typeof Notification !== 'undefined' ? Notification.permission : 'default'),

  async requestPermission() {
    if (!('Notification' in window)) {
      showToast('Your browser does not support notifications', 'warning');
      return false;
    }
    try {
      this.permission = await Notification.requestPermission();
      if (this.permission === 'granted') {
        showToast('Notifications enabled! 🔔', 'success');
        this.scheduleFromSW();
        return true;
      } else {
        showToast('Notifications blocked. Enable in browser settings.', 'warning');
        return false;
      }
    } catch(e) { return false; }
  },

  // Show a notification (uses SW registration so it works when minimised)
  show(title, body, icon = '/assets/icons/icon-192.png') {
    if (this.permission !== 'granted') return;
    try {
      const reg = window._swRegistration;
      if (reg) {
        reg.showNotification(title, {
          body,
          icon,
          badge: '/assets/icons/icon-192.png',
          tag: 'savelock-reminder',
          renotify: true,
          actions: [
            { action: 'open', title: '💰 Save Now' },
            { action: 'dismiss', title: 'Later' }
          ]
        });
      } else {
        new Notification(title, { body, icon });
      }
    } catch(e) {
      try { new Notification(title, { body, icon }); } catch(e2) {}
    }
  },

  // Post to SW to set up alarm loop
  scheduleFromSW() {
    const hour   = parseInt(localStorage.getItem('reminderHour')   ?? '20');
    const minute = parseInt(localStorage.getItem('reminderMinute') ?? '0');
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_DAILY_REMINDER',
        hour,
        minute
      });
    }
  },

  // Called when user picks a time
  async setReminderTime(hour, minute) {
    localStorage.setItem('reminderHour', hour);
    localStorage.setItem('reminderMinute', minute);
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    this.scheduleFromSW();
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    showToast(`Daily reminder set for ${hh}:${mm} 🔔`, 'success');
  },

  // Fires at reminder time — only notifies if user hasn't saved today
  async checkAndNotify() {
    const uid = getUID();
    if (!uid) return;
    const today = getTodayStr();
    try {
      const snap = await FS.savingDoc(uid, today).get();
      if (!snap.exists) {
        this.show(
          '💰 SaveLock Reminder',
          "You haven't saved yet today! Keep your streak alive 🔥"
        );
      }
    } catch(e) {}
  },

  // Restore the SW alarm every time the app opens
  init() {
    this.permission = (typeof Notification !== 'undefined' ? Notification.permission : 'default');
    if (this.permission === 'granted') {
      navigator.serviceWorker?.ready.then(() => this.scheduleFromSW());
    }
    // Listen for SW check requests
    navigator.serviceWorker?.addEventListener('message', event => {
      if (event.data && event.data.type === 'CHECK_AND_NOTIFY') {
        this.checkAndNotify();
      }
    });
  },

  notifyBudgetExceeded(spent, budget) {
    this.show('⚠️ Budget Exceeded!', `You've spent ₹${spent.toLocaleString('en-IN')} out of your ₹${budget.toLocaleString('en-IN')} budget`);
  },

  notifyGoalCompleted(goalName) {
    this.show('🎯 Goal Achieved!', `Congratulations! You've reached your "${goalName}" savings goal! 🎉`);
  },

  notifyWithdrawalAvailable(amount) {
    this.show('📅 Savings Unlocked!', `Your ₹${amount.toLocaleString('en-IN')} savings are available to withdraw today!`);
  },
};
