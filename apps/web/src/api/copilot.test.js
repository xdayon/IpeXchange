import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishDrafts } from './copilot.js';

afterEach(() => vi.unstubAllGlobals());

describe('publishDrafts', () => {
  it('persists normalized review input before publishing without a client draft body', async () => {
    vi.stubGlobal('window', {});
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'draft-1' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ intents: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await publishDrafts('draft-1', [{ direction: 'offer', title: 'Consulting' }]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]).toEqual([
      '/api/copilot/drafts/draft-1',
      expect.objectContaining({ method: 'PUT', body: expect.stringContaining('Consulting') }),
    ]);
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/copilot/drafts/draft-1/publish',
      expect.objectContaining({ method: 'POST' }),
    ]);
    expect(fetchMock.mock.calls[1][1].body).toBeUndefined();
  });
});
