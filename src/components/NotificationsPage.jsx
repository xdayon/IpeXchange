import React, { useState } from 'react';
import { Bell, ShieldCheck, TrendingUp, Users, Zap, MessageCircle, Star, Check, Trash2, Sparkles } from 'lucide-react';

const ICON_MAP = {
  match: Zap,
  trust: Users,
  invest: TrendingUp,
  rep: Star,
  msg: MessageCircle,
  insight: Sparkles,
  security: ShieldCheck,
};

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'match',    unread: true,  time: '2m',  color: '#B4F44A', title: '3 matches for your bicycle!', desc: 'We found 3 interested parties for your Cannondale. Core can connect you now.' },
  { id: 'n2', type: 'trust',   unread: true,  time: '14m', color: '#38BDF8', title: 'Roberto traded with Carlos', desc: 'Someone from your Web of Trust completed a transaction ($120). Reputation updated.' },
  { id: 'n3', type: 'invest',  unread: true,  time: '1h',  color: '#818CF8', title: 'New investment opportunity', desc: 'Ipê Bakery is raising $9,000 at 4.2% p.a. — compatible with your profile.' },
  { id: 'n4', type: 'rep',     unread: false, time: '2h',  color: '#F59E0B', title: 'Your reputation rose to 95!', desc: 'Congratulations! You reached Elite level on Xchange. New benefits unlocked.' },
  { id: 'n5', type: 'msg',     unread: false, time: '4h',  color: '#38BDF8', title: 'Message from Xchange Core', desc: 'Detected plumbing services available today in Ipê City — you had an active search.' },
  { id: 'p1', type: 'insight', unread: true,  time: 'Now', color: '#A855F7', title: 'Proactive Insight: Health Focus', desc: 'Noticed your interest in health. Marina is selling an E-Bike and the Runners Club meets tomorrow.' },
  { id: 'n6', type: 'security',unread: false, time: '1d',  color: '#B4F44A', title: 'ZKP sync completed', desc: '47 attestations successfully synced on Ethereum. Your history is safe.' },
  { id: 'n7', type: 'match',   unread: false, time: '2d',  color: '#B4F44A', title: 'Fair trade suggested by Core', desc: 'Graphic design ↔ 6 jars of organic honey. Marina would accept this proposal.' },
];

// Serialize only primitives — no React components in localStorage
const serialize = (notifications) =>
  JSON.stringify(notifications.map(({ id, type, unread, time, color, title, desc }) =>
    ({ id, type, unread, time, color, title, desc })
  ));

const deserialize = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed[0]?.type) return null;
    return parsed;
  } catch {
    return null;
  }
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('ipeXchange_notifications');
    return deserialize(saved) || INITIAL_NOTIFICATIONS;
  });

  React.useEffect(() => {
    localStorage.setItem('ipeXchange_notifications', serialize(notifications));
  }, [notifications]);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="inner-page container" style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(180,244,74,0.12)', border: '1px solid rgba(180,244,74,0.3)', color: '#B4F44A' }}>
                {unreadCount} new
              </span>
            )}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Core updates, matches, and activity from your network.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--accent-cyan)', background: 'none', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 100, padding: '7px 14px', cursor: 'pointer' }}>
            <Check size={13} /> Mark all as read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifications.map(n => {
          const Icon = ICON_MAP[n.type] || Bell;
          return (
            <div key={n.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 16, borderColor: n.unread ? `${n.color}30` : 'var(--border-color)', background: n.unread ? `${n.color}05` : undefined, transition: 'all 0.2s' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${n.color}12`, border: `1px solid ${n.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <Icon size={18} style={{ color: n.color }} />
                {n.unread && <span style={{ position: 'absolute', top: -3, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#B4F44A', border: '2px solid var(--bg-primary)' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 14, fontWeight: n.unread ? 700 : 600 }}>{n.title}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{n.time}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.desc}</p>
              </div>
              <button onClick={() => dismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 4, opacity: 0.5, flexShrink: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
            <Bell size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p>No notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
