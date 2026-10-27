// FlamePay Enterprise Admin Portal & Real-Time Financial Leads Engine
const API_BASE = '/api/v1';

let currentTab = 'overview';
let cachedLoans = [];
let cachedCards = [];
let cachedInsurance = [];
let cachedCibil = [];
let cachedUsers = [];
let cachedKyc = [];
let cachedTxns = [];
let selectedLoanId = null;
let currentLoanFilter = 'all';

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupNavigation();
  loadAllData();
});

// Authentication Handling
function initAuth() {
  const token = localStorage.getItem('fp_admin_token');
  const loginModal = document.getElementById('login-modal');
  if (!token) {
    if (loginModal) loginModal.style.display = 'flex';
  } else {
    if (loginModal) loginModal.style.display = 'none';
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;

      try {
        const res = await fetch(`${API_BASE}/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('fp_admin_token', data.token);
          loginModal.style.display = 'none';
          showToast('Welcome back, Super Admin!');
          loadAllData();
        } else {
          alert(data.message || 'Login failed');
        }
      } catch (err) {
        alert('Error connecting to backend: ' + err.message);
      }
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('fp_admin_token');
      if (loginModal) loginModal.style.display = 'flex';
    });
  }
}

// Navigation Tabs
function setupNavigation() {
  const buttons = document.querySelectorAll('.nav-item');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;

  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });

  // Update Topbar Title
  const titles = {
    overview: 'Operations & Leads Overview',
    loans: 'Loan Leads & Customer Inquiries',
    'credit-cards': 'Credit Card Applications',
    insurance: 'Buy Insurance Leads',
    cibil: 'CIBIL Score Credit Health',
    recharges: 'Recharges & Utility Bills',
    users: 'Customers & Wallet Balances',
    kyc: 'Tier-2 KYC Verifications',
    transactions: 'Live Financial Ledger',
    apis: 'REST API Endpoints'
  };
  const desc = {
    loans: 'Real-time inquiries captured when customers tap on Loan in FlamePay',
    'credit-cards': 'HDFC, SBI, ICICI card applications & income analytics',
    insurance: 'Health, Motor, Life insurance quotes & policy requests',
    cibil: 'Credit scores, repayment discipline & creditworthiness',
    overview: 'Real-time metrics, financial product leads, and user verifications'
  };

  const titleEl = document.getElementById('page-title');
  const descEl = document.getElementById('page-desc');
  if (titleEl) titleEl.innerText = titles[tabId] || 'Admin Console';
  if (descEl) descEl.innerText = desc[tabId] || 'FlamePay Enterprise Control Portal';

  // Load specific tab data
  if (tabId === 'loans') renderLoansTable();
  if (tabId === 'credit-cards') fetchCreditCards();
  if (tabId === 'insurance') fetchInsurance();
  if (tabId === 'cibil') fetchCibil();
  if (tabId === 'recharges') fetchRecharges();
  if (tabId === 'users') fetchUsers();
  if (tabId === 'kyc') fetchKycRequests();
  if (tabId === 'transactions') fetchTransactions();
}

function refreshCurrentTab() {
  loadAllData();
  showToast('Dashboard refreshed with live data');
}

// Load All Data Engine
async function loadAllData() {
  fetchStats();
  fetchLoans();
  fetchCreditCards();
  fetchInsurance();
  fetchCibil();
  fetchUsers();
  fetchKycRequests();
  fetchTransactions();
}

// 1. STATS
async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/admin/stats`);
    const json = await res.json();
    if (!json.success) return;
    const d = json.data;

    // Overview numbers
    const loansEl = document.getElementById('stat-loans');
    const loanVolEl = document.getElementById('stat-loan-volume');
    const cardsEl = document.getElementById('stat-cards');
    const insEl = document.getElementById('stat-insurance');
    const volEl = document.getElementById('stat-volume');
    const txnsEl = document.getElementById('stat-txns');

    if (loansEl) loansEl.innerText = d.totalLoans || 0;
    if (loanVolEl) loanVolEl.innerText = `₹${formatNumber(d.totalLoanRequested || 0)} Requested`;
    if (cardsEl) cardsEl.innerText = d.totalCreditCards || 0;
    if (insEl) insEl.innerText = d.totalInsurance || 0;
    if (volEl) volEl.innerText = `₹${formatNumber(d.totalVolume || 0)}`;
    if (txnsEl) txnsEl.innerText = `${d.totalTxnCount || 0} Transactions`;

    // Badges in sidebar
    const loansBadge = document.getElementById('loans-badge');
    const cardsBadge = document.getElementById('cards-badge');
    const insBadge = document.getElementById('insurance-badge');
    const kycBadge = document.getElementById('kyc-badge');

    if (loansBadge) loansBadge.innerText = d.pendingLoans || d.totalLoans || 0;
    if (cardsBadge) cardsBadge.innerText = d.totalCreditCards || 0;
    if (insBadge) insBadge.innerText = d.totalInsurance || 0;
    if (kycBadge) kycBadge.innerText = d.pendingKyc || 0;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

// 2. LOANS MODULE
async function fetchLoans() {
  try {
    const res = await fetch(`${API_BASE}/admin/loans`);
    const json = await res.json();
    if (json.success) {
      cachedLoans = json.data;
      renderLoansTable();
      renderOverviewLoans();
    }
  } catch (e) {
    console.error('Loans error:', e);
  }
}

function filterLoansByType(type) {
  currentLoanFilter = type;
  document.querySelectorAll('#loan-type-filters .pill').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase().includes(type.toLowerCase()) || (type === 'all' && btn.innerText === 'All Loans'));
  });
  renderLoansTable();
}

function filterLoansTable() {
  renderLoansTable();
}

function renderLoansTable() {
  const tbody = document.getElementById('loans-tbody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('loan-search-input')?.value || '').toLowerCase();
  let list = [...cachedLoans];

  if (currentLoanFilter !== 'all') {
    list = list.filter(l => l.loanType.toLowerCase() === currentLoanFilter.toLowerCase());
  }

  if (searchQuery) {
    list = list.filter(l => 
      l.userName.toLowerCase().includes(searchQuery) ||
      l.userPhone.includes(searchQuery) ||
      (l.city && l.city.toLowerCase().includes(searchQuery)) ||
      l.loanType.toLowerCase().includes(searchQuery)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-state">No loan inquiries found matching criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(l => {
    const cibilClass = l.cibilScore >= 750 ? 'cibil-excellent' : (l.cibilScore >= 700 ? 'cibil-good' : 'cibil-average');
    const statusBadge = getStatusBadge(l.status);
    const dateFormatted = formatTimestamp(l.appliedAt);

    return `
      <tr>
        <td>
          <b>${l.id}</b>
          <div style="font-size:11px; color:#64748b;">${dateFormatted}</div>
        </td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${l.userName}</div>
          <div style="font-size:12px; color:#475569;"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${l.userPhone}</div>
          <div style="font-size:11px; color:#94a3b8;">${l.city || 'Mumbai'}, ${l.state || 'MH'}</div>
        </td>
        <td>
          <span class="badge badge-primary font-bold">${l.loanType}</span>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">${l.source || 'App Tap'}</div>
        </td>
        <td>
          <div style="font-weight:800; font-size:14px; color:#10B981;">₹${formatNumber(l.requestedAmount)}</div>
          <div style="font-size:11px; color:#64748b;">${l.tenureMonths || 36} Months EMI</div>
        </td>
        <td>
          <div style="font-weight:600;">${l.employmentType || 'Salaried'}</div>
          <div style="font-size:11px; color:#475569;">₹${formatNumber(l.monthlyIncome || 60000)}/mo</div>
        </td>
        <td>
          <span class="cibil-pill ${cibilClass}">
            <i class="fa-solid fa-gauge-high"></i> ${l.cibilScore || 750}
          </span>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-outline btn-sm" onclick="openLoanModal('${l.id}')">
              <i class="fa-solid fa-eye"></i> View Profile
            </button>
            <a href="https://wa.me/${cleanPhone(l.userPhone)}" target="_blank" class="btn btn-wa btn-sm" title="WhatsApp Customer">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOverviewLoans() {
  const tbody = document.getElementById('overview-loans-tbody');
  if (!tbody) return;

  const topLoans = cachedLoans.slice(0, 4);
  if (topLoans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-state">No recent loan leads.</td></tr>`;
    return;
  }

  tbody.innerHTML = topLoans.map(l => `
    <tr>
      <td>
        <div style="font-weight:700;">${l.userName}</div>
        <div style="font-size:11px; color:#64748b;">${l.userPhone}</div>
      </td>
      <td><span class="badge badge-primary">${l.loanType}</span></td>
      <td style="font-weight:700; color:#10B981;">₹${formatNumber(l.requestedAmount)}</td>
      <td><span class="cibil-pill cibil-excellent">${l.cibilScore || 780}</span></td>
      <td>${getStatusBadge(l.status)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openLoanModal('${l.id}')">Details</button>
      </td>
    </tr>
  `).join('');
}

// 3. LOAN LEAD MODAL INSPECTION & ACTIONS
function openLoanModal(leadId) {
  const lead = cachedLoans.find(l => l.id === leadId);
  if (!lead) return;
  selectedLoanId = leadId;

  document.getElementById('modal-lead-id').innerText = lead.id;
  document.getElementById('modal-lead-title').innerText = `${lead.loanType} Application — ${lead.userName}`;
  document.getElementById('modal-lead-timestamp').innerText = `Received: ${formatTimestamp(lead.appliedAt)}`;
  
  // Avatar initials
  const initials = lead.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('modal-customer-avatar').innerText = initials;
  document.getElementById('modal-customer-name').innerText = lead.userName;
  document.getElementById('modal-customer-contact').innerHTML = `
    <i class="fa-solid fa-phone"></i> ${lead.userPhone} &nbsp;•&nbsp; 
    <i class="fa-solid fa-envelope"></i> ${lead.userEmail || 'N/A'}
  `;
  document.getElementById('modal-customer-location').innerHTML = `
    <i class="fa-solid fa-location-dot"></i> ${lead.city || 'Mumbai'}, ${lead.state || 'Maharashtra'}
  `;
  document.getElementById('modal-customer-source').innerHTML = `
    <i class="fa-solid fa-mobile-screen"></i> ${lead.source || 'App Screen Tap (Instant Lead)'}
  `;

  // Quick Action Buttons
  const cleanNum = cleanPhone(lead.userPhone);
  document.getElementById('modal-call-btn').href = `tel:${lead.userPhone}`;
  document.getElementById('modal-wa-btn').href = `https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(lead.userName)},%20we%20received%20your%20inquiry%20for%20${encodeURIComponent(lead.loanType)}%20on%20FlamePay.`;

  // Request specifics
  document.getElementById('modal-loan-type').innerText = lead.loanType;
  document.getElementById('modal-loan-amount').innerText = `₹${formatNumber(lead.requestedAmount)}`;
  document.getElementById('modal-loan-tenure').innerText = `${lead.tenureMonths || 36} Months (${((lead.tenureMonths || 36)/12).toFixed(1)} Yrs)`;
  
  // Calculate approximate EMI (e.g. 11% interest)
  const amt = lead.requestedAmount || 500000;
  const tenure = lead.tenureMonths || 36;
  const r = 10.5 / 1200;
  const emi = Math.round((amt * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));
  document.getElementById('modal-loan-emi').innerText = `₹${formatNumber(emi)}/month approx @ 10.5% p.a.`;

  // Financials
  document.getElementById('modal-employment-type').innerText = lead.employmentType || 'Salaried';
  document.getElementById('modal-company-name').innerText = lead.companyName || 'Not Specified';
  document.getElementById('modal-monthly-income').innerText = `₹${formatNumber(lead.monthlyIncome || 75000)} / month`;
  document.getElementById('modal-annual-income').innerText = `₹${formatNumber((lead.monthlyIncome || 75000) * 12)}`;

  // CIBIL & KYC
  const cibilText = lead.cibilScore >= 750 ? `${lead.cibilScore} (Excellent - High Approval Chance)` : `${lead.cibilScore} (Good)`;
  document.getElementById('modal-cibil-score').innerText = cibilText;
  document.getElementById('modal-pan').innerText = lead.pan || 'ABCDE1234F';
  document.getElementById('modal-aadhaar').innerText = lead.aadhaar || 'XXXX XXXX 9823';
  document.getElementById('modal-kyc-status').innerHTML = `<span class="badge badge-success">Verified</span>`;

  // Status & Notes
  document.getElementById('modal-status-select').value = lead.status || 'interested';
  document.getElementById('modal-notes-input').value = lead.adminNotes || '';

  // Show Modal
  document.getElementById('loan-details-modal').style.display = 'flex';
}

function closeLoanModal() {
  document.getElementById('loan-details-modal').style.display = 'none';
  selectedLoanId = null;
}

async function saveLoanModalStatus() {
  if (!selectedLoanId) return;
  const newStatus = document.getElementById('modal-status-select').value;
  try {
    const res = await fetch(`${API_BASE}/admin/loans/${selectedLoanId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Lead status updated to: ${newStatus}`);
      fetchLoans();
      fetchStats();
      closeLoanModal();
    }
  } catch (e) {
    alert('Error updating status: ' + e.message);
  }
}

async function saveLoanModalNotes() {
  if (!selectedLoanId) return;
  const notes = document.getElementById('modal-notes-input').value;
  try {
    const res = await fetch(`${API_BASE}/admin/loans/${selectedLoanId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Follow-up notes saved successfully!');
      fetchLoans();
    }
  } catch (e) {
    alert('Error saving notes: ' + e.message);
  }
}

// 4. SIMULATE REAL-TIME USER LOAN TAP
async function simulateUserLoanTap() {
  try {
    const res = await fetch(`${API_BASE}/admin/loans/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (json.success) {
      showToast(`⚡ New Lead Captured! ${json.data.userName} tapped on ${json.data.loanType}`);
      fetchLoans();
      fetchStats();
      // If currently on loans tab, highlight
      if (currentTab !== 'loans') {
        switchTab('loans');
      }
    }
  } catch (e) {
    alert('Error simulating lead: ' + e.message);
  }
}

// 5. CREDIT CARDS MODULE
async function fetchCreditCards() {
  try {
    const res = await fetch(`${API_BASE}/admin/credit-cards`);
    const json = await res.json();
    if (!json.success) return;
    cachedCards = json.data;
    const tbody = document.getElementById('cards-tbody');
    if (!tbody) return;

    tbody.innerHTML = cachedCards.map(c => `
      <tr>
        <td><b>${c.id}</b></td>
        <td>
          <div style="font-weight:700;">${c.userName}</div>
          <div style="font-size:11px; color:#64748b;">Applicant</div>
        </td>
        <td>
          <div>${c.userPhone}</div>
          <div style="font-size:11px; color:#94a3b8;">${c.userEmail || ''}</div>
        </td>
        <td>
          <div style="font-weight:700; color:#0D6EFD;">${c.cardName}</div>
          <div style="font-size:11px; color:#64748b;">${c.bankName} • Fee: ${c.annualFee}</div>
        </td>
        <td>₹${formatNumber(c.monthlyIncome)}/mo</td>
        <td><span class="cibil-pill cibil-excellent">${c.cibilScore}</span></td>
        <td>${getStatusBadge(c.status)}</td>
        <td>
          <a href="https://wa.me/${cleanPhone(c.userPhone)}" target="_blank" class="btn btn-wa btn-sm">
            <i class="fa-brands fa-whatsapp"></i> Chat
          </a>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Credit cards error:', e);
  }
}

// 6. INSURANCE MODULE
async function fetchInsurance() {
  try {
    const res = await fetch(`${API_BASE}/admin/insurance`);
    const json = await res.json();
    if (!json.success) return;
    cachedInsurance = json.data;
    const tbody = document.getElementById('insurance-tbody');
    if (!tbody) return;

    tbody.innerHTML = cachedInsurance.map(ins => `
      <tr>
        <td><b>${ins.id}</b></td>
        <td style="font-weight:700;">${ins.userName}</td>
        <td>${ins.userPhone}</td>
        <td><span class="badge badge-purple">${ins.insuranceType}</span></td>
        <td>
          <div style="font-weight:600;">${ins.sumInsured}</div>
          ${ins.vehicleNumber ? `<div style="font-size:11px; color:#94a3b8;">Vehicle: ${ins.vehicleNumber}</div>` : ''}
        </td>
        <td>
          <div>${ins.provider}</div>
          <div style="font-size:11px; color:#10B981;">${ins.estimatedPremium}</div>
        </td>
        <td>${getStatusBadge(ins.status)}</td>
        <td>
          <a href="https://wa.me/${cleanPhone(ins.userPhone)}" target="_blank" class="btn btn-wa btn-sm">
            <i class="fa-brands fa-whatsapp"></i> Quote
          </a>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Insurance error:', e);
  }
}

// 7. CIBIL INQUIRIES MODULE
async function fetchCibil() {
  try {
    const res = await fetch(`${API_BASE}/admin/cibil-inquiries`);
    const json = await res.json();
    if (!json.success) return;
    cachedCibil = json.data;
    const tbody = document.getElementById('cibil-tbody');
    if (!tbody) return;

    tbody.innerHTML = cachedCibil.map(cb => `
      <tr>
        <td><b>${cb.userId}</b></td>
        <td style="font-weight:700;">${cb.userName}</td>
        <td>${cb.phone}</td>
        <td>
          <span class="cibil-pill cibil-excellent" style="font-size:13px;">
            <i class="fa-solid fa-gauge-high"></i> ${cb.cibilScore}
          </span>
        </td>
        <td><span class="badge badge-success">${cb.rating}</span></td>
        <td>${cb.activeCreditLines} Active Lines</td>
        <td style="color:#10B981; font-weight:700;">${cb.paymentHistory}</td>
        <td style="font-size:12px; color:#64748b;">${formatTimestamp(cb.checkedAt)}</td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('CIBIL error:', e);
  }
}

// 8. RECHARGES & BILLS MODULE
async function fetchRecharges() {
  try {
    const res = await fetch(`${API_BASE}/admin/transactions`);
    const json = await res.json();
    if (!json.success) return;
    const billsAndRecharges = json.data.filter(t => t.category === 'recharge' || t.category === 'electricity' || t.category === 'gas' || t.category === 'broadband');
    const tbody = document.getElementById('recharges-tbody');
    if (!tbody) return;

    tbody.innerHTML = billsAndRecharges.map(r => `
      <tr>
        <td><b>${r.id}</b></td>
        <td style="font-weight:700;">${r.userName || r.userId}</td>
        <td><span class="badge badge-info">${r.category}</span></td>
        <td>${r.operatorName || 'Utility Provider'}</td>
        <td>${r.mobile || r.subtitle}</td>
        <td style="font-weight:800; color:#10B981;">₹${formatNumber(r.amount)}</td>
        <td>${r.paymentMode}</td>
        <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> ${r.status}</span></td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Recharges error:', e);
  }
}

// 9. USERS & WALLETS
async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/users`);
    const json = await res.json();
    if (!json.success) return;
    cachedUsers = json.data;
    renderUsersTable();
  } catch (e) {
    console.error('Users error:', e);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const q = (document.getElementById('user-search-input')?.value || '').toLowerCase();

  const filtered = cachedUsers.filter(u => 
    u.name.toLowerCase().includes(q) ||
    u.phone.includes(q) ||
    u.email.toLowerCase().includes(q)
  );

  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td><b>${u.id}</b></td>
      <td>
        <div style="font-weight:700;">${u.name}</div>
        <div style="font-size:11px; color:#64748b;">${u.email}</div>
      </td>
      <td>${u.phone}</td>
      <td style="font-weight:800; color:#0D6EFD;">₹${formatNumber(u.walletBalance)}</td>
      <td>
        <span class="badge ${u.kycStatus === 'verified' ? 'badge-success' : 'badge-warning'}">
          ${u.kycStatus}
        </span>
      </td>
      <td><span class="cibil-pill cibil-excellent">${u.cibilScore || 750}</span></td>
      <td>
        <span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status}</span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="creditWalletPrompt('${u.id}', '${u.name}')">
          <i class="fa-solid fa-plus"></i> Add Money
        </button>
      </td>
    </tr>
  `).join('');
}

function filterUsersTable() {
  renderUsersTable();
}

async function creditWalletPrompt(userId, name) {
  const amountStr = prompt(`Enter amount to credit into ${name}'s FlamePay Wallet (₹):`, '500');
  if (!amountStr) return;
  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) return alert('Invalid amount');

  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`₹${amount} added to ${name}'s wallet!`);
      fetchUsers();
    }
  } catch (e) {
    alert('Error adding funds: ' + e.message);
  }
}

// 10. KYC MANAGEMENT
async function fetchKycRequests() {
  try {
    const res = await fetch(`${API_BASE}/admin/kyc-requests`);
    const json = await res.json();
    if (!json.success) return;
    cachedKyc = json.data;

    // Overview list
    const overviewList = document.getElementById('overview-pending-kyc');
    const pendingList = cachedKyc.filter(k => k.status === 'pending');
    if (overviewList) {
      if (pendingList.length === 0) {
        overviewList.innerHTML = `<p style="padding:16px; color:#10B981; text-align:center;">All KYC submissions are verified! 👍</p>`;
      } else {
        overviewList.innerHTML = pendingList.map(k => `
          <div style="padding:12px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700;">${k.userName}</div>
              <div style="font-size:11px; color:#64748b;">PAN: ${k.pan}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="switchTab('kyc')">Inspect</button>
          </div>
        `).join('');
      }
    }

    // Full tab list
    const fullList = document.getElementById('kyc-full-list');
    if (fullList) {
      if (cachedKyc.length === 0) {
        fullList.innerHTML = `<p class="loading-state">No KYC submissions found.</p>`;
        return;
      }

      fullList.innerHTML = cachedKyc.map(k => `
        <div class="panel" style="margin-bottom:16px;">
          <div class="panel-header">
            <div>
              <h3>${k.userName} (${k.userPhone})</h3>
              <p>Submitted: ${formatTimestamp(k.submittedAt)}</p>
            </div>
            <div>${getStatusBadge(k.status)}</div>
          </div>
          <div style="padding:18px;">
            <div class="modal-info-grid">
              <div class="info-box">
                <span class="info-lbl">PAN Card</span>
                <span class="info-val font-bold">${k.pan}</span>
              </div>
              <div class="info-box">
                <span class="info-lbl">Aadhaar (Masked)</span>
                <span class="info-val font-bold">${k.aadhaar}</span>
              </div>
              <div class="info-box">
                <span class="info-lbl">Occupation & Income</span>
                <span class="info-val">${k.occupation} (${k.annualIncome})</span>
              </div>
            </div>
            <div style="margin-top:12px; font-size:13px; color:#475569;">
              <b>Residential Address:</b> ${k.address}
            </div>
            ${k.status === 'pending' ? `
              <div style="margin-top:16px; display:flex; gap:10px;">
                <button class="btn btn-success" onclick="actionKyc('${k.id}', 'approve')"><i class="fa-solid fa-check"></i> Approve & Upgrade to Tier-2</button>
                <button class="btn btn-outline" style="color:#ef4444; border-color:#ef4444;" onclick="actionKyc('${k.id}', 'reject')"><i class="fa-solid fa-xmark"></i> Reject Submission</button>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error('KYC error:', e);
  }
}

async function actionKyc(id, action) {
  try {
    const res = await fetch(`${API_BASE}/admin/kyc-requests/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`KYC submission ${action}d successfully`);
      fetchKycRequests();
      fetchUsers();
      fetchStats();
    }
  } catch (e) {
    alert('Error processing KYC: ' + e.message);
  }
}

// 11. TRANSACTIONS
async function fetchTransactions() {
  try {
    const res = await fetch(`${API_BASE}/admin/transactions`);
    const json = await res.json();
    if (!json.success) return;
    cachedTxns = json.data;
    const tbody = document.getElementById('txns-tbody');
    if (!tbody) return;

    tbody.innerHTML = cachedTxns.map(t => `
      <tr>
        <td><b>${t.id}</b></td>
        <td style="font-size:12px; color:#64748b;">${formatTimestamp(t.timestamp)}</td>
        <td>
          <div style="font-weight:700;">${t.title}</div>
          <div style="font-size:11px; color:#94a3b8;">${t.subtitle || ''}</div>
        </td>
        <td><span class="badge badge-secondary">${t.category}</span></td>
        <td>${t.paymentMode || 'Wallet'}</td>
        <td style="font-weight:800; color:#10B981;">₹${formatNumber(t.amount)}</td>
        <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> ${t.status}</span></td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Txns error:', e);
  }
}

// Helpers
function getStatusBadge(status) {
  const map = {
    interested: '<span class="badge badge-gold"><i class="fa-solid fa-bell"></i> Interested (New Tap)</span>',
    contacted: '<span class="badge badge-info"><i class="fa-solid fa-phone"></i> Contacted</span>',
    in_review: '<span class="badge badge-purple"><i class="fa-solid fa-file-lines"></i> In Review</span>',
    approved: '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Approved</span>',
    disbursed: '<span class="badge badge-success"><i class="fa-solid fa-money-bill-wave"></i> Disbursed</span>',
    rejected: '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Rejected</span>',
    pending: '<span class="badge badge-warning">Pending Review</span>'
  };
  return map[status] || `<span class="badge badge-secondary">${status}</span>`;
}

function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-IN');
}

function cleanPhone(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

function formatTimestamp(isoStr) {
  if (!isoStr) return 'Recent';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="fa-solid fa-circle-check" style="color:#10B981;"></i> <span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.remove();
  }, 4000);
}
