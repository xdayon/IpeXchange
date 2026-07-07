// ── ProfilePage — perfil do usuário e meus anúncios ─────────────
import React, { useState, useEffect } from 'react';
import { Package, ShoppingBag, Star } from 'lucide-react';
import { fetchMyListings } from '../../api/listings.js';

export default function ProfilePage({ user, onNavigate }) {
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyListings(user.id).then(l => { setMyListings(l); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const isTG  = user?.source === 'telegram';
  const initials = user?.displayName?.slice(0, 2)?.toUpperCase() || '??';

  return (
    <div className="page-enter" style={{ padding: '28px 0 60px' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(180,244,74,0.15))',
          border: '2px solid rgba(56,189,248,0.3)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
          {user?.avatar
            ? <img src={user.avatar} alt={initials} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{user?.displayName || 'Guest'}</h1>
          {isTG && user?.username && (
            <p style={{ fontSize: 13, color: 'var(--accent-cyan)', marginTop: 2 }}>@{user.username}</p>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {isTG ? '📱 Telegram identity' : '👤 Anonymous session'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          { icon: Package, label: 'Listings', value: myListings.length },
          { icon: ShoppingBag, label: 'Purchases', value: 0 },
          { icon: Star, label: 'Rep Score', value: '—' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ padding: '16px 12px', background: 'var(--bg-card)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <Icon size={18} style={{ color: 'var(--accent-cyan)', margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* My Listings */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My Listings</h2>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      ) : myListings.length === 0 ? (
        <div style={{ padding: '40px 24px', border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>You haven't listed anything yet.</p>
          <button onClick={() => onNavigate('create')}
            style={{ marginTop: 16, padding: '10px 24px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-lime)', color: '#080C14', fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            + List your first item
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myListings.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 2 }}>{l.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.category}</p>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--radius-full)',
                background: l.active ? 'rgba(180,244,74,0.1)' : 'rgba(255,255,255,0.05)',
                color: l.active ? 'var(--accent-lime)' : 'var(--text-secondary)' }}>
                {l.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
