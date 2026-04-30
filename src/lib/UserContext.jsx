/**
 * UserContext.jsx
 * Provides global authenticated user state across the entire app.
 *
 * After Privy auth completes, this context:
 *   1. Calls POST /api/users/upsert  → creates/updates the user in DB
 *   2. Exposes { xchangeUser, loading, walletAddress, displayName, refreshProfile }
 *
 * Usage anywhere in the app:
 *   const { xchangeUser, walletAddress, displayName } = useUser();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUser, fetchUserProfile } from './api';
import { DEMO_USER } from '../data/demoProfile';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const { ready, authenticated, user: privyUser, logout: privyLogout } = usePrivy();

  const [xchangeUser, setXchangeUser]   = useState(null); // row from our DB
  const [loading, setLoading]           = useState(false);
  const [initialized, setInitialized]   = useState(false);

  // Derive primary wallet address from Privy user object
  const walletAddress = privyUser?.wallet?.address || (localStorage.getItem('ipeXchange_demoSession') ? '0x73a...Hansen' : null);
  const email         = privyUser?.email?.address  || null;
  const privyId       = privyUser?.id              || null;

  // Build a human-readable display name:
  //   demo session → email (if present) → shortened wallet address → 'Anon'
  const displayName = localStorage.getItem('ipeXchange_demoSession')
    ? 'Jean Hansen'
    : email
    ? email.split('@')[0]
    : walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : 'Anon';

  // Shortened wallet for display in the UI
  const shortWallet = localStorage.getItem('ipeXchange_demoSession')
    ? '0x73a...Hansen'
    : walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  /** Registers/refreshes the user in our DB and loads their profile. */
  const syncUser = useCallback(async () => {
    if (!authenticated || !privyUser) return;
    if (!walletAddress && !email) return;

    setLoading(true);
    try {
      // 1. Create/update user row in DB
      const result = await upsertUser({ walletAddress, email, privyId, displayName });
      if (result?.user) {
        setXchangeUser(result.user);
      }

      // 2. If we have a wallet, also fetch full profile stats
      if (walletAddress) {
        const profile = await fetchUserProfile(walletAddress);
        if (profile) setXchangeUser(profile);
      }
    } catch (err) {
      console.error('UserContext syncUser error:', err);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [authenticated, privyUser, walletAddress, email, privyId, displayName]);

  // Demo mode: populate xchangeUser from static profile without Privy
  useEffect(() => {
    if (localStorage.getItem('ipeXchange_demoSession')) {
      setXchangeUser(DEMO_USER);
      setInitialized(true);
    }
  }, []);

  // Sync on auth change
  useEffect(() => {
    if (ready && authenticated) {
      syncUser();
    } else if (ready && !authenticated) {
      // Don't reset the user if we're in demo mode — the demo useEffect already set DEMO_USER.
      if (!localStorage.getItem('ipeXchange_demoSession')) {
        setXchangeUser(null);
      }
      setInitialized(true);
    }
  }, [ready, authenticated, syncUser]);

  /** Called after a purchase to refresh stats. */
  const refreshProfile = useCallback(async () => {
    if (!walletAddress) return;
    const profile = await fetchUserProfile(walletAddress);
    if (profile) setXchangeUser(profile);
  }, [walletAddress]);

  /** Logs out from Privy and clears local state. */
  const logout = useCallback(async () => {
    try {
      await privyLogout();
    } catch (_) { /* ignore */ }
    setXchangeUser(null);
    localStorage.removeItem('ipeXchangeState');
    localStorage.removeItem('ipeXchange_demoSession');
    window.location.reload();
  }, [privyLogout]);

  const value = {
    xchangeUser,
    loading,
    initialized,
    walletAddress,
    shortWallet,
    displayName,
    email,
    privyId,
    refreshProfile,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Hook to consume user context anywhere in the app. */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
