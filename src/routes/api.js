const express = require('express');
const router = express.Router();
const db = require('../data/db');
const way2api = require('../services/way2api');
const cyrus = require('../services/cyrus');

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

// Admin Bank & UPI Details for Adding Money (Shivam Shivam / SBI)
router.get('/wallet/bank-details', (req, res) => {
  success(res, db.bankDetails, 'Bank details fetched');
});

// Submit Topup Request (Awaiting Admin Approval with UTR number)
router.post('/wallet/request-topup', (req, res) => {
  const {
    amount = 500,
    utrNumber = '',
    paymentMethod = 'UPI / Bank Transfer',
    notes = ''
  } = req.body;

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) return fail(res, 'Valid amount is required');
  if (!utrNumber || utrNumber.trim() === '') return fail(res, '12-digit UTR / Reference number is required');

  const user = db.users[0];
  const reqId = 'TOPUP_' + Date.now().toString().slice(-6);

  const topupRecord = {
    id: reqId,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    amount: numAmount,
    utrNumber: utrNumber.trim(),
    paymentMethod,
    bankingName: db.bankDetails.bankingName,
    accountNumber: db.bankDetails.accountNumber,
    notes,
    status: 'pending', // pending -> approved by admin
    createdAt: new Date().toISOString()
  };

  db.topupRequests.unshift(topupRecord);

  // Add Pending Transaction in Ledger
  db.transactions.unshift({
    id: reqId,
    userId: user.id,
    userName: user.name,
    title: 'Wallet Deposit Request',
    subtitle: `UTR: ${utrNumber} • Pending Admin Approval`,
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status: 'pending',
    category: 'wallet_topup',
    operatorName: 'SBI UPI Deposit',
    operatorRefNumber: utrNumber.trim(),
    mobile: user.phone,
    paymentMode: paymentMethod
  });

  success(res, topupRecord, 'Deposit request submitted. Admin will verify your payment and credit your wallet shortly.');
});

// Quick Balance Setter for Testing (e.g. Set balance to ₹5 or ₹500)
router.post('/wallet/set-balance', (req, res) => {
  const { balance } = req.body;
  if (balance === undefined || balance === null) return fail(res, 'Balance value required');
  const user = db.users[0];
  user.walletBalance = Number(balance);
  success(res, { balance: user.walletBalance }, `Wallet balance updated to ₹${user.walletBalance}`);
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

// --- RECHARGE & BILLS (Powered by Live Way2API & Cyrus Engine) ---
router.get('/recharge/operators', (req, res) => {
  const type = req.query.type || 'mobile';
  success(res, db.rechargeOperators[type] || db.rechargeOperators.mobile);
});

// Live Operator & Circle Lookup from Mobile Number
router.post('/recharge/operator-check', async (req, res) => {
  const { mobileNumber, mobile_number } = req.body;
  const num = mobileNumber || mobile_number;
  if (!num) return fail(res, 'Mobile number is required');

  try {
    const live = await way2api.checkOperatorCircle(num);
    if (live && live.data && live.data.result) {
      return success(res, live.data.result, 'Operator and circle detected');
    }
  } catch (err) {
    console.error('[Operator Check Error]:', err.message);
  }

  // Fallback
  success(res, { mobile_number: num, operator: 'Reliance Jio', circle: 'Kolkata' });
});

router.post('/operator-circle/check', async (req, res) => {
  const { mobileNumber, mobile_number } = req.body;
  const num = mobileNumber || mobile_number;
  if (!num) return fail(res, 'Mobile number is required');
  try {
    const live = await way2api.checkOperatorCircle(num);
    if (live && live.data && live.data.result) {
      return success(res, live.data.result);
    }
  } catch (err) {
    console.error('[Operator Check Error]:', err.message);
  }
  success(res, { mobile_number: num, operator: 'Reliance Jio', circle: 'Kolkata' });
});

// Live Prepaid Recharge Plans (Mapped to Flutter RechargePlanModel)
router.get('/recharge/plans', async (req, res) => {
  const { operatorId, circle, operator } = req.query;
  const op = operatorId || operator;

  if (op) {
    try {
      const live = await way2api.getMobilePlans(op, circle || 'kolkata');
      if (live && live.data && live.data.result && Array.isArray(live.data.result.plans)) {
        const mappedPlans = live.data.result.plans.map((p, idx) => {
          const desc = p.description || '';
          const dataMatch = desc.match(/\d+(\.\d+)?\s*(GB|MB)(\/Day)?/i);
          const rawCat = (p.category || '').toLowerCase();
          const rawLabel = (p.category_label || '').toLowerCase();
          const descLower = desc.toLowerCase();

          // Standardize category into Flutter UI tabs: Recommended, Popular, Truly Unlimited, Data Only, Annual
          let category = 'Popular';
          if (idx < 5 || p.category === 'popular') {
            category = 'Recommended';
          } else if (rawLabel.includes('unlimited') || descLower.includes('unlimited voice') || descLower.includes('5g')) {
            category = 'Truly Unlimited';
          } else if (rawCat.includes('data') || rawLabel.includes('data') || descLower.includes('data pack')) {
            category = 'Data Only';
          } else if (rawCat.includes('annual') || rawLabel.includes('annual') || (p.validity_days && p.validity_days >= 300) || descLower.includes('365 days')) {
            category = 'Annual';
          } else {
            category = 'Popular';
          }

          return {
            id: `plan_${p.amount}_${idx}`,
            amount: Number(p.amount),
            validity: p.validity || (p.validity_days ? `${p.validity_days} Days` : 'Standard'),
            data: dataMatch ? dataMatch[0] : (category === 'Data Only' ? 'Data Pack' : 'Standard Data'),
            talktime: descLower.includes('unlimited') ? 'Unlimited Calls' : 'Standard',
            description: desc,
            category,
            rawCategory: p.category_label || p.category,
            ottBenefits: desc.includes('JioTV') ? ['JioTV', 'Live TV'] : (desc.includes('Disney') || desc.includes('Hotstar') ? ['Disney+ Hotstar'] : (desc.includes('Sony') ? ['SonyLIV'] : [])),
            isPopular: category === 'Recommended' || category === 'Popular',
          };
        });
        return success(res, mappedPlans, 'Live plans fetched successfully');
      }
    } catch (err) {
      console.error('[Live Plans Error]:', err.message);
    }
  }

  // Fallback to seeded plans if live fails or no operator specified
  success(res, db.rechargePlans);
});

// Live Mobile R-Offer
router.get('/recharge/roffer', async (req, res) => {
  const { mobileNumber, operator } = req.query;
  if (!mobileNumber) return fail(res, 'Mobile number is required');
  try {
    const roffers = await way2api.getROffer(mobileNumber, operator);
    return success(res, roffers.data || roffers);
  } catch (err) {
    return fail(res, err.message);
  }
});

// DTH Operator & Customer Info
router.post('/dth/operator-check', async (req, res) => {
  const { dthNumber, dth_number } = req.body;
  const num = dthNumber || dth_number;
  if (!num) return fail(res, 'DTH number is required');
  const check = await way2api.checkDthOperator(num);
  success(res, check.data || check);
});

router.post('/dth/info', async (req, res) => {
  const { dthNumber, operator, dth_number } = req.body;
  const num = dthNumber || dth_number;
  if (!num) return fail(res, 'DTH number is required');
  const info = await way2api.getDthInfo(num, operator);
  success(res, info.data || info);
});

router.get('/dth/plans', async (req, res) => {
  const { operator } = req.query;
  const plans = await way2api.getDthPlans(operator || 'tata_play');
  success(res, plans.data || plans);
});

// Process Mobile / DTH Recharge & Instantly Sync with Cyrus & Admin Dashboard
router.post('/recharge/pay', async (req, res) => {
  const {
    amount = 299,
    mobile = '9876543210',
    mobileNumber,
    operator = 'Jio',
    operatorId,
    circle,
    serviceType = 'Mobile Recharge',
    paymentMode = 'FlamePay Wallet'
  } = req.body;

  const targetMobile = mobileNumber || mobile;
  const targetOperator = operatorId || operator;
  const user = db.users[0];
  const numAmount = Number(amount);
  const isDth = (serviceType || '').toLowerCase().includes('dth');

  // STRICT WALLET BALANCE CHECK: If balance < amount, user must recharge wallet first!
  if (user.walletBalance < numAmount) {
    return res.status(400).json({
      success: false,
      code: 'INSUFFICIENT_BALANCE',
      message: `Insufficient wallet balance. Your balance is ₹${user.walletBalance.toFixed(2)}, but recharge amount is ₹${numAmount.toFixed(2)}. Please recharge your wallet first.`,
      data: {
        currentBalance: user.walletBalance,
        requiredAmount: numAmount,
        shortfall: Number((numAmount - user.walletBalance).toFixed(2))
      }
    });
  }

  // Deduct from wallet
  user.walletBalance -= numAmount;
  user.spentThisMonth += numAmount;

  const txnId = 'FP' + Date.now();
  let opRef = 'OP' + Math.floor(100000000 + Math.random() * 900000000);
  let status = 'success';
  let cyrusInfo = null;

  // Execute Live Recharge via Cyrus Recharge Engine
  try {
    const cyrusRes = await cyrus.executeRecharge({
      number: targetMobile,
      operator: targetOperator,
      circle: circle || 'Delhi',
      amount: numAmount,
      usertx: txnId,
      type: isDth ? 'dth' : 'mobile'
    });

    cyrusInfo = cyrusRes;
    if (cyrusRes && cyrusRes.operatorRef && cyrusRes.operatorRef.trim() !== '') {
      opRef = cyrusRes.operatorRef;
    }
    if (cyrusRes && cyrusRes.status) {
      const s = cyrusRes.status.toUpperCase();
      if (s === 'FAILURE') status = 'failed';
      else if (s === 'PENDING') status = 'pending';
      else status = 'success';
    }
  } catch (err) {
    console.error('[Cyrus Execution Error]:', err.message);
  }

  const newTxn = {
    id: txnId,
    userId: user.id,
    userName: user.name,
    title: `${targetOperator} ${isDth ? 'DTH' : 'Recharge'}`,
    subtitle: `+91 ${targetMobile} • Just now`,
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status,
    category: isDth ? 'dth' : 'recharge',
    operatorName: targetOperator,
    operatorRefNumber: opRef,
    apiTransId: cyrusInfo?.apiTransId || '',
    mobile: targetMobile.startsWith('+91') ? targetMobile : '+91 ' + targetMobile,
    paymentMode
  };

  // Live Sync into Admin Dashboard Ledger
  db.transactions.unshift(newTxn);

  if (status === 'failed') {
    // Refund wallet balance so user doesn't lose money on failed recharge
    user.walletBalance += numAmount;
    user.spentThisMonth -= numAmount;

    return res.status(400).json({
      success: false,
      message: cyrusInfo?.errorMessage ? `Cyrus API: ${cyrusInfo.errorMessage}` : 'Recharge failed. Money refunded to wallet.',
      data: {
        transactionId: txnId,
        status: 'failed',
        errorMessage: cyrusInfo?.errorMessage,
        cyrusResponse: cyrusInfo
      }
    });
  }

  success(res, {
    transactionId: txnId,
    operatorRefNumber: opRef,
    apiTransId: cyrusInfo?.apiTransId || '',
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status,
    serviceType,
    targetTitle: `${targetOperator} - ${targetMobile}`,
    paymentMode,
    cashbackEarned: Math.round(numAmount * 0.02),
    cyrusResponse: cyrusInfo
  }, 'Recharge successful');
});

router.get('/bills/categories', (req, res) => success(res, db.billCategories));

// Live Bill Fetch via Cyrus
router.post('/bills/fetch', async (req, res) => {
  const { operator, consumerNumber, number } = req.body;
  const num = consumerNumber || number;
  try {
    const data = await cyrus.fetchBill({ operator, consumerNumber: num });
    success(res, data, 'Bill details fetched');
  } catch (err) {
    fail(res, err.message);
  }
});

// Process Live Bill Payment via Cyrus & Instantly Sync with Admin Dashboard
router.post('/bills/pay', async (req, res) => {
  const {
    category = 'electricity',
    operator = 'Tata Power',
    billerId,
    consumerNumber = '100982341',
    amount = 1250,
    paymentMode = 'FlamePay Wallet'
  } = req.body;

  const user = db.users[0];
  const numAmount = Number(amount);
  const targetOperator = billerId || operator;

  // STRICT WALLET BALANCE CHECK
  if (user.walletBalance < numAmount) {
    return res.status(400).json({
      success: false,
      code: 'INSUFFICIENT_BALANCE',
      message: `Insufficient wallet balance. Your balance is ₹${user.walletBalance.toFixed(2)}, but bill amount is ₹${numAmount.toFixed(2)}. Please recharge your wallet first.`,
      data: {
        currentBalance: user.walletBalance,
        requiredAmount: numAmount,
        shortfall: Number((numAmount - user.walletBalance).toFixed(2))
      }
    });
  }

  user.walletBalance -= numAmount;
  user.spentThisMonth += numAmount;

  const txnId = 'BILL' + Date.now().toString().slice(-6);
  let opRef = 'REC' + Math.floor(100000 + Math.random() * 900000);
  let status = 'success';
  let cyrusInfo = null;

  try {
    const cyrusRes = await cyrus.payBill({
      number: consumerNumber,
      operator: targetOperator,
      amount: numAmount,
      usertx: txnId,
      account: consumerNumber
    });
    cyrusInfo = cyrusRes;
    if (cyrusRes && cyrusRes.operatorRef && cyrusRes.operatorRef.trim() !== '') {
      opRef = cyrusRes.operatorRef;
    }
    if (cyrusRes && cyrusRes.status) {
      const s = cyrusRes.status.toUpperCase();
      if (s === 'FAILURE') status = 'failed';
      else if (s === 'PENDING') status = 'pending';
      else status = 'success';
    }
  } catch (err) {
    console.error('[Cyrus Bill Pay Error]:', err.message);
  }

  const newTxn = {
    id: txnId,
    userId: user.id,
    userName: user.name,
    title: `${targetOperator} Bill Payment`,
    subtitle: `Consumer No: ${consumerNumber}`,
    amount: numAmount,
    timestamp: new Date().toISOString(),
    status,
    category,
    operatorName: targetOperator,
    operatorRefNumber: opRef,
    apiTransId: cyrusInfo?.apiTransId || '',
    mobile: user.phone,
    paymentMode
  };

  // Live Sync into Admin Dashboard Ledger
  db.transactions.unshift(newTxn);

  if (status === 'failed') {
    user.walletBalance += numAmount;
    user.spentThisMonth -= numAmount;

    return res.status(400).json({
      success: false,
      message: cyrusInfo?.errorMessage ? `Cyrus API: ${cyrusInfo.errorMessage}` : 'Bill payment failed. Money refunded to wallet.',
      data: {
        transactionId: txnId,
        status: 'failed',
        errorMessage: cyrusInfo?.errorMessage,
        cyrusResponse: cyrusInfo
      }
    });
  }

  success(res, {
    transactionId: txnId,
    receiptNo: opRef,
    operatorRefNumber: opRef,
    apiTransId: cyrusInfo?.apiTransId || '',
    amount: numAmount,
    status,
    serviceType: `${category.toUpperCase()} Bill Payment`,
    targetTitle: `${targetOperator} - ${consumerNumber}`,
    paymentMode,
    timestamp: new Date().toISOString(),
    cyrusResponse: cyrusInfo
  }, 'Bill payment processed successfully');
});

// --- CYRUS DIAGNOSTIC & MANAGEMENT ENDPOINTS ---
router.get('/cyrus/balance', async (req, res) => {
  const data = await cyrus.getBalance();
  success(res, data, 'Cyrus Balance fetched');
});

router.get('/cyrus/status-check', (req, res) => {
  const creds = cyrus.getCredentials();
  success(res, {
    memberId: creds.memberId,
    ready: Boolean(creds.memberId && creds.pin)
  });
});

router.get('/cyrus/operators', async (req, res) => {
  const data = await cyrus.getOperators();
  success(res, data, 'Cyrus Operators fetched');
});

router.get('/cyrus/circles', async (req, res) => {
  const data = await cyrus.getCircles();
  success(res, data, 'Cyrus Circles fetched');
});

router.get('/cyrus/status/:id', async (req, res) => {
  const data = await cyrus.checkStatus(req.params.id);
  success(res, data, 'Cyrus Status checked');
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

// --- CIBIL SCORE CHECK (Powered by Live Way2API) ---
router.post('/cibil/check', async (req, res) => {
  const user = db.users[0];
  const { name, mobile, pan, dob, gender, address, pincode } = req.body;
  const clientName = name || user.name;
  const clientMobile = mobile || user.phone;
  const clientPan = pan || user.pan;

  let liveCibil = null;
  if (clientPan && clientPan !== 'PAN REQUIRED') {
    try {
      const resp = await way2api.fetchCibilReport({
        name: clientName,
        mobile: clientMobile,
        pan: clientPan,
        dob,
        gender,
        address,
        pincode
      });
      if (resp && resp.data && resp.data.result) {
        liveCibil = resp.data.result;
      }
    } catch (e) {
      console.error('[CIBIL API Error]:', e.message);
    }
  }

  const score = (liveCibil && liveCibil.score) ? Number(liveCibil.score) : (user.cibilScore || 780);
  const inquiry = {
    id: 'CIBIL_REQ_' + Math.floor(100 + Math.random() * 900),
    userId: user.id,
    userName: clientName,
    phone: clientMobile,
    pan: clientPan,
    cibilScore: score,
    rating: score >= 750 ? 'Excellent' : 'Good',
    activeCreditLines: (liveCibil && liveCibil.active_accounts) || 3,
    paymentHistory: (liveCibil && liveCibil.payment_history) || '98% On-Time',
    checkedAt: new Date().toISOString(),
    rawReport: liveCibil || null
  };

  db.cibilInquiries.unshift(inquiry);
  success(res, inquiry, 'CIBIL report generated successfully');
});

// Fetch Active CIBIL Report for Mobile App
router.get('/cibil/report', (req, res) => {
  const user = db.users[0];
  const lastInquiry = db.cibilInquiries[0];
  const score = lastInquiry ? lastInquiry.cibilScore : (user.cibilScore || 780);

  success(res, {
    score,
    rating: score >= 750 ? 'Excellent' : 'Good',
    activeAccounts: lastInquiry ? lastInquiry.activeCreditLines : 3,
    paymentHistory: lastInquiry ? lastInquiry.paymentHistory : '98% On-Time',
    lastChecked: lastInquiry ? lastInquiry.checkedAt : new Date().toISOString(),
    creditUtilization: '18%',
    totalInquiries: db.cibilInquiries.length || 1,
    reportUrl: 'https://admin.flamepay.in/reports/sample_cibil.pdf'
  }, 'CIBIL report fetched');
});

// --- OFFERS, NOTIFICATIONS & HISTORY ---
router.get('/offers/list', (req, res) => success(res, db.offers));
router.get('/notifications/list', (req, res) => success(res, db.notifications));
router.get('/transactions/history', (req, res) => success(res, db.transactions));

module.exports = router;
