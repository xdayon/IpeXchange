export const CYCLE_STATUS = {
  suggested: { label: 'New suggestion', color: 'var(--accent-cyan)', bg: 'rgba(56,189,248,0.12)' },
  pending_acceptance: { label: 'Waiting for others', color: 'var(--accent-purple)', bg: 'rgba(168,85,247,0.12)' },
  accepted: { label: 'Accepted', color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.12)' },
  completed: { label: 'Completed', color: 'var(--accent-lime)', bg: 'rgba(180,244,74,0.12)' },
  cancelled: { label: 'Cancelled', color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.12)' },
  expired: { label: 'Expired', color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.12)' },
};

export const statusInfo = (status) => CYCLE_STATUS[status] ?? CYCLE_STATUS.suggested;

export const myPart = (cycle, userId) =>
  cycle?.participants?.find((p) => p.user_id === userId) ?? null;
