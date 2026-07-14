// Base L2 (chain 8453) JSON-RPC access plus token quoting for the
// on-chain checkout. No SDK: raw RPC calls cover transaction
// verification, and Coinbase's public spot endpoint needs no API key.

const DEFAULT_RPC = 'https://mainnet.base.org';
export const BASE_CHAIN_ID = 8453;
// Base blocks land every ~2s; two confirmations cost nothing in UX
// but rule out serving a receipt from a reorged head.
export const MIN_CONFIRMATIONS = 2;

// address null = native ETH; usdc is Circle's native issue on Base.
// band = [min, max] sanity range for the token's USD spot price, so a
// broken/poisoned price feed cannot silently mis-price a quote.
export const TOKENS = {
  eth: { symbol: 'ETH', decimals: 18, address: null, spot: 'ETH-USD', band: [100, 1000000] },
  usdc: {
    symbol: 'USDC',
    decimals: 6,
    address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    spot: 'USDC-USD',
    band: [0.9, 1.1],
  },
  eurc: {
    symbol: 'EURC',
    decimals: 6,
    address: '0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42',
    spot: 'EURC-USD',
    band: [0.7, 2.0],
  },
  cbbtc: {
    symbol: 'cbBTC',
    decimals: 8,
    address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
    // cbBTC is 1:1 BTC-backed and Coinbase has no CBBTC-USD spot pair, so
    // BTC-USD is the correct feed for it.
    spot: 'BTC-USD',
    band: [5000, 5000000],
  },
};

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const USER_OPERATION_TOPIC = '0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f';

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
export async function getTransactionTrace(env, hash) {
  try {
    return await rpc(
      env,
      'debug_traceTransaction',
      [hash, { tracer: 'callTracer', tracerConfig: { onlyTopCall: false } }],
    );
  } catch {
    return rpc(env, 'trace_transaction', [hash]);
  }
}

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
  const [min, max] = TOKENS[token].band;
  if (price < min || price > max) throw new Error(`${token} price out of sane range`);
  return price;
}

export async function getBlockTimestamp(env, blockNumber) {
  const block = await rpc(env, 'eth_getBlockByNumber', [blockNumber, false]);
  return Number(BigInt(block.timestamp));
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

export function paymentMinedDuringQuote(blockTimestamp, createdAt, expiresAt, toleranceMs = 0) {
  const blockTimeMs = blockTimestamp * 1000;
  return (
    blockTimeMs >= new Date(createdAt).getTime() - toleranceMs &&
    blockTimeMs <= new Date(expiresAt).getTime() + toleranceMs
  );
}

function topicAddress(topic) {
  if (!/^0x0{24}[0-9a-f]{40}$/i.test(topic ?? '')) return null;
  return `0x${topic.slice(-40).toLowerCase()}`;
}

export function smartAccountSender(receipt) {
  const event = (receipt.logs ?? []).find(
    (log) => log.topics?.[0]?.toLowerCase() === USER_OPERATION_TOPIC,
  );
  return topicAddress(event?.topics?.[2]);
}

function amountAtLeast(value, minimum) {
  try {
    return BigInt(value ?? 0) >= BigInt(minimum);
  } catch {
    return false;
  }
}

// ERC-4337 native ETH payments are internal calls from the user's smart
// account, while the outer transaction is sent by a bundler to an EntryPoint.
export function tracedNativePaymentSender(trace, toWallet, amountUnits) {
  const pending = Array.isArray(trace) ? [...trace] : trace ? [trace] : [];
  while (pending.length) {
    const call = pending.pop();
    const action = call.action ?? call;
    if (!call.error && action.to?.toLowerCase() === toWallet &&
        amountAtLeast(action.value, amountUnits) &&
        /^0x[0-9a-f]{40}$/i.test(action.from ?? '')) {
      return action.from.toLowerCase();
    }
    pending.push(...(call.calls ?? []));
  }
  return null;
}

// Returns the address that actually supplied the quoted transfer. Native
// transfers use the transaction sender; ERC-20 transfers use the indexed
// `from` address in the matching Transfer log. The latter remains correct
// when a smart account is executed by a bundler whose tx.from is unrelated.
export function paymentSender({ tx, receipt, token, toWallet, amountUnits }) {
  if (receipt.status !== '0x1') return null;
  const spec = TOKENS[token];
  if (!spec.address) {
    if (tx.to?.toLowerCase() !== toWallet || BigInt(tx.value) < BigInt(amountUnits)) return null;
    return /^0x[0-9a-f]{40}$/i.test(tx.from ?? '') ? tx.from.toLowerCase() : null;
  }
  const paddedTo = `0x000000000000000000000000${toWallet.slice(2)}`;
  const transfer = (receipt.logs ?? []).find(
    (log) =>
      log.address?.toLowerCase() === spec.address &&
      log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
      log.topics?.[2]?.toLowerCase() === paddedTo &&
      BigInt(log.data) >= BigInt(amountUnits),
  );
  return topicAddress(transfer?.topics?.[1]);
}

// Boolean compatibility helper for callers that only need transfer validity.
export function paymentSatisfied(args) {
  return paymentSender(args) !== null;
}
