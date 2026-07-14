// Identity resolution, in priority order:
// 1. Privy session (when VITE_PRIVY_APP_ID is configured at build time)
// 2. Telegram Mini App initData (Worker validates the HMAC)
// 3. Anonymous browsing (read-only market access)
import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { registerTokenProvider } from '../../api/index.js';
import { claimReferral, fetchMe, saveWallet } from '../../api/me.js';
import { useTelegram } from '../../shared/hooks/useTelegram.js';
import { fetchWithAuthRetry, isTransientAuthError } from './authRecovery.js';

const PRIVY_ENABLED = Boolean(import.meta.env.VITE_PRIVY_APP_ID);

function toAppUser(me, session) {
  return {
    id: me.id,
    displayName: me.display_name || session.displayName || 'Member',
    avatar: me.avatar_url || session.avatar || null,
    email: me.email || session.email || null,
    wallet: me.wallet || session.wallet || null,
    bio: me.bio || null,
    telegramUsername: me.telegram_username || null,
    telegramLinked: me.telegram_linked ?? false,
    telegramDmOk: me.telegram_dm_ok ?? false,
    settings: me.settings ?? {},
    isAdmin: me.is_admin === true,
    referredBy: me.referred_by ?? null,
    createdAt: me.created_at ?? null,
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
  const [authError, setAuthError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setAuthError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!identity.ready) return;
    if (!identity.authenticated) {
      let cancelled = false;
      Promise.resolve().then(() => {
        if (cancelled) return;
        setUser(null);
        setAuthError(null);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    const controller = new AbortController();
    const session = identity.session ?? { source: 'unknown' };
    fetchWithAuthRetry(() => fetchMe({ signal: controller.signal }), {
      signal: controller.signal,
    }).then((me) => {
      if (controller.signal.aborted) return;
      setUser(toAppUser(me, session));
      setAuthError(null);
      setLoading(false);
      // Keep the payout address in sync with the Privy session wallet.
      const wallet = session.wallet?.toLowerCase();
      if (wallet && me.wallet !== wallet) saveWallet(wallet).catch(() => {});
      const ref = localStorage.getItem('ipex-ref');
      if (ref && !me.referred_by) {
        claimReferral(ref)
          .then(() => localStorage.removeItem('ipex-ref'))
          .catch((err) => { if (err.status >= 400 && err.status < 500) localStorage.removeItem('ipex-ref'); });
      } else if (me.referred_by) {
        localStorage.removeItem('ipex-ref');
      }
    }).catch((error) => {
      if (controller.signal.aborted) return;
      // A Worker or network hiccup is not a logout. Keep any known app user and
      // let the existing login action retry the profile load on first startup.
      if (!isTransientAuthError(error)) setUser(null);
      setAuthError(error);
      setLoading(false);
    });
    return () => controller.abort();
    // identity.session is rebuilt every render; keying on auth state avoids loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.ready, identity.authenticated, reloadKey]);

  const recoverOrLogin = authError && identity.authenticated ? refresh : identity.login;
  const awaitingProfile = identity.authenticated && !user && !authError;

  return {
    user,
    loading: !identity.ready || loading || awaitingProfile,
    isAuthenticated: Boolean(user),
    login: recoverOrLogin,
    logout: identity.logout,
    refresh,
    authError,
  };
}
