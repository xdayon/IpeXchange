// Identity resolution, in priority order:
// 1. Privy session (when VITE_PRIVY_APP_ID is configured at build time)
// 2. Telegram Mini App initData (Worker validates the HMAC)
// 3. Anonymous browsing (read-only market access)
import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { registerTokenProvider } from '../../api/index.js';
import { fetchMe } from '../../api/me.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

const PRIVY_ENABLED = Boolean(import.meta.env.VITE_PRIVY_APP_ID);

function toAppUser(me, session) {
  return {
    id: me.id,
    displayName: me.display_name || session.displayName || 'Member',
    avatar: me.avatar_url || session.avatar || null,
    email: me.email || session.email || null,
    wallet: me.wallet || session.wallet || null,
    telegramUsername: me.telegram_username || null,
    telegramLinked: me.telegram_linked ?? false,
    source: session.source,
  };
}

function useTelegramSession() {
  const { isTMA, tgUser, isReady } = useTelegram();
  if (!isReady) return { ready: false };
  if (isTMA && tgUser) {
    return {
      ready: true,
      authenticated: true,
      session: {
        source: 'telegram',
        displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
        avatar: tgUser.photo_url || null,
      },
    };
  }
  return { ready: true, authenticated: false };
}

function usePrivyAuth() {
  const { ready, authenticated, user: privyUser, login, logout, getAccessToken } = usePrivy();
  const tg = useTelegramSession();

  useEffect(() => {
    registerTokenProvider(authenticated ? getAccessToken : null);
  }, [authenticated, getAccessToken]);

  const session = authenticated
    ? {
        source: 'privy',
        displayName: privyUser?.google?.name || privyUser?.telegram?.firstName || null,
        email: privyUser?.email?.address || null,
        wallet: privyUser?.wallet?.address || null,
      }
    : tg.session;

  return {
    ready: ready && tg.ready,
    authenticated: authenticated || Boolean(tg.authenticated),
    session,
    login,
    logout: authenticated ? logout : null,
  };
}

function useTelegramOnlyAuth() {
  const tg = useTelegramSession();
  return {
    ready: tg.ready,
    authenticated: Boolean(tg.authenticated),
    session: tg.session,
    login: () => alert('Login is not available yet in this build.'),
    logout: null,
  };
}

const useIdentity = PRIVY_ENABLED ? usePrivyAuth : useTelegramOnlyAuth;

export function useAuth() {
  const identity = useIdentity();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!identity.ready) return;
    let cancelled = false;
    const session = identity.session ?? { source: 'unknown' };
    const load = identity.authenticated ? fetchMe().catch(() => null) : Promise.resolve(null);
    load.then((me) => {
      if (cancelled) return;
      setUser(me ? toAppUser(me, session) : null);
      setLoading(false);
    });
    return () => { cancelled = true; };
    // identity.session is rebuilt every render; keying on auth state avoids loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.ready, identity.authenticated, reloadKey]);

  return {
    user,
    loading: loading && identity.ready !== false,
    isAuthenticated: Boolean(user),
    login: identity.login,
    logout: identity.logout,
    refresh,
  };
}
