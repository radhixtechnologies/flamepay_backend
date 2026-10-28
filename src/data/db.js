// In-Memory Database with Comprehensive Seed Data for FlamePay Super-App
class Database {
  constructor() {
    this.admin = {
      username: 'admin',
      password: 'password123',
      name: 'Super Administrator',
      role: 'super_admin'
    };

    // User Accounts
    this.users = [
      {
        id: 'FP_USER_101',
        name: 'Rahul Sharma',
        phone: '+91 9876543210',
        email: 'rahul.sharma@example.com',
        isVip: true,
        kycStatus: 'verified',
        walletBalance: 2580.00,
        cibilScore: 780,
        pan: 'ABCDE1234F',
        aadhaar: 'XXXX XXXX 9823',
        monthlyLimit: 200000.00,
        spentThisMonth: 4280.00,
        employmentType: 'Salaried',
        companyName: 'Tata Consultancy Services',
        monthlyIncome: 85000,
        city: 'Mumbai',
        state: 'Maharashtra',
        createdAt: '2026-10-15T10:00:00Z',
        status: 'active'
      },
      {
        id: 'FP_USER_102',
        name: 'Pooja Verma',
        phone: '+91 9876543211',
        email: 'pooja.verma@example.com',
        isVip: false,
        kycStatus: 'pending',
        walletBalance: 1250.00,
        cibilScore: 720,
        pan: 'BKMPV8921K',
        aadhaar: 'XXXX XXXX 1142',
        monthlyLimit: 50000.00,
        spentThisMonth: 1200.00,
        employmentType: 'Self-Employed',
        companyName: 'Verma Boutiques',
        monthlyIncome: 65000,
        city: 'Noida',
        state: 'Uttar Pradesh',
        createdAt: '2026-10-20T12:30:00Z',
        status: 'active'
      },
      {
        id: 'FP_USER_103',
        name: 'Amit Patel',
        phone: '+91 9123456780',
        email: 'amit.patel@example.com',
        isVip: true,
        kycStatus: 'verified',
        walletBalance: 8400.00,
        cibilScore: 810,
        pan: 'CDEFR4512P',
        aadhaar: 'XXXX XXXX 7781',
        monthlyLimit: 200000.00,
        spentThisMonth: 12500.00,
        employmentType: 'Salaried',
        companyName: 'Infosys Ltd',
        monthlyIncome: 120000,
        city: 'Ahmedabad',
        state: 'Gujarat',
        createdAt: '2026-10-22T09:15:00Z',
        status: 'active'
      },
      {
        id: 'FP_USER_104',
        name: 'Rajesh Kumar',
        phone: '+91 9988776655',
        email: 'rajesh.k@example.com',
        isVip: false,
        kycStatus: 'verified',
        walletBalance: 3200.00,
        cibilScore: 745,
        pan: 'XYXPR7761A',
        aadhaar: 'XXXX XXXX 4531',
        monthlyLimit: 100000.00,
        spentThisMonth: 8500.00,
        employmentType: 'Business Owner',
        companyName: 'RK Logistics & Traders',
        monthlyIncome: 175000,
        city: 'Delhi',
        state: 'Delhi',
        createdAt: '2026-10-24T11:00:00Z',
        status: 'active'
      },
      {
        id: 'FP_USER_SHIVAM',
        name: 'Shivam',
        phone: '+91 9990385942',
        email: 'shivam@flamepay.in',
        isVip: true,
        kycStatus: 'verified',
        walletBalance: 5.00, // Seeded with ₹5 to test the insufficient balance flow!
        cibilScore: 790,
        pan: 'SHIVM1234K',
        aadhaar: 'XXXX XXXX 9942',
        monthlyLimit: 200000.00,
        spentThisMonth: 0.00,
        employmentType: 'Business Owner',
        companyName: 'FlamePay Services',
        monthlyIncome: 150000,
        city: 'Delhi',
        state: 'Delhi',
        createdAt: '2026-10-28T00:00:00Z',
        status: 'active'
      }
    ];

    // Admin Bank Account & UPI Details for Adding Money / Deposits
    this.bankDetails = {
      accountNumber: '32823806111',
      ifsc: 'SBIN0013209',
      bankingName: 'SHIVAM SHIVAM',
      bankName: 'State Bank of India (SBI)',
      branch: 'Main Branch',
      upiId: '32823806111@sbi',
      accountType: 'Current / Savings Account',
      instructions: 'Transfer funds to the above SBI account or UPI ID. After transfer, submit the 12-digit UTR/Reference number below. Admin will verify and credit your FlamePay wallet instantly.'
    };

    // User Topup / Deposit Requests (Awaiting Admin Approval)
    this.topupRequests = [
      {
        id: 'TOPUP_1001',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        userPhone: '+91 9876543210',
        amount: 500,
        utrNumber: 'UTR492819283712',
        paymentMethod: 'SBI UPI (32823806111@sbi)',
        bankingName: 'SHIVAM SHIVAM',
        status: 'approved', // pending, approved, rejected
        adminNotes: 'Verified in SBI account on 28-Oct',
        createdAt: '2026-10-28T09:00:00Z',
        reviewedAt: '2026-10-28T09:15:00Z'
      }
    ];

    // Engine Settings (Supports Cyrus Sandbox / Test Mode for Free Development)
    this.settings = {
      cyrusTestMode: true, // Default to true so testing does not deduct real ₹67.67 Cyrus wallet!
      minWalletAddAmount: 10,
      maxWalletAddAmount: 50000,
      enforceWalletBalance: true
    };

    // LOAN LEADS & INQUIRIES (Personal, Home, Business, LAP)
    this.loanLeads = [
      {
        id: 'LN_LEAD_501',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        userPhone: '+91 9876543210',
        userEmail: 'rahul.sharma@example.com',
        loanType: 'Personal Loan', // Personal Loan, Home Loan, Business Loan, Loan Against Property
        requestedAmount: 500000,
        tenureMonths: 36,
        employmentType: 'Salaried',
        companyName: 'Tata Consultancy Services',
        monthlyIncome: 85000,
        cibilScore: 780,
        pan: 'ABCDE1234F',
        aadhaar: 'XXXX XXXX 9823',
        city: 'Mumbai',
        state: 'Maharashtra',
        source: 'App Screen Tap (Instant Lead)',
        status: 'interested', // interested, contacted, in_review, approved, rejected, disbursed
        adminNotes: 'User tapped on Personal Loan banner in app. CIBIL score is high (780). Suitable for pre-approved offer.',
        appliedAt: '2026-10-27T06:15:00Z'
      },
      {
        id: 'LN_LEAD_502',
        userId: 'FP_USER_104',
        userName: 'Rajesh Kumar',
        userPhone: '+91 9988776655',
        userEmail: 'rajesh.k@example.com',
        loanType: 'Business Loan',
        requestedAmount: 1500000,
        tenureMonths: 48,
        employmentType: 'Business Owner',
        companyName: 'RK Logistics & Traders',
        monthlyIncome: 175000,
        cibilScore: 745,
        pan: 'XYXPR7761A',
        aadhaar: 'XXXX XXXX 4531',
        city: 'Delhi',
        state: 'Delhi',
        source: 'App Form Submission',
        status: 'in_review',
        adminNotes: 'Requested 15 Lakhs for working capital expansion. GST returns requested.',
        appliedAt: '2026-10-26T18:40:00Z'
      },
      {
        id: 'LN_LEAD_503',
        userId: 'FP_USER_103',
        userName: 'Amit Patel',
        userPhone: '+91 9123456780',
        userEmail: 'amit.patel@example.com',
        loanType: 'Home Loan',
        requestedAmount: 4500000,
        tenureMonths: 240,
        employmentType: 'Salaried',
        companyName: 'Infosys Ltd',
        monthlyIncome: 120000,
        cibilScore: 810,
        pan: 'CDEFR4512P',
        aadhaar: 'XXXX XXXX 7781',
        city: 'Ahmedabad',
        state: 'Gujarat',
        source: 'EMI Calculator Interaction',
        status: 'contacted',
        adminNotes: 'Contacted via phone. Verified salary slips. Ready for sanction letter.',
        appliedAt: '2026-10-26T11:20:00Z'
      },
      {
        id: 'LN_LEAD_504',
        userId: 'FP_USER_102',
        userName: 'Pooja Verma',
        userPhone: '+91 9876543211',
        userEmail: 'pooja.verma@example.com',
        loanType: 'Loan Against Property',
        requestedAmount: 2500000,
        tenureMonths: 120,
        employmentType: 'Self-Employed',
        companyName: 'Verma Boutiques',
        monthlyIncome: 65000,
        cibilScore: 720,
        pan: 'BKMPV8921K',
        aadhaar: 'XXXX XXXX 1142',
        city: 'Noida',
        state: 'Uttar Pradesh',
        source: 'Services Grid Tap',
        status: 'interested',
        adminNotes: 'Customer clicked on Loan Against Property. Awaiting property valuation documents.',
        appliedAt: '2026-10-27T08:00:00Z'
      }
    ];

    // CREDIT CARD LEADS
    this.creditCardLeads = [
      {
        id: 'CC_LEAD_601',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        userPhone: '+91 9876543210',
        userEmail: 'rahul.sharma@example.com',
        cardName: 'HDFC Regalia Gold Credit Card',
        bankName: 'HDFC Bank',
        cardCategory: 'Travel & Rewards',
        monthlyIncome: 85000,
        cibilScore: 780,
        status: 'in_review',
        annualFee: '₹2,500',
        appliedAt: '2026-10-26T14:10:00Z'
      },
      {
        id: 'CC_LEAD_602',
        userId: 'FP_USER_103',
        userName: 'Amit Patel',
        userPhone: '+91 9123456780',
        userEmail: 'amit.patel@example.com',
        cardName: 'SBI SimplyCLICK Card',
        bankName: 'State Bank of India',
        cardCategory: 'Online Shopping & Cashback',
        monthlyIncome: 120000,
        cibilScore: 810,
        status: 'approved',
        annualFee: '₹499',
        appliedAt: '2026-10-25T16:30:00Z'
      },
      {
        id: 'CC_LEAD_603',
        userId: 'FP_USER_104',
        userName: 'Rajesh Kumar',
        userPhone: '+91 9988776655',
        userEmail: 'rajesh.k@example.com',
        cardName: 'ICICI Sapphiro Business Card',
        bankName: 'ICICI Bank',
        cardCategory: 'Corporate & Lounge Access',
        monthlyIncome: 175000,
        cibilScore: 745,
        status: 'interested',
        annualFee: '₹3,500',
        appliedAt: '2026-10-27T07:45:00Z'
      }
    ];

    // INSURANCE INQUIRIES & POLICIES (Health, Motor, Term Life, Travel)
    this.insuranceLeads = [
      {
        id: 'INS_LEAD_701',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        userPhone: '+91 9876543210',
        insuranceType: 'Health Insurance',
        sumInsured: '₹10,00,000 (Family Floater)',
        provider: 'Care Health Insurance',
        estimatedPremium: '₹14,500/year',
        status: 'contacted',
        appliedAt: '2026-10-26T15:20:00Z'
      },
      {
        id: 'INS_LEAD_702',
        userId: 'FP_USER_104',
        userName: 'Rajesh Kumar',
        userPhone: '+91 9988776655',
        insuranceType: 'Motor / Car Insurance',
        sumInsured: 'Comprehensive IDV: ₹8,50,000',
        vehicleNumber: 'DL 01 AB 9988',
        provider: 'HDFC ERGO',
        estimatedPremium: '₹9,850/year',
        status: 'interested',
        appliedAt: '2026-10-27T06:50:00Z'
      },
      {
        id: 'INS_LEAD_703',
        userId: 'FP_USER_103',
        userName: 'Amit Patel',
        userPhone: '+91 9123456780',
        insuranceType: 'Term Life Insurance',
        sumInsured: '₹1,00,00,000 (1 Crore Cover)',
        provider: 'Max Life Insurance',
        estimatedPremium: '₹8,200/year',
        status: 'in_review',
        appliedAt: '2026-10-25T11:45:00Z'
      }
    ];

    // CIBIL SCORE INQUIRIES
    this.cibilInquiries = [
      {
        id: 'CIBIL_REQ_801',
        userId: 'FP_USER_103',
        userName: 'Amit Patel',
        phone: '+91 9123456780',
        cibilScore: 810,
        rating: 'Excellent',
        activeCreditLines: 4,
        paymentHistory: '100% On-Time',
        checkedAt: '2026-10-26T10:00:00Z'
      },
      {
        id: 'CIBIL_REQ_802',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        phone: '+91 9876543210',
        cibilScore: 780,
        rating: 'Very Good',
        activeCreditLines: 3,
        paymentHistory: '98% On-Time',
        checkedAt: '2026-10-26T14:00:00Z'
      },
      {
        id: 'CIBIL_REQ_803',
        userId: 'FP_USER_104',
        userName: 'Rajesh Kumar',
        phone: '+91 9988776655',
        cibilScore: 745,
        rating: 'Good',
        activeCreditLines: 5,
        paymentHistory: '95% On-Time',
        checkedAt: '2026-10-27T07:30:00Z'
      },
      {
        id: 'CIBIL_REQ_804',
        userId: 'FP_USER_102',
        userName: 'Pooja Verma',
        phone: '+91 9876543211',
        cibilScore: 720,
        rating: 'Good',
        activeCreditLines: 2,
        paymentHistory: '92% On-Time',
        checkedAt: '2026-10-27T08:15:00Z'
      }
    ];

    // TRANSACTIONS LEDGER
    this.transactions = [
      {
        id: 'TXN1001',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        title: 'Jio 5G Unlimited Prepaid',
        subtitle: '+91 9876543210 • 28 Days',
        amount: 299.00,
        timestamp: '2026-10-26T14:32:00Z',
        status: 'success',
        category: 'recharge',
        operatorName: 'Jio',
        mobile: '+91 9876543210',
        paymentMode: 'FlamePay Wallet'
      },
      {
        id: 'TXN1002',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        title: 'Tata Power Mumbai Electricity',
        subtitle: 'Consumer ID: 100982341',
        amount: 1450.00,
        timestamp: '2026-10-25T11:20:00Z',
        status: 'success',
        category: 'electricity',
        operatorName: 'Tata Power',
        mobile: '+91 9876543210',
        paymentMode: 'FlamePay Wallet'
      },
      {
        id: 'TXN1003',
        userId: 'FP_USER_101',
        userName: 'Rahul Sharma',
        title: 'Send Money to Pooja Verma',
        subtitle: 'UPI: pooja@okhdfc',
        amount: 500.00,
        timestamp: '2026-10-24T18:45:00Z',
        status: 'success',
        category: 'transfer',
        operatorName: 'UPI Transfer',
        mobile: '+91 9876543211',
        paymentMode: 'FlamePay Wallet'
      },
      {
        id: 'TXN1004',
        userId: 'FP_USER_104',
        userName: 'Rajesh Kumar',
        title: 'Indraprastha Gas Bill',
        subtitle: 'BP Number: 4001923',
        amount: 890.00,
        timestamp: '2026-10-26T09:10:00Z',
        status: 'success',
        category: 'gas',
        operatorName: 'Indraprastha Gas Limited',
        mobile: '+91 9988776655',
        paymentMode: 'FlamePay Wallet'
      },
      {
        id: 'TXN1005',
        userId: 'FP_USER_103',
        userName: 'Amit Patel',
        title: 'Airtel Broadband Fiber 200 Mbps',
        subtitle: 'Account: 079-4091223',
        amount: 1179.00,
        timestamp: '2026-10-26T16:05:00Z',
        status: 'success',
        category: 'broadband',
        operatorName: 'Airtel Xstream Fiber',
        mobile: '+91 9123456780',
        paymentMode: 'FlamePay Wallet'
      }
    ];

    // KYC REQUESTS
    this.kycRequests = [
      {
        id: 'KYC_REQ_201',
        userId: 'FP_USER_102',
        userName: 'Pooja Verma',
        userPhone: '+91 9876543211',
        pan: 'BKMPV8921K',
        aadhaar: 'XXXX XXXX 1142',
        dob: '21/05/1998',
        address: 'B-12, Sector 62, Noida, Uttar Pradesh, 201301',
        annualIncome: '₹5,00,000 - ₹10,00,000',
        occupation: 'Self-Employed / Business',
        status: 'pending',
        submittedAt: '2026-10-25T16:40:00Z'
      }
    ];

    // RECHARGE OPERATORS & PLANS
    this.rechargeOperators = {
      mobile: [
        { id: 'jio', name: 'Reliance Jio', circle: 'All India', minAmount: 19 },
        { id: 'airtel', name: 'Bharti Airtel', circle: 'All India', minAmount: 19 },
        { id: 'vi', name: 'Vodafone Idea (Vi)', circle: 'All India', minAmount: 29 },
        { id: 'bsnl', name: 'BSNL Prepaid', circle: 'All India', minAmount: 18 }
      ],
      dth: [
        { id: 'tata_play', name: 'Tata Play', circle: 'All India', minAmount: 100 },
        { id: 'airtel_dth', name: 'Airtel Digital TV', circle: 'All India', minAmount: 100 },
        { id: 'dish_tv', name: 'Dish TV', circle: 'All India', minAmount: 50 },
        { id: 'sun_direct', name: 'Sun Direct', circle: 'South India', minAmount: 50 }
      ]
    };

    this.rechargePlans = [
      { id: 'p1', amount: 299, validity: '28 Days', data: '1.5 GB/Day', calls: 'Unlimited Calls', category: 'Popular' },
      { id: 'p2', amount: 349, validity: '28 Days', data: '2.0 GB/Day', calls: 'Unlimited Calls + True 5G', category: 'Hero 5G' },
      { id: 'p3', amount: 719, validity: '84 Days', data: '1.5 GB/Day', calls: 'Unlimited Calls', category: '3-Months' },
      { id: 'p4', amount: 2999, validity: '365 Days', data: '2.5 GB/Day', calls: 'Annual Super Saver', category: 'Annual' }
    ];

    this.billCategories = [
      { id: 'electricity', title: 'Electricity', icon: 'bolt', count: 58 },
      { id: 'water', title: 'Water', icon: 'water_drop', count: 32 },
      { id: 'gas', title: 'Piped Gas', icon: 'local_gas_station', count: 24 },
      { id: 'broadband', title: 'Broadband', icon: 'wifi', count: 40 },
      { id: 'dth', title: 'DTH Recharges', icon: 'tv', count: 6 }
    ];
  }

  getUser(idOrPhone) {
    if (!idOrPhone) return null;
    return this.users.find(u => u.id === idOrPhone || u.phone.includes(idOrPhone) || idOrPhone.includes(u.phone.replace(/[^0-9]/g, '')));
  }
}

module.exports = new Database();
