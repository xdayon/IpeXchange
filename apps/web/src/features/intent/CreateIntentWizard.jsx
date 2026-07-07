import { useState, useCallback } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, LogIn } from 'lucide-react';
import { createIntent, uploadImage } from '../../api/intents.js';
import StepIntentType from './wizard/StepIntentType.jsx';
import StepIntentDetails from './wizard/StepIntentDetails.jsx';
import StepIntentReview from './wizard/StepIntentReview.jsx';
import { ProgressBar, NavRow } from './wizard/ui.jsx';
import { haptic } from './wizard/helpers.js';

const INITIAL_FORM = {
  direction: 'want',
  kind: null,
  title: '',
  description: '',
  priceFiat: '',
  imageFile: null,
  imagePreview: null,
};

const STEP_LABELS = ['Type', 'Details', 'Publish'];

function LoginGate({ login }) {
  return (
    <div className="empty-state" style={{ marginTop: 60 }}>
      <LogIn size={36} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
      <p style={{ marginBottom: 8 }}>Log in to publish on the market.</p>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Anyone can browse. Publishing interests and offers needs an account.
      </p>
      <button onClick={() => login?.()} style={{ padding: '12px 28px', borderRadius: 'var(--radius-full)',
        background: 'var(--accent-lime)', color: 'var(--bg-dark)', fontWeight: 700,
        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        Log in
      </button>
    </div>
  );
}

function SuccessScreen({ intent, onMarket, onCreateAnother }) {
  return (
    <div className="page-enter" style={{ textAlign: 'center', padding: '60px 0', maxWidth: 360, margin: '0 auto' }}>
      <CheckCircle2 size={56} color="var(--accent-lime)" style={{ margin: '0 auto 20px', display: 'block' }} />
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        {intent.direction === 'offer' ? 'Offer' : 'Interest'} <span className="text-gradient-lime">published</span>
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 32 }}>
        It is live on the network. The oracle is already looking for matches and trade cycles.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={onMarket} style={{ padding: '14px', borderRadius: 'var(--radius-md)', border: 'none',
          background: 'linear-gradient(135deg, var(--accent-lime), var(--accent-cyan))',
          color: 'var(--bg-dark)', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Browse the market
        </button>
        <button onClick={onCreateAnother} style={{ background: 'none', border: 'none',
          color: 'var(--accent-cyan)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--font-sans)', padding: 8 }}>
          Publish another intent
        </button>
      </div>
    </div>
  );
}

export default function CreateIntentWizard({ onBack, onMarket, isAuthenticated, login, initialDirection }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...INITIAL_FORM, direction: initialDirection || INITIAL_FORM.direction });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [published, setPublished] = useState(null);

  const set = useCallback((key, value) => setForm((f) => ({ ...f, [key]: value })), []);

  if (!isAuthenticated) return <LoginGate login={login} />;
  if (published) {
    return (
      <SuccessScreen
        intent={published}
        onMarket={onMarket}
        onCreateAnother={() => { setForm(INITIAL_FORM); setStep(0); setPublished(null); }}
      />
    );
  }

  const canProceed = step === 0 ? Boolean(form.direction && form.kind) : form.title.trim().length >= 3;

  const handlePublish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl = null;
      if (form.imageFile) {
        try {
          imageUrl = (await uploadImage(form.imageFile)).url;
        } catch {
          // image is best-effort; publish the intent anyway
        }
      }
      const intent = await createIntent({
        direction: form.direction,
        kind: form.kind,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price_fiat: form.priceFiat ? Number(form.priceFiat) : null,
        image_url: imageUrl,
      });
      window?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      setPublished(intent);
    } catch (e) {
      setError(e.message || 'Could not publish. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '16px 0 80px', maxWidth: 520, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={step === 0 ? onBack : () => { haptic('light'); setStep(step - 1); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-secondary)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8,
            textTransform: 'uppercase', marginBottom: 6 }}>
            Step {step + 1} of 3 - {STEP_LABELS[step]}
          </div>
          <ProgressBar step={step} total={3} />
        </div>
      </div>

      {step === 0 && (
        <StepIntentType direction={form.direction} kind={form.kind}
          onDirection={(v) => set('direction', v)} onKind={(v) => set('kind', v)} />
      )}
      {step === 1 && <StepIntentDetails form={form} onChange={set} direction={form.direction} />}
      {step === 2 && <StepIntentReview form={form} />}

      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(244,63,94,0.08)',
          border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-md)',
          color: 'var(--accent-pink)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {step < 2 ? (
        <NavRow onBack={step > 0 ? () => setStep(step - 1) : null}
          onNext={() => { haptic('light'); setStep(step + 1); window.scrollTo({ top: 0 }); }}
          disabled={!canProceed} />
      ) : (
        <NavRow onBack={() => setStep(1)} onNext={handlePublish}
          nextLabel="Publish" nextIcon={Sparkles} loading={submitting} />
      )}
    </div>
  );
}
