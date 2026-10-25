// Detects the Telegram Mini App environment. The Telegram SDK script loads in
// index.html before React mounts, so presence can be derived synchronously.
import { useState, useEffect } from 'react';

// Local mirror of the haptics setting so taps stay silent without a fetch.
export const HAPTICS_OFF_KEY = 'ipex_haptics_off';

const APP_BG = '#080C14';

const hapticsOff = () => {
  try { return localStorage.getItem(HAPTICS_OFF_KEY) === '1'; } catch { return false; }
};

// Every optional SDK call is guarded by version so older clients never throw.
const supports = (tg, version) => Boolean(tg?.isVersionAtLeast?.(version));

export function setupTelegramChrome() {
  const tg = window?.Telegram?.WebApp;
  if (!tg?.initData) return;
  if (supports(tg, '7.7')) tg.disableVerticalSwipes?.();
  if (supports(tg, '6.1')) {
    tg.setHeaderColor?.(APP_BG);
    tg.setBackgroundColor?.(APP_BG);
  }
  if (supports(tg, '7.10')) tg.setBottomBarColor?.(APP_BG);
}

export function useTelegram() {
  const [isTMA] = useState(() => Boolean(window?.Telegram?.WebApp?.initData));
  const [tgUser] = useState(() => window?.Telegram?.WebApp?.initDataUnsafe?.user ?? null);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    setupTelegramChrome();
  }, []);

  const close = () => window?.Telegram?.WebApp?.close();
  const openLink = (url) => {
    const tg = window?.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank', 'noopener');
  };
  const requestWriteAccess = () =>
    new Promise((resolve) => {
      const tg = window?.Telegram?.WebApp;
      if (!tg?.requestWriteAccess) return resolve(false);
      try {
        tg.requestWriteAccess((granted) => resolve(Boolean(granted)));
      } catch {
        resolve(false);
      }
    });
  const haptic = (style = 'light') => {
    if (hapticsOff()) return;
    window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(style);
  };
  const notify = (type = 'success') => {
    if (hapticsOff()) return;
    window?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.(type);
  };
  const showBack = () => window?.Telegram?.WebApp?.BackButton?.show();
  const hideBack = () => window?.Telegram?.WebApp?.BackButton?.hide();
  const onBack = (fn) => {
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(fn);
    return () => tg.BackButton.offClick(fn);
  };

  return {
    isTMA, tgUser, isReady: true, close, openLink, haptic, notify, showBack, hideBack, onBack,
    requestWriteAccess,
  };
}
