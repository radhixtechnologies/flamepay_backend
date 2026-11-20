const express = require('express');
const router = express.Router();
const db = require('../data/db');
const cyrus = require('../services/cyrus');

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

// Admin Comprehensive Operational Stats
router.get('/stats', (req, res) => {
  const totalUsers = db.users.length;
  const verifiedKyc = db.users.filter(u => u.kycStatus === 'verified').length;
  const pendingKyc = db.kycRequests.filter(k => k.status === 'pending').length;
  const totalVolume = db.transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalTxnCount = db.transactions.length;

  const totalLoans = db.loanLeads.length;
  const pendingLoans = db.loanLeads.filter(l => l.status === 'interested' || l.status === 'in_review').length;
  const totalLoanRequested = db.loanLeads.reduce((acc, l) => acc + (l.requestedAmount || 0), 0);

  const totalCreditCards = db.creditCardLeads.length;
  const totalInsurance = db.insuranceLeads.length;
  const totalCibil = db.cibilInquiries.length;

  res.json({
    success: true,
    data: {
      totalUsers,
      verifiedKyc,
      pendingKyc,
      totalVolume,
      totalTxnCount,
      totalLoans,
      pendingLoans,
      totalLoanRequested,
      totalCreditCards,
      totalInsurance,
      totalCibil
    }
  });
});

// --- LOAN LEADS MANAGEMENT ---
router.get('/loans', (req, res) => {
  let leads = [...db.loanLeads];
  const { status, type } = req.query;
  if (status && status !== 'all') {
    leads = leads.filter(l => l.status === status);
  }
  if (type && type !== 'all') {
    leads = leads.filter(l => l.loanType.toLowerCase().includes(type.toLowerCase()));
  }
  res.json({ success: true, count: leads.length, data: leads });
});

router.post('/loans/:id/status', (req, res) => {
  const lead = db.loanLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Loan lead not found' });

  const { status, adminNotes } = req.body;
  if (status) lead.status = status;
  if (adminNotes) lead.adminNotes = adminNotes;

  // Real Disbursal trigger when Admin approves or disburses!
  if (status === 'disbursed' || status === 'approved') {
    lead.disbursalStatus = status === 'disbursed' ? 'Funds Disbursed to Bank Account / Wallet' : 'Sanctioned & Approved by Admin';
    const user = db.users.find(u => u.id === lead.userId) || db.getUser(lead.userPhone) || db.users.find(u => u.name === lead.userName);
    if (user && !lead.alreadyDisbursed) {
      user.walletBalance = (user.walletBalance || 0) + (lead.requestedAmount || 0);
      lead.alreadyDisbursed = true;
      db.transactions.unshift({
        id: 'TXN_LN_' + Date.now().toString().slice(-6),
        userId: user.id,
        userName: user.name,
        title: `Loan Sanction - ${lead.loanType || 'Personal Loan'}`,
        subtitle: `Admin approved Loan #${lead.id} • Disbursed to Wallet`,
        amount: lead.requestedAmount,
        type: 'credit',
        status: 'success',
        timestamp: new Date().toISOString()
      });
    }
  } else if (status === 'rejected') {
    lead.disbursalStatus = 'Application Rejected by Admin';
  } else {
    lead.disbursalStatus = 'Under Review by Admin';
  }

  res.json({ success: true, message: `Loan lead status updated to ${lead.status}`, data: lead });
});

router.post('/loans/:id/notes', (req, res) => {
  const lead = db.loanLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Loan lead not found' });

  lead.adminNotes = req.body.notes || '';
  res.json({ success: true, message: 'Notes saved', data: lead });
});

// Quick simulate endpoint for testing from Admin dashboard
router.post('/loans/simulate', (req, res) => {
  const user = db.users[Math.floor(Math.random() * db.users.length)];
  const types = ['Personal Loan', 'Business Loan', 'Home Loan', 'Loan Against Property'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  const amounts = [300000, 500000, 1000000, 2500000];
  const randomAmt = amounts[Math.floor(Math.random() * amounts.length)];

  const newLead = {
    id: 'LN_LEAD_' + Math.floor(100 + Math.random() * 900),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    userEmail: user.email,
    loanType: randomType,
    requestedAmount: randomAmt,
    tenureMonths: 36,
    employmentType: user.employmentType || 'Salaried',
    companyName: user.companyName || 'Corporate Entity',
    monthlyIncome: user.monthlyIncome || 80000,
    cibilScore: user.cibilScore || 780,
    pan: user.pan || 'PAN1234567',
    aadhaar: user.aadhaar || 'XXXX XXXX 9999',
    city: user.city || 'Mumbai',
    state: user.state || 'Maharashtra',
    source: 'Live App Screen Tap (Simulated)',
    status: 'interested',
    adminNotes: `New live lead generated! Customer tapped on ${randomType} in mobile app.`,
    appliedAt: new Date().toISOString()
  };

  db.loanLeads.unshift(newLead);
  res.json({ success: true, message: 'New user loan inquiry simulated successfully!', data: newLead });
});

// --- CREDIT CARDS MANAGEMENT ---
router.get('/credit-cards', (req, res) => {
  res.json({ success: true, count: db.creditCardLeads.length, data: db.creditCardLeads });
});

router.post('/credit-cards/:id/status', (req, res) => {
  const lead = db.creditCardLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Credit card lead not found' });
  lead.status = req.body.status || lead.status;
  res.json({ success: true, message: 'Credit card lead status updated', data: lead });
});

// --- INSURANCE MANAGEMENT ---
router.get('/insurance', (req, res) => {
  res.json({ success: true, count: db.insuranceLeads.length, data: db.insuranceLeads });
});

router.post('/insurance/:id/status', (req, res) => {
  const lead = db.insuranceLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Insurance lead not found' });
  lead.status = req.body.status || lead.status;
  res.json({ success: true, message: 'Insurance lead status updated', data: lead });
});

// --- CIBIL INQUIRIES ---
router.get('/cibil-inquiries', (req, res) => {
  res.json({ success: true, count: db.cibilInquiries.length, data: db.cibilInquiries });
});

// --- USERS MANAGEMENT ---
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

// --- KYC MANAGEMENT ---
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

// --- TRANSACTIONS ---
router.get('/transactions', (req, res) => {
  res.json({ success: true, data: db.transactions });
});

// --- WALLET TOPUP / DEPOSIT REQUESTS (Admin Approval) ---
router.get('/topups', (req, res) => {
  res.json({ success: true, data: db.topupRequests });
});

router.post('/topups/:id/approve', (req, res) => {
  const topup = db.topupRequests.find(t => t.id === req.params.id);
  if (!topup) return res.status(404).json({ success: false, message: 'Topup request not found' });
  if (topup.status === 'approved') return res.json({ success: true, message: 'Already approved', topup });

  topup.status = 'approved';
  topup.reviewedAt = new Date().toISOString();
  topup.adminNotes = req.body.adminNotes || 'Payment verified in SBI Bank Account';

  // Credit user's wallet
  const user = db.users.find(u => u.id === topup.userId) || db.users[0];
  user.walletBalance += topup.amount;

  // Update associated transaction
  const txn = db.transactions.find(t => t.id === topup.id);
  if (txn) {
    txn.status = 'success';
    txn.subtitle = `Approved by Admin • UTR: ${topup.utrNumber}`;
  }

  res.json({
    success: true,
    message: `Topup of ₹${topup.amount} approved! User ${user.name} wallet balance is now ₹${user.walletBalance}`,
    topup,
    userBalance: user.walletBalance
  });
});

router.post('/topups/:id/reject', (req, res) => {
  const topup = db.topupRequests.find(t => t.id === req.params.id);
  if (!topup) return res.status(404).json({ success: false, message: 'Topup request not found' });

  topup.status = 'rejected';
  topup.reviewedAt = new Date().toISOString();
  topup.adminNotes = req.body.adminNotes || 'Payment verification failed / invalid UTR';

  const txn = db.transactions.find(t => t.id === topup.id);
  if (txn) {
    txn.status = 'failed';
    txn.subtitle = 'Rejected by Admin';
  }

  res.json({ success: true, message: 'Topup request rejected', topup });
});

// --- SYSTEM SETTINGS & SANDBOX TOGGLE ---
router.get('/system/settings', (req, res) => {
  res.json({
    success: true,
    data: {
      bankDetails: db.bankDetails,
      settings: db.settings,
      cyrusTestMode: cyrus.getTestMode()
    }
  });
});

router.post('/system/test-mode', (req, res) => {
  const { testMode } = req.body;
  const isEnabled = cyrus.setTestMode(testMode);
  db.settings.cyrusTestMode = isEnabled;
  res.json({
    success: true,
    message: isEnabled ? 'Cyrus Sandbox / Test Mode ENABLED (Free simulated recharge - Real wallet protected)' : 'Cyrus LIVE Mode ENABLED (Will deduct real ₹67.67 Cyrus wallet)',
    cyrusTestMode: isEnabled
  });
});

// --- OFFERS & REWARDS MANAGEMENT (Add / Edit / Delete) ---
router.get('/offers', (req, res) => {
  res.json({ success: true, count: db.offers.length, data: db.offers });
});

router.post('/offers', (req, res) => {
  const { title, description, code, discount, category, bannerColor, isActive } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, message: 'Offer title is required' });
  }
  if (!code || !String(code).trim()) {
    return res.status(400).json({ success: false, message: 'Coupon code is required' });
  }

  const newOffer = {
    id: 'OFFER_' + Date.now().toString().slice(-6),
    title: String(title).trim(),
    description: String(description || '').trim(),
    code: String(code).trim().toUpperCase().replace(/\s+/g, ''),
    discount: String(discount || 'Special Offer').trim(),
    category: String(category || 'Recharge').trim(),
    bannerColor: String(bannerColor || '0xFF1E88E5').trim(),
    isActive: isActive !== false && isActive !== 'false',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.offers.unshift(newOffer);
  if (typeof db.saveOffers === 'function') db.saveOffers();

  res.status(201).json({ success: true, message: 'Offer created successfully', data: newOffer });
});

router.put('/offers/:id', (req, res) => {
  const idx = db.offers.findIndex(o => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Offer not found' });
  }

  const existing = db.offers[idx];
  const { title, description, code, discount, category, bannerColor, isActive } = req.body;

  const updated = {
    ...existing,
    ...(title !== undefined ? { title: String(title).trim() } : {}),
    ...(description !== undefined ? { description: String(description).trim() } : {}),
    ...(code !== undefined ? { code: String(code).trim().toUpperCase().replace(/\s+/g, '') } : {}),
    ...(discount !== undefined ? { discount: String(discount).trim() } : {}),
    ...(category !== undefined ? { category: String(category).trim() } : {}),
    ...(bannerColor !== undefined ? { bannerColor: String(bannerColor).trim() } : {}),
    ...(isActive !== undefined ? { isActive: isActive === true || isActive === 'true' } : {}),
    updatedAt: new Date().toISOString()
  };

  db.offers[idx] = updated;
  if (typeof db.saveOffers === 'function') db.saveOffers();

  res.json({ success: true, message: 'Offer updated successfully', data: updated });
});

router.delete('/offers/:id', (req, res) => {
  const idx = db.offers.findIndex(o => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Offer not found' });
  }

  const [removed] = db.offers.splice(idx, 1);
  if (typeof db.saveOffers === 'function') db.saveOffers();

  res.json({ success: true, message: 'Offer deleted successfully', data: removed });
});

// --- SUPPORT / CONTACT TICKETS MANAGEMENT ---
router.get('/contact-tickets', (req, res) => {
  res.json({ success: true, count: (db.supportTickets || []).length, data: db.supportTickets || [] });
});

router.post('/contact-tickets/:id/status', (req, res) => {
  const ticket = (db.supportTickets || []).find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ success: false, message: 'Support ticket not found' });
  ticket.status = req.body.status || 'resolved';
  res.json({ success: true, message: `Ticket status updated to ${ticket.status}`, data: ticket });
});

module.exports = router;
