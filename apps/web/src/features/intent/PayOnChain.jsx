// Direct P2P checkout on Base: quote from the Worker, transaction sent
// from the buyer's own wallet (native ETH or ERC-20 USDC), receipt
// verified server-side against the RPC before the payment settles.
import { useState, useRef, useEffect } from 'react';
import { Wallet, Loader2, Check, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { createPayment, verifyPayment } from '../../api/payments.js';

const POLL_MS = 4000;
const MAX_POLLS = 30;
const TOKEN_OPTIONS = [
  { id: 'usdc', label: 'USDC', hint: 'stable, 1:1 with USD' },
  { id: 'eth', label: 'ETH', hint: 'native ether' },
];

const pad64 = (hex) => hex.replace(/^0x/, '').padStart(64, '0');

function txParams(quote, from) {
  if (!quote.token_address) {
    return { from, to: quote.to_wallet, value: `0x${BigInt(quote.amount_units).toString(16)}` };
  }
  const data = `0xa9059cbb${pad64(quote.to_wallet)}${pad64(BigInt(quote.amount_units).toString(16))}`;
  return { from, to: quote.token_address, value: '0x0', data };
}

function sendErrorMessage(e) {
  if (e?.code === 4001 || /reject|denied/i.test(e?.message ?? '')) return 'You rejected the transaction in your wallet.';
  if (/insufficient/i.test(e?.message ?? '')) return 'Insufficient balance for this amount plus gas.';
  return 'The transaction could not be sent. Try again.';
}

export default function PayOnChain({ intent, isAuthenticated, login, btnStyle }) {
  const { wallets } = useWallets();
  const [phase, setPhase] = useState('idle');
  const [token, setToken] = useState('usdc');
  const [quote, setQuote] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const fail = (message) => {
    if (!alive.current) return;
    setError(message);
    setPhase('error');
  };

  const requestQuote = async (tok = token) => {
    if (!isAuthenticated) return login?.();
    setToken(tok);
    setPhase('quoting');
    setError(null);
    try {
      const q = await createPayment(intent.id, tok);
      if (alive.current) { setQuote(q); setPhase('confirm'); }
    } catch (e) {
      fail(e.message || 'Could not prepare the payment.');
    }
  };

  const sendAndVerify = async () => {
    const wallet = wallets[0];
    if (!wallet) return fail('No wallet available on this account.');
    setPhase('sending');
    let hash;
    try {
      await wallet.switchChain(quote.chain_id);
      const provider = await wallet.getEthereumProvider();
      hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [txParams(quote, wallet.address)],
      });
    } catch (e) {
      return fail(sendErrorMessage(e));
    }
    if (!alive.current) return;
    setTxHash(hash);
    setPhase('verifying');
    for (let i = 0; i < MAX_POLLS && alive.current; i++) {
      try {
        const p = await verifyPayment(quote.id, hash);
        if (p.status === 'confirmed') return alive.current && setPhase('paid');
        if (p.status === 'failed') return fail('The transaction failed on-chain.');
      } catch (e) {
        return fail(e.message || 'Could not verify the payment.');
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
    fail('Verification is taking longer than expected. Check the transaction on BaseScan.');
  };

  const txLink = txHash && (
    <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-cyan)', fontSize: 13 }}>
      View on BaseScan <ExternalLink size={14} />
    </a>
  );

  if (phase === 'paid') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...btnStyle, background: 'rgba(180,244,74,0.12)', color: 'var(--accent-lime)', cursor: 'default' }}>
          <Check size={20} /> Payment confirmed. The seller was notified.
        </div>
        <div style={{ marginTop: 10 }}>{txLink}</div>
      </div>
    );
  }

  if (phase === 'quoting' || phase === 'confirm' || phase === 'sending' || phase === 'verifying') {
    const busy = phase === 'sending' || phase === 'verifying';
    return (
      <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)' }}>
        <div className="filter-chips" style={{ marginBottom: 12 }}>
          {TOKEN_OPTIONS.map((t) => (
            <button key={t.id} className={`filter-chip ${token === t.id ? 'active' : ''}`}
              disabled={busy || phase === 'quoting'} onClick={() => t.id !== token && requestQuote(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You pay on Base</span>
          <strong style={{ fontSize: 16 }}>
            {phase === 'quoting' ? <Loader2 size={16} className="spin" /> : `${quote.amount_display} ${quote.symbol}`}
          </strong>
        </div>
        {phase !== 'quoting' && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
            ~${quote.amount_fiat} at ${Number(quote.token_usd_price).toLocaleString()}/{quote.symbol}. Quote valid
            for 15 minutes. Sent directly to the seller's wallet and verified on-chain.
          </p>
        )}
        <button onClick={sendAndVerify} disabled={busy || phase === 'quoting'}
          style={{ ...btnStyle, background: 'var(--accent-cyan)', color: 'var(--bg-dark)', opacity: busy ? 0.7 : 1 }}>
          {busy
            ? <><Loader2 size={20} className="spin" /> {phase === 'sending' ? 'Waiting for your wallet' : 'Verifying on Base'}</>
            : <><Wallet size={20} /> Confirm and pay</>}
        </button>
        {phase === 'verifying' && <div style={{ marginTop: 10, textAlign: 'center' }}>{txLink}</div>}
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => requestQuote()}
        style={{ ...btnStyle, background: 'var(--accent-cyan)', color: 'var(--bg-dark)' }}>
        <Wallet size={20} /> {isAuthenticated ? 'Pay with crypto' : 'Log in to pay with crypto'}
      </button>
      {phase === 'error' && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center' }}>
          {error} {txLink}
        </p>
      )}
    </div>
  );
}
