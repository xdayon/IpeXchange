import { describe, expect, it, vi } from 'vitest';
import { fetchWithAuthRetry, isTransientAuthError } from './authRecovery.js';

describe('auth recovery', () => {
  it('retries transient failures using the configured backoff', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('network'), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error('limited'), { status: 429 }))
      .mockResolvedValue({ id: 'user-1' });
    const wait = vi.fn().mockResolvedValue();

    await expect(fetchWithAuthRetry(fetcher, { delays: [10, 20], wait }))
      .resolves.toEqual({ id: 'user-1' });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[10], [20]]);
  });

  it('does not retry an authentication rejection', async () => {
    const error = Object.assign(new Error('unauthorized'), { status: 401 });
    const fetcher = vi.fn().mockRejectedValue(error);
    const wait = vi.fn();

    await expect(fetchWithAuthRetry(fetcher, { wait })).rejects.toBe(error);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });

  it('stops after the bounded retry schedule', async () => {
    const error = new TypeError('Failed to fetch');
    const fetcher = vi.fn().mockRejectedValue(error);

    await expect(fetchWithAuthRetry(fetcher, {
      delays: [10, 20],
      wait: vi.fn().mockResolvedValue(),
    })).rejects.toBe(error);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('classifies only network, throttling, and server failures as transient', () => {
    expect(isTransientAuthError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isTransientAuthError({ status: 408 })).toBe(true);
    expect(isTransientAuthError({ status: 500 })).toBe(true);
    expect(isTransientAuthError({ status: 404 })).toBe(false);
  });
});
