import React, { useState } from 'react';
import { mockListings } from '../data/mockData';
import ListingCard from './ListingCard';
import { Filter } from 'lucide-react';

const CATEGORIES = ['All', 'Services', 'Products', 'Donations'];

const DiscoverPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? mockListings
    : mockListings.filter(l => l.category === activeFilter);

  return (
    <div className="discover-layout container">
      <div className="discover-header">
        <div>
          <h2 style={{ fontSize: '28px', marginBottom: '4px' }}>
            Discover <span className="text-gradient-lime">Opportunities</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Latest offers from your city network
          </p>
        </div>
        <div className="filter-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="listings-grid" style={{ marginTop: '32px' }}>
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
};

export default DiscoverPage;
