import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Plus, Search, Sparkles } from 'lucide-react';
import IntentCard from './IntentCard.jsx';
import { useMarket } from './useMarket.js';
import { KINDS } from '../intent/constants.js';

const DIRECTION_TABS = [
  { id: null, label: 'All' },
  { id: 'offer', label: 'Offers' },
  { id: 'want', label: 'Interests' },
];

export default function MarketFeed({ onSelectIntent, onNavigate, isTMA = false }) {
  const [direction, setDirection] = useState(null);
  const [kind, setKind] = useState(null);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const { intents, mode, loading, error, refresh } = useMarket({ direction, kind, q });

  useEffect(() => {
    const id = setTimeout(() => setQ(search.trim()), 450);
    return () => clearTimeout(id);
  }, [search]);

  return (
    <div style={{ padding: '28px 0 40px' }} className="page-enter">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            The <span className="text-gradient-lime">Market</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Interests and offers from the Ipe network
          </p>
        </div>
        <button
          onClick={() => refresh()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the market..."
          style={{
            width: '100%', padding: '12px 16px 12px 42px',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)', color: 'var(--text-primary)',
            fontSize: 15, fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="filter-chips">
          {DIRECTION_TABS.map((t) => (
            <button
              key={t.label}
              className={`filter-chip ${direction === t.id ? 'active' : ''}`}
              onClick={() => setDirection(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          {KINDS.map((k) => (
            <button
              key={k.id}
              className={`filter-chip ${kind === k.id ? 'active' : ''}`}
              onClick={() => setKind(kind === k.id ? null : k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {q && mode === 'semantic' && !loading && (
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} style={{ color: 'var(--accent-cyan)' }} /> Semantic results for "{q}"
        </p>
      )}

      {error && !loading && (
        <div style={{ marginTop: 24, padding: 20, background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-md)',
          color: '#F43F5E', textAlign: 'center' }}>
          {error}
          <button onClick={() => refresh()} style={{ display: 'block', margin: '12px auto 0',
            background: 'none', border: '1px solid #F43F5E', borderRadius: 8,
            color: '#F43F5E', padding: '6px 16px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Try again
          </button>
        </div>
      )}

      {loading && intents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
          <Activity size={28} className="pulse" style={{ margin: '0 auto 16px', display: 'block', color: 'var(--accent-lime)' }} />
          <p>Syncing with the Ipe network...</p>
        </div>
      )}

      {!loading && intents.length > 0 && (
        <div className="market-grid" style={{ marginTop: 24 }}>
          {intents.map((i) => (
            <IntentCard key={i.id} intent={i} onClick={onSelectIntent} />
          ))}
        </div>
      )}

      {!loading && intents.length === 0 && !error && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <Activity size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ marginBottom: 8 }}>Nothing here yet.</p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Be the first: tell the network what you are looking for or what you bring.
          </p>
          <button
            onClick={() => onNavigate('create')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 'var(--radius-full)', border: 'none',
              background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))',
              color: 'var(--bg-dark)', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
            }}
          >
            <Plus size={16} /> Publish an intent
          </button>
        </div>
      )}

      {isTMA && (
        <button
          onClick={() => { window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium'); onNavigate('create'); }}
          title="Publish an intent"
          style={{
            position: 'fixed',
            bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            right: 20, zIndex: 200, width: 60, height: 60,
            borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))',
            boxShadow: '0 4px 28px rgba(180,244,74,0.5), 0 2px 8px rgba(0,0,0,0.4)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={28} color="var(--bg-dark)" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
