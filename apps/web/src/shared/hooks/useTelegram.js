// Detects the Telegram Mini App environment. The Telegram SDK script loads in
// index.html before React mounts, so presence can be derived synchronously.
import { useState, useEffect } from 'react';

export function useTelegram() {
  const [isTMA] = useState(() => Boolean(window?.Telegram?.WebApp?.initData));
  const [tgUser] = useState(() => window?.Telegram?.WebApp?.initDataUnsafe?.user ?? null);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
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
  const haptic = (style = 'light') => window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  const showBack = () => window?.Telegram?.WebApp?.BackButton?.show();
  const hideBack = () => window?.Telegram?.WebApp?.BackButton?.hide();
  const onBack = (fn) => {
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(fn);
    return () => tg.BackButton.offClick(fn);
  };

  return { isTMA, tgUser, isReady: true, close, openLink, haptic, showBack, hideBack, onBack, requestWriteAccess };
}
