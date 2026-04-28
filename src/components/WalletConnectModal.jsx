import React, { useState } from 'react';
import { X, ShieldCheck, Copy, QrCode, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff, Smartphone, CreditCard } from 'lucide-react';

// ─── PIX FLOW ────────────────────────────────────────────
const PixFlow = ({ onSuccess }) => {
  const [step, setStep] = useState(1); // 1=key, 2=confirm
  const [keyType, setKeyType] = useState('cpf');
  const [keyValue, setKeyValue] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    if (!keyValue || !name) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess({ label: `PIX · ${name}`, sub: keyValue }); }, 1800);
  };

  return (
    <div className="wc-flow">
      <div className="wc-flow-icon" style={{ background: 'rgba(0,184,148,0.12)', borderColor: 'rgba(0,184,148,0.3)' }}>
        <span style={{ fontSize: 28 }}>💸</span>
      </div>
      <h3 className="wc-flow-title">Connect PIX</h3>
      <p className="wc-flow-sub">Link your PIX key for instant payments on Xchange.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['cpf','email','phone','random'].map(t => (
          <button key={t} onClick={() => setKeyType(t)}
            style={{ flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: `1px solid ${keyType===t ? '#00B894' : 'var(--border-color)'}`, background: keyType===t ? 'rgba(0,184,148,0.12)' : 'transparent', color: keyType===t ? '#00B894' : 'var(--text-secondary)', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      <div className="wc-input-group">
        <label>PIX Key ({keyType})</label>
        <input className="wc-input" placeholder={keyType === 'cpf' ? '000.000.000-00' : keyType === 'email' ? 'your@email.com' : keyType === 'phone' ? '+55 (48) 9xxxx-xxxx' : 'Random key'} value={keyValue} onChange={e => setKeyValue(e.target.value)} />
      </div>
      <div className="wc-input-group">
        <label>Account holder name</label>
        <input className="wc-input" placeholder="As shown in your bank" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="wc-security-note">
        <ShieldCheck size={13} color="#B4F44A" />
        <span>Your data is encrypted locally. Never shared without your authorization.</span>
      </div>

      <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg,#00B894,#10B981)' }} onClick={handleConfirm} disabled={!keyValue || !name || loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
        {loading ? 'Verifying...' : 'Link PIX Key'}
      </button>
    </div>
  );
};

// ─── CREDIT CARD FLOW ─────────────────────────────────────
const CardFlow = ({ onSuccess }) => {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [showCvv, setShowCvv] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatCard = (v) => v.replace(/\D/g,'').replace(/(.{4})/g,'$1 ').trim().slice(0,19);
  const formatExpiry = (v) => v.replace(/\D/g,'').replace(/^(.{2})(.+)/,'$1/$2').slice(0,5);

  const handleConfirm = () => {
    if (card.number.length < 19 || !card.name || card.expiry.length < 5 || card.cvv.length < 3) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess({ label: `•••• ${card.number.slice(-4)}`, sub: card.name }); }, 2000);
  };

  const brand = card.number.startsWith('4') ? 'Visa' : card.number.startsWith('5') ? 'Mastercard' : card.number.startsWith('6') ? 'Elo' : '';

  return (
    <div className="wc-flow">
      <div className="wc-flow-icon" style={{ background: 'rgba(56,189,248,0.12)', borderColor: 'rgba(56,189,248,0.3)' }}>
        <CreditCard size={28} color="#38BDF8" />
      </div>
      <h3 className="wc-flow-title">Add Card</h3>
      <p className="wc-flow-sub">Visa, Mastercard or Elo. Your data is encrypted and never stored in plain text.</p>

      {/* Card preview */}
      <div className="wc-card-preview">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, opacity: 0.7 }}>IpêXchange Card</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#38BDF8' }}>{brand}</span>
        </div>
        <p className="wc-card-number">{card.number || '•••• •••• •••• ••••'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{card.name || 'CARDHOLDER NAME'}</span>
          <span style={{ fontSize: 12, opacity: 0.8 }}>{card.expiry || 'MM/YY'}</span>
        </div>
      </div>

      <div className="wc-input-group">
        <label>Card number</label>
        <input className="wc-input" placeholder="0000 0000 0000 0000" maxLength={19} value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))} />
      </div>
      <div className="wc-input-group">
        <label>Cardholder name</label>
        <input className="wc-input" placeholder="As shown on card" value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="wc-input-group">
          <label>Expiry</label>
          <input className="wc-input" placeholder="MM/YY" maxLength={5} value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} />
        </div>
        <div className="wc-input-group">
          <label>CVV</label>
          <div style={{ position: 'relative' }}>
            <input className="wc-input" type={showCvv ? 'text' : 'password'} placeholder="•••" maxLength={4} value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/,'') }))} style={{ paddingRight: 36 }} />
            <button onClick={() => setShowCvv(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
              {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="wc-security-note">
        <ShieldCheck size={13} color="#B4F44A" />
        <span>Secure processing via tokenization. Real card number is never transmitted in plain text.</span>
      </div>

      <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg,#38BDF8,#818CF8)' }} onClick={handleConfirm} disabled={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <ShieldCheck size={16} />}
        {loading ? 'Verifying card...' : 'Add Card'}
      </button>
    </div>
  );
};

// ─── METAMASK FLOW ───────────────────────────────────────
const MetaMaskFlow = ({ onSuccess }) => {
  const [step, setStep] = useState('idle'); // idle | connecting | sign | done

  const handleConnect = () => {
    setStep('connecting');
    setTimeout(() => setStep('sign'), 1800);
  };

  const handleSign = () => {
    setStep('done');
    setTimeout(() => onSuccess({ label: 'MetaMask', sub: '0x7f3a...d8c2' }), 1200);
  };

  return (
    <div className="wc-flow" style={{ textAlign: 'center' }}>
      <div className="wc-flow-icon" style={{ background: 'rgba(246,133,27,0.12)', borderColor: 'rgba(246,133,27,0.3)' }}>
        <span style={{ fontSize: 30 }}>🦊</span>
      </div>
      <h3 className="wc-flow-title">MetaMask</h3>

      {step === 'idle' && (
        <>
          <p className="wc-flow-sub">Connect your MetaMask wallet to use USDC and ETH on Xchange.</p>
          <div className="wc-steps-list">
            {['MetaMask detected in browser','Request read permission','Sign auth message (no gas cost)'].map((s,i) => (
              <div key={i} className="wc-step-row"><span className="wc-step-num">{i+1}</span><span>{s}</span></div>
            ))}
          </div>
          <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg,#F6851B,#E07318)' }} onClick={handleConnect}>
            <span>🦊</span> Conectar MetaMask
          </button>
        </>
      )}

      {step === 'connecting' && (
        <div style={{ padding: '24px 0' }}>
          <Loader2 size={40} color="#F6851B" className="spin" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Waiting for MetaMask...</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Check the extension in your browser</p>
        </div>
      )}

      {step === 'sign' && (
        <>
          <p className="wc-flow-sub">MetaMask connected! Sign the message to authenticate on IpêXchange.</p>
          <div className="wc-sign-box">
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Authentication message:</p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#F6851B', wordBreak: 'break-all' }}>
              "IpêXchange Authentication\nTimestamp: {Date.now()}\nNonce: 0x9f2a..."
            </p>
          </div>
          <p style={{ fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            <ShieldCheck size={13} /> No gas cost — signature only
          </p>
          <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg,#F6851B,#E07318)' }} onClick={handleSign}>
            Sign message
          </button>
        </>
      )}

      {step === 'done' && (
        <div style={{ padding: '16px 0' }}>
          <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Wallet connected!</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>0x7f3a...d8c2</p>
        </div>
      )}
    </div>
  );
};

// ─── WALLETCONNECT FLOW ───────────────────────────────────
const WalletConnectFlow = ({ onSuccess }) => {
  const [scanned, setScanned] = useState(false);

  return (
    <div className="wc-flow" style={{ textAlign: 'center' }}>
      <div className="wc-flow-icon" style={{ background: 'rgba(59,153,252,0.12)', borderColor: 'rgba(59,153,252,0.3)' }}>
        <span style={{ fontSize: 28 }}>📱</span>
      </div>
      <h3 className="wc-flow-title">WalletConnect</h3>
      <p className="wc-flow-sub">Scan the QR with any mobile wallet: Trust, Rainbow, Uniswap, etc.</p>

      {/* Mock QR */}
      <div className="wc-qr-box">
        <QrCode size={80} color="#3B99FC" />
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>wc:9f2a...connect</p>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0' }}>
        <button style={{ fontSize: 12, padding: '7px 14px', borderRadius: 100, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Copy size={12} /> Copiar URI
        </button>
        <button style={{ fontSize: 12, padding: '7px 14px', borderRadius: 100, border: '1px solid rgba(59,153,252,0.4)', color: '#3B99FC', background: 'rgba(59,153,252,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { setScanned(true); setTimeout(() => onSuccess({ label: 'WalletConnect', sub: 'Rainbow Wallet' }), 1500); }}>
          <Smartphone size={12} /> Simular escaneio
        </button>
      </div>

      {scanned && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: '#22c55e', fontSize: 13 }}>
          <Loader2 size={14} className="spin" /> Waiting for confirmation in the app...
        </div>
      )}
    </div>
  );
};

// ─── COINBASE FLOW ────────────────────────────────────────
const CoinbaseFlow = ({ onSuccess }) => {
  const [step, setStep] = useState('idle');

  return (
    <div className="wc-flow" style={{ textAlign: 'center' }}>
      <div className="wc-flow-icon" style={{ background: 'rgba(0,82,255,0.12)', borderColor: 'rgba(0,82,255,0.3)' }}>
        <span style={{ fontSize: 28 }}>🔵</span>
      </div>
      <h3 className="wc-flow-title">Coinbase Wallet</h3>
      <p className="wc-flow-sub">Conecte via Coinbase Wallet app ou extensão. Suporte a Base, Ethereum e Polygon.</p>

      {step === 'idle' && (
        <>
          <div className="wc-steps-list">
            {['Open Coinbase Wallet','Go to "Connect to app"','Scan or click to connect'].map((s,i) => (
              <div key={i} className="wc-step-row"><span className="wc-step-num">{i+1}</span><span>{s}</span></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
            <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg,#0052FF,#3B82F6)' }} onClick={() => { setStep('loading'); setTimeout(() => onSuccess({ label: 'Coinbase Wallet', sub: '0x4c2b...a91f' }), 2000); }}>
              🔵 Conectar via extensão
            </button>
            <button style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
              <QrCode size={14} style={{ display: 'inline', marginRight: 6 }} /> Mostrar QR Code
            </button>
          </div>
        </>
      )}

      {step === 'loading' && (
        <div style={{ padding: '24px 0' }}>
          <Loader2 size={40} color="#0052FF" className="spin" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Connecting to Coinbase Wallet...</p>
        </div>
      )}
    </div>
  );
};

// ─── TANGEM FLOW ──────────────────────────────────────────
const TangemFlow = ({ onSuccess }) => {
  const [step, setStep] = useState('idle');

  const handleTap = () => {
    setStep('scanning');
    setTimeout(() => {
      setStep('done');
      setTimeout(() => onSuccess({ label: 'Tangem', sub: 'Hardware Wallet' }), 1500);
    }, 2000);
  };

  return (
    <div className="wc-flow" style={{ textAlign: 'center' }}>
      <div className="wc-flow-icon" style={{ background: 'rgba(30,41,59,0.12)', borderColor: 'rgba(30,41,59,0.3)' }}>
        <span style={{ fontSize: 28 }}>🪪</span>
      </div>
      <h3 className="wc-flow-title">Tangem Wallet</h3>
      <p className="wc-flow-sub">Tap your Tangem card to the device to sign transactions with hardware-level security.</p>

      {step === 'idle' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ width: 200, height: 120, background: 'linear-gradient(135deg, #1E293B, #0F172A)', margin: '0 auto 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 10, left: 15 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z"/></svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, color: '#fff' }}>TANGEM</span>
          </div>
          <button className="wc-confirm-btn" style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} onClick={handleTap}>
            Tap NFC Card
          </button>
        </div>
      )}

      {step === 'scanning' && (
        <div style={{ padding: '24px 0' }}>
          <div className="spin" style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#38BDF8', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Reading Tangem card via NFC...</p>
        </div>
      )}

      {step === 'done' && (
        <div style={{ padding: '16px 0' }}>
          <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px', display: 'block' }} />
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Card Authenticated!</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Private keys verified offline.</p>
        </div>
      )}
    </div>
  );
};

// ─── RAYCASH FLOW ─────────────────────────────────────────
const RaycashFlow = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess({ label: 'Raycash', sub: email }); }, 1500);
  };

  return (
    <div className="wc-flow">
      <div className="wc-flow-icon" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }}>
        <span style={{ fontSize: 28 }}>💵</span>
      </div>
      <h3 className="wc-flow-title" style={{ textAlign: 'center' }}>Raycash</h3>
      <p className="wc-flow-sub">Connect your Raycash account for instant Stablecoin payments (USDC/USDT) with no volatility.</p>

      <div className="wc-input-group" style={{ marginTop: 12 }}>
        <label>Raycash account email</label>
        <input className="wc-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg, #10B981, #059669)', marginTop: 8 }} onClick={handleConfirm} disabled={!email || loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
        {loading ? 'Connecting...' : 'Link Raycash'}
      </button>
    </div>
  );
};

// ─── YODL FLOW ────────────────────────────────────────────
const YodlFlow = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess({ label: 'Yodl Gateway', sub: 'Conectado' }); }, 1500);
  };

  return (
    <div className="wc-flow" style={{ textAlign: 'center' }}>
      <div className="wc-flow-icon" style={{ background: 'rgba(129,140,248,0.12)', borderColor: 'rgba(129,140,248,0.3)' }}>
        <span style={{ fontSize: 28 }}>🪙</span>
      </div>
      <h3 className="wc-flow-title">Yodl Crypto Payments</h3>
      <p className="wc-flow-sub">The native crypto payment gateway of the ecosystem. Pay with any supported token, instant settlement.</p>

      <div style={{ background: 'rgba(129,140,248,0.05)', padding: 16, borderRadius: 12, border: '1px solid rgba(129,140,248,0.2)', margin: '12px 0', textAlign: 'left' }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Yodl advantages:</p>
        <ul style={{ fontSize: 13, paddingLeft: 20, color: 'var(--text-primary)', margin: 0 }}>
          <li>Multi-chain support</li>
          <li>Automatic conversion at checkout</li>
          <li>Direct integration via smart contracts</li>
        </ul>
      </div>

      <button className="wc-confirm-btn" style={{ background: 'linear-gradient(135deg, #818CF8, #6366F1)' }} onClick={handleConnect} disabled={loading}>
        {loading ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
        {loading ? 'Initializing Yodl...' : 'Activate Yodl Gateway'}
      </button>
    </div>
  );
};

// ─── MASTER MODAL ─────────────────────────────────────────
const FLOWS = { 
  pix: PixFlow, 
  card: CardFlow, 
  metamask: MetaMaskFlow, 
  walletconnect: WalletConnectFlow, 
  coinbase: CoinbaseFlow,
  tangem: TangemFlow,
  raycash: RaycashFlow,
  yodl: YodlFlow
};

const WalletConnectModal = ({ methodId, onClose, onConnected }) => {
  const Flow = FLOWS[methodId];
  if (!Flow) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box glass-panel" style={{ maxWidth: 440, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <X size={20} />
        </button>
        <Flow onSuccess={(info) => { onConnected(methodId, info); onClose(); }} />
      </div>
    </div>
  );
};

export default WalletConnectModal;
