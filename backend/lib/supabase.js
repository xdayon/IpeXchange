import { createClient } from '@supabase/supabase-js';
import { MOCK_LISTINGS } from './mockData.js';

// ─── User Management ──────────────────────────────────────────────────────────

let supabase = null;
let dbAvailable = false;

// In-memory fallback for when DB isn't set up yet
const inMemory = {
  sessions: {},
  messages: {},   // sessionId -> []
  intents: [],
  listings: [...MOCK_LISTINGS],
  demands: [],
  cycles: [
    {
      id: 'cycle-demo-3hop',
      hops: 3,
      matchScore: 94.5,
      valueRatio: 82.1,
      nodes: [
        { user: 'You', item: 'Electric Bike', price: 850, rep: 85, is_mock: true, sourceType: 'user_listing', avatar: null },
        { user: 'Bia Tech', item: 'Web Dev Consulting (10h)', price: 500, rep: 92, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'Bread & Co', item: 'Artisan Sourdough Subscription', price: 450, rep: 96, is_mock: true, sourceType: 'store_product', storeId: 'store-bakery', avatar: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&q=80&w=60&h=60' },
      ]
    },
    {
      id: 'cycle-demo-4hop',
      hops: 4,
      matchScore: 88.7,
      valueRatio: 74.0,
      nodes: [
        { user: 'You', item: 'Electric Bike', price: 850, rep: 85, is_mock: true, sourceType: 'user_listing', avatar: null },
        { user: 'FitCoach', item: 'Yoga Sessions (10h)', price: 600, rep: 88, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'CoffeeLab', item: 'Coffee Roasting Workshop', price: 700, rep: 94, is_mock: true, sourceType: 'store_product', storeId: 'store-coffee', avatar: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'AI Haus', item: 'Smart Home Setup', price: 800, rep: 91, is_mock: true, sourceType: 'store_product', storeId: 'store-aihaus', avatar: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=60&h=60' },
      ]
    },
    {
      id: 'cycle-demo-5hop',
      hops: 5,
      matchScore: 82.3,
      valueRatio: 71.5,
      nodes: [
        { user: 'You', item: 'Macbook Pro M1', price: 1200, rep: 85, is_mock: true, sourceType: 'user_listing', avatar: null },
        { user: 'Bia Tech', item: 'Web Dev Consulting (15h)', price: 1000, rep: 92, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'WoodCraft', item: 'Woodworking Workshop (5 lessons)', price: 900, rep: 79, is_mock: true, sourceType: 'user_listing', avatar: 'https://images.unsplash.com/photo-1540314227222-2daee298072c?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'Ipê Bakery', item: '3-Month Sourdough Subscription', price: 750, rep: 96, is_mock: true, sourceType: 'store_product', storeId: 'store-bakery', avatar: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=60&h=60' },
        { user: 'Green Roots', item: 'Organic Veggie Box (3 months)', price: 975, rep: 88, is_mock: true, sourceType: 'store_product', storeId: 'store-organic', avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=60&h=60' },
      ]
    }
  ],
};

try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log('⚡ Supabase client initialized');
} catch (e) {
  console.warn('⚠️  Supabase not configured — using in-memory fallback');
}

// Check if DB tables actually exist
async function checkDb() {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('sessions').select('id').limit(1);
    if (!error) {
      dbAvailable = true;
      console.log('✅ Supabase DB tables found — persistence enabled');
    } else {
      console.warn('⚠️  Supabase tables not found — using in-memory fallback. Run supabase_schema.sql in your Supabase dashboard.');
    }
  } catch (e) {
    console.warn('⚠️  Supabase connection failed — in-memory fallback active');
  }
}
checkDb();

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function upsertSession(sessionId) {
  if (!dbAvailable) {
    inMemory.sessions[sessionId] = { id: sessionId, last_seen: new Date().toISOString() };
    return;
  }
  const { error } = await supabase
    .from('sessions')
    .upsert({ id: sessionId, last_seen: new Date().toISOString() });
  if (error) console.error('upsertSession error:', error.message);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function saveMessage({ sessionId, role, content, isAudio = false }) {
  if (!dbAvailable) {
    if (!inMemory.messages[sessionId]) inMemory.messages[sessionId] = [];
    inMemory.messages[sessionId].push({ role, content, created_at: new Date().toISOString(), audio_transcript: isAudio });
    return;
  }
  const { error } = await supabase.from('messages').insert({
    session_id: sessionId,
    role,
    content,
    audio_transcript: isAudio,
  });
  if (error) console.error('saveMessage error:', error.message);
}

export async function getSessionHistory(sessionId, limit = 20) {
  if (!dbAvailable) {
    const msgs = (inMemory.messages[sessionId] || []).slice(-limit);
    return msgs;
  }
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at, audio_transcript')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('getSessionHistory error:', error.message);
    return [];
  }
  return data || [];
}

// ─── Intents ─────────────────────────────────────────────────────────────────

export async function saveIntent({ sessionId, intentType, item, category, confidence }) {
  if (!intentType || intentType === 'none' || !item) return;

  if (!dbAvailable) {
    inMemory.intents.push({ session_id: sessionId, intent_type: intentType, item, category, confidence, created_at: new Date().toISOString() });
    return;
  }
  const { error } = await supabase.from('user_intents').insert({
    session_id: sessionId,
    intent_type: intentType,
    item,
    category,
    confidence,
  });
  if (error) console.error('saveIntent error:', error.message);
}

export async function getHotIntents() {
  if (!dbAvailable) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recent = inMemory.intents.filter(i =>
      new Date(i.created_at).getTime() > since &&
      ['buy', 'trade', 'learn'].includes(i.intent_type) &&
      i.item
    );
    const counts = {};
    for (const row of recent) {
      const key = row.item.toLowerCase();
      if (!counts[key]) counts[key] = { item: row.item, category: row.category, count: 0 };
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('user_intents')
    .select('item, category, intent_type')
    .gte('created_at', since)
    .in('intent_type', ['buy', 'trade', 'learn'])
    .not('item', 'is', null);

  if (error) {
    console.error('getHotIntents error:', error.message);
    return [];
  }

  const counts = {};
  for (const row of data || []) {
    const key = row.item.toLowerCase();
    if (!counts[key]) counts[key] = { item: row.item, category: row.category, count: 0 };
    counts[key].count++; 
  }
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
}

// ─── Listings ─────────────────────────────────────────────────────────────────
// Helper to format DB rows to frontend format
function buildPaymentTypes(l) {
  const types = [];
  if (l.price_fiat > 0) types.push('fiat');
  if (l.price_crypto > 0) types.push('crypto');
  if (l.accepts_trade) types.push('trade');
  return types.length > 0 ? types : ['free'];
}

function mapListingToFrontend(l) {
  return {
    id: l.id,
    title: l.title,
    description: l.description,
    category: l.category,
    subcategory: l.subcategory || null,
    tags: l.tags || [],
    condition: l.condition,
    price: l.price_fiat != null ? `$${Number(l.price_fiat).toFixed(0)}` : null,
    price_fiat: l.price_fiat,
    price_crypto: l.price_crypto,
    acceptedPayments: buildPaymentTypes(l),
    provider: l.provider_name || 'Anonymous',
    image: l.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&q=80&w=400&h=300',
    is_mock: l.is_mock || false,
    availability: l.availability || null,
    location_label: l.location_label || 'Ipê City',
    quantity: l.quantity || 1,
    unit: l.unit || null,
    duration_minutes: l.duration_minutes || null,
    is_remote: l.is_remote || false,
    isPublic: true,
  };
}

export async function getListings({ category = null, subcategory = null, tags = null, limit = 50 } = {}) {
  if (!dbAvailable) {
    return inMemory.listings;
  }

  try {
    let query = supabase
      .from('listings')
      .select('id, title, description, category, subcategory, tags, condition, price_fiat, price_crypto, accepts_trade, trade_wants, provider_name, image_url, active, is_mock, availability, location_label, quantity, unit, duration_minutes, is_remote, created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'All') query = query.eq('category', category);
    if (subcategory) query = query.eq('subcategory', subcategory);
    if (tags && tags.length > 0) query = query.overlaps('tags', tags);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapListingToFrontend);
  } catch (error) {
    console.error('getListings error:', error);
    return [];
  }
}

export async function createListing({ sessionId, listing, embedding = null }) {
  const {
    title, description, category, condition,
    price_fiat, price_crypto, accepts_trade,
    trade_wants, provider_name, image_url,
  } = listing;

  if (!dbAvailable) {
    const newListing = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      title, description, category, condition,
      price_fiat, price_crypto, accepts_trade,
      trade_wants, provider_name, image_url,
      active: true,
      ai_generated: true,
      is_mock: false,
      created_at: new Date().toISOString(),
    };
    inMemory.listings.push(newListing);
    return newListing;
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      session_id: sessionId,
      title,
      description,
      category,
      condition,
      price_fiat: price_fiat || null,
      price_crypto: price_crypto || null,
      accepts_trade: accepts_trade || false,
      trade_wants: trade_wants || null,
      provider_name: provider_name || null,
      image_url: image_url || null,
      active: true,
      ai_generated: true,
      is_mock: false,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single();

  if (error) {
    console.error('createListing error:', error.message);
    return null;
  }
  return data;
}

// Semantic search: find listings similar to a query embedding
export async function searchListingsBySimilarity(embedding, limit = 5) {
  if (!dbAvailable || !embedding) return [];

  const { data, error } = await supabase.rpc('match_listings', {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.70,
    match_count: limit,
  });

  if (error) {
    console.error('searchListingsBySimilarity error:', error.message);
    return [];
  }
  return (data || []).map(mapListingToFrontend);
}

// ─── Demands ──────────────────────────────────────────────────────────────────

export async function createDemand({ sessionId, description, category, maxBudgetFiat, acceptsTrade, embedding = null }) {
  if (!dbAvailable) {
    const demand = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      description,
      category,
      max_budget_fiat: maxBudgetFiat || null,
      accepts_trade: acceptsTrade !== false,
      resolved: false,
      is_mock: false,
      created_at: new Date().toISOString(),
    };
    inMemory.demands.push(demand);
    return demand;
  }

  const { data, error } = await supabase
    .from('demands')
    .insert({
      session_id: sessionId,
      description,
      category,
      max_budget_fiat: maxBudgetFiat || null,
      accepts_trade: acceptsTrade !== false,
      resolved: false,
      is_mock: false,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single();

  if (error) {
    console.error('createDemand error:', error.message);
    return null;
  }
  return data;
}

// ─── Multi-Hop Engine ─────────────────────────────────────────────────────────

export async function getTradeCycles(sessionId) {
  if (!dbAvailable || !sessionId) {
    return inMemory.cycles;
  }

  const { data, error } = await supabase.rpc('find_trade_cycles', {
    target_session_id: sessionId,
    match_threshold: 0.65,
  });

  if (error) {
    console.error('getTradeCycles error:', error.message);
    return inMemory.cycles;
  }
  
  // Pl/PgSQL JSONB returns either null or an array
  return data && data.length > 0 ? data : inMemory.cycles;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Creates or updates a user record tied to their Privy identity.
 * Called once on login. Safe to call multiple times (upsert by wallet_address).
 */
export async function upsertUser({ walletAddress, email, privyId, displayName }) {
  if (!dbAvailable) {
    // In-memory fallback — just return a minimal user object
    return { id: privyId || walletAddress, wallet_address: walletAddress, email, display_name: displayName, ipe_rep_score: 0 };
  }

  const now = new Date().toISOString();
  const identifier = walletAddress || email;
  if (!identifier) return null;

  // Build the upsert payload
  const payload = {
    last_seen: now,
    ...(walletAddress && { wallet_address: walletAddress }),
    ...(email        && { email }),
    ...(privyId      && { privy_id: privyId }),
    ...(displayName  && { display_name: displayName }),
  };

  // Try upsert by wallet address first, fall back to email
  const conflictColumn = walletAddress ? 'wallet_address' : 'email';

  const { data, error } = await supabase
    .from('users')
    .upsert({ ...payload, created_at: now }, { onConflict: conflictColumn, ignoreDuplicates: false })
    .select()
    .single();

  if (error) {
    console.error('upsertUser error:', error.message);
    return null;
  }
  return data;
}

/**
 * Returns a user's profile including aggregated stats:
 * listing count, purchase count, and base rep score.
 */
export async function getUserProfile(walletAddress) {
  if (!dbAvailable || !walletAddress) return null;

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (userErr || !user) {
    console.error('getUserProfile error:', userErr?.message);
    return null;
  }

  // Count listings created by this user
  const { count: listingCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', walletAddress)
    .eq('active', true);

  // Count purchases (transactions as buyer)
  const { count: purchaseCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_wallet', walletAddress);

  // Count sales (transactions as seller)
  const { count: salesCount } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('seller_wallet', walletAddress);

  const totalTx = (purchaseCount || 0) + (salesCount || 0);

  // Simple reputation formula: base 0, +2 per completed tx, capped at 100
  const computedRep = Math.min(100, totalTx * 2);
  const repScore = Math.max(user.ipe_rep_score || 0, computedRep);

  return {
    ...user,
    listing_count: listingCount || 0,
    purchase_count: purchaseCount || 0,
    sales_count: salesCount || 0,
    total_tx: totalTx,
    rep_score: repScore,
  };
}

/**
 * Returns a user's recent transactions (as buyer or seller).
 */
export async function getUserTransactions(walletAddress, limit = 20) {
  if (!dbAvailable || !walletAddress) return [];

  // Fetch as buyer
  const { data: asBuyer, error: buyerErr } = await supabase
    .from('transactions')
    .select('id, listing_id, amount_fiat, amount_crypto, currency, is_trade, trade_description, created_at, seller_wallet, listing:listings(title, category, image_url)')
    .eq('buyer_wallet', walletAddress)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (buyerErr) console.error('getUserTransactions (buyer) error:', buyerErr.message);

  // Fetch as seller
  const { data: asSeller, error: sellerErr } = await supabase
    .from('transactions')
    .select('id, listing_id, amount_fiat, amount_crypto, currency, is_trade, trade_description, created_at, buyer_wallet, listing:listings(title, category, image_url)')
    .eq('seller_wallet', walletAddress)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (sellerErr) console.error('getUserTransactions (seller) error:', sellerErr.message);

  const buyerTxs = (asBuyer || []).map(tx => ({ ...tx, direction: 'out', counterparty: tx.seller_wallet }));
  const sellerTxs = (asSeller || []).map(tx => ({ ...tx, direction: 'in', counterparty: tx.buyer_wallet }));

  return [...buyerTxs, ...sellerTxs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

/**
 * Records a completed purchase transaction.
 * Called from checkout after the user confirms.
 */
export async function recordTransaction({ listingId, buyerWallet, sellerWallet, amountFiat, amountCrypto, currency, isTrade, tradeDescription }) {
  if (!dbAvailable) return null;

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      listing_id: listingId || null,
      buyer_wallet: buyerWallet || null,
      seller_wallet: sellerWallet || null,
      amount_fiat: amountFiat || null,
      amount_crypto: amountCrypto || null,
      currency: currency || 'USD',
      is_trade: isTrade || false,
      trade_description: tradeDescription || null,
    })
    .select()
    .single();

  if (error) {
    console.error('recordTransaction error:', error.message);
    return null;
  }
  return data;
}

// ─── Stores ───────────────────────────────────────────────────────────────────

/**
 * Returns all active stores, optionally filtered by category.
 */
export async function getStores({ category = null } = {}) {
  if (!dbAvailable) return [];

  let query = supabase
    .from('stores')
    .select('id, session_id, name, category, description, address, on_chain, reputation_score, icon_key, icon_color, icon_bg, owner_ens, rating, review_count, tags, is_mock')
    .eq('active', true)
    .order('reputation_score', { ascending: false });

  if (category && category !== 'All') query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('getStores error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Returns all active products for a given store.
 * Includes price_fiat for value-balance engine.
 */
export async function getStoreProducts(storeId) {
  if (!dbAvailable || !storeId) return [];

  const { data, error } = await supabase
    .from('store_products')
    .select('id, store_id, name, type, description, price_fiat, price_label, image_url, payments, accepts_trade, is_mock')
    .eq('store_id', storeId)
    .eq('active', true)
    .order('price_fiat', { ascending: true });

  if (error) {
    console.error('getStoreProducts error:', error.message);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    // Normalize price_label: use stored label or build from price_fiat
    price: p.price_label || (p.price_fiat > 0 ? `$${p.price_fiat}` : 'Free'),
    payments: p.payments || ['fiat'],
    desc: p.description,
    image: p.image_url,
  }));
}

/**
 * Returns all store products that accept trade, across all stores.
 * Used by the Multi-Hop engine context and Discover page.
 */
export async function getAllTradeableStoreProducts({ limit = 50 } = {}) {
  if (!dbAvailable) return [];

  const { data, error } = await supabase
    .from('store_products')
    .select('id, store_id, name, type, description, price_fiat, price_label, image_url, payments, accepts_trade, is_mock, stores(name, category, reputation_score)')
    .eq('active', true)
    .eq('accepts_trade', true)
    .order('price_fiat', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getAllTradeableStoreProducts error:', error.message);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    provider: p.stores?.name || 'Store',
    category: p.stores?.category || 'Commerce',
    price: p.price_label || (p.price_fiat > 0 ? `$${p.price_fiat}` : 'Free'),
    acceptedPayments: p.payments || ['fiat'],
    image: p.image_url,
    sourceType: 'store_product',
  }));
}

export async function seedDatabase(sessions, listings, demands) {
  if (!dbAvailable) return { success: false, error: 'Database not available' };

  try {
    // 1. Sessions
    if (sessions?.length) {
      await supabase.from('sessions').upsert(sessions, { onConflict: 'id' });
    }

    // 2. Listings
    if (listings?.length) {
      await supabase.from('listings').upsert(listings, { onConflict: 'mock_key' });
    }

    // 3. Demands
    if (demands?.length) {
      // Use upsert with mock_key to avoid duplicates during re-seeds
      await supabase.from('demands').upsert(demands, { onConflict: 'mock_key', ignoreDuplicates: true });
    }

    return { success: true };
  } catch (err) {
    console.error('seedDatabase error:', err);
    return { success: false, error: err.message };
  }
}

export async function getCityGraphData() {
  if (!dbAvailable) {
    return { listings: [], users: [], stores: [], transactions: [], demands: [] };
  }
  try {
    const [listingsRes, usersRes, storesRes, txRes, demandsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, description, category, subcategory, price_fiat, accepts_trade, trade_wants, provider_name, image_url, is_mock, mock_key, location_lat, location_lng, location_privacy, session_id')
        .eq('active', true)
        .limit(80),
      supabase
        .from('users')
        .select('id, display_name, wallet_address, ipe_rep_score, location_lat, location_lng')
        .limit(40),
      supabase
        .from('stores')
        .select('id, name, description, category, location_lat, location_lng, is_mock, session_id')
        .limit(30),
      supabase
        .from('transactions')
        .select('id, listing_id, buyer_wallet, seller_wallet, is_trade, created_at')
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('demands')
        .select('id, session_id, description, category, is_mock')
        .eq('is_mock', false)
        .limit(40),
    ]);
    return {
      listings: listingsRes.data || [],
      users: usersRes.data || [],
      stores: storesRes.data || [],
      transactions: txRes.data || [],
      demands: demandsRes.data || [],
    };
  } catch (err) {
    console.error('getCityGraphData error:', err);
    return { listings: [], users: [], stores: [], transactions: [], demands: [] };
  }
}

export async function getListingsBySession(sessionId) {
  if (!dbAvailable || !sessionId) return [];
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, category, active, location_privacy, created_at')
    .eq('session_id', sessionId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data || [];
}

export async function updateListingPrivacy(listingId, sessionId, locationPrivacy) {
  if (!dbAvailable) throw new Error('DB not available');
  const { data, error } = await supabase
    .from('listings')
    .update({ location_privacy: locationPrivacy })
    .eq('id', listingId)
    .eq('session_id', sessionId)
    .select('id, location_privacy')
    .single();
  if (error) throw error;
  return data;
}

export default supabase;
