// routes/auth.js — Authentication-related backend endpoints
const express = require('express');
const router = express.Router();
const admin = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// Get current user profile from Firebase Auth
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    res.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      createdAt: user.metadata.creationTime,
    });
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Set admin custom claim (super admin only)
router.post('/set-admin', verifyToken, async (req, res) => {
  const { targetUid, adminSecret } = req.body;
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }
  try {
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    res.json({ success: true, message: `Admin claim set for ${targetUid}` });
  } catch(err) {
    res.status(500).json({ error: 'Failed to set admin claim' });
  }
});

// Disable a user account (admin only)
router.post('/disable-user', verifyToken, async (req, res) => {
  if (!req.user.admin) return res.status(403).json({ error: 'Admin required' });
  const { targetUid } = req.body;
  try {
    await admin.auth().updateUser(targetUid, { disabled: true });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to disable user' });
  }
});

module.exports = router;
