export const POLL_MS = 4000;
export const MAX_POLLS = 30;
export const QUOTE_SEND_BUFFER_MS = 30_000;

const pad64 = (hex) => hex.replace(/^0x/, '').padStart(64, '0');

export function walletLabel(wallet) {
  const address = wallet?.address ?? '';
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unavailable';
  const source = String(wallet?.walletClientType ?? wallet?.connectorType ?? 'wallet')
    .replaceAll('_', ' ');
  return `${source} (${short})`;
}

export function initialWalletAddress(wallets) {
  return wallets.length === 1 ? wallets[0].address : '';
}

export function isQuoteExpired(quote, now = Date.now(), bufferMs = 0) {
  const expiresAt = Date.parse(quote?.quote_expires_at);
  return !Number.isFinite(expiresAt) || expiresAt <= now + bufferMs;
}

export function txParams(quote, from) {
  if (!quote.token_address) {
    return { from, to: quote.to_wallet, value: `0x${BigInt(quote.amount_units).toString(16)}` };
  }
  const data = `0xa9059cbb${pad64(quote.to_wallet)}${pad64(BigInt(quote.amount_units).toString(16))}`;
  return { from, to: quote.token_address, value: '0x0', data };
}

const isTransientError = (error) => (
  !error?.status || error.status === 429 || error.status >= 500
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function pollPaymentVerification({
  paymentId,
  txHash,
  verify,
  wait = delay,
  isAlive = () => true,
  maxPolls = MAX_POLLS,
  pollMs = POLL_MS,
}) {
  let lastError = null;
  for (let attempt = 0; attempt < maxPolls && isAlive(); attempt += 1) {
    try {
      const payment = await verify(paymentId, txHash);
      lastError = null;
      if (payment.status === 'confirmed' || payment.status === 'failed') return payment;
    } catch (error) {
      if (!isTransientError(error)) throw error;
      lastError = error;
    }
    if (attempt + 1 < maxPolls && isAlive()) await wait(pollMs);
  }
  return isAlive() ? { status: 'pending', error: lastError } : { status: 'stopped' };
}
