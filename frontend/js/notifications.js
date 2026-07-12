// notifications.js — Browser notifications and FCM scaffolding

const Notifications = {
  permission: 'default',

  async requestPermission() {
    if (!('Notification' in window)) return;
    try {
      this.permission = await Notification.requestPermission();
      if (this.permission === 'granted') {
        showToast('Notifications enabled! 🔔', 'success');
        this.scheduleDailyReminder();
      } else {
        showToast('Notifications blocked. Enable in browser settings.', 'warning');
      }
    } catch(e) {}
  },

  show(title, body, icon = '/assets/icons/icon-192.png') {
    if (this.permission !== 'granted') return;
    try {
      const notif = new Notification(title, { body, icon, badge: '/assets/icons/icon-192.png', tag: 'savelock-' + Date.now() });
      notif.onclick = () => { window.focus(); notif.close(); };
    } catch(e) {}
  },

  scheduleDailyReminder() {
    // Check if daily reminder time (8 PM) has passed today
    const now = new Date();
    const reminderHour = 20; // 8 PM
    let nextReminder = new Date(now);
    nextReminder.setHours(reminderHour, 0, 0, 0);
    if (now >= nextReminder) nextReminder.setDate(nextReminder.getDate() + 1);
    const msUntil = nextReminder - now;
    setTimeout(() => {
      this.checkAndNotify();
      setInterval(() => this.checkAndNotify(), 86400000); // every 24h
    }, msUntil);
  },

  async checkAndNotify() {
    const uid = getUID();
    if (!uid) return;
    const today = getTodayStr();
    try {
      const snap = await FS.savingDoc(uid, today).get();
      if (!snap.exists) {
        this.show('💰 SaveLock Reminder', "Don't forget to save today! Keep your streak alive 🔥");
      }
    } catch(e) {}
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
