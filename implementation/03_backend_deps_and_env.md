# Backend — Dependencies & Environment Variables

## 1. Install dependencies (run inside /backend)
```bash
cd backend
npm install @ethereum-attestation-service/eas-sdk ethers
```

- `ethers` v6 (installs latest by default — EAS SDK requires v6)
- `@ethereum-attestation-service/eas-sdk` — official EAS SDK

## 2. Generate attester wallet (one-time)
Run this in any Node REPL or a throwaway script:
```js
import { ethers } from 'ethers';
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

This wallet is IpêXchange's "attester" — it signs attestations server-side.
It does NOT hold user funds. It just needs a tiny bit of Base Sepolia ETH for gas (get from faucet).

Fund the attester address at: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 3. Add to backend/.env
```
# EAS — Ethereum Attestation Service (Base Sepolia)
ATTESTER_PRIVATE_KEY=0xYOUR_GENERATED_PRIVATE_KEY
EAS_SCHEMA_UID=0xYOUR_SCHEMA_UID_FROM_STEP_02
```

## 4. Add to backend/.env.example (for documentation)
```
# EAS — Ethereum Attestation Service
ATTESTER_PRIVATE_KEY=0x_your_attester_wallet_private_key
EAS_SCHEMA_UID=0x_your_schema_uid_from_easscan
```

## Notes
- ATTESTER_PRIVATE_KEY is a throwaway wallet, only for signing attestations. No real money.
- On Render, add these same vars to the backend service's Environment Variables dashboard.
- Base Sepolia RPC: use the public one `https://sepolia.base.org` — no API key needed.
