// services/firebase.js — Firebase Admin SDK initialization
const admin = require('firebase-admin');

if (!admin.apps.length) {
  // On Render: set FIREBASE_SERVICE_ACCOUNT as a JSON string env var
  // OR use Application Default Credentials if running on Google Cloud
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'saving-ff0d3',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'saving-ff0d3.firebasestorage.app',
  });

  console.log('✅ Firebase Admin initialized');
}

module.exports = admin;
