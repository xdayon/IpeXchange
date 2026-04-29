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
// ─── Static entities for non-DB layers ───────────────────────────────────────
// These mirror the data from ipe-city-graph's static TypeScript files.
// They populate infrastructure, governance, safety, environment, and events layers.

const STATIC_ENTITIES = [
  // ── Identity (citizen personas from mock sessions) ─────────────────────────
  { id: 'citizen-alex',       layer: 'identity', label: 'Alex M.',     description: 'Ipê City resident. Offers electric mobility and tech gear.',      location: { lat: -27.43890, lon: -48.49985 } },
  { id: 'citizen-bia',        layer: 'identity', label: 'Bia Tech',    description: 'Full-stack developer. React, Next.js, Node.js. AI automation.',    location: { lat: -27.43810, lon: -48.50120 } },
  { id: 'citizen-bread',      layer: 'identity', label: 'Bread & Co',  description: 'Artisan baker. Sourdough subscriptions. Loves fresh produce.',     location: { lat: -27.44050, lon: -48.50200 } },
  { id: 'citizen-luna',       layer: 'identity', label: 'Luna Foto',   description: 'Photographer and videographer. Available for events and portraits.',location: { lat: -27.44200, lon: -48.49800 } },
  { id: 'citizen-fitcoach',   layer: 'identity', label: 'FitCoach',    description: 'Personal trainer and wellness coach. Yoga, strength, mobility.',    location: { lat: -27.43750, lon: -48.50400 } },
  { id: 'citizen-sound',      layer: 'identity', label: 'Sound Lab',   description: 'Sound healing practitioner. Crystal bowls, gongs, group journeys.',location: { lat: -27.44300, lon: -48.50350 } },
  { id: 'citizen-green',      layer: 'identity', label: 'Green Roots', description: 'Permaculture designer. Solar kits, urban farming workshops.',        location: { lat: -27.44100, lon: -48.50600 } },
  { id: 'citizen-code',       layer: 'identity', label: 'Code Lab',    description: 'Python and AI educator. No-code tools. Workshops and mentoring.',   location: { lat: -27.43900, lon: -48.50550 } },
  { id: 'citizen-marina',     layer: 'identity', label: 'Marina H.',   description: 'Reiki practitioner and breathwork guide. Holistic healing space.',  location: { lat: -27.44166, lon: -48.50434 } },
  { id: 'citizen-trailco',    layer: 'identity', label: 'TrailCo',     description: 'Outdoor adventure gear rental. Kayaking and trail exploration.',    location: { lat: -27.44400, lon: -48.49700 } },
  { id: 'citizen-pixel',      layer: 'identity', label: 'Studio Pixel',description: 'Graphic designer and brand identity specialist. Visual storytelling.',location: { lat: -27.43680, lon: -48.50250 } },
  { id: 'citizen-balance',    layer: 'identity', label: 'Balance Studio',description: 'Acupuncture and life coaching. Traditional medicine meets modern coaching.',location: { lat: -27.44050, lon: -48.50450 } },
  { id: 'citizen-inner',      layer: 'identity', label: 'Inner Spaces',description: 'Mindfulness and meditation programs. 8-week MBSR curriculum.',     location: { lat: -27.44350, lon: -48.50150 } },
  { id: 'citizen-skyview',    layer: 'identity', label: 'SkyView Lab', description: 'Drone pilot and aerial photographer. DJI specialist.',              location: { lat: -27.43700, lon: -48.49900 } },
  { id: 'citizen-community',  layer: 'identity', label: 'Community Hub',description: 'Ipê City community center. Donations, events, shared resources.',  location: { lat: -27.44050, lon: -48.50050 } },

  // ── Venues (commerce, special gold markers) ────────────────────────────────
  { id: 'venue-founder-haus', layer: 'commerce', label: 'Founder Haus', description: 'The main co-living and co-working hub of Ipê City. Builders, creators, operators gather here.', location: { lat: -27.43890, lon: -48.49985 }, kind: 'venue' },
  { id: 'venue-ai-haus',      layer: 'commerce', label: 'AI Haus',      description: 'ML research and hackathon space. Weekly AI study groups and builders sprint.', location: { lat: -27.43747, lon: -48.50342 }, kind: 'venue' },
  { id: 'venue-privacy-haus', layer: 'commerce', label: 'Privacy Haus', description: 'ZK and cryptography builders space. Smart contract audits and security research.', location: { lat: -27.44166, lon: -48.50434 }, kind: 'venue' },

  // ── Infrastructure ─────────────────────────────────────────────────────────
  { id: 'infra-solar-north',   layer: 'infrastructure', label: 'North Solar Array',     description: 'Community solar panel cluster powering the co-working hub. 50kW, currently at 34kW load.', location: { lat: -27.43822, lon: -48.50714 }, kind: 'solar-panel',  capacity: 50,   currentLoad: 34,  unit: 'kW' },
  { id: 'infra-solar-south',   layer: 'infrastructure', label: 'South Solar Array',     description: 'Residential solar cluster along the southern village grid. 35kW capacity.', location: { lat: -27.44478, lon: -48.50050 }, kind: 'solar-panel',  capacity: 35,   currentLoad: 28,  unit: 'kW' },
  { id: 'infra-internet-hub',  layer: 'infrastructure', label: 'Mesh Internet Hub',     description: 'Main internet relay node providing decentralized connectivity. 1Gbps, 620Mbps in use.', location: { lat: -27.43845, lon: -48.50142 }, kind: 'internet-node', capacity: 1000, currentLoad: 620, unit: 'Mbps' },
  { id: 'infra-internet-beach',layer: 'infrastructure', label: 'Beachfront Relay',      description: 'Coastal mesh node extending coverage to the beach. 500Mbps, 180Mbps in use.', location: { lat: -27.43701, lon: -48.49950 }, kind: 'internet-node', capacity: 500,  currentLoad: 180, unit: 'Mbps' },
  { id: 'infra-water-main',    layer: 'infrastructure', label: 'Water Quality Station', description: 'Monitors and filters village water supply with real-time quality reporting. 72% capacity.', location: { lat: -27.44123, lon: -48.49687 }, kind: 'water-station', capacity: 100,  currentLoad: 72,  unit: '%' },
  { id: 'infra-ev-charger',    layer: 'infrastructure', label: 'EV Charging Station',   description: 'Four-port electric vehicle charging station powered by South Solar Array. 2/4 ports active.', location: { lat: -27.44413, lon: -48.50623 }, kind: 'ev-charger',   capacity: 4,    currentLoad: 2,   unit: 'ports' },
  { id: 'infra-power-grid',    layer: 'infrastructure', label: 'Microgrid Controller',  description: 'Smart grid controller balancing solar, battery, and grid power. 145kW / 200kW.', location: { lat: -27.43850, lon: -48.49822 }, kind: 'power-grid',   capacity: 200,  currentLoad: 145, unit: 'kW' },

  // ── Governance ─────────────────────────────────────────────────────────────
  { id: 'gov-bike-lanes',      layer: 'governance', label: 'Bike Lane Expansion',        description: 'Proposal to extend bike lane network by 2.4km. 24 votes for, 3 against. Budget: $15,000.', location: { lat: -27.43945, lon: -48.50567 }, status: 'active', votesFor: 24, votesAgainst: 3,  budget: 15000 },
  { id: 'gov-garden',          layer: 'governance', label: 'Community Garden',           description: 'Permaculture food garden proposal. Already passed: 31 for, 2 against. Budget: $8,000.', location: { lat: -27.44452, lon: -48.50430 }, status: 'passed', votesFor: 31, votesAgainst: 2,  budget: 8000 },
  { id: 'gov-noise-policy',    layer: 'governance', label: 'Data-Driven Noise Ordinance',description: 'Draft proposal using sensor data to shape noise policies. Community-driven, pending votes.', location: { lat: -27.44379, lon: -48.49593 }, status: 'draft',  votesFor: 0,  votesAgainst: 0, budget: 0 },

  // ── Safety ─────────────────────────────────────────────────────────────────
  { id: 'safety-flood',   layer: 'safety', label: 'Coastal Flood Warning',   description: 'Medium severity. High tide + storm surge advisory for beachfront properties. Marcelo and Lucas responding.', location: { lat: -27.44000, lon: -48.49000 }, severity: 'medium', resolved: false },
  { id: 'safety-power',   layer: 'safety', label: 'Microgrid Brownout',      description: 'Low severity. Temporary power dip in south sector. Battery backup engaged. Pedro responding.', location: { lat: -27.44300, lon: -48.50500 }, severity: 'low', resolved: true },
  { id: 'safety-zone-beach',  layer: 'safety', label: 'Beachfront Monitoring Zone',  description: 'Environmental monitoring zone for flood and storm surge conditions. 60m radius.', location: { lat: -27.44050, lon: -48.49200 }, isSafetyZone: true, zoneRadiusMeters: 80 },
  { id: 'safety-zone-village',layer: 'safety', label: 'Village Core Response Zone',  description: 'Primary emergency response area covering the residential village grid. 80m radius.', location: { lat: -27.44100, lon: -48.50300 }, isSafetyZone: true, zoneRadiusMeters: 110 },

  // ── Environment sensors ────────────────────────────────────────────────────
  { id: 'env-air-north',      layer: 'environment', label: 'Air Quality — North',    description: 'AQI 28 — excellent. Beachfront sensor monitoring particulate matter and CO₂.',     location: { lat: -27.43800, lon: -48.49700 }, value: 28,   unit: ' AQI' },
  { id: 'env-air-south',      layer: 'environment', label: 'Air Quality — South',    description: 'AQI 22 — excellent. Residential area sensor.',                                       location: { lat: -27.44300, lon: -48.50100 }, value: 22,   unit: ' AQI' },
  { id: 'env-noise-beach',    layer: 'environment', label: 'Noise Level — Beach',    description: '52 dB near event areas. Within normal parameters for daytime activity.',             location: { lat: -27.43900, lon: -48.49600 }, value: 52,   unit: 'dB' },
  { id: 'env-noise-village',  layer: 'environment', label: 'Noise Level — Village',  description: '38 dB in village core. Quiet residential ambiance.',                                  location: { lat: -27.44200, lon: -48.50200 }, value: 38,   unit: 'dB' },
  { id: 'env-water-lagoon',   layer: 'environment', label: 'Water Quality — Lagoon', description: '92% safe. Lagoon edge water sensor. Monitoring pH, turbidity and contaminants.',      location: { lat: -27.44400, lon: -48.49900 }, value: '92%', unit: ' safe' },
  { id: 'env-temp-center',    layer: 'environment', label: 'Temperature — Center',   description: '26°C at village center. Comfortable for outdoor activity.',                           location: { lat: -27.44100, lon: -48.50100 }, value: 26,   unit: '°C' },

  // ── Events ─────────────────────────────────────────────────────────────────
  { id: 'event-grants',   layer: 'events', label: 'Grants Kickoff',     description: 'Opening ceremony for Ipê Village 2026 grants program. All citizens welcome.', location: { lat: -27.43890, lon: -48.49985 }, startDate: '2026-05-06', attendees: 48 },
  { id: 'event-xmtp',    layer: 'events', label: 'XMTP Workshop',       description: 'Hands-on workshop building encrypted, wallet-native messaging apps.',          location: { lat: -27.43890, lon: -48.49985 }, startDate: '2026-05-10', attendees: 24 },
  { id: 'event-ai-gov',  layer: 'events', label: 'AI Governance',       description: 'Exploring AI agents for Ipê City operations. Open discussion format.',          location: { lat: -27.43747, lon: -48.50342 }, startDate: '2026-05-14', attendees: 36 },
];

// Mock session ID → citizen entity ID mapping
const SESSION_TO_CITIZEN = {
  'test-session-id':    'citizen-alex',
  'bia-tech-id':        'citizen-bia',
  'bread-co-id':        'citizen-bread',
  'luna-photo-id':      'citizen-luna',
  'fitcoach-id':        'citizen-fitcoach',
  'sound-lab-id':       'citizen-sound',
  'green-roots-id':     'citizen-green',
  'code-lab-id':        'citizen-code',
  'ipe-farm-id':        'citizen-alex',
  'marina-h-id':        'citizen-marina',
  'trailco-id':         'citizen-trailco',
  'studio-pixel-id':    'citizen-pixel',
  'balance-studio-id':  'citizen-balance',
  'inner-spaces-id':    'citizen-inner',
  'skyview-lab-id':     'citizen-skyview',
  'community-id':       'citizen-community',
};

// Static relationships between entities in different layers
const STATIC_EDGES = [
  // Venues ↔ citizens
  { id: 'e-alex-founder',       source: 'citizen-alex',      target: 'venue-founder-haus', relationship: 'uses',       label: 'Resident' },
  { id: 'e-bia-ai-haus',        source: 'citizen-bia',       target: 'venue-ai-haus',      relationship: 'provides',   label: 'Builder' },
  { id: 'e-marina-privacy',     source: 'citizen-marina',    target: 'venue-privacy-haus', relationship: 'uses',       label: 'Practitioner' },
  { id: 'e-code-ai-haus',       source: 'citizen-code',      target: 'venue-ai-haus',      relationship: 'provides',   label: 'Educator' },
  { id: 'e-pixel-founder',      source: 'citizen-pixel',     target: 'venue-founder-haus', relationship: 'provides',   label: 'Creative' },
  // Venues ↔ events
  { id: 'e-grants-founder',     source: 'event-grants',      target: 'venue-founder-haus', relationship: 'hosts',      label: 'Hosted at' },
  { id: 'e-xmtp-founder',       source: 'event-xmtp',        target: 'venue-founder-haus', relationship: 'hosts',      label: 'Hosted at' },
  { id: 'e-ai-gov-aihaus',      source: 'event-ai-gov',      target: 'venue-ai-haus',      relationship: 'hosts',      label: 'Hosted at' },
  // Infrastructure ↔ venues
  { id: 'e-solar-n-founder',    source: 'infra-solar-north', target: 'venue-founder-haus', relationship: 'powers',     label: 'Powers' },
  { id: 'e-solar-s-ev',         source: 'infra-solar-south', target: 'infra-ev-charger',   relationship: 'powers',     label: 'Powers' },
  { id: 'e-grid-solar-n',       source: 'infra-power-grid',  target: 'infra-solar-north',  relationship: 'depends-on', label: 'Balances' },
  { id: 'e-grid-solar-s',       source: 'infra-power-grid',  target: 'infra-solar-south',  relationship: 'depends-on', label: 'Balances' },
  { id: 'e-internet-founder',   source: 'infra-internet-hub',target: 'venue-founder-haus', relationship: 'provides',   label: 'Connects' },
  // Safety ↔ infrastructure/environment
  { id: 'e-flood-water',        source: 'safety-flood',      target: 'infra-water-main',   relationship: 'monitors',   label: 'Monitors' },
  { id: 'e-power-grid',         source: 'safety-power',      target: 'infra-power-grid',   relationship: 'responds-to',label: 'Responded' },
  // Governance ↔ citizens/infrastructure
  { id: 'e-bike-community',     source: 'gov-bike-lanes',    target: 'citizen-community',  relationship: 'proposed-by',label: 'Proposed by' },
  { id: 'e-garden-green',       source: 'gov-garden',        target: 'citizen-green',      relationship: 'proposed-by',label: 'Proposed by' },
  { id: 'e-noise-env',          source: 'gov-noise-policy',  target: 'env-noise-beach',    relationship: 'monitors',   label: 'Data from' },
  // Citizen ↔ citizen (sister venues connection)
  { id: 'e-founder-aihaus',     source: 'venue-founder-haus',target: 'venue-ai-haus',      relationship: 'sister-venue',label: 'Sister Venue' },
  { id: 'e-founder-privacy',    source: 'venue-founder-haus',target: 'venue-privacy-haus', relationship: 'sister-venue',label: 'Sister Venue' },
];

export function buildCityGraphPayload({ listings, users, stores, transactions, demands }) {
  // DB-derived entities
  const dbEntities = [
    ...listings.map(listingToEntity),
    ...users.map(userToEntity),
    ...stores.map(storeToEntity),
  ];

  // Merge static entities (all layers) — avoiding ID collisions with DB entities
  const allEntities = [...dbEntities, ...STATIC_ENTITIES];

  const entityMap = Object.fromEntries(allEntities.map(e => [e.id, e]));

  // DB edges: real transactions
  const txEdges = transactions
    .map(tx => transactionToEdge(tx, entityMap))
    .filter(Boolean);

  // DB edges: trade keyword matches between listings
  const tradeEdges = synthesizeTradeEdges(listings);

  // DB edges: citizen → their listings
  const citizenListingEdges = [];
  for (const listing of listings) {
    const citizenId = SESSION_TO_CITIZEN[listing.session_id];
    const listingEntityId = `listing-${listing.id}`;
    if (citizenId && entityMap[listingEntityId]) {
      citizenListingEdges.push({
        id: `citizen-listing-${citizenId}-${listing.id}`,
        source: citizenId,
        target: listingEntityId,
        relationship: 'provides',
        label: 'Offers',
      });
    }
  }

  // Deduplicate all edges
  const seenEdges = new Set();
  const allEdges = [...STATIC_EDGES, ...txEdges, ...tradeEdges, ...citizenListingEdges]
    .filter(e => {
      const key = [e.source, e.target].sort().join('|');
      if (seenEdges.has(key)) return false;
      seenEdges.add(key);
      // Only include edges where both endpoints exist
      return entityMap[e.source] && entityMap[e.target];
    });

  return { entities: allEntities, edges: allEdges };
}
