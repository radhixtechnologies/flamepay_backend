const express = require('express');
const router = express.Router();
const db = require('../data/db');

// Admin Auth
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === db.admin.username && password === db.admin.password) {
    return res.json({
      success: true,
      message: 'Login successful',
      token: 'admin_session_token_' + Date.now(),
      admin: { name: db.admin.name, role: db.admin.role, username: db.admin.username }
    });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin username or password' });
});

// Admin Stats
router.get('/stats', (req, res) => {
  const totalUsers = db.users.length;
  const verifiedKyc = db.users.filter(u => u.kycStatus === 'verified').length;
  const pendingKyc = db.kycRequests.filter(k => k.status === 'pending').length;
  const totalVolume = db.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalTxnCount = db.transactions.length;

  res.json({
    success: true,
    data: {
      totalUsers,
      verifiedKyc,
      pendingKyc,
      totalVolume,
      totalTxnCount
    }
  });
});

// Admin Users CRUD
router.get('/users', (req, res) => {
  res.json({ success: true, data: db.users });
});

router.post('/users/:id/balance', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const amount = Number(req.body.amount) || 0;
  user.walletBalance += amount;
  res.json({ success: true, message: `Balance updated to ₹${user.walletBalance}`, user });
});

router.post('/users/:id/status', (req, res) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.status = req.body.status || 'active';
  res.json({ success: true, message: 'User status updated', user });
});

// Admin KYC Management
router.get('/kyc-requests', (req, res) => {
  res.json({ success: true, data: db.kycRequests });
});

router.post('/kyc-requests/:id/action', (req, res) => {
  const reqItem = db.kycRequests.find(k => k.id === req.params.id);
  if (!reqItem) return res.status(404).json({ success: false, message: 'KYC request not found' });
  
  const { action } = req.body; // 'approve' or 'reject'
  reqItem.status = action === 'approve' ? 'approved' : 'rejected';
  
  const user = db.users.find(u => u.id === reqItem.userId);
  if (user) {
    user.kycStatus = action === 'approve' ? 'verified' : 'rejected';
    if (action === 'approve') {
      user.monthlyLimit = 200000.00;
      user.isVip = true;
    }
  }

  res.json({ success: true, message: `KYC request ${reqItem.status}`, kyc: reqItem });
});

// Admin Transactions
router.get('/transactions', (req, res) => {
  res.json({ success: true, data: db.transactions });
});

module.exports = router;
