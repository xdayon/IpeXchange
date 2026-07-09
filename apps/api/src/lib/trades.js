import { getDb } from './supabase.js';

// A user's "completed trades" = confirmed payments where they're buyer or
// seller, plus completed trade cycles they participated in.
export async function countCompletedTrades(env, userId) {
  const db = getDb(env);
  const [payments, cycles] = await Promise.all([
    db
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed')
      .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
      .then((r) => r.count ?? 0),
    db
      .from('trade_cycle_participants')
      .select('id, trade_cycles!inner(status)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('trade_cycles.status', 'completed')
      .then((r) => r.count ?? 0),
  ]);
  return payments + cycles;
}

export async function fetchRecentTrades(env, userId) {
  const db = getDb(env);
  const [payments, cycles] = await Promise.all([
    db
      .from('payments')
      .select(
        'id, amount_fiat, token, confirmed_at, buyer_user_id, seller_user_id, ' +
          'intents ( title ), buyer:buyer_user_id ( display_name ), seller:seller_user_id ( display_name )',
      )
      .eq('status', 'confirmed')
      .or(`buyer_user_id.eq.${userId},seller_user_id.eq.${userId}`)
      .order('confirmed_at', { ascending: false })
      .limit(20)
      .then((r) => r.data ?? []),
    db
      .from('trade_cycle_participants')
      .select('cycle_id, trade_cycles!inner ( id, status, updated_at, hops )')
      .eq('user_id', userId)
      .eq('trade_cycles.status', 'completed')
      .limit(20)
      .then((r) => r.data ?? []),
  ]);

  const paymentTrades = payments.map((p) => {
    const isBuyer = p.buyer_user_id === userId;
    return {
      type: 'payment',
      role: isBuyer ? 'buyer' : 'seller',
      amount_fiat: Number(p.amount_fiat),
      token: p.token,
      intent_title: p.intents?.title ?? null,
      counterpart_name: (isBuyer ? p.seller?.display_name : p.buyer?.display_name) ?? 'A network member',
      at: p.confirmed_at,
    };
  });

  const cycleTrades = cycles.map((c) => ({
    type: 'cycle',
    hops: c.trade_cycles?.hops ?? null,
    at: c.trade_cycles?.updated_at,
  }));

  return [...paymentTrades, ...cycleTrades]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20);
}
