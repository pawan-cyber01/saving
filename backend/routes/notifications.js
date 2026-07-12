// routes/notifications.js — FCM push notification endpoints
const express = require('express');
const router = express.Router();
const admin = require('../services/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Save FCM token for a user
router.post('/register-token', verifyToken, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'FCM token required' });
  try {
    await admin.firestore()
      .collection('users').doc(req.user.uid)
      .collection('data').doc('profile')
      .set({ fcmToken }, { merge: true });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to save token' });
  }
});

// Send notification to a specific user (admin)
router.post('/send', verifyToken, requireAdmin, async (req, res) => {
  const { uid, title, body, url } = req.body;
  try {
    const snap = await admin.firestore()
      .collection('users').doc(uid)
      .collection('data').doc('profile').get();
    const fcmToken = snap.data()?.fcmToken;
    if (!fcmToken) return res.status(404).json({ error: 'User has no FCM token' });

    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      webpush: { fcmOptions: { link: url || '/' } },
    });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send announcement to all users (admin)
router.post('/broadcast', verifyToken, requireAdmin, async (req, res) => {
  const { title, body } = req.body;
  try {
    // Get all FCM tokens
    const usersSnap = await admin.firestore().collection('users').get();
    const tokens = [];
    for (const userDoc of usersSnap.docs) {
      const profileSnap = await userDoc.ref.collection('data').doc('profile').get();
      const token = profileSnap.data()?.fcmToken;
      if (token) tokens.push(token);
    }

    if (tokens.length === 0) return res.json({ success: true, sent: 0 });

    // Send in batches of 500 (FCM limit)
    const batches = [];
    for (let i = 0; i < tokens.length; i += 500) {
      batches.push(tokens.slice(i, i + 500));
    }

    let totalSent = 0;
    for (const batch of batches) {
      const response = await admin.messaging().sendEachForMulticast({ tokens: batch, notification: { title, body } });
      totalSent += response.successCount;
    }

    res.json({ success: true, sent: totalSent, total: tokens.length });
  } catch(err) {
    res.status(500).json({ error: 'Broadcast failed: ' + err.message });
  }
});

module.exports = router;
