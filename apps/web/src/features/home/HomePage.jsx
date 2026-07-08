
import { Compass, Megaphone, Repeat, ListChecks, LogIn } from 'lucide-react';
import CtaCard from '../../shared/ui/CtaCard.jsx';

const CTAS = [
  {
    id: 'browse', icon: Compass, title: 'Browse the market',
    desc: 'See what the Ipe network wants and offers',
    color: 'var(--accent-cyan)', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)',
    to: ['discover'],
  },
  {
    id: 'create', icon: Megaphone, title: 'List an intent',
    desc: 'An interest or an offer - goods, services, work, knowledge',
    color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.08)', border: 'rgba(180,244,74,0.25)',
    to: ['create'],
  },
  {
    id: 'cycles', icon: Repeat, title: 'Multi-hop cycles', authOnly: true,
    desc: 'Rings the oracle closed with your intents',
    color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.25)',
    to: ['cycles'],
  },
  {
    id: 'mine', icon: ListChecks, title: 'My intents', authOnly: true,
    desc: 'Manage your interests, offers and marks',
    color: 'var(--accent-indigo)', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.25)',
    to: ['profile'],
  },
];

export default function HomePage({ user, isAuthenticated, login, onNavigate }) {
  const firstName = user?.displayName?.split(' ')[0];
  const ctas = CTAS.filter((cta) => !cta.authOnly || isAuthenticated);

  return (
    <div style={{ padding: '40px 0 60px', maxWidth: 560, margin: '0 auto' }}>
      <h1 className="stagger-enter" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
        {isAuthenticated && firstName ? (
          <>Welcome back, <span className="text-gradient-lime">{firstName}</span></>
        ) : (
          <>The <span className="text-gradient-lime">intent market</span> of Ipe City</>
        )}
      </h1>
      <p className="stagger-enter" style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6,
        marginBottom: 32, animationDelay: '60ms' }}>
        List your interests and your offers. The oracle crosses them across the whole
        network, including trades no two people could close alone.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ctas.map((cta, i) => (
          <CtaCard
            key={cta.id}
            icon={cta.icon}
            title={cta.title}
            desc={cta.desc}
            color={cta.color}
            bg={cta.bg}
            border={cta.border}
            delay={120 + i * 60}
            onClick={() => onNavigate(...cta.to)}
          />
        ))}
      </div>

      {!isAuthenticated && (
        <button
          className="stagger-enter"
          onClick={() => login?.()}
          style={{
            marginTop: 28, width: '100%', padding: '15px', borderRadius: 'var(--radius-md)',
            border: 'none', background: 'var(--accent-lime)', color: 'var(--bg-dark)',
            fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-sans)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            animationDelay: `${120 + ctas.length * 60}ms`,
          }}
        >
          <LogIn size={18} /> Log in to publish
        </button>
      )}
    </div>
  );
}
