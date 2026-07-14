// Direct P2P checkout on Base: quote from the Worker, transaction sent
// from the buyer's own wallet (native ETH or ERC-20 USDC), receipt
// verified server-side against the RPC before the payment settles.
import { Wallet, Loader2, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { useOnChainPayment } from './useOnChainPayment.js';

const TOKEN_OPTIONS = [
  { id: 'usdc', label: 'USDC', hint: 'stable, 1:1 with USD' },
  { id: 'eth', label: 'ETH', hint: 'native ether' },
  { id: 'eurc', label: 'EURC', hint: 'euro stablecoin' },
  { id: 'cbbtc', label: 'cbBTC', hint: 'bitcoin on Base' },
];

export default function PayOnChain({ intent, isAuthenticated, login, btnStyle }) {
  const { wallets } = useWallets();
  const {
    error, phase, quote, requestQuote, retryVerification, sendAndVerify, token, txHash,
  } = useOnChainPayment({ intentId: intent.id, isAuthenticated, login, wallet: wallets[0] });

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

  if (phase === 'verify-error' || phase === 'failed') {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: 10, fontSize: 13, color: 'var(--accent-pink)' }}>{error}</p>
        <button onClick={retryVerification}
          style={{ ...btnStyle, background: 'var(--accent-cyan)', color: 'var(--bg-dark)' }}>
          <RefreshCw size={20} /> Recheck transaction
        </button>
        <div style={{ marginTop: 10 }}>{txLink}</div>
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          This checks the same submitted transaction and will not send funds again.
        </p>
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
