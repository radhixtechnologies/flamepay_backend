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
let cachedOffers = [];
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
    topups: 'Wallet Deposit Requests (SBI Bank / UPI)',
    recharges: 'Recharges & Utility Bills',
    users: 'Customers & Wallet Balances',
    kyc: 'Tier-2 KYC Verifications',
    transactions: 'Live Financial Ledger',
    offers: 'Offers & Rewards Manager',
    contacts: 'Customer Contact & Support Inquiries',
    apis: 'REST API Endpoints'
  };
  const desc = {
    loans: 'Real-time inquiries captured when customers tap on Loan in FlamePay',
    'credit-cards': 'HDFC, SBI, ICICI card applications & income analytics',
    insurance: 'Health, Motor, Life insurance quotes & policy requests',
    cibil: 'Credit scores, repayment discipline & creditworthiness',
    topups: 'Verify payments sent to SHIVAM SHIVAM (SBI: 32823806111) and approve wallet credit',
    offers: 'Create, edit, pause or delete cashback offers & coupon codes displayed in the mobile app',
    contacts: 'Inquiries, questions, and support tickets submitted by visitors on flamepay.in',
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
  if (tabId === 'topups') fetchTopups();
  if (tabId === 'recharges') fetchRecharges();
  if (tabId === 'users') fetchUsers();
  if (tabId === 'kyc') fetchKycRequests();
  if (tabId === 'transactions') fetchTransactions();
  if (tabId === 'offers') fetchOffers();
  if (tabId === 'contacts') fetchContacts();
}

function refreshCurrentTab() {
  loadAllData();
  showToast('Dashboard refreshed with live data');
}

// Load All Data Engine
async function loadAllData() {
  fetchStats();
  checkSystemSettings();
  fetchTopups();
  fetchLoans();
  fetchCreditCards();
  fetchInsurance();
  fetchCibil();
  fetchUsers();
  fetchKycRequests();
  fetchTransactions();
  fetchOffers();
  fetchContacts();
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

    const contactsEl = document.getElementById('stat-contacts');
    const contactsOpenEl = document.getElementById('stat-contacts-open');
    if (contactsEl) contactsEl.innerText = d.totalContacts || 0;
    if (contactsOpenEl) contactsOpenEl.innerText = `${d.openContacts || 0} Open`;

    // Badges in sidebar
    const loansBadge = document.getElementById('loans-badge');
    const cardsBadge = document.getElementById('cards-badge');
    const insBadge = document.getElementById('insurance-badge');
    const kycBadge = document.getElementById('kyc-badge');
    const contactsBadge = document.getElementById('contacts-badge');

    if (loansBadge) loansBadge.innerText = d.pendingLoans || d.totalLoans || 0;
    if (cardsBadge) cardsBadge.innerText = d.totalCreditCards || 0;
    if (insBadge) insBadge.innerText = d.totalInsurance || 0;
    if (kycBadge) kycBadge.innerText = d.pendingKyc || 0;
    if (contactsBadge) contactsBadge.innerText = d.openContacts || d.totalContacts || 0;
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

      fullList.innerHTML = cachedKyc.map(k => {
        const docs = k.documents || {};
        const docKeys = [
          { key: 'aadhaarFront', label: 'Aadhaar Card (Front)', icon: 'fa-id-card' },
          { key: 'aadhaarBack', label: 'Aadhaar Card (Back)', icon: 'fa-id-card' },
          { key: 'panCard', label: 'PAN Card (Front)', icon: 'fa-address-card' },
          { key: 'selfie', label: 'Live Facial Selfie', icon: 'fa-camera' }
        ];

        const docCardsHtml = docKeys.map(dk => {
          const item = docs[dk.key];
          if (!item) {
            return `
              <div class="kyc-doc-card">
                <div class="kyc-doc-card-title"><i class="fa-solid ${dk.icon} text-slate-400"></i> ${dk.label}</div>
                <div style="height:140px; background:#f1f5f9; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; font-size:12px; border:1px dashed #cbd5e1;">
                  <i class="fa-regular fa-image" style="font-size:24px; margin-bottom:6px;"></i>
                  <span>Not Uploaded</span>
                </div>
              </div>
            `;
          }

          let imgSrc = '';
          let fileName = 'document.jpg';
          let fileSize = '';

          if (typeof item === 'string') {
            if (item.startsWith('data:image/') || item.startsWith('http') || item.startsWith('/')) {
              imgSrc = item;
            } else {
              imgSrc = `/uploads/kyc/${item}`;
              fileName = item;
            }
          } else if (typeof item === 'object') {
            imgSrc = item.url || item.dataUrl || (item.name && item.name.startsWith('/') ? item.name : `/uploads/kyc/${item.name}`);
            fileName = item.name || `${dk.key}.jpg`;
            if (item.size) {
              fileSize = `(${(item.size / 1024).toFixed(1)} KB)`;
            }
          }

          const safeImgSrc = imgSrc.replace(/'/g, "\\'");
          const safeLabel = dk.label.replace(/'/g, "\\'");
          const safeUserName = (k.userName || 'Applicant').replace(/'/g, "\\'");

          return `
            <div class="kyc-doc-card">
              <div class="kyc-doc-card-title">
                <i class="fa-solid ${dk.icon} text-blue"></i> ${dk.label}
              </div>
              <div class="kyc-thumb-container" onclick="openKycDocModal('${safeImgSrc}', '${safeLabel}', '${safeUserName}', '${fileName} ${fileSize}')">
                <img src="${imgSrc}" class="kyc-thumb-img" alt="${dk.label}" onerror="this.onerror=null; this.src='/assets/flamepay_icon.png'">
                <div class="kyc-thumb-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i> View Original</div>
              </div>
              <div class="kyc-doc-card-meta">
                <span style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${fileName}">${fileName} ${fileSize}</span>
                <button class="btn btn-outline btn-xs" onclick="openKycDocModal('${safeImgSrc}', '${safeLabel}', '${safeUserName}', '${fileName} ${fileSize}')">
                  <i class="fa-solid fa-eye"></i> View
                </button>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="panel" style="margin-bottom:20px; border-radius:16px;">
            <div class="panel-header" style="background:#f8fafc; border-bottom:1px solid #e2e8f0; border-radius:16px 16px 0 0; padding:16px 20px;">
              <div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <h3 style="font-size:17px; font-weight:800; margin:0;">${k.userName}</h3>
                  <span class="badge badge-purple" style="font-size:11px;">${k.id}</span>
                </div>
                <p style="margin:4px 0 0; font-size:12px; color:#64748b;">
                  <i class="fa-solid fa-phone"></i> ${k.userPhone} &nbsp;•&nbsp; 
                  <i class="fa-regular fa-clock"></i> Submitted: ${formatTimestamp(k.submittedAt)}
                </p>
              </div>
              <div>${getStatusBadge(k.status)}</div>
            </div>

            <div style="padding:20px;">
              <!-- 3-Column Identity Grid -->
              <div class="modal-info-grid">
                <div class="info-box">
                  <span class="info-lbl">PAN Card Number</span>
                  <span class="info-val font-bold font-mono" style="color:#0f172a; font-size:14px;">${k.pan || 'N/A'}</span>
                </div>
                <div class="info-box">
                  <span class="info-lbl">Aadhaar (UIDAI Verified)</span>
                  <span class="info-val font-bold font-mono" style="color:#0f172a; font-size:14px;">${k.aadhaar || 'N/A'}</span>
                </div>
                <div class="info-box">
                  <span class="info-lbl">DOB & Occupation</span>
                  <span class="info-val">${k.dob ? `DOB: ${k.dob}` : ''} • ${k.occupation || 'Professional'} (${k.annualIncome || 'Above 5L'})</span>
                </div>
              </div>

              ${k.address ? `
                <div style="margin-top:12px; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:12.5px; color:#334155;">
                  <b><i class="fa-solid fa-location-dot text-slate-500"></i> Residential Address:</b> ${k.address}
                </div>
              ` : ''}

              <!-- UIDAI QR Code Verification Box -->
              ${k.qrVerification ? `
                <div style="margin-top:14px; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; padding:14px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight:700; color:#065f46; display:flex; align-items:center; gap:8px; font-size:13px;">
                      <i class="fa-solid fa-shield-halved" style="color:#10b981;"></i> UIDAI Digital QR Code Verified
                    </div>
                    <span class="badge badge-success"><i class="fa-solid fa-check"></i> Digital Signature Valid</span>
                  </div>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; font-size:12px; color:#047857;">
                    <div><b>Scanned Name:</b> ${k.qrVerification.scannedName || k.userName}</div>
                    <div><b>Scanned Aadhaar:</b> ${k.qrVerification.scannedAadhaar || k.aadhaar}</div>
                    <div><b>Scanned DOB:</b> ${k.qrVerification.scannedDob || k.dob}</div>
                    <div><b>Gender:</b> ${k.qrVerification.scannedGender || 'Verified'}</div>
                    ${k.qrVerification.scannedAddress ? `<div style="grid-column:1/-1;"><b>UIDAI Record Address:</b> ${k.qrVerification.scannedAddress}</div>` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- UIDAI & NSDL Live Verification Proofs (PAN & Aadhaar) -->
              ${(k.panVerification || k.aadhaarVerification) ? `
                <div style="margin-top:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:14px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight:700; color:#1e40af; display:flex; align-items:center; gap:8px; font-size:13px;">
                      <i class="fa-solid fa-circle-check" style="color:#2563eb;"></i> UIDAI & NSDL Government Verification
                    </div>
                    <span class="badge badge-primary"><i class="fa-solid fa-shield-check"></i> Live Verified</span>
                  </div>
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; font-size:12px; color:#1e3a8a;">
                    ${k.panVerification ? `
                      <div>
                        <b>PAN Verified (NSDL):</b> ${k.panVerification.name || k.userName} (${k.panVerification.status || 'VALID'})<br>
                        <span style="font-size:11px; color:#3b82f6;">Order ID: ${k.panVerification.orderId || 'N/A'} • Aadhaar Link: ${k.panVerification.aadhaarSeedingStatus || 'Checked'}</span>
                      </div>
                    ` : ''}
                    ${k.aadhaarVerification ? `
                      <div>
                        <b>Aadhaar Verified (UIDAI):</b> ${k.aadhaarVerification.maskedAadhaar || k.aadhaar} (${k.aadhaarVerification.state || 'Verified'})<br>
                        <span style="font-size:11px; color:#3b82f6;">Order ID: ${k.aadhaarVerification.orderId || 'N/A'} ${k.aadhaarVerification.gender ? '• ' + k.aadhaarVerification.gender : ''} ${k.aadhaarVerification.ageRange ? '• Age ' + k.aadhaarVerification.ageRange : ''}</span>
                      </div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Biometric Match Status -->
              <div style="margin-top:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <span class="badge ${k.isBiometricVerified ? 'badge-success' : 'badge-secondary'}">
                  <i class="fa-solid fa-fingerprint"></i> ${k.isBiometricVerified ? 'Biometric Fingerprint / Face Matched' : 'Biometric Auth Not Completed'}
                </span>
                <span class="badge badge-primary">
                  <i class="fa-solid fa-wallet"></i> Upgraded Wallet Limit: ₹2,00,000 / month
                </span>
              </div>

              <!-- Uploaded KYC Documents Section -->
              <div style="margin-top:18px;">
                <h4 style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-folder-open text-blue"></i> Uploaded Documents (${Object.keys(docs).length} Attached)
                </h4>
                <div class="kyc-doc-grid">
                  ${docCardsHtml}
                </div>
              </div>

              <!-- Admin Decision Actions -->
              ${k.status === 'pending' ? `
                <div style="margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; gap:12px; flex-wrap:wrap;">
                  <button class="btn btn-success" onclick="actionKyc('${k.id}', 'approve')">
                    <i class="fa-solid fa-check"></i> Approve & Upgrade to Tier-2
                  </button>
                  <button class="btn btn-outline" style="color:#ef4444; border-color:#ef4444;" onclick="actionKyc('${k.id}', 'reject')">
                    <i class="fa-solid fa-xmark"></i> Reject Submission
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    console.error('KYC error:', e);
  }
}

// Lightbox Modal for KYC Documents
function openKycDocModal(imageUrl, title, userName, meta) {
  const modal = document.getElementById('kyc-doc-modal');
  const img = document.getElementById('kyc-doc-img');
  const titleEl = document.getElementById('kyc-doc-title');
  const badgeEl = document.getElementById('kyc-doc-badge');
  const metaEl = document.getElementById('kyc-doc-meta');
  const filenameEl = document.getElementById('kyc-doc-filename');
  const detailEl = document.getElementById('kyc-doc-detail');
  const openBtn = document.getElementById('kyc-doc-open-btn');
  const downloadBtn = document.getElementById('kyc-doc-download-btn');

  if (img) img.src = imageUrl;
  if (titleEl) titleEl.innerText = title || 'Document Inspection';
  if (badgeEl) badgeEl.innerText = (title || 'DOCUMENT').toUpperCase();
  if (metaEl) metaEl.innerText = `Applicant: ${userName || 'User'}`;
  if (filenameEl) filenameEl.innerText = title || 'Document Photo';
  if (detailEl) detailEl.innerText = meta || 'Verified Original ID Document submitted from FlamePay App';
  if (openBtn) openBtn.href = imageUrl;
  if (downloadBtn) {
    downloadBtn.href = imageUrl;
    downloadBtn.download = `${(userName || 'Applicant').replace(/\s+/g, '_')}_${(title || 'Document').replace(/\s+/g, '_')}.jpg`;
  }

  if (modal) modal.style.display = 'flex';
}

function closeKycDocModal() {
  const modal = document.getElementById('kyc-doc-modal');
  if (modal) modal.style.display = 'none';
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

// --- TOPUP MANAGEMENT & SANDBOX CONTROL ---
let cachedTopups = [];

async function fetchTopups() {
  try {
    const res = await fetch(`${API_BASE}/admin/topups`);
    const json = await res.json();
    if (!json.success) return;
    cachedTopups = json.data;

    const badge = document.getElementById('topups-badge');
    const pendingCount = cachedTopups.filter(t => t.status === 'pending').length;
    if (badge) {
      badge.innerText = pendingCount;
      badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }

    renderTopups();
  } catch (e) {
    console.error('Topups fetch error:', e);
  }
}

function renderTopups() {
  const tbody = document.getElementById('topups-tbody');
  if (!tbody) return;

  if (cachedTopups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#94a3b8;">No deposit requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = cachedTopups.map(t => {
    const isPending = t.status === 'pending';
    const statusBadge = isPending 
      ? '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Pending Approval</span>'
      : (t.status === 'approved' 
          ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Approved & Credited</span>'
          : '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> Rejected</span>');

    const actions = isPending ? `
      <div style="display:flex; gap:6px;">
        <button class="btn btn-success btn-sm" onclick="approveTopup('${t.id}')" title="Verify in SBI account & Credit Wallet">
          <i class="fa-solid fa-check"></i> Approve
        </button>
        <button class="btn btn-danger btn-sm" onclick="rejectTopup('${t.id}')">
          <i class="fa-solid fa-xmark"></i> Reject
        </button>
      </div>
    ` : `<span style="font-size:12px; color:#94a3b8;">${t.reviewedAt ? formatTimestamp(t.reviewedAt) : 'Processed'}</span>`;

    return `
      <tr>
        <td><b>${t.id}</b></td>
        <td style="font-size:12px; color:#64748b;">${formatTimestamp(t.createdAt)}</td>
        <td>
          <div style="font-weight:700;">${t.userName}</div>
          <div style="font-size:11px; color:#94a3b8;">${t.userPhone}</div>
        </td>
        <td style="font-weight:800; font-size:15px; color:#22c55e;">₹${formatNumber(t.amount)}</td>
        <td>
          <div style="font-family:monospace; font-weight:700; color:#38bdf8;">${t.utrNumber || 'N/A'}</div>
          <div style="font-size:11px; color:#94a3b8;">To: ${t.bankingName || 'SHIVAM SHIVAM'}</div>
        </td>
        <td style="font-size:12px;">${t.paymentMethod || 'SBI UPI'}</td>
        <td>${statusBadge}</td>
        <td>${actions}</td>
      </tr>
    `;
  }).join('');
}

async function approveTopup(id) {
  if (!confirm(`Confirm payment received in SBI Account (32823806111) and credit user wallet?`)) return;
  try {
    const res = await fetch(`${API_BASE}/admin/topups/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: 'Verified in SBI account by Admin' })
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message);
      fetchTopups();
      fetchTransactions();
      fetchUsers();
    } else {
      alert(json.message);
    }
  } catch (e) {
    alert('Error approving topup: ' + e.message);
  }
}

async function rejectTopup(id) {
  const reason = prompt('Enter rejection reason (e.g. UTR not matched):', 'UTR payment not received');
  if (reason === null) return;
  try {
    const res = await fetch(`${API_BASE}/admin/topups/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: reason })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Topup request rejected');
      fetchTopups();
      fetchTransactions();
    }
  } catch (e) {
    alert('Error rejecting topup: ' + e.message);
  }
}

let isCyrusSandbox = true;

async function checkSystemSettings() {
  try {
    const res = await fetch(`${API_BASE}/admin/system/settings`);
    const json = await res.json();
    if (json.success && json.data) {
      isCyrusSandbox = json.data.cyrusTestMode;
      updateSandboxButtonUI();
    }
  } catch (e) {
    console.error('Settings error:', e);
  }
}

function updateSandboxButtonUI() {
  const btn = document.getElementById('cyrus-sandbox-btn');
  const txt = document.getElementById('cyrus-sandbox-text');
  if (!btn || !txt) return;

  if (isCyrusSandbox) {
    btn.className = 'btn btn-warning btn-sm';
    btn.innerHTML = '<i class="fa-solid fa-flask"></i> <span>Sandbox: Active (Free Testing)</span>';
    btn.title = 'Recharges are simulated to protect real wallet. Click to switch to LIVE mode.';
  } else {
    btn.className = 'btn btn-danger btn-sm';
    btn.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> <span>Cyrus: LIVE (Real Wallet)</span>';
    btn.title = 'Recharges will deduct real ₹67.67 Cyrus wallet. Click to switch to Sandbox.';
  }
}

async function toggleCyrusTestMode() {
  const newMode = !isCyrusSandbox;
  const confirmMsg = newMode 
    ? 'Switch to Cyrus Sandbox Mode? (Recharges will be simulated for free testing)'
    : 'Switch to Cyrus LIVE Mode? (Recharges will deduct real balance from your ₹67.67 Cyrus wallet)';
  
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${API_BASE}/admin/system/test-mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testMode: newMode })
    });
    const json = await res.json();
    if (json.success) {
      isCyrusSandbox = json.cyrusTestMode;
      updateSandboxButtonUI();
      showToast(json.message);
    }
  } catch (e) {
    alert('Error toggling test mode: ' + e.message);
  }
}

// ======================================================
// OFFERS & REWARDS MANAGER (ADD / EDIT / DELETE / TOGGLE)
// ======================================================
function flutterColorToCss(hex) {
  if (!hex) return '#1E88E5';
  const cleaned = String(hex).replace(/^0x/i, '').replace(/^#/, '');
  if (cleaned.length === 8) return '#' + cleaned.slice(2);
  if (cleaned.length === 6) return '#' + cleaned;
  return '#1E88E5';
}

async function fetchOffers() {
  try {
    const res = await fetch(`${API_BASE}/admin/offers`);
    const json = await res.json();
    if (!json.success) return;
    cachedOffers = json.data || [];
    const badge = document.getElementById('offers-badge');
    if (badge) {
      const activeCount = cachedOffers.filter(o => o.isActive !== false).length;
      badge.innerText = activeCount;
    }
    renderOffersTable();
  } catch (e) {
    console.error('Error fetching offers:', e);
  }
}

function renderOffersTable() {
  const tbody = document.getElementById('offers-tbody');
  if (!tbody) return;

  const filterEl = document.getElementById('offers-category-filter');
  const filterCat = filterEl ? filterEl.value : 'All';

  let list = cachedOffers;
  if (filterCat && filterCat !== 'All') {
    list = list.filter(o => (o.category || '').toLowerCase() === filterCat.toLowerCase());
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:#64748b;">No offers found. Click <b>"Add New Offer"</b> to create one!</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => {
    const cssColor = flutterColorToCss(o.bannerColor);
    const isActive = o.isActive !== false;
    const safeId = String(o.id).replace(/'/g, "\\'");
    const safeTitle = String(o.title || '').replace(/'/g, "\\'");

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:42px; height:42px; border-radius:10px; background:${cssColor}; color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; box-shadow:0 4px 10px rgba(0,0,0,0.12);">
              <i class="fa-solid fa-tag"></i>
            </div>
            <div>
              <div style="font-weight:700; color:#0f172a; font-size:13.5px;">${o.title || 'Untitled Offer'}</div>
              <div style="font-size:11.5px; color:#64748b; max-width:280px;">${o.description || ''}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="display:inline-block; padding:4px 10px; background:#f1f5f9; border:1px dashed #94a3b8; border-radius:6px; font-family:monospace; font-weight:800; color:#0f172a; letter-spacing:0.8px;">${o.code || '-'}</span>
        </td>
        <td><b style="color:${cssColor};">${o.discount || '-'}</b></td>
        <td><span class="badge badge-info">${o.category || 'General'}</span></td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">
            ${isActive ? 'Active (Live)' : 'Paused'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button class="btn btn-outline btn-xs" title="${isActive ? 'Pause Offer' : 'Activate Offer'}" onclick="toggleOfferStatus('${safeId}', ${isActive})">
              <i class="fa-solid ${isActive ? 'fa-pause' : 'fa-play'}"></i> ${isActive ? 'Pause' : 'Live'}
            </button>
            <button class="btn btn-primary btn-xs" onclick="openOfferModal('${safeId}')">
              <i class="fa-solid fa-pen"></i> Edit
            </button>
            <button class="btn btn-danger btn-xs" onclick="deleteOffer('${safeId}', '${safeTitle}')">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openOfferModal(offerId = null) {
  const modal = document.getElementById('offer-modal');
  const badge = document.getElementById('offer-modal-badge');
  const titleEl = document.getElementById('offer-modal-title');
  const idInput = document.getElementById('offer-id');
  const titleInput = document.getElementById('offer-title-input');
  const codeInput = document.getElementById('offer-code-input');
  const discountInput = document.getElementById('offer-discount-input');
  const catInput = document.getElementById('offer-category-input');
  const colorInput = document.getElementById('offer-color-input');
  const descInput = document.getElementById('offer-desc-input');
  const activeInput = document.getElementById('offer-active-input');

  if (offerId) {
    const existing = cachedOffers.find(o => o.id === offerId);
    if (!existing) return;
    badge.innerText = 'EDIT OFFER';
    titleEl.innerText = `Edit Offer (${existing.code})`;
    idInput.value = existing.id;
    titleInput.value = existing.title || '';
    codeInput.value = existing.code || '';
    discountInput.value = existing.discount || '';
    catInput.value = existing.category || 'Recharge';
    colorInput.value = existing.bannerColor || '0xFF1E88E5';
    descInput.value = existing.description || '';
    activeInput.checked = existing.isActive !== false;
  } else {
    badge.innerText = 'NEW OFFER';
    titleEl.innerText = 'Add New Offer';
    idInput.value = '';
    titleInput.value = '';
    codeInput.value = '';
    discountInput.value = '';
    catInput.value = 'Recharge';
    colorInput.value = '0xFF1E88E5';
    descInput.value = '';
    activeInput.checked = true;
  }

  modal.style.display = 'flex';
}

function closeOfferModal() {
  const modal = document.getElementById('offer-modal');
  if (modal) modal.style.display = 'none';
}

async function saveOffer(event) {
  event.preventDefault();
  const id = document.getElementById('offer-id').value.trim();
  const payload = {
    title: document.getElementById('offer-title-input').value.trim(),
    code: document.getElementById('offer-code-input').value.trim().toUpperCase(),
    discount: document.getElementById('offer-discount-input').value.trim(),
    category: document.getElementById('offer-category-input').value,
    bannerColor: document.getElementById('offer-color-input').value,
    description: document.getElementById('offer-desc-input').value.trim(),
    isActive: document.getElementById('offer-active-input').checked
  };

  const url = id ? `${API_BASE}/admin/offers/${encodeURIComponent(id)}` : `${API_BASE}/admin/offers`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      closeOfferModal();
      showToast(id ? 'Offer updated & synced live to app!' : 'New offer added & live in app!');
      fetchOffers();
    } else {
      alert(json.message || 'Could not save offer');
    }
  } catch (e) {
    alert('Error saving offer: ' + e.message);
  }
}

async function toggleOfferStatus(id, currentActive) {
  try {
    const res = await fetch(`${API_BASE}/admin/offers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive })
    });
    const json = await res.json();
    if (json.success) {
      showToast(!currentActive ? 'Offer activated in app!' : 'Offer paused from app');
      fetchOffers();
    }
  } catch (e) {
    alert('Error updating offer status: ' + e.message);
  }
}

async function deleteOffer(id, title) {
  if (!confirm(`Delete offer "${title}" permanently? It will be removed from the FlamePay app immediately.`)) return;
  try {
    const res = await fetch(`${API_BASE}/admin/offers/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (json.success) {
      showToast('Offer deleted successfully');
      fetchOffers();
    } else {
      alert(json.message || 'Could not delete offer');
    }
  } catch (e) {
    alert('Error deleting offer: ' + e.message);
  }
}

// --- 11. CONTACT & SUPPORT INQUIRIES MODULE ---
let allContacts = [];
let currentContactStatus = 'all';

async function fetchContacts() {
  const tbody = document.getElementById('contacts-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Loading contact inquiries...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/admin/contact-tickets`);
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      allContacts = json.data;
      updateContactCounts();
      renderContactsTable();
    } else {
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-state">No inquiries found</td></tr>';
    }
  } catch (e) {
    console.error('Error fetching contact tickets:', e);
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading-state text-danger">Error loading contact inquiries</td></tr>';
  }
}

function updateContactCounts() {
  const countAll = document.getElementById('count-all-contacts');
  const countOpen = document.getElementById('count-open-contacts');
  const badge = document.getElementById('contacts-badge');
  const openCount = allContacts.filter(c => (c.status || 'open') === 'open').length;

  if (countAll) countAll.innerText = allContacts.length;
  if (countOpen) countOpen.innerText = openCount;
  if (badge) badge.innerText = openCount;
}

function filterContactsByStatus(status) {
  currentContactStatus = status;
  document.querySelectorAll('#contact-status-filters .pill').forEach(p => {
    p.classList.remove('active');
  });
  if (event && event.target) {
    event.target.classList.add('active');
  }
  renderContactsTable();
}

function filterContactsTable() {
  renderContactsTable();
}

function renderContactsTable() {
  const tbody = document.getElementById('contacts-tbody');
  if (!tbody) return;

  const searchInput = document.getElementById('contact-search-input');
  const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

  let filtered = allContacts.filter(c => {
    const st = c.status || 'open';
    if (currentContactStatus !== 'all' && st !== currentContactStatus) return false;
    if (query) {
      const match = (c.name || '').toLowerCase().includes(query) ||
                    (c.phone || '').includes(query) ||
                    (c.email || '').toLowerCase().includes(query) ||
                    (c.topic || '').toLowerCase().includes(query) ||
                    (c.message || '').toLowerCase().includes(query) ||
                    (c.id || '').toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;"><i class="fa-solid fa-inbox" style="font-size:24px; margin-bottom:8px; display:block;"></i>No contact inquiries match the criteria</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const st = c.status || 'open';
    const dateStr = c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent';
    const cleanPhone = (c.phone || '').replace(/\D/g, '').slice(-10);
    const waUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${c.name || 'Customer'}, regarding your FlamePay inquiry (${c.topic || 'General'})...`)}` : '#';

    let badgeClass = 'badge-warning';
    let statusLabel = 'Open';
    if (st === 'in_progress') { badgeClass = 'badge-primary'; statusLabel = 'In Progress'; }
    if (st === 'resolved') { badgeClass = 'badge-success'; statusLabel = 'Resolved'; }

    return `
      <tr>
        <td>
          <b style="color:#0ea5e9;">#${c.id}</b>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">${dateStr}</div>
        </td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${c.name || 'Anonymous'}</div>
          <div style="font-size:12px; color:#475569; margin-top:2px;"><i class="fa-solid fa-phone" style="font-size:11px; color:#3b82f6;"></i> ${c.phone || 'N/A'}</div>
          ${c.email ? `<div style="font-size:11px; color:#64748b;"><i class="fa-solid fa-envelope" style="font-size:10px;"></i> ${c.email}</div>` : ''}
        </td>
        <td>
          <span class="badge badge-purple" style="font-size:11px;">${c.topic || 'General'}</span>
        </td>
        <td style="max-width:320px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px 12px; font-size:12.5px; color:#1e293b; line-height:1.45; word-break:break-word;">
            ${c.message || 'No message content'}
          </div>
        </td>
        <td>
          <span class="badge ${badgeClass}">${statusLabel}</span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            ${cleanPhone ? `
              <a href="${waUrl}" target="_blank" class="btn btn-sm" style="background:#22c55e; color:#fff; padding:6px 10px; border-radius:6px; font-size:11.5px; display:inline-flex; align-items:center; gap:4px; text-decoration:none;" title="Chat on WhatsApp">
                <i class="fa-brands fa-whatsapp"></i> Chat
              </a>
              <a href="tel:${cleanPhone}" class="btn btn-sm btn-outline" style="padding:6px 10px; border-radius:6px; font-size:11.5px;" title="Call Customer">
                <i class="fa-solid fa-phone"></i>
              </a>
            ` : '<span style="color:#94a3b8; font-size:11px;">-</span>'}
          </div>
        </td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <select class="form-select form-select-sm" style="font-size:12px; padding:4px 8px; border-radius:6px;" onchange="updateContactStatus('${c.id}', this.value)">
              <option value="open" ${st === 'open' ? 'selected' : ''}>Open</option>
              <option value="in_progress" ${st === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="resolved" ${st === 'resolved' ? 'selected' : ''}>Resolved</option>
            </select>
            <button class="btn btn-sm btn-outline" style="color:#ef4444; border-color:#fca5a5; padding:5px 8px;" onclick="deleteContact('${c.id}')" title="Delete Inquiry">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateContactStatus(ticketId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/admin/contact-tickets/${encodeURIComponent(ticketId)}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Ticket #${ticketId} updated to ${newStatus}`);
      const t = allContacts.find(c => c.id === ticketId);
      if (t) t.status = newStatus;
      updateContactCounts();
      renderContactsTable();
    } else {
      alert(json.message || 'Could not update ticket status');
    }
  } catch (e) {
    alert('Error updating status: ' + e.message);
  }
}

async function deleteContact(ticketId) {
  if (!confirm(`Delete ticket #${ticketId} permanently?`)) return;
  try {
    const res = await fetch(`${API_BASE}/admin/contact-tickets/${encodeURIComponent(ticketId)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Ticket #${ticketId} deleted`);
      allContacts = allContacts.filter(c => c.id !== ticketId);
      updateContactCounts();
      renderContactsTable();
    } else {
      alert(json.message || 'Could not delete ticket');
    }
  } catch (e) {
    alert('Error deleting ticket: ' + e.message);
  }
}
