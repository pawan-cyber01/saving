// routes/admin.js — Admin-only API endpoints
const express = require('express');
const router = express.Router();
const admin = require('../services/firebase');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// List all users
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const listResult = await admin.auth().listUsers(100);
    const users = listResult.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      disabled: u.disabled,
      createdAt: u.metadata.creationTime,
      lastSignIn: u.metadata.lastSignInTime,
      isAdmin: !!u.customClaims?.admin,
    }));
    res.json({ users, total: users.length });
  } catch(err) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Get app-wide stats
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const db = admin.firestore();
    const usersSnap = await db.collection('users').get();
    const totalUsers = usersSnap.size;

    // Today's active users (those who have a savings record today)
    const today = new Date().toISOString().split('T')[0];
    let activeToday = 0;
    // Count in parallel (simplified for MVP)
    const checks = usersSnap.docs.slice(0, 50).map(async userDoc => {
      const savSnap = await userDoc.ref.collection('savings').doc(today).get();
      if (savSnap.exists) activeToday++;
    });
    await Promise.all(checks);

    res.json({ totalUsers, activeToday, generatedAt: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Disable/enable user
router.patch('/users/:uid', verifyToken, requireAdmin, async (req, res) => {
  const { disabled } = req.body;
  try {
    await admin.auth().updateUser(req.params.uid, { disabled });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (nuclear option)
router.delete('/users/:uid', verifyToken, requireAdmin, async (req, res) => {
  try {
    await admin.auth().deleteUser(req.params.uid);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
