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

export async function publishListing(sessionId, listing) {
  try {
    const response = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, listing }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('publishListing error:', error);
    return null;
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

export async function fetchDiscoverItems({ category, subcategory, tags } = {}) {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (tags && tags.length > 0) params.set('tags', tags.join(','));
    const url = `${API_URL}/discover${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
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

export async function seedMockData() {
  try {
    const res = await fetch(`${API_URL}/admin/seed`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.error('seedMockData error:', err);
    return { error: err.message };
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

export async function fetchCityGraphData() {
  try {
    const res = await fetch(`${API_URL}/city-graph`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchCityGraphData error:', err);
    return { entities: [], edges: [] };
  }
}

export async function fetchMyListingsReal(sessionId) {
  try {
    const res = await fetch(`${API_URL}/listings/mine?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    return data.listings || [];
  } catch {
    return [];
  }
}

export async function toggleListingPrivacy(listingId, sessionId, locationPrivacy) {
  const res = await fetch(`${API_URL}/listings/${listingId}/privacy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, location_privacy: locationPrivacy }),
  });
  return res.json();
}
