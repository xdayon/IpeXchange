import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { fetchAdminMetrics } from '../../api/admin.js';
import { StatTile, BarList, MonthBars, Donut, Panel } from './charts.jsx';
import LineChart from './LineChart.jsx';
import AdminTables from './AdminTables.jsx';

// Fixed categorical hue order for every chart on this page.
const C = ['var(--accent-cyan)', 'var(--accent-lime)', 'var(--accent-indigo)', 'var(--accent-amber)'];
const STATUS = {
  confirmed: 'var(--accent-lime)', submitted: 'var(--accent-amber)',
  quoted: 'var(--text-muted)', failed: 'var(--accent-pink)',
};

// Magnitude breakdowns render in a single hue (the BarList prop); only
// entity-keyed maps (direction, status) assign per-item identity colors.
const toItems = (obj = {}, colors = {}) =>
  Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value: Number(value), color: colors[label] }));

const usd = (v) => `$${Number(v).toLocaleString()}`;

export default function AdminPage({ onBack }) {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminMetrics().then(setMetrics).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty-state" style={{ marginTop: 80 }}><p>{error}</p></div>;
  if (!metrics) {
    return (
      <div className="empty-state" style={{ marginTop: 120 }}>
        <Loader2 size={28} className="spin" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  const t = metrics.totals ?? {};
  const daily = metrics.daily ?? [];
  const monthly = metrics.monthly ?? [];
  const dayLabels = daily.map((d) => d.day.slice(5));
  const monthLabels = monthly.map((m) => m.month.slice(2));

  return (
    <div className="page-enter" style={{ padding: '24px 0 60px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none',
        border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 20,
        fontFamily: 'var(--font-sans)', fontSize: 14 }}>
        <ArrowLeft size={16} /> Back
      </button>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={22} style={{ color: 'var(--accent-lime)' }} /> Admin dashboard
      </h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
        Live platform metrics. Numbers refresh on every visit.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 12 }}>
        <StatTile label="Members" value={t.users ?? 0} sub={`+${t.users_new_30d ?? 0} in 30d`} color={C[1]} />
        <StatTile label="Active 7d" value={t.users_active_7d ?? 0} sub={`${t.users_active_30d ?? 0} in 30d`} />
        <StatTile label="Intents" value={t.intents ?? 0} sub={`${t.intents_active ?? 0} active`} />
        <StatTile label="Interest marks" value={t.interest_marks ?? 0} sub={`${t.intents_fulfilled ?? 0} intents fulfilled`} color={C[2]} />
        <StatTile label="Trade cycles" value={t.cycles ?? 0} sub={`${t.cycles_completed ?? 0} completed`} color={C[2]} />
        <StatTile label="Payments" value={t.payments_confirmed ?? 0} sub={`${usd(t.volume_fiat_confirmed ?? 0)} settled`} color={C[1]} />
        <StatTile label="Telegram reach" value={t.users_telegram ?? 0} sub={`${t.notifications_telegram ?? 0} DMs delivered`} />
        <StatTile label="AI actions 30d" value={t.ai_actions_30d ?? 0} sub={`${t.users_wallet ?? 0} wallets linked`} color={C[3]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        <Panel title="Activity - last 30 days" span>
          <LineChart labels={dayLabels} series={[
            { name: 'New members', color: C[0], values: daily.map((d) => d.new_users) },
            { name: 'New intents', color: C[1], values: daily.map((d) => d.new_intents) },
            { name: 'Interest marks', color: C[2], values: daily.map((d) => d.interest_marks) },
          ]} />
        </Panel>

        <Panel title="Growth - last 12 months">
          <LineChart height={170} labels={monthLabels} series={[
            { name: 'New members', color: C[0], values: monthly.map((m) => m.new_users) },
            { name: 'New intents', color: C[1], values: monthly.map((m) => m.new_intents) },
          ]} />
        </Panel>
        <Panel title="Confirmed volume by month (USD)">
          <MonthBars format={usd} items={monthly.map((m) => ({ label: m.month.slice(2), value: Number(m.volume_fiat) }))} />
        </Panel>

        <Panel title="Intents by direction">
          <Donut centerLabel="intents" items={toItems(metrics.intents_by_direction, { offer: C[1], want: C[0] })} />
        </Panel>
        <Panel title="Payments by status">
          <Donut centerLabel="payments" items={toItems(metrics.payments_by_status, STATUS)} />
        </Panel>

        <Panel title="Intents by kind">
          <BarList items={toItems(metrics.intents_by_kind)} />
        </Panel>
        <Panel title="Top categories">
          <BarList color={C[2]} items={(metrics.top_categories ?? []).map((c) => ({ label: c.category, value: c.count }))} />
        </Panel>
        <Panel title="Cycles by status">
          <BarList items={toItems(metrics.cycles_by_status)} />
        </Panel>
        <Panel title="Intents by source">
          <BarList color={C[3]} items={toItems(metrics.intents_by_source)} />
        </Panel>
        <Panel title="AI usage by action">
          <BarList color={C[0]} items={toItems(metrics.ai_by_action)} />
        </Panel>
        <Panel title="Payments by token">
          <BarList color={C[1]} items={toItems(metrics.payments_by_token)} />
        </Panel>

        <AdminTables metrics={metrics} />
      </div>
    </div>
  );
}
