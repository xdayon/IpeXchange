# EAS Schema Deploy — One-Time Manual Step

## What is a Schema
Before creating attestations, EAS requires you to register a "schema" — the shape/fields of your attestation. This is done once, produces a UID, and that UID is hardcoded in the app.

## How to deploy (browser, no code)

1. Go to: https://base-sepolia.easscan.org/schema/create
2. Connect any wallet (MetaMask, Coinbase Wallet — testnet, no real funds needed)
3. Paste this schema string exactly:
   ```
   address buyer,address seller,string itemOffered,string itemReceived,string category,string sessionId
   ```
4. Set "Resolver" to: `0x0000000000000000000000000000000000000000` (none)
5. Set "Revocable" to: `true`
6. Click "Create Schema" → confirm the transaction (free on testnet)
7. Copy the resulting Schema UID (looks like `0x1234...abcd`, 66 chars)
8. Save it as `EAS_SCHEMA_UID` in `backend/.env`

## Alternative: if no wallet available for schema deploy
Use the IpêXchange attester wallet (generated in step 03). Fund it with Base Sepolia ETH from:
https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
(free — just needs a Coinbase account)

## Expected result
After deploy, you'll have a URL like:
`https://base-sepolia.easscan.org/schema/view/0xYOUR_SCHEMA_UID`

This is shareable and shows your schema publicly — great for the demo presentation.

## Fallback schema UID (IpêXchange pre-deployed)
If schema deploy fails or takes too long, a generic "trade" schema on Base Sepolia can be reused. But deploying your own is better for the demo narrative ("we deployed our own schema on Base").
