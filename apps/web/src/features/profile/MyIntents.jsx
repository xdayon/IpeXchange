import { useState, useEffect } from 'react';
import { Inbox, Archive } from 'lucide-react';
import { fetchMyIntents, fetchMyInterests, updateIntent } from '../../api/intents.js';
import { fetchMyPayments } from '../../api/payments.js';
import { directionInfo, formatPrice } from '../intent/constants.js';

const TABS = [
  { id: 'want', label: 'Interests' },
  { id: 'offer', label: 'Offers' },
  { id: 'marked', label: 'Marked' },
  { id: 'payments', label: 'Payments' },
];

const PAYMENT_COLORS = {
  confirmed: 'var(--accent-lime)',
  submitted: 'var(--accent-amber)',
  quoted: 'var(--text-secondary)',
  failed: 'var(--accent-pink)',
};

function Row({ title, subtitle, right, onSelect }) {
  return (
    <div onClick={onSelect} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 12, padding: '14px 16px', background: 'var(--bg-card)', cursor: onSelect ? 'pointer' : 'default',
      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export default function MyIntents({ onSelectIntent }) {
  const [tab, setTab] = useState('want');
  const [intents, setIntents] = useState({ want: null, offer: null });
  const [marked, setMarked] = useState(null);
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    if (tab === 'payments') {
      if (!payments) fetchMyPayments().then(setPayments).catch(() => setPayments([]));
    } else if (tab === 'marked') {
      if (!marked) fetchMyInterests().then((d) => setMarked(d.made ?? [])).catch(() => setMarked([]));
    } else if (!intents[tab]) {
      fetchMyIntents(tab)
        .then((list) => setIntents((s) => ({ ...s, [tab]: list })))
        .catch(() => setIntents((s) => ({ ...s, [tab]: [] })));
    }
  }, [tab, intents, marked, payments]);

  const archive = async (intent) => {
    try {
      await updateIntent(intent.id, { status: 'archived' });
      setIntents((s) => ({ ...s, [intent.direction]: s[intent.direction]?.filter((i) => i.id !== intent.id) }));
    } catch {
      // leave the row in place if archiving failed
    }
  };

  const list = tab === 'payments' ? payments : tab === 'marked' ? marked : intents[tab];

  return (
    <div>
      <div className="filter-chips" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.id} className={`filter-chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {list == null ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</p>
      ) : list.length === 0 ? (
        <div style={{ padding: '32px 24px', border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Inbox size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>
            {tab === 'payments'
              ? 'No on-chain payments yet.'
              : tab === 'marked'
                ? 'You have not marked interest in anything yet.'
                : 'Nothing published here yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'payments'
            ? list.map((p) => (
                <Row key={p.id}
                  title={p.intent_title ?? 'Intent removed'}
                  subtitle={`${p.role === 'buyer' ? 'Sent' : 'Received'} ${p.amount_display} ${p.symbol} - ${new Date(p.created_at).toLocaleDateString()}`}
                  onSelect={p.tx_hash ? () => window.open(`https://basescan.org/tx/${p.tx_hash}`, '_blank', 'noopener') : null}
                  right={
                    <span style={{ fontSize: 12, fontWeight: 700, color: PAYMENT_COLORS[p.status] }}>
                      {p.status}
                    </span>
                  }
                />
              ))
            : tab === 'marked'
            ? list.map((m) => (
                <Row key={m.id}
                  title={m.intents?.title ?? 'Intent removed'}
                  subtitle={m.message || null}
                  onSelect={m.intents ? () => onSelectIntent?.(m.intents) : null}
                  right={m.intents && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: directionInfo(m.intents.direction).color }}>
                      {directionInfo(m.intents.direction).label}
                    </span>
                  )}
                />
              ))
            : list.map((i) => (
                <Row key={i.id}
                  title={i.title}
                  subtitle={[formatPrice(i.price_fiat), i.status].filter(Boolean).join(' - ')}
                  onSelect={() => onSelectIntent?.(i)}
                  right={
                    <button onClick={(e) => { e.stopPropagation(); archive(i); }} title="Archive"
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)',
                        cursor: 'pointer', padding: 6, flexShrink: 0 }}>
                      <Archive size={16} />
                    </button>
                  }
                />
              ))}
        </div>
      )}
    </div>
  );
}
