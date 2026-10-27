# FlamePay Backend & Admin Portal 🚀

FlamePay super-app ka complete REST API backend server aur interactive web-based Admin Dashboard.

## 📁 Directory:
`C:\flutter projects\flamepay_backend`

## 🌐 URLs:
- **Admin Control Portal**: http://localhost:4000/admin
- **API Base URL**: http://localhost:4000/api/v1

---

## 🔑 Admin Credentials:
- **Username**: `admin`
- **Password**: `password123`

---

## ⚡ Features:
1. **Interactive Admin Dashboard**:
   - Total Transaction Volume & Counts (Live metrics)
   - Active Users & Wallet Balances
   - Real-time Tier-2 KYC Approval/Rejection System
   - Live Transactions Ledger
   - Credit Wallet / Add Funds action per user
2. **Flutter App REST APIs**:
   - `POST /api/v1/auth/send-otp`
   - `POST /api/v1/auth/verify-otp`
   - `POST /api/v1/auth/register`
   - `GET /api/v1/user/profile`
   - `POST /api/v1/user/profile/update`
   - `POST /api/v1/user/kyc-submit`
   - `GET /api/v1/wallet/balance`
   - `POST /api/v1/wallet/add-money`
   - `POST /api/v1/wallet/transfer` (Send Money via Mobile / UPI)
   - `GET /api/v1/recharge/operators`
   - `POST /api/v1/recharge/pay`

---

## 🚀 How to Run:
```bash
cd "C:\flutter projects\flamepay_backend"
npm install
npm start
```
