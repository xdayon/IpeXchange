// ── MarketplaceFilters — categoria e subcategoria ───────────────
import React from 'react';

const CATEGORIES = ['All', 'Products', 'Services', 'Knowledge', 'Donations'];

const SUBS = {
  Products:  ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Kitchen', 'Health'],
  Services:  ['Technology', 'Maintenance', 'Health & Wellness', 'Education', 'Creative', 'Legal'],
  Knowledge: ['Workshops', 'Courses', 'Mentoring', 'Language', 'Arts'],
  Donations: ['Clothes', 'Food', 'Furniture', 'Books', 'Other'],
};

export default function MarketplaceFilters({ category, subcategory, onCategory, onSubcategory }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Category row */}
      <div className="filter-chips">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`filter-chip ${category === c ? 'active' : ''}`}
            onClick={() => { onCategory(c); onSubcategory(null); }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Subcategory row */}
      {SUBS[category] && (
        <div className="filter-chips">
          {SUBS[category].map(s => (
            <button
              key={s}
              onClick={() => onSubcategory(subcategory === s ? null : s)}
              style={{
                flexShrink: 0, fontSize: 12, padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: subcategory === s ? 'rgba(180,244,74,0.1)' : 'transparent',
                border: `1px solid ${subcategory === s ? 'var(--accent-lime)' : 'var(--border-color)'}`,
                color: subcategory === s ? 'var(--accent-lime)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
