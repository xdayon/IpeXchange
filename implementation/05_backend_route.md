# backend/server.js — New Route

## 1. Add import at top of server.js
After the existing imports (around line 6), add:
```js
import { attestTrade } from './lib/eas.js';
```

## 2. Add new route POST /api/attestations

Insert this route block after the `POST /api/transactions` route (around line 333), before the `app.listen` call:

```js
// ─── EAS Attestations ────────────────────────────────────────────────────────

app.post('/api/attestations', async (req, res) => {
  const { buyer, seller, itemOffered, itemReceived, category, sessionId } = req.body;

  if (!itemReceived) {
    return res.status(400).json({ error: 'itemReceived is required' });
  }

  try {
    const uid = await attestTrade({ buyer, seller, itemOffered, itemReceived, category, sessionId });

    if (!uid) {
      return res.status(503).json({ error: 'Attestation service unavailable', uid: null });
    }

    return res.status(201).json({
      uid,
      explorerUrl: `https://base-sepolia.easscan.org/attestation/view/${uid}`,
    });
  } catch (err) {
    console.error('POST /api/attestations error:', err);
    return res.status(500).json({ error: 'Internal error', uid: null });
  }
});
```

## What this route does
- Receives trade details from the frontend after checkout completes
- Calls `attestTrade()` from `backend/lib/eas.js`
- Returns the real UID and the full easscan.org explorer URL
- If EAS is not configured or fails, returns 503 — frontend handles gracefully

## Timing note
`attestTrade()` waits for the tx to be mined on Base Sepolia (~2 seconds). This is acceptable because it happens after the user clicks "Finalize" and during the existing 2.2s simulated delay in the frontend. We can increase that delay slightly or run the attestation in parallel with the UI animation.
