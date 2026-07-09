import { useState, useEffect } from 'react';
import { Repeat, ArrowLeftRight, History } from 'lucide-react';
import { fetchMyTrades } from '../../api/me.js';

function tradeLine(trade) {
  if (trade.type === 'cycle') return `${trade.hops}-person trade cycle`;
  return trade.role === 'buyer' ? `Bought ${trade.intent_title ?? 'an offer'}` : `Sold ${trade.intent_title ?? 'an offer'}`;
}

function Row({ trade }) {
  const date = trade.at ? new Date(trade.at).toLocaleDateString() : '';
  const subtitle = trade.type === 'cycle'
    ? date
    : [trade.counterpart_name, date].filter(Boolean).join(' · ');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 12, padding: '14px 16px', background: 'var(--bg-card)',
      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {trade.type === 'cycle'
          ? <Repeat size={18} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
          : <ArrowLeftRight size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />}
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tradeLine(trade)}
          </p>
          {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>
      </div>
      {trade.type === 'payment' && (
        <span style={{ fontWeight: 700, color: 'var(--accent-lime)', whiteSpace: 'nowrap' }}>
          ${trade.amount_fiat}
        </span>
      )}
    </div>
  );
}

export default function TradeHistory() {
  const [trades, setTrades] = useState(null);

  useEffect(() => {
    fetchMyTrades().then((r) => setTrades(r.trades ?? [])).catch(() => setTrades([]));
  }, []);

  return (
    <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)', marginTop: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Trade history</h2>
      {trades === null ? (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading...</p>
      ) : trades.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <History size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>No completed trades yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trades.map((trade, i) => <Row key={i} trade={trade} />)}
        </div>
      )}
    </div>
  );
}
