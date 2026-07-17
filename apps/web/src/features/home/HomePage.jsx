import { Compass, Megaphone, Repeat, ListChecks, LogIn, ArrowRight } from 'lucide-react';
import CtaCard from '../../shared/ui/CtaCard.jsx';

const CTAS = [
  { id: 'browse', icon: Compass, title: 'Browse Interests and Offers',
    desc: 'Discover what people are looking for and what they can provide.', accent: 'cyan', to: ['discover'] },
  { id: 'create', icon: Megaphone, title: 'Publish an Interest or Offer',
    desc: 'List a good, service, skill, digital product, or knowledge.', accent: 'lime', to: ['create'] },
  { id: 'cycles', icon: Repeat, title: 'Review group trades', authOnly: true,
    desc: 'See exchanges Nexum found between two or three people.', accent: 'purple', to: ['cycles'] },
  { id: 'mine', icon: ListChecks, title: 'Manage my listings', authOnly: true,
    desc: 'Review your Interests, Offers, saved items, and payments.', accent: 'indigo', to: ['profile'] },
];

const STEPS = [
  ['1', 'Publish', 'Share what you want as an Interest, or what you can provide as an Offer.'],
  ['2', 'Connect', 'Nexum looks for people whose Interests and Offers fit together.'],
  ['3', 'Exchange', 'Buy directly when available, trade one-to-one, or join a group trade.'],
];

export default function HomePage({ user, isAuthenticated, login, onNavigate }) {
  const firstName = user?.displayName?.split(' ')[0];
  const ctas = CTAS.filter((cta) => !cta.authOnly || isAuthenticated);

  return (
    <div className="home-page">
      <p className="home-eyebrow">IpeXchange</p>
      <h1 className="stagger-enter">
        {isAuthenticated && firstName
          ? <>Welcome back, <span className="text-gradient-lime">{firstName}</span></>
          : <>Exchange what you have for <span className="text-gradient-lime">what you need</span></>}
      </h1>
      <p className="home-intro stagger-enter">
        IpeXchange is a marketplace built around intentions. Publish an <strong>Interest</strong> when
        you need something, or an <strong>Offer</strong> when you have something to sell or exchange.
      </p>

      <section className="home-how" aria-labelledby="how-it-works">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">How it works</p>
            <h2 id="how-it-works">From intention to exchange</h2>
          </div>
          <span>Nexum is your matching guide</span>
        </div>
        <div className="home-steps">
          {STEPS.map(([number, title, description]) => (
            <div className="home-step" key={number}>
              <span aria-hidden="true">{number}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </div>
          ))}
        </div>
        <p className="home-example">
          <Repeat size={18} aria-hidden="true" />
          <span><strong>Group trade example:</strong> you give design help to Ana, Ana gives a bicycle
          to Leo, and Leo gives you the guitar lessons you wanted. Everyone receives something useful.</span>
        </p>
      </section>

      <div className="home-actions">
        {ctas.map((cta, i) => (
          <CtaCard key={cta.id} icon={cta.icon} title={cta.title} desc={cta.desc}
            accent={cta.accent} delay={120 + i * 60} onClick={() => onNavigate(...cta.to)} />
        ))}
      </div>

      {!isAuthenticated && (
        <button className="primary-action stagger-enter" onClick={() => login?.()}>
          <LogIn size={18} aria-hidden="true" /> Log in to publish <ArrowRight size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
