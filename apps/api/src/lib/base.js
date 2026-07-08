// Base L2 (chain 8453) JSON-RPC access plus token quoting for the
// on-chain checkout. No SDK: raw RPC calls cover transaction
// verification, and Coinbase's public spot endpoint needs no API key.

const DEFAULT_RPC = 'https://mainnet.base.org';
export const BASE_CHAIN_ID = 8453;
// Base blocks land every ~2s; two confirmations cost nothing in UX
// but rule out serving a receipt from a reorged head.
export const MIN_CONFIRMATIONS = 2;

// address null = native ETH; usdc is Circle's native issue on Base.
export const TOKENS = {
  eth: { symbol: 'ETH', decimals: 18, address: null, spot: 'ETH-USD' },
  usdc: {
    symbol: 'USDC',
    decimals: 6,
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    spot: 'USDC-USD',
  },
};

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

async function rpc(env, method, params) {
  const res = await fetch(env.BASE_RPC_URL || DEFAULT_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Base RPC ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`Base RPC: ${body.error.message}`);
  return body.result;
}

export const getTransaction = (env, hash) => rpc(env, 'eth_getTransactionByHash', [hash]);
export const getTransactionReceipt = (env, hash) => rpc(env, 'eth_getTransactionReceipt', [hash]);

export async function getConfirmations(env, receipt) {
  const head = BigInt(await rpc(env, 'eth_blockNumber', []));
  return Number(head - BigInt(receipt.blockNumber) + 1n);
}

export async function getTokenUsdPrice(token) {
  const res = await fetch(`https://api.coinbase.com/v2/prices/${TOKENS[token].spot}/spot`);
  if (!res.ok) throw new Error(`${token} price lookup failed (${res.status})`);
  const body = await res.json();
  const price = Number(body?.data?.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error(`${token} price unavailable`);
  return price;
}

// 1e9 sub-unit precision keeps the quote float-safe end to end.
export function usdToUnits(amountUsd, usdPrice, decimals) {
  const scaled = BigInt(Math.round((amountUsd / usdPrice) * 1e9));
  return decimals >= 9
    ? scaled * 10n ** BigInt(decimals - 9)
    : scaled / 10n ** BigInt(9 - decimals);
}

export function unitsToDecimalString(units, decimals) {
  const base = 10n ** BigInt(decimals);
  const whole = BigInt(units) / base;
  const frac = (BigInt(units) % base).toString().padStart(decimals, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : String(whole);
}

// A payment is satisfied by a successful native transfer for ETH, or by
// a Transfer log emitted by the token contract itself for ERC-20 —
// checking logs (not calldata) also covers smart-account wallets.
export function paymentSatisfied({ tx, receipt, token, toWallet, amountUnits }) {
  if (receipt.status !== '0x1') return false;
  const spec = TOKENS[token];
  if (!spec.address) {
    return tx.to?.toLowerCase() === toWallet && BigInt(tx.value) >= BigInt(amountUnits);
  }
  const paddedTo = `0x000000000000000000000000${toWallet.slice(2)}`;
  return (receipt.logs ?? []).some(
    (log) =>
      log.address?.toLowerCase() === spec.address &&
      log.topics?.[0] === TRANSFER_TOPIC &&
      log.topics?.[2]?.toLowerCase() === paddedTo &&
      BigInt(log.data) >= BigInt(amountUnits),
  );
}
