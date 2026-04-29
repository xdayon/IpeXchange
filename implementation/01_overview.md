# EAS Integration — Overview & Architecture

## What we're building
Every completed trade in IpêXchange will be **attested on-chain on Base Sepolia** using EAS (Ethereum Attestation Service). This turns each barter into a verifiable, permanent, public record — with a real link to the blockchain explorer.

## Why EAS on Base
- EAS is the standard used by Optimism, Base, Gitcoin, Edge City, Zuzalu ecosystem
- Base Sepolia = free testnet from Coinbase — no gas cost for demo
- easscan.org gives a beautiful public explorer URL per attestation (perfect for demo)
- Zero user friction: the user doesn't sign anything — IpêXchange's own attester wallet signs server-side

## Architecture

```
User clicks "Finalize Xchange"
        │
        ▼
XchangeCheckout.jsx → POST /api/attestations (new backend route)
        │
        ▼
backend/lib/eas.js  → EAS SDK + attester wallet (private key in .env)
        │
        ▼
Base Sepolia chain  → on-chain attestation created
        │                   UID = 0xabc123...
        ▼
Response → frontend shows real UID + link to easscan.org
```

## What the attestation contains (schema)
```
address buyer        — wallet of buyer (or "0x000..." if no wallet)
address seller       — wallet of seller listing owner
string  itemOffered  — what buyer gave (for barter) or payment method
string  itemReceived — listing title
string  category     — listing category (Products/Services/Knowledge/Donations)
string  sessionId    — IpêXchange session ID
```

## Files to create/modify

| File | Action |
|------|--------|
| `backend/lib/eas.js` | CREATE — attester module |
| `backend/server.js` | MODIFY — add POST /api/attestations route |
| `backend/.env` | MODIFY — add ATTESTER_PRIVATE_KEY + EAS_SCHEMA_UID |
| `backend/package.json` | MODIFY — add dependencies |
| `src/lib/api.js` | MODIFY — add createAttestation() function |
| `src/components/XchangeCheckout.jsx` | MODIFY — call real attestation, show real UID + link |

## EAS addresses on Base Sepolia
- EAS Contract: `0x4200000000000000000000000000000000000021`
- Schema Registry: `0x4200000000000000000000000000000000000020`
- Explorer base URL: `https://base-sepolia.easscan.org/attestation/view/`

## Pre-requisite: deploy the schema (one-time, manual)
See `02_schema_deploy.md` — done once via browser, produces the SCHEMA_UID we hardcode.
