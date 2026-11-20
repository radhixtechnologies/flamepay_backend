/**
 * FlamePay - Cyrus Recharge & Bill Payment Service Integration
 * Handles live Mobile Recharge, DTH Recharge, Bill Payment & Fetch
 */

const CYRUS_BASE = 'https://cyrusrecharge.in';

let isSandboxMode = process.env.CYRUS_TEST_MODE === 'false' ? false : true;

const setTestMode = (val) => {
  isSandboxMode = Boolean(val);
  return isSandboxMode;
};

const getTestMode = () => isSandboxMode;

const getCredentials = () => {
  let pin = process.env.CYRUS_PASSWORD || '73A4DB6556';
  if (pin === 'sg66cy3u8vl6') pin = '73A4DB6556';
  return {
    memberId: process.env.CYRUS_API_ID || 'AP178923',
    pin
  };
};

// Exact Circle Mapping for Cyrus Recharge API
const CIRCLE_MAP = {
  'andaman': '36',
  'andhra': '1',
  'andhra pradesh': '1',
  'telangana': '37',
  'arunachal': '26',
  'assam': '2',
  'bihar': '3',
  'bihar and jharkhand': '42',
  'jharkhand': '24',
  'chennai': '4',
  'chhattisgarh': '27',
  'chattisgarh': '27',
  'delhi': '5',
  'delhi ncr': '5',
  'goa': '28',
  'gujarat': '6',
  'haryana': '7',
  'himachal': '8',
  'himachal pradesh': '8',
  'jammu': '9',
  'jammu & kashmir': '9',
  'kashmir': '9',
  'karnataka': '10',
  'kerala': '11',
  'kolkata': '12',
  'madhya pradesh': '14',
  'mp': '14',
  'mp and chattisgarh': '14',
  'maharashtra': '13',
  'mumbai': '15',
  'north east': '16',
  'odisha': '17',
  'orissa': '17',
  'punjab': '18',
  'rajasthan': '19',
  'tamil nadu': '20',
  'tamilnadu': '20',
  'up east': '21',
  'uttar pradesh east': '21',
  'up west': '22',
  'uttar pradesh west': '22',
  'uttarakhand': '35',
  'west bengal': '23',
  'bengal': '23'
};

// Operator Code Mapping for Cyrus Recharge API
const OPERATOR_MAP = {
  mobile: {
    'airtel': 'AT',
    'at': 'AT',
    'jio': 'JIO',
    'reliance jio': 'JIO',
    'vi': 'VF',
    'vodafone': 'VF',
    'idea': 'VF',
    'vodafone idea': 'VF',
    'bsnl': 'BSNL',
    'bsnl topup': 'BSNL',
    'bsnl validity': 'BSV',
    'bsnl special': 'BSS',
    'mtnl delhi': 'MD',
    'mtnl mumbai': 'MM'
  },
  dth: {
    'tata play': 'TSD',
    'tata sky': 'TSD',
    'airtel dth': 'ATD',
    'airtel digital tv': 'ATD',
    'dish tv': 'DTD',
    'videocon dth': 'VDD',
    'videocon d2h': 'VDD',
    'sun direct': 'SD'
  },
  google_play: 'IND11010',
  metro: {
    'delhi metro': 'IND11013',
    'hyderabad metro': 'IND11014',
    'mumbai metro': 'IND11015',
    'bangalore metro': 'IND11016'
  }
};

const resolveCircleCode = (circleName) => {
  if (!circleName) return '5'; // default Delhi
  const c = String(circleName).toLowerCase().trim();
  for (const [k, v] of Object.entries(CIRCLE_MAP)) {
    if (c.includes(k)) return v;
  }
  return '5';
};

const resolveOperatorCode = (operatorName, type = 'mobile') => {
  if (!operatorName) return type === 'dth' ? 'TSD' : 'JIO';
  const o = String(operatorName).toLowerCase().trim();
  const subMap = OPERATOR_MAP[type] || OPERATOR_MAP.mobile;
  for (const [k, v] of Object.entries(subMap)) {
    if (o.includes(k)) return v;
  }
  return subMap['jio'] || 'JIO';
};

/**
 * Fetch Cyrus Wallet Balance
 */
const getBalance = async () => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/GetOperator.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&Method=getbalance`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[Cyrus getBalance Error]:', err.message);
    return { Status: '0', ErrorMessage: err.message };
  }
};

/**
 * Fetch Live Operators from Cyrus
 */
const getOperators = async () => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/GetOperator.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&Method=getoperator`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[Cyrus getOperators Error]:', err.message);
    return { Status: '0', ErrorMessage: err.message };
  }
};

/**
 * Fetch Live Circles from Cyrus
 */
const getCircles = async () => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/GetOperator.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&Method=getcircle`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[Cyrus getCircles Error]:', err.message);
    return { Status: '0', ErrorMessage: err.message };
  }
};

/**
 * Execute Live Recharge (Mobile or DTH)
 * Returns normalized object: { success, status, apiTransId, operatorRef, message, raw }
 */
const executeRecharge = async ({
  number,
  operator,
  circle,
  amount,
  usertx,
  type = 'mobile'
}) => {
  const { memberId, pin } = getCredentials();
  const opCode = resolveOperatorCode(operator, type);
  const circleCode = resolveCircleCode(circle);
  const txn = usertx || `FP${Date.now()}`;
  const cleanNumber = String(number).replace(/[^0-9]/g, '');

  // Sandbox / Test Mode Guard: Protects real Cyrus wallet balance during testing
  if (isSandboxMode) {
    console.log(`[Cyrus SANDBOX MODE] Simulating ${type} recharge of ₹${amount} for ${cleanNumber} (${opCode})`);
    return {
      success: true,
      status: 'SUCCESS',
      apiTransId: 'SIM_' + Math.floor(10000000 + Math.random() * 90000000),
      operatorRef: 'OP' + Math.floor(100000000 + Math.random() * 900000000),
      errorMessage: '',
      transactionDate: new Date().toISOString(),
      isSimulated: true
    };
  }

  const url = `${CYRUS_BASE}/services_cyapi/recharge_cyapi.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&number=${cleanNumber}&operator=${opCode}&circle=${circleCode}&amount=${amount}&usertx=${txn}&format=json&RechargeMode=1`;

  console.log(`[Cyrus Recharge Request] URL: ${CYRUS_BASE}/services_cyapi/recharge_cyapi.aspx?memberid=${memberId}&...&number=${cleanNumber}&op=${opCode}&circle=${circleCode}&amt=${amount}&tx=${txn}`);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    // Cyrus response format:
    // { ApiTransID: "123", Status: "SUCCESS" | "PENDING" | "FAILURE", ErrorMessage: "", OperatorRef: "..." }
    const status = (data.Status || '').toUpperCase();
    const isSuccess = status === 'SUCCESS' || status === 'PENDING';

    return {
      success: isSuccess,
      status: status || 'PENDING',
      apiTransId: data.ApiTransID || '',
      operatorRef: data.OperatorRef || `REF${Math.floor(10000000 + Math.random() * 90000000)}`,
      errorMessage: data.ErrorMessage || '',
      transactionDate: data.TransactionDate || new Date().toISOString(),
      raw: data
    };
  } catch (err) {
    console.error('[Cyrus executeRecharge Error]:', err.message);
    return {
      success: false,
      status: 'FAILURE',
      errorMessage: err.message,
      operatorRef: ''
    };
  }
};

/**
 * Live Bill Fetch via Cyrus
 */
const fetchBill = async ({ operator, consumerNumber }) => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/BillFetch_Cyrus_BA.aspx`;

  try {
    const formData = new URLSearchParams();
    formData.append('memberid', memberId);
    formData.append('pin', pin);
    formData.append('methodname', 'get_billerinfo');
    formData.append('operator', operator || 'MSEDCL');
    formData.append('number', consumerNumber || '');

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(6000)
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('[Cyrus fetchBill Error]:', err.message);
    return { Status: '0', ErrorMessage: err.message };
  }
};

/**
 * Live Bill Payment via Cyrus
 */
const payBill = async ({
  number,
  operator,
  circle = '5',
  amount,
  usertx,
  account,
  othervalue = '',
  othervalue1 = ''
}) => {
  const { memberId, pin } = getCredentials();
  const txn = usertx || `BILL${Date.now()}`;
  const cleanNumber = String(number).replace(/[^0-9]/g, '');

  if (isSandboxMode) {
    console.log(`[Cyrus SANDBOX MODE] Simulating bill payment of ₹${amount} for ${cleanNumber}`);
    return {
      success: true,
      status: 'SUCCESS',
      apiTransId: 'SIM_BILL_' + Math.floor(10000000 + Math.random() * 90000000),
      operatorRef: 'REC' + Math.floor(100000 + Math.random() * 900000),
      errorMessage: '',
      isSimulated: true
    };
  }

  const url = `${CYRUS_BASE}/services_cyapi/recharge_cyapi.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&number=${cleanNumber}&operator=${encodeURIComponent(operator)}&circle=${circle}&amount=${amount}&usertx=${txn}&account=${encodeURIComponent(account || cleanNumber)}&othervalue=${encodeURIComponent(othervalue)}&othervalue1=${encodeURIComponent(othervalue1)}&format=json&RechargeMode=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { rawText: text };
    }

    const status = (data.Status || '').toUpperCase();
    return {
      success: status === 'SUCCESS' || status === 'PENDING',
      status: status || 'PENDING',
      apiTransId: data.ApiTransID || '',
      operatorRef: data.OperatorRef || `REC${Math.floor(100000 + Math.random() * 900000)}`,
      errorMessage: data.ErrorMessage || '',
      raw: data
    };
  } catch (err) {
    console.error('[Cyrus payBill Error]:', err.message);
    return {
      success: false,
      status: 'FAILURE',
      errorMessage: err.message
    };
  }
};

/**
 * Check Transaction Status
 */
const checkStatus = async (transid) => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/rechargestatus.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&transid=${encodeURIComponent(transid)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    return { raw: text };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Dispute Request
 */
const raiseDispute = async (transid, reason = 'Transaction Failed') => {
  const { memberId, pin } = getCredentials();
  const url = `${CYRUS_BASE}/api/api_raise_dispute.aspx?memberid=${encodeURIComponent(memberId)}&pin=${encodeURIComponent(pin)}&transid=${encodeURIComponent(transid)}&reason=${encodeURIComponent(reason)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    return { raw: text };
  } catch (err) {
    return { error: err.message };
  }
};

/**
 * Cyrus TransUnion CIBIL Credit Report API
 * Endpoint: POST https://cyrusrecharge.in/api/total-kyc.aspx
 * Docs: https://documenter.getpostman.com/view/22264863/2sBYHQ1Mvo#420cef60-4ef6-4bf4-b1fe-3775d70025b5
 */
const fetchCibilReport = async ({ name, mobile, pan, dob, gender, address, city, state, pincode, street }) => {
  const { memberId, pin } = getCredentials();
  const cleanMobile = String(mobile || '9990385942').replace(/[^0-9]/g, '').slice(-10);
  const cleanPan = (pan || '').toUpperCase().trim();
  const cleanName = (name || 'Customer').trim();
  const cleanGender = (gender && String(gender).toLowerCase() === 'female') ? 'female' : 'male';

  // Format DOB to YYYY-MM-DD
  let formattedDob = '1995-08-15';
  if (dob) {
    if (dob.includes('/')) {
      const parts = dob.split('/');
      if (parts.length === 3) {
        formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    } else if (dob.includes('-')) {
      const parts = dob.split('-');
      if (parts[0].length === 4) {
        formattedDob = dob;
      } else if (parts[2].length === 4) {
        formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }

  const addrObj = (address && typeof address === 'object') ? address : {
    street: street || (typeof address === 'string' ? address : 'Main Road'),
    city: city || 'Jaipur',
    state: state || 'Rajasthan',
    pincode: Number(pincode || 302017) || 302017
  };

  const payload = {
    merchantId: process.env.CYRUS_MERCHANT_ID || process.env.CYRUS_API_ID || memberId || 'AP178923',
    merchantKey: process.env.CYRUS_MERCHANT_KEY || process.env.CYRUS_PASSWORD || pin || '73A4DB6556',
    mobile: cleanMobile,
    name: cleanName,
    pan: cleanPan,
    dob: formattedDob,
    gender: cleanGender,
    address: addrObj,
    consent: 'Y',
    type: 'CREDIT_REPORT_CIBIL',
    txnid: 'FP_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000)
  };

  const url = `${CYRUS_BASE}/api/total-kyc.aspx`;
  console.log(`[Cyrus CIBIL] Invoking TransUnion CIBIL check for ${cleanName} (${cleanPan}, DOB: ${formattedDob})...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });

    const data = await res.json();
    console.log('[Cyrus CIBIL Response]:', JSON.stringify(data).slice(0, 500));
    return data;
  } catch (err) {
    console.error('[Cyrus CIBIL Error]:', err.message);
    return { success: false, statusCode: '500', message: err.message };
  }
};

module.exports = {
  getCredentials,
  resolveCircleCode,
  resolveOperatorCode,
  getBalance,
  getOperators,
  getCircles,
  executeRecharge,
  fetchBill,
  payBill,
  checkStatus,
  raiseDispute,
  fetchCibilReport,
  setTestMode,
  getTestMode
};
