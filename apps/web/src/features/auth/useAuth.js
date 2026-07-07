// ── useAuth — identidade do usuário ──────────────────────────────
// Estratégia do MVP:
// 1. Se vier do Telegram Mini App → usa identidade do Telegram
// 2. Se tiver Privy configurado → usa Privy (futuro)
// 3. Fallback → sessão anônima local
import { useState, useEffect } from 'react';
import { useTelegram } from '../../shared/hooks/useTelegram.js';

const ANON_KEY = 'ipe_anon_session';

export function useAuth() {
  const { isTMA, tgUser } = useTelegram();
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Telegram identity takes priority
    if (isTMA && tgUser) {
      setUser({
        id: `tg_${tgUser.id}`,
        telegramId: tgUser.id,
        displayName: tgUser.first_name + (tgUser.last_name ? ` ${tgUser.last_name}` : ''),
        username: tgUser.username,
        avatar: tgUser.photo_url,
        source: 'telegram',
      });
      setLoading(false);
      return;
    }

    // Anonymous session fallback
    let anon = localStorage.getItem(ANON_KEY);
    if (!anon) {
      anon = `anon_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem(ANON_KEY, anon);
    }
    setUser({ id: anon, displayName: 'Guest', source: 'anon' });
    setLoading(false);
  }, [isTMA, tgUser]);

  const isAnon     = user?.source === 'anon';
  const isTGUser   = user?.source === 'telegram';

  return { user, loading, isAnon, isTGUser };
}
