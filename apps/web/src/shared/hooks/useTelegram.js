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

  return { isTMA, tgUser, isReady: true, close, haptic, showBack, hideBack, onBack };
}
