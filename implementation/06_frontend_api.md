# src/lib/api.js — Add createAttestation()

## Add this function at the end of src/lib/api.js

```js
/** Creates an on-chain EAS attestation for a completed trade. */
export async function createAttestation({ buyer, seller, itemOffered, itemReceived, category, sessionId }) {
  try {
    const res = await fetch(`${API_URL}/attestations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ buyer, seller, itemOffered, itemReceived, category, sessionId }),
    });
    if (!res.ok) return null;
    return await res.json(); // { uid, explorerUrl }
  } catch (err) {
    console.error('createAttestation error:', err);
    return null;
  }
}
```

## Notes
- Returns `{ uid, explorerUrl }` on success, `null` on failure
- Caller (XchangeCheckout) handles null gracefully (falls back to showing a placeholder)
