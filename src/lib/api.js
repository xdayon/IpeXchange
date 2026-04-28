// API Library for IpeXchange

let API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
if (API_URL.startsWith('http') && !API_URL.endsWith('/api')) {
  API_URL += '/api';
}

export async function sendChatMessage(sessionId, message, isAudio = false, audioBase64 = null, mimeType = null, walletAddress = null) {
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, isAudio, audioBase64, mimeType, walletAddress }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('sendChatMessage error:', error);
    // Fallback for demo if API is offline
    return {
      text: '⚡ Core is currently offline. Please try again later.',
      cta: null,
      rateLimited: false,
    };
  }
}

export async function fetchSessionHistory(sessionId) {
  try {
    const response = await fetch(`${API_URL}/history/${sessionId}`);
    if (!response.ok) throw new Error('History fetch failed');
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('fetchSessionHistory error:', error);
    return [];
  }
}

export async function fetchDiscoverItems() {
  try {
    const response = await fetch(`${API_URL}/discover`);
    if (!response.ok) throw new Error('Discover fetch failed');
    return await response.json();
  } catch (error) {
    console.error('fetchDiscoverItems error:', error);
    return { listings: [], trending: [], hotIntents: [] };
  }
}

export async function pingHealth() {
  try {
    await fetch(`${API_URL}/health`);
  } catch (error) {
    // Ignore, just a keepalive ping
  }
}

// ─── User Identity ──────────────────────────────────────────────────────────

/** Called once after Privy login. Creates/updates the user record in the DB. */
export async function upsertUser({ walletAddress, email, privyId, displayName }) {
  try {
    const res = await fetch(`${API_URL}/users/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, email, privyId, displayName }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('upsertUser error:', err);
    return null;
  }
}

/** Fetches full profile + aggregated stats for the given wallet address. */
export async function fetchUserProfile(walletAddress) {
  if (!walletAddress) return null;
  try {
    const res = await fetch(`${API_URL}/users/${walletAddress}/profile`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.profile || null;
  } catch (err) {
    console.error('fetchUserProfile error:', err);
    return null;
  }
}

/** Fetches the user's recent transactions (purchases + sales). */
export async function fetchUserTransactions(walletAddress, limit = 20) {
  if (!walletAddress) return [];
  try {
    const res = await fetch(`${API_URL}/users/${walletAddress}/transactions?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.transactions || [];
  } catch (err) {
    console.error('fetchUserTransactions error:', err);
    return [];
  }
}

/** Records a completed purchase/sale in the DB. */
export async function recordTransaction({ listingId, buyerWallet, sellerWallet, amountFiat, currency, isTrade, tradeDescription }) {
  try {
    const res = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, buyerWallet, sellerWallet, amountFiat, currency, isTrade, tradeDescription }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('recordTransaction error:', err);
    return null;
  }
}
