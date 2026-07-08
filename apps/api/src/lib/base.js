// Base L2 (chain 8453) JSON-RPC access plus the ETH spot price used to
// quote fiat-priced intents. No SDK: two raw RPC calls cover receipt
// verification, and Coinbase's public spot endpoint needs no API key.

const DEFAULT_RPC = 'https://mainnet.base.org';
export const BASE_CHAIN_ID = 8453;

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

export async function getEthUsdPrice() {
  const res = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot');
  if (!res.ok) throw new Error(`ETH price lookup failed (${res.status})`);
  const body = await res.json();
  const price = Number(body?.data?.amount);
  if (!Number.isFinite(price) || price <= 0) throw new Error('ETH price unavailable');
  return price;
}

// Gwei-precision integer math keeps the quote float-safe end to end.
export function usdToWei(amountUsd, ethUsdPrice) {
  const gwei = Math.round((amountUsd / ethUsdPrice) * 1e9);
  return BigInt(gwei) * 1000000000n;
}

export function weiToEthString(wei) {
  const eth = Number(BigInt(wei) / 1000000000n) / 1e9;
  return eth.toFixed(6).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
