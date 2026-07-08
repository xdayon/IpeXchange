import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';
import { getDb } from '../lib/supabase.js';
import { notify } from '../lib/notify.js';
import {
  BASE_CHAIN_ID,
  MIN_CONFIRMATIONS,
  TOKENS,
  getConfirmations,
  getTokenUsdPrice,
  getTransaction,
  getTransactionReceipt,
  paymentSatisfied,
  unitsToDecimalString,
  usdToUnits,
} from '../lib/base.js';

const app = new Hono();

const QUOTE_TTL_MS = 15 * 60 * 1000;
const TX_HASH_RE = /^0x[0-9a-fA-F]{64}$/;

const serialize = (p) => ({
  id: p.id,
  intent_id: p.intent_id,
  buyer_user_id: p.buyer_user_id,
  seller_user_id: p.seller_user_id,
  to_wallet: p.to_wallet,
  token: p.token,
  symbol: TOKENS[p.token].symbol,
  token_address: TOKENS[p.token].address,
  amount_fiat: Number(p.amount_fiat),
  amount_units: String(p.amount_wei),
  amount_display: unitsToDecimalString(p.amount_wei, TOKENS[p.token].decimals),
  token_usd_price: Number(p.token_usd_price),
  chain_id: p.chain_id,
  tx_hash: p.tx_hash,
  status: p.status,
  quote_expires_at: p.quote_expires_at,
  confirmed_at: p.confirmed_at,
});

app.post('/payments', requireAuth, rateLimit(10, 'pay-quote'), async (c) => {
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  if (!body.intent_id) return c.json({ error: 'intent_id is required' }, 400);
  const token = body.token ?? 'eth';
  if (!TOKENS[token]) return c.json({ error: 'Unsupported token' }, 400);

  const db = getDb(c.env);
  const { data: intent } = await db
    .from('intents')
    .select('id, user_id, direction, title, price_fiat, status, users ( id, wallet )')
    .eq('id', body.intent_id)
    .maybeSingle();

  if (!intent || intent.status !== 'active') return c.json({ error: 'Not found' }, 404);
  if (intent.direction !== 'offer') return c.json({ error: 'Only offers can be paid' }, 400);
  if (intent.user_id === user.id) return c.json({ error: 'Cannot pay for your own offer' }, 400);
  if (!(Number(intent.price_fiat) > 0)) return c.json({ error: 'This offer has no price' }, 400);
  if (!intent.users?.wallet) return c.json({ error: 'The seller has no wallet linked' }, 409);

  let usdPrice;
  try {
    usdPrice = await getTokenUsdPrice(token);
  } catch (e) {
    console.error('Token quote failed:', e);
    return c.json({ error: `Could not fetch the ${TOKENS[token].symbol} price. Try again.` }, 502);
  }

  const amountUnits = usdToUnits(Number(intent.price_fiat), usdPrice, TOKENS[token].decimals);
  const { data: payment, error } = await db
    .from('payments')
    .insert({
      intent_id: intent.id,
      buyer_user_id: user.id,
      seller_user_id: intent.user_id,
      to_wallet: intent.users.wallet.toLowerCase(),
      token,
      amount_fiat: Number(intent.price_fiat),
      token_usd_price: usdPrice,
      eth_usd_price: token === 'eth' ? usdPrice : null,
      amount_wei: amountUnits.toString(),
      chain_id: BASE_CHAIN_ID,
      quote_expires_at: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Payment insert failed:', error);
    return c.json({ error: 'Could not create the payment' }, 500);
  }
  return c.json(serialize(payment), 201);
});

app.post('/payments/:id/verify', requireAuth, rateLimit(60, 'pay-verify'), async (c) => {
  const user = c.get('user');
  const db = getDb(c.env);
  const body = await c.req.json().catch(() => ({}));

  const { data: payment } = await db
    .from('payments')
    .select('*, intents ( id, title )')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!payment || payment.buyer_user_id !== user.id) return c.json({ error: 'Not found' }, 404);
  if (payment.status === 'confirmed') return c.json(serialize(payment));
  if (payment.status === 'failed') return c.json({ error: 'This payment already failed' }, 409);

  const txHash = String(body.tx_hash ?? payment.tx_hash ?? '').toLowerCase();
  if (!TX_HASH_RE.test(txHash)) return c.json({ error: 'A valid tx_hash is required' }, 400);
  if (payment.tx_hash && payment.tx_hash !== txHash) {
    return c.json({ error: 'A different transaction is already attached' }, 409);
  }

  if (!payment.tx_hash) {
    if (new Date(payment.quote_expires_at).getTime() < Date.now()) {
      return c.json({ error: 'This quote expired. Request a new one.' }, 409);
    }
    const { error } = await db
      .from('payments')
      .update({ tx_hash: txHash, status: 'submitted' })
      .eq('id', payment.id);
    if (error) return c.json({ error: 'This transaction is already used by another payment' }, 409);
    payment.tx_hash = txHash;
    payment.status = 'submitted';
  }

  const [tx, receipt] = await Promise.all([
    getTransaction(c.env, txHash).catch(() => null),
    getTransactionReceipt(c.env, txHash).catch(() => null),
  ]);
  // Not indexed or not mined yet: stay submitted, the client keeps polling.
  if (!tx || !receipt) return c.json(serialize(payment));

  const valid = paymentSatisfied({
    tx,
    receipt,
    token: payment.token,
    toWallet: payment.to_wallet,
    amountUnits: payment.amount_wei,
  });
  // Ride out potential reorgs before settling either way.
  if (valid && (await getConfirmations(c.env, receipt).catch(() => 0)) < MIN_CONFIRMATIONS) {
    return c.json(serialize(payment));
  }

  const patch = valid
    ? { status: 'confirmed', from_wallet: tx.from?.toLowerCase() ?? null, confirmed_at: new Date().toISOString() }
    : { status: 'failed' };
  const { data: updated, error } = await db
    .from('payments')
    .update(patch)
    .eq('id', payment.id)
    .select()
    .single();
  if (error) {
    console.error('Payment update failed:', error);
    return c.json({ error: 'Could not update the payment' }, 500);
  }

  if (valid) {
    const who = user.display_name || 'A member';
    const amount = `${unitsToDecimalString(payment.amount_wei, TOKENS[payment.token].decimals)} ${TOKENS[payment.token].symbol}`;
    const dm =
      `${who} paid ${amount} (~$${Number(payment.amount_fiat)}) for your offer "${payment.intents?.title}" on Base.` +
      `\n\nTransaction: https://basescan.org/tx/${txHash}` +
      '\n\nDeliver as agreed, then mark the intent fulfilled in your profile.';
    c.executionCtx.waitUntil(
      notify(c.env, {
        userId: payment.seller_user_id,
        type: 'payment_received',
        payload: {
          payment_id: payment.id,
          intent_id: payment.intent_id,
          from_user_id: user.id,
          token: payment.token,
          amount: unitsToDecimalString(payment.amount_wei, TOKENS[payment.token].decimals),
          amount_fiat: Number(payment.amount_fiat),
          tx_hash: txHash,
        },
        text: dm,
      }),
    );
  }
  return c.json(serialize(updated));
});

app.get('/payments/mine', requireAuth, async (c) => {
  const user = c.get('user');
  const { data } = await getDb(c.env)
    .from('payments')
    .select('*, intents ( id, title )')
    .or(`buyer_user_id.eq.${user.id},seller_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20);
  return c.json(
    (data ?? []).map((p) => ({
      ...serialize(p),
      intent_title: p.intents?.title ?? null,
      role: p.buyer_user_id === user.id ? 'buyer' : 'seller',
      created_at: p.created_at,
    })),
  );
});

app.get('/payments/:id', requireAuth, async (c) => {
  const user = c.get('user');
  const { data: payment } = await getDb(c.env)
    .from('payments')
    .select('*')
    .eq('id', c.req.param('id'))
    .maybeSingle();
  if (!payment || (payment.buyer_user_id !== user.id && payment.seller_user_id !== user.id)) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(serialize(payment));
});

export default app;
