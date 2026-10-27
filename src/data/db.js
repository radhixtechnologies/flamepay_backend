// In-Memory Database with Seed Data for FlamePay
class Database {
  constructor() {
    this.admin = {
      username: 'admin',
      password: 'password123',
      name: 'Super Administrator',
      role: 'super_admin'
    };

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
        createdAt: '2026-10-20T12:30:00Z',
        status: 'active'
      },
      {
        id: 'FP_USER_103',
        name: 'Amit Sharma',
        phone: '+91 9123456780',
        email: 'amit.sharma@example.com',
        isVip: true,
        kycStatus: 'verified',
        walletBalance: 8400.00,
        cibilScore: 810,
        pan: 'CDEFR4512P',
        aadhaar: 'XXXX XXXX 7781',
        monthlyLimit: 200000.00,
        spentThisMonth: 12500.00,
        createdAt: '2026-10-22T09:15:00Z',
        status: 'active'
      }
    ];

    this.transactions = [
      {
        id: 'TXN1001',
        userId: 'FP_USER_101',
        title: 'Jio Prepaid',
        subtitle: '+91 9876543210 • 26 Oct 2026',
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
        title: 'Tata Power Electricity',
        subtitle: 'CA 100982341 • 25 Oct 2026',
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
        title: 'Send Money to Pooja Verma',
        subtitle: 'UPI: pooja@okhdfc • 24 Oct 2026',
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
        userId: 'FP_USER_101',
        title: 'Wallet Top-up',
        subtitle: 'Via Google Pay UPI • 23 Oct 2026',
        amount: 2000.00,
        timestamp: '2026-10-23T09:10:00Z',
        status: 'success',
        category: 'wallet_topup',
        operatorName: 'Google Pay UPI',
        mobile: '+91 9876543210',
        paymentMode: 'UPI'
      }
    ];

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
        occupation: 'Salaried Professional',
        status: 'pending', // 'pending', 'approved', 'rejected'
        submittedAt: '2026-10-25T16:40:00Z'
      }
    ];

    this.rechargeOperators = {
      mobile: [
        { id: 'jio', name: 'Jio', circle: 'Mumbai', minAmount: 19 },
        { id: 'airtel', name: 'Airtel', circle: 'Mumbai', minAmount: 19 },
        { id: 'vi', name: 'Vodafone Idea (Vi)', circle: 'Mumbai', minAmount: 29 },
        { id: 'bsnl', name: 'BSNL', circle: 'Maharashtra', minAmount: 18 }
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
      { id: 'p2', amount: 349, validity: '28 Days', data: '2.0 GB/Day', calls: 'Unlimited Calls + 5G', category: 'Hero Unlimited' },
      { id: 'p3', amount: 719, validity: '84 Days', data: '1.5 GB/Day', calls: 'Unlimited Calls', category: 'Validity' },
      { id: 'p4', amount: 2999, validity: '365 Days', data: '2.5 GB/Day', calls: 'Annual Super Saver', category: 'Annual' }
    ];

    this.billCategories = [
      { id: 'electricity', title: 'Electricity', icon: 'bolt', count: 48 },
      { id: 'water', title: 'Water', icon: 'water_drop', count: 24 },
      { id: 'gas', title: 'Piped Gas', icon: 'local_gas_station', count: 18 },
      { id: 'broadband', title: 'Broadband', icon: 'wifi', count: 32 }
    ];

    this.offers = [
      { id: 'off_1', title: 'Flat ₹50 Cashback on 1st Recharge', code: 'FLAME50', minAmount: 199, expiry: '31 Oct 2026' },
      { id: 'off_2', title: '10% Cashback on Electricity Bill', code: 'POWER10', minAmount: 500, expiry: '15 Nov 2026' },
      { id: 'off_3', title: 'Win ₹100 Scratch Card on Send Money', code: 'SEND100', minAmount: 200, expiry: '05 Nov 2026' }
    ];

    this.notifications = [
      { id: 'notif_1', title: 'Welcome to FlamePay!', message: 'Complete your KYC to unlock ₹2,00,000 monthly limit.', time: '2 hours ago', read: false },
      { id: 'notif_2', title: 'Cashback Credited', message: '₹50 cashback added to your FlamePay Wallet.', time: '1 day ago', read: true }
    ];
  }

  getUser(idOrPhone) {
    return this.users.find(u => u.id === idOrPhone || u.phone.includes(idOrPhone));
  }
}

module.exports = new Database();
