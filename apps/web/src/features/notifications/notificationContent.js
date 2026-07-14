export function notificationContent(notification) {
  const payload = notification.payload ?? {};
  const from = payload.from_display_name || 'Someone';

  if (notification.type === 'interest_received') {
    return {
      kind: 'interest',
      title: `New interest in ${payload.intent_title || 'your intent'}`,
      body: payload.message || `${from} is interested and wants to connect.`,
      destination: payload.intent_id ? ['intent-detail', { intent: { id: payload.intent_id } }] : null,
    };
  }
  if (notification.type === 'payment_received') {
    const amount = [payload.amount, payload.token?.toUpperCase()].filter(Boolean).join(' ');
    const hasFiat = payload.amount_fiat != null && Number.isFinite(Number(payload.amount_fiat));
    const fiat = hasFiat ? `, about $${Number(payload.amount_fiat)}` : '';
    return {
      kind: 'payment', title: 'Payment received',
      body: amount ? `${amount}${fiat} was confirmed on Base.` : 'A payment was confirmed on Base.',
      destination: payload.intent_id ? ['intent-detail', { intent: { id: payload.intent_id } }] : null,
    };
  }
  if (notification.type?.startsWith('cycle_')) {
    const copy = {
      cycle_suggested: ['New trade cycle', 'Nexum found a trade cycle for you to review.'],
      cycle_accepted: ['Trade cycle accepted', 'Everyone accepted. Open the cycle to coordinate delivery.'],
      cycle_cancelled: ['Trade cycle cancelled', 'A participant declined. Nexum will keep looking for matches.'],
      cycle_completed: ['Trade cycle completed', 'Everyone confirmed delivery and receipt.'],
    }[notification.type] ?? ['Trade cycle update', 'Your trade cycle has an update.'];
    return {
      kind: 'cycle', title: copy[0], body: copy[1],
      destination: payload.cycle_id ? ['cycle-detail', { cycleId: payload.cycle_id }] : null,
    };
  }
  if (notification.type === 'referral_joined') {
    return {
      kind: 'referral', title: 'A new member joined',
      body: `${payload.display_name || 'A new member'} joined with your invite link.`, destination: null,
    };
  }
  return { kind: 'general', title: 'IpeXchange update', body: 'You have a new marketplace update.', destination: null };
}
