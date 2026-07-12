// firebase.js — Firebase initialization and Firestore helpers
// Uses Firebase Compat SDK (v10 compat) loaded via CDN in index.html

const firebaseConfig = {
  apiKey: "AIzaSyAZ4hc_PoPnY-F05hdYxVu2rIJ7M5KGzlQ",
  authDomain: "saving-ff0d3.firebaseapp.com",
  projectId: "saving-ff0d3",
  storageBucket: "saving-ff0d3.firebasestorage.app",
  messagingSenderId: "632702311079",
  appId: "1:632702311079:web:d8c7e02b9a136d1a721982",
  measurementId: "G-FYCC5FD562"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Service references
const DB = firebase.firestore();
const AUTH = firebase.auth();
const STORAGE = firebase.storage();
let analytics;
try { analytics = firebase.analytics(); } catch(e) { /* analytics optional */ }

// Enable Firestore offline persistence
DB.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence unavailable: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser');
  }
});

// ─── Firestore Collection Helpers ───────────────────────────────────────────

const FS = {
  // Base path for a user's data
  userRef(uid) { return DB.collection('users').doc(uid); },

  // Profile
  profileRef(uid) { return this.userRef(uid).collection('data').doc('profile'); },

  // Budget settings
  budgetRef(uid) { return this.userRef(uid).collection('data').doc('budget'); },

  // Streak data
  streakRef(uid) { return this.userRef(uid).collection('data').doc('streak'); },

  // Locked savings summary
  lockedRef(uid) { return this.userRef(uid).collection('data').doc('lockedSavings'); },

  // Daily savings records: doc ID = "YYYY-MM-DD"
  savingsCol(uid) { return this.userRef(uid).collection('savings'); },
  savingDoc(uid, dateStr) { return this.savingsCol(uid).doc(dateStr); },

  // Expenses
  expensesCol(uid) { return this.userRef(uid).collection('expenses'); },
  expenseDoc(uid, id) { return this.expensesCol(uid).doc(id); },

  // Goals
  goalsCol(uid) { return this.userRef(uid).collection('goals'); },
  goalDoc(uid, id) { return this.goalsCol(uid).doc(id); },

  // Income
  incomeRef(uid) { return this.userRef(uid).collection('income'); },

  // Admin: announcements
  announcementsCol() { return DB.collection('announcements'); },

  // Admin: user index (written by admin only)
  adminUsersCol() { return DB.collection('adminUsers'); },
};

// ─── Firestore Timestamp helpers ────────────────────────────────────────────
const TS = {
  now() { return firebase.firestore.FieldValue.serverTimestamp(); },
  fromDate(d) { return firebase.firestore.Timestamp.fromDate(d); },
  increment(n) { return firebase.firestore.FieldValue.increment(n); },
};
