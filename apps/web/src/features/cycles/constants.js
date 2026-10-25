const tint = (token) => `color-mix(in srgb, ${token} 12%, transparent)`;

export const CYCLE_STATUS = {
  suggested: { label: 'New suggestion', color: 'var(--accent-cyan)', bg: tint('var(--accent-cyan)') },
  pending_acceptance: { label: 'Waiting for others', color: 'var(--accent-purple)', bg: tint('var(--accent-purple)') },
  accepted: { label: 'Accepted', color: 'var(--accent-lime)', bg: tint('var(--accent-lime)') },
  completed: { label: 'Completed', color: 'var(--accent-lime)', bg: tint('var(--accent-lime)') },
  cancelled: { label: 'Cancelled', color: 'var(--text-secondary)', bg: tint('var(--text-secondary)') },
  expired: { label: 'Expired', color: 'var(--text-secondary)', bg: tint('var(--text-secondary)') },
  superseded: { label: 'No longer available', color: 'var(--accent-amber)', bg: tint('var(--accent-amber)') },
};

export const SUPERSEDED_COPY = 'No longer available: someone completed another loop with one of these items.';

export const statusInfo = (status) => CYCLE_STATUS[status] ?? CYCLE_STATUS.suggested;

export const myPart = (cycle, userId) =>
  cycle?.participants?.find((p) => p.user_id === userId) ?? null;

export const loopName = (hops) => (hops === 2 ? 'Direct swap' : `${hops}-person trade loop`);

export const matchStrength = (score) =>
  Number.isFinite(Number(score)) && score !== null ? `${Math.round(Math.max(0, Math.min(1, Number(score))) * 100)}%` : null;
