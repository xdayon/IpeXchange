export function telegramShareUrl(url, text) {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export const loopShareText = (hops) =>
  hops === 2
    ? 'I just closed a direct swap on IpeXchange. Nexum found it for me.'
    : `I just closed a ${hops}-person trade loop on IpeXchange. Nexum found it for me.`;

// Returns 'shared' or 'copied' so the caller can confirm to the person.
export async function shareLoop({ hops, userId }) {
  const url = `${window.location.origin}/${userId ? `?ref=${userId}` : ''}`;
  const text = loopShareText(hops);
  const tg = window.Telegram?.WebApp;
  if (tg?.initData && tg.openTelegramLink) {
    tg.openTelegramLink(telegramShareUrl(url, text));
    return 'shared';
  }
  if (navigator.share) {
    try {
      await navigator.share({ url, text });
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(`${text} ${url}`);
  return 'copied';
}
