// Maps a clearing candidate to the shape CycleRing draws. Participants are
// ordered by position and participant i receives what participant i-1 gives.
export function toRingParticipants(participants = []) {
  const sorted = [...participants].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const n = sorted.length;
  return sorted.map((p, i) => ({
    id: `p${i}`,
    user_id: p.user_id,
    users: { display_name: p.display_name },
    gives: { id: p.gives_intent_id ?? `g${i}` },
    receives: { id: sorted[(i - 1 + n) % n].gives_intent_id ?? `g${(i - 1 + n) % n}` },
  }));
}

export const clearingSummary = (result) => {
  if (!result) return null;
  const { candidates = 0, created = 0, selected = [] } = result;
  return { candidates, created, selected: selected.length };
};
