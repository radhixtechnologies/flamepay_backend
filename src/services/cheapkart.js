const crypto = require('crypto');

const CHEAPKART_CONFIG = {
  baseUrl: process.env.CHEAPKART_BASE_URL || 'https://cheapkart.in/api/v1',
  apiKey: process.env.CHEAPKART_API_KEY || 'ck_live_b6d1273e5e93c7114f4c194242ecf988',
  secretKey: process.env.CHEAPKART_SECRET_KEY || 'sec_d100c76436732f5a97a6711b1271ee82a3908b9f5728af36',
  clientId: process.env.CHEAPKART_CLIENT_ID || 'CK_CLIENT_361EE392',
};

// Cache products in-memory for 10 minutes to ensure blazing fast response times
let cachedCreditCards = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fetch all allocated credit card products from CheapKart B2B API
 */
const getCreditCardProducts = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedCreditCards && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedCreditCards;
  }

  try {
    const url = `${CHEAPKART_CONFIG.baseUrl}/products.php?category=credit_card`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': CHEAPKART_CONFIG.apiKey,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`Cheapkart API HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && (data.status === true || Array.isArray(data.products))) {
      cachedCreditCards = data.products || [];
      lastCacheTime = now;
      console.log(`[CheapKart] Successfully loaded ${cachedCreditCards.length} credit card products`);
      return cachedCreditCards;
    }
    return cachedCreditCards || [];
  } catch (err) {
    console.error('[CheapKart getCreditCardProducts Error]:', err.message);
    return cachedCreditCards || [];
  }
};

/**
 * Submit applicant lead for a credit card product
 */
const submitApplicantLead = async ({ fullName, phone, email, panCard, pincode, productId }) => {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '').slice(-10);
  const cleanPan = String(panCard || '').trim().toUpperCase();
  const cleanPincode = String(pincode || '110001').replace(/[^0-9]/g, '').slice(0, 6);

  const payload = {
    fullName: String(fullName || 'Applicant').trim(),
    phone: cleanPhone || '9876543210',
    email: String(email || 'applicant@flamepay.in').trim(),
    panCard: cleanPan || 'ABCDE1234F',
    pincode: cleanPincode || '110001',
    productId: Number(productId) || 88
  };

  const bodyString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', CHEAPKART_CONFIG.secretKey)
    .update(bodyString)
    .digest('hex');

  const url = `${CHEAPKART_CONFIG.baseUrl}/submit_lead.php`;
  console.log(`[CheapKart] Submitting lead for Product #${payload.productId} to ${url}`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': CHEAPKART_CONFIG.apiKey,
        'X-SIGNATURE': signature
      },
      body: bodyString,
      signal: AbortSignal.timeout(15000)
    });

    const data = await res.json();
    console.log('[CheapKart Lead Response]:', data);
    return data;
  } catch (err) {
    console.error('[CheapKart submitLead Error]:', err.message);
    return {
      status: false,
      message: err.message
    };
  }
};

module.exports = {
  CHEAPKART_CONFIG,
  getCreditCardProducts,
  submitApplicantLead
};
