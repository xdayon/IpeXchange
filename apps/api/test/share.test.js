import { describe, expect, it, vi } from 'vitest';
import { fetchPublicIntent, injectShareMetaTags } from '../src/lib/share.js';

describe('public intent sharing', () => {
  it('filters shared intents to active records in the database query', async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: 'intent-id' } });
    const statusEq = vi.fn(() => ({ single }));
    const idEq = vi.fn(() => ({ eq: statusEq }));
    const select = vi.fn(() => ({ eq: idEq }));
    const db = { from: vi.fn(() => ({ select })) };

    await expect(fetchPublicIntent(db, 'intent-id')).resolves.toEqual({ id: 'intent-id' });
    expect(db.from).toHaveBeenCalledWith('intents');
    expect(idEq).toHaveBeenCalledWith('id', 'intent-id');
    expect(statusEq).toHaveBeenCalledWith('status', 'active');
  });

  it('inserts user-controlled dollar patterns as literal text', () => {
    const shell = '<html><head><title>Shell</title></head><body>Body</body></html>';
    const metaTags = '<meta property="og:title" content="$` $& $\'" /></head>';
    const html = injectShareMetaTags(shell, metaTags);

    expect(html).toContain(metaTags);
    expect(html.match(/<title>Shell<\/title>/g)).toHaveLength(1);
    expect(html.match(/<body>Body<\/body>/g)).toHaveLength(1);
  });
});
