// backend/lib/cityGraphBuilder.js
// Transforms raw Supabase data into the city-graph entity+edge format.

const BBOX = {
  minLat: -27.4518, maxLat: -27.4334,
  minLon: -48.5135, maxLon: -48.4905,
};

// Deterministic coordinates for entities without real lat/lon.
// Uses a simple string hash to produce stable positions within Jurerê bbox.
function deterministicCoords(seed) {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = (Math.imul(31, h1) + c) | 0;
    h2 = (Math.imul(37, h2) + c) | 0;
  }
  const t1 = (Math.abs(h1) % 9000 + 500) / 10000;
  const t2 = (Math.abs(h2) % 9000 + 500) / 10000;
  return {
    lat: BBOX.minLat + t1 * (BBOX.maxLat - BBOX.minLat),
    lon: BBOX.minLon + t2 * (BBOX.maxLon - BBOX.minLon),
  };
}

const CATEGORY_TO_KIND = {
  Products: 'marketplace',
  Services: 'skill-exchange',
  Knowledge: 'skill-exchange',
  Donations: 'marketplace',
};

function listingToEntity(listing) {
  const location = (listing.location_lat && listing.location_lng)
    ? { lat: listing.location_lat, lon: listing.location_lng }
    : deterministicCoords(listing.mock_key || listing.id);

  return {
    id: `listing-${listing.id}`,
    layer: 'commerce',
    label: listing.title,
    description: listing.description || '',
    location,
    status: 'active',
    createdAt: listing.created_at || new Date().toISOString(),
    kind: CATEGORY_TO_KIND[listing.category] || 'marketplace',
    category: listing.category,
    provider: listing.provider_name || 'Unknown',
    priceFiat: listing.price_fiat,
    acceptsTrade: listing.accepts_trade,
    tradeWants: listing.trade_wants,
    image: listing.image_url,
    isMock: listing.is_mock,
    sessionId: listing.session_id,
    sourceType: 'listing',
  };
}

function userToEntity(user) {
  const location = (user.location_lat && user.location_lng)
    ? { lat: user.location_lat, lon: user.location_lng }
    : deterministicCoords(user.wallet_address || user.id);

  return {
    id: `user-${user.id}`,
    layer: 'identity',
    label: user.display_name || user.wallet_address?.slice(0, 8) + '...' || 'Citizen',
    description: `Ipê Rep Score: ${user.ipe_rep_score || 0}`,
    location,
    status: 'active',
    createdAt: new Date().toISOString(),
    wallet: user.wallet_address,
    repScore: user.ipe_rep_score,
    sourceType: 'user',
  };
}

function storeToEntity(store) {
  const location = (store.location_lat && store.location_lng)
    ? { lat: store.location_lat, lon: store.location_lng }
    : deterministicCoords(store.id);

  return {
    id: `store-${store.id}`,
    layer: 'commerce',
    label: store.name,
    description: store.description || '',
    location,
    status: 'active',
    createdAt: new Date().toISOString(),
    kind: 'store',
    category: store.category,
    isMock: store.is_mock,
    sourceType: 'store',
  };
}

function transactionToEdge(tx, listingEntityMap) {
  const targetId = `listing-${tx.listing_id}`;
  if (!listingEntityMap[targetId]) return null;
  return {
    id: `tx-${tx.id}`,
    source: targetId,
    target: targetId,
    relationship: tx.is_trade ? 'trade' : 'purchase',
    label: tx.is_trade ? 'Trade' : 'Purchase',
    buyerWallet: tx.buyer_wallet,
    sellerWallet: tx.seller_wallet,
    createdAt: tx.created_at,
  };
}

// Synthesize edges between listings that share trade relationships
// (listing A wants what listing B offers and vice versa)
function synthesizeTradeEdges(listings) {
  const edges = [];
  for (let i = 0; i < listings.length; i++) {
    for (let j = i + 1; j < listings.length; j++) {
      const a = listings[i];
      const b = listings[j];
      if (!a.accepts_trade || !b.accepts_trade) continue;
      const aWants = (a.trade_wants || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      const bWants = (b.trade_wants || '').toLowerCase();
      const aTitle = (a.title || '').toLowerCase();
      const aMatchesB = aWants && bTitle && (
        aWants.split(' ').some(word => word.length > 4 && bTitle.includes(word))
      );
      const bMatchesA = bWants && aTitle && (
        bWants.split(' ').some(word => word.length > 4 && aTitle.includes(word))
      );
      if (aMatchesB || bMatchesA) {
        edges.push({
          id: `trade-match-${a.id}-${b.id}`,
          source: `listing-${a.id}`,
          target: `listing-${b.id}`,
          relationship: 'trade-match',
          label: 'Trade Match',
        });
      }
    }
  }
  return edges;
}

export function buildCityGraphPayload({ listings, users, stores, transactions, demands }) {
  const entities = [
    ...listings.map(listingToEntity),
    ...users.map(userToEntity),
    ...stores.map(storeToEntity),
  ];

  const listingEntityMap = {};
  entities.forEach(e => { listingEntityMap[e.id] = e; });

  const txEdges = transactions
    .map(tx => transactionToEdge(tx, listingEntityMap))
    .filter(Boolean);

  const tradeEdges = synthesizeTradeEdges(listings);

  // Deduplicate edges
  const seenEdges = new Set();
  const edges = [...txEdges, ...tradeEdges].filter(e => {
    const key = `${e.source}-${e.target}`;
    if (seenEdges.has(key)) return false;
    seenEdges.add(key);
    return true;
  });

  return { entities, edges };
}
