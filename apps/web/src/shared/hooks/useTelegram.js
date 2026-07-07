// ── useTelegram — detecta Telegram Mini App ──────────────────────
// Quando o app é aberto dentro do Telegram, WebApp está disponível.
// Fornece initData, user e utilitários do Telegram SDK.
import { useState, useEffect } from 'react';

export function useTelegram() {
  const [tgUser, setTgUser]     = useState(null);
  const [isTMA, setIsTMA]       = useState(false);
  const [isReady, setIsReady]   = useState(false);

  useEffect(() => {
    const tg = window?.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      setIsTMA(true);
      if (tg.initDataUnsafe?.user) {
        setTgUser(tg.initDataUnsafe.user);
      }
    }
    setIsReady(true);
  }, []);

  const close      = () => window?.Telegram?.WebApp?.close();
  const haptic     = (style = 'light') => window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  const showBack   = () => window?.Telegram?.WebApp?.BackButton?.show();
  const hideBack   = () => window?.Telegram?.WebApp?.BackButton?.hide();
  const onBack     = (fn) => {
    const tg = window?.Telegram?.WebApp;
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(fn);
    return () => tg.BackButton.offClick(fn);
  };

  return { isTMA, tgUser, isReady, close, haptic, showBack, hideBack, onBack };
}
