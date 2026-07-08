import { Panel } from './charts.jsx';

const STATUS_COLORS = {
  confirmed: 'var(--accent-lime)',
  submitted: 'var(--accent-amber)',
  quoted: 'var(--text-secondary)',
  failed: 'var(--accent-pink)',
};

function Table({ columns, rows }) {
  if (rows.length === 0) return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nothing yet.</p>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.label} style={{ textAlign: 'left', padding: '6px 10px 6px 0', fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.4,
                borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {columns.map((col) => (
                <td key={col.label} style={{ padding: '8px 10px 8px 0', color: 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border-color)', maxWidth: 220, overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const when = (ts) => new Date(ts).toLocaleDateString();
const strong = (v) => <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>;
const badge = (value, color) => (
  <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
);

export default function AdminTables({ metrics }) {
  return (
    <>
      <Panel title="Latest members" span>
        <Table
          rows={metrics.recent_users ?? []}
          columns={[
            { label: 'Name', render: (u) => strong(u.display_name || 'Anonymous') },
            { label: 'Telegram', render: (u) => (u.telegram_username ? `@${u.telegram_username}` : '-') },
            { label: 'Wallet', render: (u) => badge(u.has_wallet ? 'linked' : 'none', u.has_wallet ? 'var(--accent-lime)' : 'var(--text-muted)') },
            { label: 'Joined', render: (u) => when(u.created_at) },
            { label: 'Last seen', render: (u) => when(u.last_seen) },
          ]}
        />
      </Panel>
      <Panel title="Latest intents" span>
        <Table
          rows={metrics.recent_intents ?? []}
          columns={[
            { label: 'Title', render: (i) => strong(i.title) },
            { label: 'Direction', render: (i) => badge(i.direction, i.direction === 'offer' ? 'var(--accent-lime)' : 'var(--accent-cyan)') },
            { label: 'Kind', render: (i) => i.kind ?? '-' },
            { label: 'Source', render: (i) => i.source },
            { label: 'Status', render: (i) => i.status },
            { label: 'Created', render: (i) => when(i.created_at) },
          ]}
        />
      </Panel>
      <Panel title="Latest payments" span>
        <Table
          rows={metrics.recent_payments ?? []}
          columns={[
            { label: 'Amount', render: (p) => strong(`$${Number(p.amount_fiat)}`) },
            { label: 'Token', render: (p) => p.token.toUpperCase() },
            { label: 'Status', render: (p) => badge(p.status, STATUS_COLORS[p.status]) },
            { label: 'Created', render: (p) => when(p.created_at) },
          ]}
        />
      </Panel>
    </>
  );
}
