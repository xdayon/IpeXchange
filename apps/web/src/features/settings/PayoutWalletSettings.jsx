import { useMemo, useState } from 'react';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { saveWallet } from '../../api/me.js';
import { walletLabel } from '../intent/paymentFlow.js';

export default function PayoutWalletSettings({ currentWallet, onSaved }) {
  const { wallets } = useWallets();
  const initial = useMemo(() => {
    const current = wallets.find((wallet) => wallet.address.toLowerCase() === currentWallet?.toLowerCase());
    return current?.address ?? (wallets.length === 1 ? wallets[0].address : '');
  }, [currentWallet, wallets]);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const address = selected || initial;
  const isCurrent = address && address.toLowerCase() === currentWallet?.toLowerCase();

  const save = async () => {
    if (!address || isCurrent) return;
    setStatus('saving');
    setError('');
    try {
      await saveWallet(address.toLowerCase());
      setStatus('saved');
      onSaved?.();
    } catch (saveError) {
      setStatus('idle');
      setError(saveError.message || 'Could not verify this payout wallet.');
    }
  };

  if (wallets.length === 0) {
    return (
      <div className="wallet-settings">
        <p className="wallet-settings__label">Payout wallet</p>
        <p className="wallet-settings__hint">Link a wallet to your login account before enabling Buy now.</p>
      </div>
    );
  }

  return (
    <div className="wallet-settings">
      <div>
        <p className="wallet-settings__label">Payout wallet</p>
        <p className="wallet-settings__hint">Buy now payments go directly to this verified wallet on Base.</p>
      </div>
      <div className="wallet-settings__controls">
        <select value={address} onChange={(event) => { setSelected(event.target.value); setStatus('idle'); }}
          aria-label="Payout wallet">
          {wallets.length > 1 && <option value="">Choose a wallet</option>}
          {wallets.map((wallet) => (
            <option key={`${wallet.walletClientType}-${wallet.address}`} value={wallet.address}>
              {walletLabel(wallet)}
            </option>
          ))}
        </select>
        <button onClick={save} disabled={!address || isCurrent || status === 'saving'}>
          {status === 'saving' && <Loader2 size={15} className="spin" />}
          {(isCurrent || status === 'saved') && <Check size={15} />}
          {isCurrent || status === 'saved' ? 'Verified' : 'Use for payouts'}
        </button>
      </div>
      <p className="wallet-settings__security"><ShieldCheck size={14} /> Only wallets linked to your login can be saved.</p>
      {error && <p className="wallet-settings__error" role="alert">{error}</p>}
    </div>
  );
}
