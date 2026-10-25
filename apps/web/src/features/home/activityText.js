export function describeEvent(event) {
  const label = event.direction === 'offer' ? 'Offer' : 'Interest';
  switch (event.type) {
    case 'intent_published':
      return `New ${label}: ${event.title || 'something new'}`;
    case 'loop_formed':
      return event.hops === 2 ? 'A direct swap was just found' : `A ${event.hops ?? 3}-person trade loop was just found`;
    case 'loop_completed':
      return event.hops === 2 ? 'A direct swap was completed' : `A ${event.hops ?? 3}-person trade loop was completed`;
    case 'purchase_completed':
      return `Someone just bought ${event.title || 'an Offer'}`;
    default:
      return null;
  }
}

export function timeAgo(at, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000));
  if (!Number.isFinite(seconds)) return '';
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

export const tickerEvents = (events = []) =>
  events.map((e) => ({ ...e, text: describeEvent(e) })).filter((e) => e.text);
