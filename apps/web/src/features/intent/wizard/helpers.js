export const haptic = (style = 'light') =>
  window?.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);

export const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
  fontSize: 16, fontFamily: 'var(--font-sans)', outline: 'none',
};
