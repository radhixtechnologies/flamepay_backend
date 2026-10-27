const express = require('express');
const router = express.Router();
const db = require('../data/db');

// Helper wrapper
const success = (res, data = {}, message = 'Success') => res.json({ success: true, message, data });
const fail = (res, message = 'Error', code = 400) => res.status(code).json({ success: false, message });

// --- AUTH ---
router.post('/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return fail(res, 'Phone is required');
  success(res, { otp: '123456', phone }, `OTP sent successfully to +91 ${phone}`);
});

router.post('/auth/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone) return fail(res, 'Phone is required');
  
  let user = db.getUser(phone);
  let isNewUser = false;
  if (!user) {
    isNewUser = true;
    user = {
      id: 'FP_USER_' + Date.now().toString().slice(-4),
      name: 'New FlamePay User',
      phone: phone.startsWith('+91') ? phone : '+91 ' + phone,
      email: 'user@flamepay.com',
      isVip: false,
      kycStatus: 'pending',
      walletBalance: 0.0,
      cibilScore: 750,
      monthlyLimit: 50000.00,
      spentThisMonth: 0.0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    db.users.push(user);
  }

  success(res, {
    token: 'jwt_flamepay_token_' + Date.now(),
    refreshToken: 'jwt_flamepay_refresh_' + Date.now(),
    isNewUser,
    user
  }, 'OTP verified successfully');
});

router.post('/auth/register', (req, res) => {
  const { name, email, phone } = req.body;
  let user = db.getUser(phone);
  if (!user) {
    user = {
      id: 'FP_USER_' + Date.now().toString().slice(-4),
      name: name || 'FlamePay User',
      phone: phone ? (phone.startsWith('+91') ? phone : '+91 ' + phone) : '+91 9876543210',
      email: email || 'user@flamepay.com',
      isVip: false,
      kycStatus: 'pending',
      walletBalance: 0.0,
      cibilScore: 750,
      monthlyLimit: 50000.00,
      spentThisMonth: 0.0,
      createdAt: new Date().toISOString(),
      status: 'active'
    };
    db.users.push(user);
  } else {
    if (name) user.name = name;
    if (email) user.email = email;
  }

  success(res, {
    token: 'jwt_flamepay_token_' + Date.now(),
    refreshToken: 'jwt_flamepay_refresh_' + Date.now(),
    user
  }, 'Registration successful');
});

router.post('/auth/set-mpin', (req, res) => success(res, true, 'MPIN created successfully'));
router.post('/auth/verify-mpin', (req, res) => success(res, true, 'MPIN verified'));
router.post('/auth/logout', (req, res) => success(res, true, 'Logged out successfully'));

// --- USER & PROFILE ---
router.get('/user/profile', (req, res) => {
  const user = db.users[0]; // Active session user
  success(res, user);
});

router.post('/user/profile/update', (req, res) => {
  const { name, email } = req.body;
  const user = db.users[0];
  if (name) user.name = name;
  if (email) user.email = email;
  success(res, user, 'Profile updated successfully');
});

// --- KYC ---
router.get('/user/kyc-status', (req, res) => {
  const user = db.users[0];
  success(res, { status: user.kycStatus, monthlyLimit: user.monthlyLimit });
});

router.post('/user/kyc-submit', (req, res) => {
  const { fullName, panNumber, aadhaarNumber, dob, address, annualIncome, occupation } = req.body;
  const user = db.users[0];
  user.name = fullName || user.name;
  user.pan = panNumber || user.pan;
  user.aadhaar = aadhaarNumber || user.aadhaar;
  user.kycStatus = 'verified';
  user.monthlyLimit = 200000.00;
  user.isVip = true;

  db.kycRequests.push({
    id: 'KYC_REQ_' + Date.now().toString().slice(-4),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    pan: user.pan,
    aadhaar: user.aadhaar,
    dob,
    address,
    annualIncome,
    occupation,
    status: 'approved',
    submittedAt: new Date().toISOString()
  });

  success(res, { status: 'verified', user }, 'KYC verified successfully');
});

// --- WALLET & TRANSFERS ---
router.get('/wallet/balance', (req, res) => {
  const user = db.users[0];
  success(res, {
    balance: user.walletBalance,
    monthlyLimit: user.monthlyLimit,
    spentThisMonth: user.spentThisMonth
  });
});

router.get('/wallet/transactions', (req, res) => {
  success(res, db.transactions);
});

router.post('/wallet/add-money', (req, res) => {
  const amount = Number(req.body.amount) || 500;
  const user = db.users[0];
  user.walletBalance += amount;

  const newTxn = {
    id: 'TXN_' + Date.now().toString().slice(-6),
    userId: user.id,
    title: 'Wallet Top-up',
    subtitle: `Via ${req.body.paymentMethod || 'UPI'} • Just now`,
    amount,
    timestamp: new Date().toISOString(),
    status: 'success',
    category: 'wallet_topup',
    operatorName: req.body.paymentMethod || 'UPI',
    mobile: user.phone,
    paymentMode: 'UPI'
  };
  db.transactions.unshift(newTxn);

  success(res, { newBalance: user.walletBalance, transactionId: newTxn.id }, 'Money added successfully');
});

router.post('/wallet/transfer', (req, res) => {
  const amount = Number(req.body.amount) || 100;
  const recipient = req.body.recipient || 'Mobile Transfer';
  const user = db.users[0];

  if (user.walletBalance < amount) {
    return fail(res, 'Insufficient wallet balance', 400);
  }

  user.walletBalance -= amount;
  user.spentThisMonth += amount;

  const txnId = 'FP' + Date.now();
  const newTxn = {
    id: txnId,
    userId: user.id,
    title: `Send Money to ${recipient}`,
    subtitle: `Transfer • ${new Date().toLocaleTimeString()}`,
    amount,
    timestamp: new Date().toISOString(),
    status: 'success',
    category: 'transfer',
    operatorName: 'FlamePay Wallet',
    mobile: recipient,
    paymentMode: 'FlamePay Wallet'
  };
  db.transactions.unshift(newTxn);

  success(res, {
    transactionId: txnId,
    operatorRefNumber: 'TXN' + Math.floor(10000000 + Math.random() * 90000000),
    amount,
    timestamp: new Date().toISOString(),
    status: 'success',
    serviceType: 'Money Transfer',
    targetTitle: `Transfer to ${recipient}`,
    paymentMode: 'FlamePay Wallet',
    cashbackEarned: 5.0,
    newBalance: user.walletBalance
  }, 'Transfer successful');
});

// --- RECHARGE & BILLS ---
router.get('/recharge/operators', (req, res) => {
  const type = req.query.type || 'mobile';
  success(res, db.rechargeOperators[type] || db.rechargeOperators.mobile);
});

router.get('/recharge/plans', (req, res) => success(res, db.rechargePlans));

router.post('/recharge/pay', (req, res) => {
  const { amount = 299, mobile = '9876543210', operator = 'Jio' } = req.body;
  const user = db.users[0];
  if (user.walletBalance >= amount) user.walletBalance -= amount;

  const txnId = 'FP' + Date.now();
  db.transactions.unshift({
    id: txnId,
    userId: user.id,
    title: `${operator} Recharge`,
    subtitle: `+91 ${mobile} • Just now`,
    amount,
    timestamp: new Date().toISOString(),
    status: 'success',
    category: 'recharge',
    operatorName: operator,
    mobile: '+91 ' + mobile,
    paymentMode: 'FlamePay Wallet'
  });

  success(res, {
    transactionId: txnId,
    operatorRefNumber: 'OP' + Math.floor(100000000 + Math.random() * 900000000),
    amount,
    timestamp: new Date().toISOString(),
    status: 'success',
    serviceType: 'Mobile Recharge',
    targetTitle: `${operator} Prepaid - ${mobile}`,
    paymentMode: 'FlamePay Wallet',
    cashbackEarned: 15.0
  }, 'Recharge successful');
});

router.get('/bills/categories', (req, res) => success(res, db.billCategories));

router.post('/bills/pay', (req, res) => {
  const { category = 'electricity', operator = 'Tata Power', consumerNumber = '100982341', amount = 1250 } = req.body;
  const user = db.users[0];
  if (user.walletBalance >= amount) user.walletBalance -= amount;

  const txnId = 'BILL' + Date.now().toString().slice(-6);
  db.transactions.unshift({
    id: txnId,
    userId: user.id,
    userName: user.name,
    title: `${operator} Bill Payment`,
    subtitle: `Consumer No: ${consumerNumber}`,
    amount: Number(amount),
    timestamp: new Date().toISOString(),
    status: 'success',
    category,
    operatorName: operator,
    mobile: user.phone,
    paymentMode: 'FlamePay Wallet'
  });

  success(res, {
    transactionId: txnId,
    receiptNo: 'REC' + Math.floor(100000 + Math.random() * 900000),
    amount: Number(amount),
    status: 'success',
    timestamp: new Date().toISOString()
  }, 'Bill payment processed successfully');
});

// --- FINANCIAL PRODUCTS: LOANS (Personal, Home, Business, LAP) ---
router.post('/loan/apply', (req, res) => {
  const {
    loanType = 'Personal Loan',
    requestedAmount = 500000,
    tenureMonths = 36,
    employmentType = 'Salaried',
    monthlyIncome = 75000,
    city = 'Mumbai',
    source = 'App Screen Tap (Instant Lead)'
  } = req.body;

  // Use logged in user if available, else first user
  const user = db.users[0];
  const leadId = 'LN_LEAD_' + Math.floor(100 + Math.random() * 900);

  const newLead = {
    id: leadId,
    userId: user.id,
    userName: req.body.userName || user.name,
    userPhone: req.body.userPhone || user.phone,
    userEmail: req.body.userEmail || user.email,
    loanType,
    requestedAmount: Number(requestedAmount),
    tenureMonths: Number(tenureMonths),
    employmentType: req.body.employmentType || user.employmentType || employmentType,
    companyName: req.body.companyName || user.companyName || 'Not Specified',
    monthlyIncome: Number(req.body.monthlyIncome || user.monthlyIncome || monthlyIncome),
    cibilScore: user.cibilScore || 750,
    pan: user.pan || 'PAN REQUIRED',
    aadhaar: user.aadhaar || 'AADHAAR REQUIRED',
    city: req.body.city || user.city || city,
    state: user.state || 'Maharashtra',
    source,
    status: 'interested', // Initial state when user taps
    adminNotes: `User tapped on ${loanType} inside Flutter App. High priority financial lead.`,
    appliedAt: new Date().toISOString()
  };

  db.loanLeads.unshift(newLead);

  success(res, newLead, 'Loan interest recorded successfully! Our executive will contact you shortly.');
});

// --- FINANCIAL PRODUCTS: CREDIT CARDS ---
router.post('/credit-card/apply', (req, res) => {
  const { cardName = 'HDFC Regalia Gold Credit Card', bankName = 'HDFC Bank' } = req.body;
  const user = db.users[0];
  const leadId = 'CC_LEAD_' + Math.floor(100 + Math.random() * 900);

  const newLead = {
    id: leadId,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    userEmail: user.email,
    cardName,
    bankName,
    cardCategory: 'Rewards & Travel',
    monthlyIncome: user.monthlyIncome || 85000,
    cibilScore: user.cibilScore || 780,
    status: 'interested',
    annualFee: '₹1,500',
    appliedAt: new Date().toISOString()
  };

  db.creditCardLeads.unshift(newLead);
  success(res, newLead, 'Credit card application submitted successfully');
});

// --- FINANCIAL PRODUCTS: INSURANCE ---
router.post('/insurance/inquiry', (req, res) => {
  const { insuranceType = 'Health Insurance', sumInsured = '₹10,00,000' } = req.body;
  const user = db.users[0];
  const leadId = 'INS_LEAD_' + Math.floor(100 + Math.random() * 900);

  const newLead = {
    id: leadId,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    insuranceType,
    sumInsured,
    provider: 'Partner Insurers',
    estimatedPremium: 'Custom Quote',
    status: 'interested',
    appliedAt: new Date().toISOString()
  };

  db.insuranceLeads.unshift(newLead);
  success(res, newLead, 'Insurance inquiry registered successfully');
});

// --- CIBIL SCORE CHECK ---
router.post('/cibil/check', (req, res) => {
  const user = db.users[0];
  const inquiry = {
    id: 'CIBIL_REQ_' + Math.floor(100 + Math.random() * 900),
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    cibilScore: user.cibilScore || 780,
    rating: (user.cibilScore || 780) >= 750 ? 'Excellent' : 'Good',
    activeCreditLines: 3,
    paymentHistory: '98% On-Time',
    checkedAt: new Date().toISOString()
  };

  db.cibilInquiries.unshift(inquiry);
  success(res, inquiry, 'CIBIL report generated successfully');
});

// --- OFFERS, NOTIFICATIONS & HISTORY ---
router.get('/offers/list', (req, res) => success(res, db.offers));
router.get('/notifications/list', (req, res) => success(res, db.notifications));
router.get('/transactions/history', (req, res) => success(res, db.transactions));

module.exports = router;
