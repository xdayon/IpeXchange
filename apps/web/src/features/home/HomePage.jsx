
import { Handshake, Megaphone, Compass, Repeat, ArrowRight, LogIn } from 'lucide-react';

const CTAS = [
  {
    id: 'cycles', icon: Repeat, title: 'My trade cycles', authOnly: true,
    desc: 'Rings the oracle closed with your intents',
    color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)',
    to: ['cycles'],
  },
  {
    id: 'want', icon: Handshake, title: 'List an interest',
    desc: 'Tell the network what you are looking for',
    color: 'var(--accent-cyan)', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)',
    to: ['create', { direction: 'want' }],
  },
  {
    id: 'offer', icon: Megaphone, title: 'List an offer',
    desc: 'Goods, services, work, knowledge - all tradeable',
    color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.08)', border: 'rgba(180,244,74,0.25)',
    to: ['create', { direction: 'offer' }],
  },
  {
    id: 'market', icon: Compass, title: 'Browse the market',
    desc: 'See what the Ipe network wants and offers',
    color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)',
    to: ['discover'],
  },
];

export default function HomePage({ user, isAuthenticated, login, onNavigate }) {
  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="page-enter" style={{ padding: '40px 0 60px', maxWidth: 560, margin: '0 auto' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
        {isAuthenticated && firstName ? (
          <>Welcome back, <span className="text-gradient-lime">{firstName}</span></>
        ) : (
          <>The <span className="text-gradient-lime">intent market</span> of Ipe City</>
        )}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
        List your interests and your offers. The oracle crosses them across the whole
        network, including trades no two people could close alone.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CTAS.filter((cta) => !cta.authOnly || isAuthenticated).map((cta) => {
          const Icon = cta.icon;
          return (
            <button
              key={cta.id}
              onClick={() => onNavigate(...cta.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
                padding: '20px 22px', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${cta.border}`, background: cta.bg,
                cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
            >
              <span style={{
                width: 46, height: 46, borderRadius: 'var(--radius-md)', flexShrink: 0,
                background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} style={{ color: cta.color }} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {cta.title}
                </span>
                <span style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)' }}>{cta.desc}</span>
              </span>
              <ArrowRight size={18} style={{ color: cta.color, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>

      {!isAuthenticated && (
        <button
          onClick={() => login?.()}
          style={{
            marginTop: 28, width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--accent-lime)', color: 'var(--bg-dark)',
            fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          <LogIn size={18} /> Log in to publish
        </button>
      )}
    </div>
  );
}
