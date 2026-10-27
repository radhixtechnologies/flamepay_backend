// FlamePay Admin Web Application
// Automatically route to api.flamepay.in if opened on admin.flamepay.in, or use relative /api/v1 on same domain / localhost
const API_BASE = (function() {
  const host = window.location.hostname;
  if (host.includes('admin.')) {
    return `${window.location.protocol}//${host.replace('admin.', 'api.')}/api/v1`;
  }
  return '/api/v1';
})();

let currentTab = 'overview';
let cachedUsers = [];
let cachedKyc = [];
let cachedTxns = [];

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupNavigation();
  loadAllData();
});

// Auth check
function initAuth() {
  const token = localStorage.getItem('fp_admin_token');
  if (!token) {
    document.getElementById('login-modal').style.display = 'flex';
  } else {
    document.getElementById('login-modal').style.display = 'none';
  }

  // Handle Login form
  const loginForm = document.getElementById('login-form');
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
        document.getElementById('login-modal').style.display = 'none';
        loadAllData();
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Error connecting to backend: ' + err.message);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('fp_admin_token');
    document.getElementById('login-modal').style.display = 'flex';
  });
}

// Navigation
function setupNavigation() {
  const buttons = document.querySelectorAll('.nav-item');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === 'tab-' + tabId);
  });

  // Update title
  const titles = {
    overview: ['Operational Overview', 'Real-time metrics, payment processing, and user verifications'],
    users: ['Customer Accounts & Limits', 'Manage wallet balances and account statuses'],
    kyc: ['KYC Compliance & Verification', 'Review Aadhaar & PAN verification requests'],
    transactions: ['Audit Trail & Payment Stream', 'Monitor deposits, recharges, transfers and bills'],
    apis: ['API Documentation & Sandbox', 'Endpoints consumed by FlamePay Flutter Mobile App']
  };

  if (titles[tabId]) {
    document.getElementById('page-title').innerText = titles[tabId][0];
    document.getElementById('page-desc').innerText = titles[tabId][1];
  }
}

function refreshCurrentTab() {
  loadAllData();
}

// Load all dashboard data
async function loadAllData() {
  try {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchKycRequests(),
      fetchTransactions()
    ]);
  } catch (err) {
    console.error('Error loading data:', err);
  }
}

// Stats
async function fetchStats() {
  const res = await fetch(`${API_BASE}/admin/stats`);
  const data = await res.json();
  if (data.success) {
    const s = data.data;
    document.getElementById('stat-volume').innerText = '₹' + Number(s.totalVolume).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    document.getElementById('stat-users').innerText = s.totalUsers;
    document.getElementById('stat-verified-kyc').innerText = s.verifiedKyc;
    document.getElementById('stat-pending-kyc').innerText = s.pendingKyc;
    document.getElementById('kyc-badge').innerText = s.pendingKyc;
  }
}

// Users
async function fetchUsers() {
  const res = await fetch(`${API_BASE}/admin/users`);
  const data = await res.json();
  if (data.success) {
    cachedUsers = data.data;
    renderUsersTable(cachedUsers);
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><code>${u.id}</code></td>
      <td><b>${u.name}</b><br><small style="color:#64748B">${u.email}</small></td>
      <td>${u.phone}</td>
      <td><b style="color:#0D6EFD">₹${Number(u.walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</b></td>
      <td>
        <span class="badge ${u.kycStatus === 'verified' ? 'badge-success' : 'badge-warning'}">
          ${u.kycStatus === 'verified' ? '<i class="fa-solid fa-check"></i> Verified' : 'Pending'}
        </span>
      </td>
      <td><span class="badge badge-blue">CIBIL ${u.cibilScore || 750}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="addMoneyPrompt('${u.id}', '${u.name}')">+ Add Funds</button>
      </td>
    </tr>
  `).join('');
}

function filterUsersTable() {
  const q = document.getElementById('user-search-input').value.toLowerCase();
  const filtered = cachedUsers.filter(u => 
    u.name.toLowerCase().includes(q) || 
    u.phone.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
}

async function addMoneyPrompt(userId, userName) {
  const amountStr = prompt(`Enter amount to add into ${userName}'s FlamePay Wallet (₹):`, '500');
  if (!amountStr) return;
  const amount = Number(amountStr);
  if (isNaN(amount) || amount <= 0) return alert('Enter a valid amount');

  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data.success) {
      alert(`₹${amount} added successfully! New Balance: ₹${data.user.walletBalance}`);
      loadAllData();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// KYC
async function fetchKycRequests() {
  const res = await fetch(`${API_BASE}/admin/kyc-requests`);
  const data = await res.json();
  if (data.success) {
    cachedKyc = data.data;
    renderKycList(cachedKyc);
  }
}

function renderKycList(list) {
  const container = document.getElementById('kyc-full-list');
  const mini = document.getElementById('overview-pending-kyc');

  if (list.length === 0) {
    container.innerHTML = '<p class="loading-state">No KYC submissions found.</p>';
    mini.innerHTML = '<p style="color:#64748B; padding: 12px 0;">No pending verification requests.</p>';
    return;
  }

  // Render Full
  container.innerHTML = list.map(k => `
    <div class="kyc-card">
      <div class="kyc-card-header">
        <div>
          <h4>${k.userName}</h4>
          <small style="color:#64748B">${k.userPhone} • ${k.id}</small>
        </div>
        <span class="badge ${k.status === 'approved' ? 'badge-success' : (k.status === 'rejected' ? 'badge-danger' : 'badge-warning')}">
          ${k.status.toUpperCase()}
        </span>
      </div>
      <div style="font-size: 12.5px; color: #334155; line-height: 1.6; margin: 10px 0;">
        <div><b>PAN:</b> ${k.pan || 'N/A'}</div>
        <div><b>Aadhaar:</b> ${k.aadhaar || 'N/A'}</div>
        <div><b>DOB:</b> ${k.dob || 'N/A'}</div>
        <div><b>Income:</b> ${k.annualIncome || 'N/A'}</div>
        <div><b>Address:</b> ${k.address || 'N/A'}</div>
      </div>
      ${k.status === 'pending' ? `
        <div class="kyc-actions">
          <button class="btn btn-primary btn-sm" onclick="handleKycAction('${k.id}', 'approve')"><i class="fa-solid fa-check"></i> Approve Tier 2</button>
          <button class="btn btn-secondary btn-sm" onclick="handleKycAction('${k.id}', 'reject')"><i class="fa-solid fa-xmark"></i> Reject</button>
        </div>
      ` : ''}
    </div>
  `).join('');

  // Render mini
  const pending = list.filter(k => k.status === 'pending');
  if (pending.length === 0) {
    mini.innerHTML = '<p style="color:#10B981; font-weight:600; padding:12px 0;"><i class="fa-solid fa-circle-check"></i> All KYC requests verified!</p>';
  } else {
    mini.innerHTML = pending.map(k => `
      <div class="kyc-card" style="padding:10px 14px; margin-bottom:8px;">
        <div class="kyc-card-header" style="margin:0;">
          <div>
            <b>${k.userName}</b> (${k.userPhone})<br>
            <small style="color:#64748B">PAN: ${k.pan} • Aadhaar: ${k.aadhaar}</small>
          </div>
          <button class="btn btn-primary btn-sm" onclick="handleKycAction('${k.id}', 'approve')">Approve</button>
        </div>
      </div>
    `).join('');
  }
}

async function handleKycAction(reqId, action) {
  try {
    const res = await fetch(`${API_BASE}/admin/kyc-requests/${reqId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (data.success) {
      alert(`KYC ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`);
      loadAllData();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// Transactions
async function fetchTransactions() {
  const res = await fetch(`${API_BASE}/admin/transactions`);
  const data = await res.json();
  if (data.success) {
    cachedTxns = data.data;
    renderTxnsTable(cachedTxns);
  }
}

function renderTxnsTable(txns) {
  const fullTbody = document.getElementById('txns-tbody');
  const miniTbody = document.getElementById('overview-recent-txns');

  const rowsHtml = txns.map(t => `
    <tr>
      <td><code>${t.id}</code></td>
      <td>${new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br><small style="color:#64748B">${new Date(t.timestamp).toLocaleDateString()}</small></td>
      <td><b>${t.title}</b><br><small style="color:#64748B">${t.subtitle || ''}</small></td>
      <td><span class="badge badge-blue">${t.category}</span></td>
      <td>${t.paymentMode || 'Wallet'}</td>
      <td><b>₹${Number(t.amount).toFixed(2)}</b></td>
      <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> Success</span></td>
    </tr>
  `).join('');

  fullTbody.innerHTML = rowsHtml;

  // Mini rows (first 4)
  miniTbody.innerHTML = txns.slice(0, 4).map(t => `
    <tr>
      <td><code>${t.id}</code></td>
      <td><b>${t.title}</b></td>
      <td><span class="badge badge-blue">${t.category}</span></td>
      <td><b>₹${Number(t.amount).toFixed(2)}</b></td>
      <td><span class="badge badge-success">Success</span></td>
    </tr>
  `).join('');
}
