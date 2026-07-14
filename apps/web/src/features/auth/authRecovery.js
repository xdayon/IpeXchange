export const AUTH_RETRY_DELAYS_MS = [250, 750, 1500];

export function isTransientAuthError(error) {
  const status = Number(error?.status);
  if (!Number.isFinite(status) || status === 0) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function waitForRetry(delay, signal) {
  if (signal?.aborted) {
    return Promise.reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
  }
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeout);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function fetchWithAuthRetry(fetcher, options = {}) {
  const {
    delays = AUTH_RETRY_DELAYS_MS,
    signal,
    wait = (delay) => waitForRetry(delay, signal),
  } = options;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetcher();
    } catch (error) {
      if (signal?.aborted || !isTransientAuthError(error) || attempt >= delays.length) {
        throw error;
      }
      await wait(delays[attempt]);
    }
  }
}
