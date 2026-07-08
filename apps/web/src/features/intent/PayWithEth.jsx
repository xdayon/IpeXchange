// Direct P2P checkout: quote from the Worker, transaction sent from the
// buyer's own wallet on Base, receipt verified server-side. Render only
// when Privy is enabled and outside the Telegram Mini App.
import { useState, useRef, useEffect } from 'react';
import { Wallet, Loader2, Check, ExternalLink } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { createPayment, verifyPayment } from '../../api/payments.js';

const POLL_MS = 4000;
const MAX_POLLS = 30;

export default function PayWithEth({ intent, isAuthenticated, login, btnStyle }) {
  const { wallets } = useWallets();
  const [phase, setPhase] = useState('idle');
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

  const requestQuote = async () => {
    if (!isAuthenticated) return login?.();
    setPhase('quoting');
    setError(null);
    try {
      const q = await createPayment(intent.id);
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
        params: [{
          from: wallet.address,
          to: quote.to_wallet,
          value: `0x${BigInt(quote.amount_wei).toString(16)}`,
        }],
      });
    } catch {
      return fail('Transaction was rejected or could not be sent.');
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

  if (phase === 'confirm' || phase === 'sending' || phase === 'verifying') {
    const busy = phase !== 'confirm';
    return (
      <div style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You pay on Base</span>
          <strong style={{ fontSize: 16 }}>{quote.amount_eth} ETH</strong>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
          ~${quote.amount_fiat} at ${Math.round(quote.eth_usd_price)}/ETH. Quote valid for 15 minutes.
          Sent directly to the seller's wallet.
        </p>
        <button onClick={sendAndVerify} disabled={busy}
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
      <button onClick={requestQuote} disabled={phase === 'quoting'}
        style={{ ...btnStyle, background: 'var(--accent-cyan)', color: 'var(--bg-dark)' }}>
        {phase === 'quoting'
          ? <Loader2 size={20} className="spin" />
          : <><Wallet size={20} /> {isAuthenticated ? 'Pay with ETH' : 'Log in to pay with ETH'}</>}
      </button>
      {phase === 'error' && (
        <p style={{ marginTop: 10, fontSize: 13, color: 'var(--accent-pink)', textAlign: 'center' }}>
          {error} {txLink}
        </p>
      )}
    </div>
  );
}
