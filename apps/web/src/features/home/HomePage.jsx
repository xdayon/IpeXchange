import { Mic, Layers, LogIn } from 'lucide-react';
import NexumOrb from '../nexum/NexumOrb.jsx';
import PulseStats from './PulseStats.jsx';
import HowLoops from './HowLoops.jsx';
import YourLoops from './YourLoops.jsx';
import { useActivity } from './useActivity.js';
import './home.css';

export default function HomePage({ user, isAuthenticated, login, onNavigate }) {
  const activity = useActivity();
  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__orb"><NexumOrb size={260} /></div>
        <div className="home-hero__copy">
          <p className="home-eyebrow">{isAuthenticated && firstName ? `Welcome back, ${firstName}` : 'IpeXchange'}</p>
          <h1 className="stagger-enter">
            What do you have? <span className="text-gradient-lime">What do you need?</span>
          </h1>
          <p className="home-hero__sub">Tell Nexum. It finds the loop.</p>
          <div className="home-hero__ctas">
            <button className="btn btn--lime btn--lg" onClick={() => onNavigate('nexum')}>
              <Mic size={20} aria-hidden="true" /> Talk to Nexum
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => onNavigate('discover', { mode: 'swipe' })}>
              <Layers size={20} aria-hidden="true" /> Swipe the market
            </button>
          </div>
        </div>
      </section>

      <PulseStats activity={activity} />
      {isAuthenticated && <YourLoops onOpen={() => onNavigate('cycles')} />}
      <HowLoops />

      {!isAuthenticated && (
        <button className="btn btn--lime btn--lg home-login" onClick={() => login?.()}>
          <LogIn size={18} aria-hidden="true" /> Log in to publish
        </button>
      )}
    </div>
  );
}
