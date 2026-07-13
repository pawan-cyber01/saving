// notifications.js — Browser notifications with 3 daily reminders

const Notifications = {
  permission: (typeof Notification !== 'undefined' ? Notification.permission : 'default'),

  // Default reminder times (morning, afternoon, evening)
  DEFAULT_TIMES: [
    { hour: 8,  minute: 0,  label: 'Morning' },
    { hour: 14, minute: 0,  label: 'Afternoon' },
    { hour: 20, minute: 0,  label: 'Evening' },
  ],

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

  // Get saved reminder times from localStorage
  getSavedTimes() {
    try {
      const saved = JSON.parse(localStorage.getItem('reminderTimes'));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch(e) {}
    return this.DEFAULT_TIMES;
  },

  // Post all 3 alarm times to SW
  scheduleFromSW() {
    const times = this.getSavedTimes();
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_DAILY_REMINDERS',
        times
      });
    }
  },

  // Called when user saves custom times
  async setReminderTimes(times) {
    localStorage.setItem('reminderTimes', JSON.stringify(times));
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return;
    }
    this.scheduleFromSW();
    showToast(`3 daily reminders set 🔔`, 'success');
  },

  // Fires at each reminder time — only notifies if user hasn't saved today
  async checkAndNotify() {
    const uid = getUID();
    if (!uid) return;
    const today = getTodayStr();
    try {
      const snap = await FS.savingDoc(uid, today).get();
      if (!snap.exists) {
        const hour = new Date().getHours();
        let msg = "You haven't saved yet today! Keep your streak alive 🔥";
        if (hour < 12)       msg = "Good morning! 🌅 Don't forget to save today!";
        else if (hour < 17)  msg = "Afternoon check-in! 💰 Have you saved today?";
        else                 msg = "Evening reminder! 🌙 Still time to save today — don't break your streak!";
        this.show('💰 SaveLock Reminder', msg);
      }
    } catch(e) {}
  },

  // Also check daily spend vs pocket money limit
  async checkSpendLimit() {
    const uid = getUID();
    if (!uid) return;
    try {
      const budgetSnap = await FS.budgetRef(uid).get();
      const budget = budgetSnap.data() || {};
      const pocketMoney = budget.monthlyPocketMoney;
      if (!pocketMoney) return;

      const today = getTodayStr();
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      const remainingDays = daysInMonth - dayOfMonth + 1;
      const startOfMonth = getMonthStr(); // YYYY-MM

      // Get total spent this month
      const expSnap = await FS.expensesCol(uid)
        .where('date', '>=', startOfMonth + '-01')
        .where('date', '<=', today)
        .get();
      let totalSpent = 0;
      expSnap.forEach(d => { totalSpent += d.data().amount || 0; });

      const remainingBudget = pocketMoney - totalSpent;
      const adjustedDaily = remainingBudget / remainingDays;

      // Get today's spending
      const todayExpSnap = await FS.expensesCol(uid)
        .where('date', '==', today)
        .get();
      let todaySpent = 0;
      todayExpSnap.forEach(d => { todaySpent += d.data().amount || 0; });

      const baseDaily = pocketMoney / daysInMonth;
      if (todaySpent > baseDaily) {
        const over = todaySpent - baseDaily;
        const newDaily = (remainingBudget - todaySpent) / Math.max(1, remainingDays - 1);
        this.show(
          '⚠️ Over Budget Today!',
          `You spent ₹${todaySpent.toFixed(0)} (₹${over.toFixed(0)} over). Tomorrow's limit: ₹${Math.max(0, newDaily).toFixed(0)}`
        );
      }
    } catch(e) {}
  },

  // Restore reminder on app load if permission already granted
  init() {
    this.permission = (typeof Notification !== 'undefined' ? Notification.permission : 'default');
    if (this.permission === 'granted') {
      navigator.serviceWorker?.ready.then(() => this.scheduleFromSW());
    }
    // Listen for SW check requests
    navigator.serviceWorker?.addEventListener('message', event => {
      if (event.data && event.data.type === 'CHECK_AND_NOTIFY') {
        this.checkAndNotify();
        this.checkSpendLimit();
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
