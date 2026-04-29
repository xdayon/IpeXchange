# backend/lib/eas.js — New File

Create this file at `backend/lib/eas.js`. It's a singleton module that initializes the EAS SDK once and exports an `attest()` function.

```js
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

const EAS_CONTRACT = '0x4200000000000000000000000000000000000021';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const SCHEMA_UID = process.env.EAS_SCHEMA_UID;

let easInstance = null;

function getEAS() {
  if (easInstance) return easInstance;

  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  const signer = new ethers.Wallet(process.env.ATTESTER_PRIVATE_KEY, provider);

  const eas = new EAS(EAS_CONTRACT);
  eas.connect(signer);

  easInstance = eas;
  return eas;
}

/**
 * Creates an on-chain attestation for a completed IpêXchange trade.
 * Returns the attestation UID (0x...) or null if something fails.
 */
export async function attestTrade({ buyer, seller, itemOffered, itemReceived, category, sessionId }) {
  if (!process.env.ATTESTER_PRIVATE_KEY || !SCHEMA_UID) {
    console.warn('EAS not configured — skipping attestation');
    return null;
  }

  try {
    const eas = getEAS();

    const encoder = new SchemaEncoder(
      'address buyer,address seller,string itemOffered,string itemReceived,string category,string sessionId'
    );

    const encoded = encoder.encodeData([
      { name: 'buyer',        type: 'address', value: buyer        || ethers.ZeroAddress },
      { name: 'seller',       type: 'address', value: seller       || ethers.ZeroAddress },
      { name: 'itemOffered',  type: 'string',  value: itemOffered  || '' },
      { name: 'itemReceived', type: 'string',  value: itemReceived || '' },
      { name: 'category',     type: 'string',  value: category     || '' },
      { name: 'sessionId',    type: 'string',  value: sessionId    || '' },
    ]);

    const tx = await eas.attest({
      schema: SCHEMA_UID,
      data: {
        recipient:          buyer || ethers.ZeroAddress,
        expirationTime:     0n,
        revocable:          true,
        data:               encoded,
      },
    });

    const uid = await tx.wait();
    console.log(`✅ EAS attestation created: ${uid}`);
    return uid;
  } catch (err) {
    console.error('EAS attestation failed:', err.message);
    return null;
  }
}
```

## Key design decisions
- **Singleton provider/signer** — `getEAS()` initializes once, reuses on subsequent calls
- **Graceful fallback** — if env vars missing, logs warning and returns null (app keeps working)
- **ethers.ZeroAddress** — used when buyer/seller wallet is unknown (anonymous session)
- **`await tx.wait()`** — waits for the tx to be mined and returns the real UID
- **No throw** — errors are caught and return null so the transaction still completes in the app
