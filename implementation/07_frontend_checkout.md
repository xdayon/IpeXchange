# src/components/XchangeCheckout.jsx — StepConfirm changes

## 1. Add import at top
```js
import { createAttestation } from '../lib/api';
```

## 2. Replace StepConfirm's handleConfirm function

Current code (lines ~247–274) has a fake tx hash and a hardcoded 2.2s delay.
Replace the entire `handleConfirm` function with this:

```js
const handleConfirm = async () => {
  setLoading(true);

  const entry = savePurchase({ listing, paymentMethod });

  // Run DB record + EAS attestation in parallel
  const [, attestation] = await Promise.all([
    walletAddress ? recordTransaction({
      listingId:        listing.id,
      buyerWallet:      walletAddress,
      sellerWallet:     listing.wallet_address || null,
      amountFiat:       listing.price ? parseFloat(listing.price.replace(/[^\d.]/g, '')) || 0 : 0,
      currency:         'USD',
      isTrade:          paymentMethod === 'trade',
      tradeDescription: paymentMethod === 'trade' ? 'Barter negotiation' : null,
    }) : Promise.resolve(null),

    createAttestation({
      buyer:        walletAddress || null,
      seller:       listing.wallet_address || null,
      itemOffered:  paymentMethod === 'trade' ? 'Barter offer' : paymentMethod,
      itemReceived: listing.title,
      category:     listing.category || '',
      sessionId:    localStorage.getItem('ipeCoreSessionId') || '',
    }),
  ]);

  if (walletAddress) await refreshProfile();

  // Use real UID if attestation succeeded, fallback to mock
  setTxHash(attestation?.uid || entry.txHash);
  setAttestationUrl(attestation?.explorerUrl || null);
  setConfirmed(true);
  setLoading(false);
};
```

## 3. Add attestationUrl to StepConfirm state

At the top of StepConfirm component, after the existing useState declarations:
```js
const [attestationUrl, setAttestationUrl] = useState(null);
```

Pass `attestationUrl` down to the success screen JSX.

## 4. Update the success screen TX Hash row

Find the "TX Hash" row in the success screen (around line 292–296).
Replace the static `<ExternalLink>` with a real link:

```jsx
<div className="success-tx-row">
  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Attestation</span>
  {attestationUrl ? (
    <a
      href={attestationUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{ fontFamily: 'monospace', fontSize: 12, color: '#B4F44A', display: 'flex', alignItems: 'center', gap: 6 }}
    >
      {txHash.slice(0, 18)}… <ExternalLink size={12} />
    </a>
  ) : (
    <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#B4F44A' }}>
      {txHash}
    </span>
  )}
</div>
```

## 5. Update the "Confirmed on-chain" status row

Change the status text to reflect EAS:
```jsx
<span style={{ fontSize: 13, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
  <ShieldCheck size={13} /> Attested on Base Sepolia
</span>
```

## 6. Add "View on EAS Explorer" button in success screen (optional, nice for demo)

After the success-tx-card div, add:
```jsx
{attestationUrl && (
  <a
    href={attestationUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="checkout-cta"
    style={{ marginTop: 12, textDecoration: 'none', justifyContent: 'center', background: 'rgba(180,244,74,0.08)', border: '1px solid rgba(180,244,74,0.3)', color: '#B4F44A' }}
  >
    <ExternalLink size={16} />
    View Attestation on Base
  </a>
)}
```

## Summary of changes in XchangeCheckout.jsx
- Import `createAttestation` from api.js
- Add `attestationUrl` state to StepConfirm
- Replace `handleConfirm` to run attestation in parallel with DB record
- Success screen shows real UID with clickable link to easscan.org
- Status row says "Attested on Base Sepolia" instead of "Confirmed on-chain"
