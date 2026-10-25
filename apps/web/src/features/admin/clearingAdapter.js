// Maps a clearing candidate (participants with titles) to the shape CycleRing draws.
export function toRingParticipants(participants = []) {
  const n = participants.length;
  return participants.map((p, i) => {
    const receiveIndex = participants.findIndex((q) => q.gives_title === p.receives_title);
    const from = receiveIndex >= 0 && receiveIndex !== i ? receiveIndex : (i - 1 + n) % n;
    return {
      id: `p${i}`,
      user_id: p.user_id,
      users: { display_name: p.display_name },
      gives: { id: `g${i}` },
      receives: { id: `g${from}` },
    };
  });
}

export const clearingSummary = (result) => {
  if (!result) return null;
  const { candidates = 0, created = 0, selected = [] } = result;
  return { candidates, created, selected: selected.length };
};
