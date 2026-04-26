/**
 * xchangeStore.js
 * Simple localStorage-based store for the IpêXchange purchase/listings state.
 * Architecture is intentionally flat for easy LLM/backend replacement later.
 */

const KEYS = {
  purchases: 'ipeXchange_purchases',
  soldProducts: 'ipeXchange_soldProducts',
  myListings: 'ipeXchange_myListings',
};

// ─── Helpers ──────────────────────────────────────────────
const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
};

// ─── Purchases ────────────────────────────────────────────

/** Save a completed purchase to the store. */
export const savePurchase = ({ listing, paymentMethod, txHash }) => {
  const purchases = read(KEYS.purchases, []);
  const entry = {
    id: `tx-${Date.now()}`,
    listing,
    paymentMethod,
    txHash: txHash || `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`,
    date: new Date().toISOString(),
    status: 'confirmed',
  };
  write(KEYS.purchases, [entry, ...purchases]);

  // If it's a unique product (type Product, not a service), mark as sold
  if (listing.type === 'Product' || listing.category === 'Products') {
    markAsSold(listing.id);
  }

  return entry;
};

/** Get all purchases, newest first. */
export const getPurchases = () => read(KEYS.purchases, []);

/** Clear all purchases (dev/test utility). */
export const clearPurchases = () => {
  write(KEYS.purchases, []);
  write(KEYS.soldProducts, []);
};

// ─── Sold Products ────────────────────────────────────────

/** Mark a product listing as sold (hides from Discover). */
export const markAsSold = (listingId) => {
  const sold = read(KEYS.soldProducts, []);
  if (!sold.includes(listingId)) {
    write(KEYS.soldProducts, [...sold, listingId]);
  }
};

/** Get list of sold listing IDs. */
export const getSoldProductIds = () => read(KEYS.soldProducts, []);

/** Check if a specific listing is sold. */
export const isProductSold = (listingId) => getSoldProductIds().includes(listingId);

// ─── My Listings ──────────────────────────────────────────

// Seed default mock listings for the user if none exist
const DEFAULT_MY_LISTINGS = [
  {
    id: 'mine-1',
    title: 'Graphic Design & Visual Identity',
    category: 'Services',
    type: 'Service',
    acceptedPayments: ['fiat', 'crypto', 'trade'],
    price: '$40/project',
    description: 'Logo creation, branding and graphic materials. +12 projects delivered on-chain.',
    isPublic: true,
    status: 'active',
    views: 47,
    inquiries: 3,
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'mine-2',
    title: 'Dell XPS 13 Laptop (2022)',
    category: 'Products',
    type: 'Product',
    acceptedPayments: ['fiat', 'crypto'],
    price: '$850',
    description: 'Dell XPS 13, i7, 16GB RAM, 512GB SSD. Great condition. Comes with original charger.',
    isPublic: true,
    status: 'active',
    views: 23,
    inquiries: 1,
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'mine-3',
    title: 'Sony Alpha A6400 Camera',
    category: 'Products',
    type: 'Product',
    acceptedPayments: ['fiat', 'trade'],
    price: '$750',
    description: 'Sony A6400 with 16-50mm kit lens. Less than 5k clicks. I accept trade for audio equipment.',
    isPublic: false,
    status: 'paused',
    views: 8,
    inquiries: 0,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=400&h=300',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

/** Get all of my listings. */
export const getMyListings = () => {
  const stored = read(KEYS.myListings, null);
  if (!stored) {
    write(KEYS.myListings, DEFAULT_MY_LISTINGS);
    return DEFAULT_MY_LISTINGS;
  }
  return stored;
};

/** Toggle listing visibility (pause/activate). */
export const toggleListingStatus = (id) => {
  const listings = getMyListings();
  const updated = listings.map(l =>
    l.id === id ? { ...l, status: l.status === 'active' ? 'paused' : 'active', isPublic: l.status === 'active' ? false : true } : l
  );
  write(KEYS.myListings, updated);
  return updated;
};

/** Mark a listing as sold (for my own listings). */
export const markListingAsSold = (id) => {
  const listings = getMyListings();
  const updated = listings.map(l =>
    l.id === id ? { ...l, status: 'sold', isPublic: false } : l
  );
  write(KEYS.myListings, updated);
  return updated;
};
