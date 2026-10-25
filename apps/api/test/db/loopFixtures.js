// Fixtures for database tests of the matching engine. Embeddings are
// synthetic unit vectors: an Interest and an Offer on the same topic have
// similarity 1, different topics are orthogonal (similarity 0).
import postgres from 'postgres';

const DIMENSIONS = 768;

export const dbUrl = process.env.TEST_DATABASE_URL;

export function connect() {
  return postgres(dbUrl, { max: 1, onnotice: () => {} });
}

export function topicVector(topic, blend = null) {
  const values = new Array(DIMENSIONS).fill(0);
  values[topic] = 1;
  // blend = [otherTopic, weight] lowers similarity to the pure topic.
  if (blend) values[blend[0]] = blend[1];
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return `[${values.map((v) => v / norm).join(',')}]`;
}

class Rollback extends Error {}

// Runs fn inside a transaction that is always rolled back.
export async function inRollback(sql, fn) {
  try {
    await sql.begin(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
}

export async function user(tx, name) {
  const [row] = await tx`INSERT INTO users (display_name) VALUES (${name}) RETURNING id`;
  return row.id;
}

export async function intent(tx, owner, direction, topic, options = {}) {
  const {
    kind = 'good', price = null, mode = 'exchange', continuous = false, blend = null,
  } = options;
  const tokens = mode === 'exchange' ? [] : ['usdc'];
  const [row] = await tx`
    INSERT INTO intents (user_id, direction, kind, title, price_fiat, transaction_mode,
                         accepted_payment_tokens, is_continuous, embedding)
    VALUES (${owner}, ${direction}, ${kind}, ${`${direction} topic ${topic}`}, ${price}, ${mode},
            ${tokens}, ${continuous}, ${topicVector(topic, blend)})
    RETURNING id`;
  return row.id;
}

// Builds a ring where member i offers topic base+i and wants the topic
// offered by member i-1, so every member gives to the next one. A blend
// applies to the Interests only, which weakens every edge of the ring.
export async function ring(tx, size, base, options = {}) {
  const { blend = null, ...shared } = options;
  const members = [];
  for (let i = 0; i < size; i += 1) members.push(await user(tx, `member ${base + i}`));
  const offers = [];
  for (let i = 0; i < size; i += 1) {
    offers.push(await intent(tx, members[i], 'offer', base + i, shared));
    await intent(tx, members[i], 'want', base + ((i - 1 + size) % size), { ...shared, blend });
  }
  return { members, offers };
}

export async function findLoops(tx, userId, maxHops = 6) {
  const [row] = await tx`
    SELECT find_intent_cycles(${userId}::uuid, 10, ${maxHops}) AS loops`;
  return row.loops;
}
