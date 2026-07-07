// ── useListings — carrega e filtra listings do marketplace ──────
import { useState, useEffect, useCallback } from 'react';
import { fetchListings } from '../../api/listings.js';

export function useListings(category = 'All', subcategory = null) {
  const [listings, setListings]   = useState([]);
  const [trending, setTrending]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetchListings({ category, subcategory });
      setListings(data.listings || []);
      setTrending(data.trending || []);
    } catch (e) {
      setError('Could not reach the marketplace.');
      setListings([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [category, subcategory]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  return { listings, trending, loading, error, refresh: load };
}
