# Execution Order — Step by Step

Do these in order. Each step is independent except for the ones that say "requires step X".

---

## Step 1 — Deploy EAS Schema (browser, ~5 min)
- Follow `02_schema_deploy.md`
- Result: you have `EAS_SCHEMA_UID=0x...`

## Step 2 — Generate attester wallet (Node REPL, ~2 min)
```js
import { ethers } from 'ethers';
const w = ethers.Wallet.createRandom();
console.log(w.address, w.privateKey);
```
- Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Result: you have `ATTESTER_PRIVATE_KEY=0x...` and the wallet has testnet ETH

## Step 3 — Install backend deps (terminal, ~1 min)
```bash
cd backend
npm install @ethereum-attestation-service/eas-sdk ethers
```

## Step 4 — Create backend/lib/eas.js (code, ~2 min)
- Copy code from `04_backend_eas_module.md`

## Step 5 — Update backend/.env (env vars, ~1 min)
- Add `ATTESTER_PRIVATE_KEY` and `EAS_SCHEMA_UID` from steps 1 and 2

## Step 6 — Add route to backend/server.js (code, ~3 min)
- Add import + route from `05_backend_route.md`

## Step 7 — Add createAttestation() to src/lib/api.js (code, ~2 min)
- Append function from `06_frontend_api.md`

## Step 8 — Update XchangeCheckout.jsx (code, ~10 min)
- Apply all changes from `07_frontend_checkout.md`

## Step 9 — Test locally
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Go through checkout flow with any listing
4. After "Finalize Xchange", check console for `✅ EAS attestation created: 0x...`
5. Click the "View Attestation on Base" link → opens easscan.org with real data

## Step 10 — Deploy to Render
- Push to git → Render auto-deploys
- In Render backend dashboard → Environment → add `ATTESTER_PRIVATE_KEY` and `EAS_SCHEMA_UID`

---

## Estimated total time: 30–45 minutes

## What to say during the demo
> "When a trade completes in IpêXchange, it's not just saved in our database — it's attested on-chain on Base using EAS, the same attestation protocol used by Optimism and Edge City. Every trade creates a permanent, verifiable, public record. Here's the live link — you can open it right now."

[Click the link → easscan.org opens showing the real attestation with buyer, seller, item info]

This hits **Technical Quality** and **Innovation** hard.
