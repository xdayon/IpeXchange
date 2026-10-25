// Merkle tree over 32-byte receipt digests.
// Domain separation: leaf = SHA-256(0x00 || digest);
// node = SHA-256(0x01 || min(a, b) || max(a, b)) with byte-wise ordering, so
// proofs need no left/right flags. Leaves are sorted and de-duplicated; an odd
// node at the end of a level is promoted unchanged.
export const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
export const fromHex = (text) => Uint8Array.from(text.match(/../g) ?? [], (h) => parseInt(h, 16));

async function sha256(...parts) {
  const data = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) { data.set(part, offset); offset += part.length; }
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

function compare(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

const hashLeaf = (digest) => sha256(Uint8Array.of(0), digest);
const hashNode = (a, b) => {
  const [lo, hi] = compare(a, b) <= 0 ? [a, b] : [b, a];
  return sha256(Uint8Array.of(1), lo, hi);
};

function sortedUnique(digests) {
  const sorted = [...digests].sort(compare);
  return sorted.filter((d, i) => i === 0 || compare(d, sorted[i - 1]) !== 0);
}

async function buildLevels(digests) {
  if (!digests.length) throw new Error('Cannot build a Merkle tree without leaves');
  let level = await Promise.all(sortedUnique(digests).map(hashLeaf));
  const levels = [level];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(i + 1 < level.length ? await hashNode(level[i], level[i + 1]) : level[i]);
    }
    level = next;
    levels.push(level);
  }
  return levels;
}

export async function merkleRoot(digests) {
  const levels = await buildLevels(digests);
  return levels.at(-1)[0];
}

// Sibling hashes from leaf to root (promoted levels contribute nothing).
export async function merkleProof(digests, digest) {
  const leaves = sortedUnique(digests);
  let index = leaves.findIndex((d) => compare(d, digest) === 0);
  if (index < 0) throw new Error('Leaf is not in the tree');
  const levels = await buildLevels(digests);
  const proof = [];
  for (const level of levels.slice(0, -1)) {
    const sibling = index ^ 1;
    if (sibling < level.length) proof.push(level[sibling]);
    index >>= 1;
  }
  return proof;
}

export async function verifyProof(digest, proof, root) {
  let node = await hashLeaf(digest);
  for (const sibling of proof) node = await hashNode(node, sibling);
  return compare(node, root) === 0;
}
