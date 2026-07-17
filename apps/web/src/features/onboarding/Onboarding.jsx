import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight, Bot, Box, ChevronLeft, ChevronRight, CircleDollarSign,
  PackageSearch, ShoppingBag, Sparkles, Users,
} from 'lucide-react';
import './onboarding.css';

export const ONBOARDING_VERSION = 1;

const steps = [
  {
    eyebrow: 'Welcome to IpeXchange',
    title: 'A market built around intentions',
    body: 'Start with what you need or what you can provide. Goods, digital products, services, work, consulting, knowledge and skills all belong here.',
    icon: Sparkles,
    examples: [
      { icon: Box, label: 'Physical goods' },
      { icon: ShoppingBag, label: 'Services and work' },
      { icon: Bot, label: 'Digital and knowledge' },
    ],
  },
  {
    eyebrow: 'Two simple listing types',
    title: 'Publish an Interest or an Offer',
    body: 'An Interest describes something you are looking for. An Offer describes something you can sell, share or exchange.',
    icon: PackageSearch,
    cards: [
      { label: 'Interest', text: 'What you are looking for', tone: 'cyan' },
      { label: 'Offer', text: 'What you can provide', tone: 'lime' },
    ],
  },
  {
    eyebrow: 'Flexible ways to trade',
    title: 'Buy, exchange, or connect a group',
    body: 'Buy eligible Offers directly with crypto, propose a direct exchange, or let IpeXchange find a group trade where everyone gets something they want.',
    icon: ArrowLeftRight,
    examples: [
      { icon: CircleDollarSign, label: 'Direct purchase' },
      { icon: ArrowLeftRight, label: 'Direct exchange' },
      { icon: Users, label: 'Group trade' },
    ],
  },
  {
    eyebrow: 'Your market guide',
    title: 'Meet Nexum',
    body: 'Tell Nexum what you need or offer in your own words. It helps shape a clear listing, asks you to confirm it, and looks for possible exchanges.',
    icon: Bot,
  },
];

export default function Onboarding({ replay = false, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef(null);
  const panelRef = useRef(null);
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const finish = async (destination) => {
    setSaving(true);
    setError('');
    try {
      await onComplete(destination);
    } catch {
      setError('We could not save your progress. Check your connection and try again.');
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && !saving) {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...panelRef.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0];
    const lastButton = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"
      onKeyDown={handleKeyDown}>
      <div className="onboarding__ambient" aria-hidden="true" />
      <section className="onboarding__panel" ref={panelRef}>
        <header className="onboarding__header">
          <span className="onboarding__brand">Ipe<span>Xchange</span></span>
          <button className="onboarding__skip" onClick={() => finish()} disabled={saving}>
            {replay ? 'Close' : 'Skip tutorial'}
          </button>
        </header>

        <div className="onboarding__progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <span key={item.title} className={index <= step ? 'is-active' : ''} />
          ))}
        </div>

        <div className="onboarding__content" key={current.title}>
          <div className="onboarding__icon" aria-hidden="true"><Icon size={34} /></div>
          <p className="onboarding__eyebrow">{current.eyebrow}</p>
          <h1 id="onboarding-title" ref={headingRef} tabIndex="-1">{current.title}</h1>
          <p className="onboarding__body">{current.body}</p>

          {current.examples && (
            <div className="onboarding__examples">
              {current.examples.map(({ icon: ExampleIcon, label }) => (
                <div key={label}><ExampleIcon size={20} /><span>{label}</span></div>
              ))}
            </div>
          )}
          {current.cards && (
            <div className="onboarding__cards">
              {current.cards.map((card) => (
                <div key={card.label} className={`onboarding__type onboarding__type--${card.tone}`}>
                  <strong>{card.label}</strong><span>{card.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="onboarding__error" role="alert">{error}</p>}
        <footer className={`onboarding__footer ${last ? 'onboarding__footer--final' : ''}`}>
          {step > 0 && (
            <button className="onboarding__back" onClick={() => setStep(step - 1)} disabled={saving}>
              <ChevronLeft size={18} /> Back
            </button>
          )}
          {!last && (
            <button className="onboarding__next" onClick={() => setStep(step + 1)}>
              Continue <ChevronRight size={18} />
            </button>
          )}
          {last && (
            <>
              <button className="onboarding__next" onClick={() => finish('nexum')} disabled={saving}>
                {saving ? 'Saving...' : 'Tell Nexum what you need'}
              </button>
              <button className="onboarding__secondary" onClick={() => finish('discover')} disabled={saving}>
                Browse the market
              </button>
              <button className="onboarding__text-action" onClick={() => finish('create')} disabled={saving}>
                Create manually
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  );
}
