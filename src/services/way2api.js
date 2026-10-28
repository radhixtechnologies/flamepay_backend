const WAY2API_BASE = 'https://app.way2api.com/api/v1';

const getApiKey = () => {
  return process.env.WAY2API_KEY || 'w2a_b6bddcb08041a6023a76571894b35af28d5a32809a0cabfa26fa7235a8fa719b9a55a4152b65245cce6fbc0804b16aca';
};

const post = async (endpoint, body = {}) => {
  const url = `${WAY2API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[Way2API Error] ${endpoint}:`, err.message);
    return { success: false, message: err.message };
  }
};

const normalizeCircle = (circle) => {
  const c = String(circle || '').toLowerCase().replace(/[^a-z0-9]/g, ' ');
  if (c.includes('mp') || c.includes('madhya') || c.includes('chattisgarh') || c.includes('chhattisgarh')) return 'madhya_pradesh';
  if (c.includes('delhi')) return 'delhi';
  if (c.includes('mumbai')) return 'mumbai';
  if (c.includes('kolkata')) return 'kolkata';
  if (c.includes('maharashtra') || c.includes('goa')) return 'maharashtra';
  if (c.includes('up east') || c.includes('uttar pradesh east')) return 'up_east';
  if (c.includes('up west') || c.includes('uttar pradesh west')) return 'up_west';
  if (c.includes('bihar') || c.includes('jharkhand')) return 'bihar';
  if (c.includes('gujarat')) return 'gujarat';
  if (c.includes('haryana')) return 'haryana';
  if (c.includes('himachal')) return 'himachal_pradesh';
  if (c.includes('karnataka')) return 'karnataka';
  if (c.includes('kerala')) return 'kerala';
  if (c.includes('punjab')) return 'punjab';
  if (c.includes('rajasthan')) return 'rajasthan';
  if (c.includes('tamil') || c.includes('chennai')) return 'tamil_nadu';
  if (c.includes('andhra') || c.includes('telangana')) return 'andhra_pradesh';
  if (c.includes('bengal')) return 'west_bengal';
  if (c.includes('assam')) return 'assam';
  if (c.includes('odisha') || c.includes('orissa')) return 'odisha';
  if (c.includes('jammu') || c.includes('kashmir')) return 'jammu_kashmir';
  if (c.includes('north east')) return 'north_east';
  return 'delhi';
};

const normalizeOperator = (op) => {
  const o = String(op || '').toLowerCase();
  if (o.includes('airtel')) return 'airtel';
  if (o.includes('jio')) return 'jio';
  if (o.includes('vi') || o.includes('idea') || o.includes('vodafone')) return 'vi';
  if (o.includes('bsnl')) return 'bsnl';
  return 'jio';
};

/**
 * Identify telecom operator and circle for 10-digit mobile number
 */
const checkOperatorCircle = async (mobileNumber) => {
  const cleanMobile = String(mobileNumber).replace(/[^0-9]/g, '').slice(-10);
  return await post('/operator-circle/check', { mobile_number: cleanMobile });
};

/**
 * Fetch live prepaid recharge plans for operator & circle
 */
const getMobilePlans = async (operator, circle) => {
  const op = normalizeOperator(operator);
  const cir = normalizeCircle(circle);
  return await post('/mobile/recharge-plans', { operator: op, circle: cir });
};

/**
 * Fetch live R-Offer (Special personalized offers for Airtel & Vi)
 */
const getROffer = async (mobileNumber, operator) => {
  const cleanMobile = String(mobileNumber).replace(/[^0-9]/g, '').slice(-10);
  let op = String(operator || 'airtel').toLowerCase();
  if (op.includes('airtel')) op = 'airtel';
  else if (op.includes('vi') || op.includes('idea') || op.includes('vodafone')) op = 'vi';
  else op = 'airtel';

  return await post('/mobile/r-offer', { mobile_number: cleanMobile, operator: op });
};

/**
 * Check DTH operator for subscriber ID
 */
const checkDthOperator = async (dthNumber) => {
  return await post('/dth/operator-check', { dth_number: String(dthNumber).trim() });
};

/**
 * Fetch DTH Customer info (Balance, customer name, status, plan expiry)
 */
const getDthInfo = async (dthNumber, operator) => {
  let op = String(operator || 'tata_play').toLowerCase();
  if (op.includes('tata')) op = 'tata_play';
  else if (op.includes('dish')) op = 'dish_tv';
  else if (op.includes('sun')) op = 'sun_direct';
  else if (op.includes('airtel')) op = 'airtel_dth';
  else if (op.includes('d2h') || op.includes('videocon')) op = 'videocon_d2h';

  return await post('/dth/info', { dth_number: String(dthNumber).trim(), operator: op });
};

/**
 * Fetch DTH Recharge Plans
 */
const getDthPlans = async (operator) => {
  let op = String(operator || 'tata_play').toLowerCase();
  if (op.includes('tata')) op = 'tata_play';
  else if (op.includes('dish')) op = 'dish_tv';
  else if (op.includes('sun')) op = 'sun_direct';
  else if (op.includes('airtel')) op = 'airtel_dth';
  else if (op.includes('d2h') || op.includes('videocon')) op = 'videocon_d2h';

  return await post('/dth/recharge-plans', { operator: op });
};

/**
 * Fetch CIBIL Credit Report
 */
const fetchCibilReport = async ({ name, mobile, pan, dob, gender, address, pincode }) => {
  const cleanMobile = String(mobile).replace(/[^0-9]/g, '').slice(-10);
  const payload = {
    name: name || 'User',
    mobile: cleanMobile,
    pan: (pan || '').toUpperCase().trim(),
  };
  if (dob) payload.dob = dob;
  if (gender) payload.gender = gender;
  if (address) payload.address = address;
  if (pincode) payload.pincode = pincode;

  return await post('/credit-report-cibil/fetch-report', payload);
};

module.exports = {
  checkOperatorCircle,
  getMobilePlans,
  getROffer,
  checkDthOperator,
  getDthInfo,
  getDthPlans,
  fetchCibilReport,
};
