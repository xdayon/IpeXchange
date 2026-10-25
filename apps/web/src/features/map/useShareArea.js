import { useCallback, useState } from 'react';
import { clearLocation, saveLocation } from '../../api/map.js';

// Telegram's LocationManager needs Bot API 8.0; elsewhere use the browser API.
function telegramLocation() {
  const tg = window.Telegram?.WebApp;
  const manager = tg?.LocationManager;
  if (!manager || !tg.isVersionAtLeast?.('8.0')) return null;
  return new Promise((resolve) => {
    const read = () => manager.getLocation((data) => resolve(data ? { lat: data.latitude, lng: data.longitude } : null));
    if (manager.isInited) read();
    else manager.init(read);
  });
}

function browserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is not available on this device.'));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location permission was denied.')),
      { enableHighAccuracy: false, timeout: 12000 },
    );
  });
}

export function useShareArea(onChanged) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const share = useCallback(async () => {
    setStatus('working');
    setError(null);
    try {
      const position = (await telegramLocation()) ?? (await browserLocation());
      if (!position) throw new Error('Location permission was denied.');
      const saved = await saveLocation(position);
      setStatus('idle');
      onChanged?.(saved);
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Could not share your area.');
    }
  }, [onChanged]);

  const remove = useCallback(async () => {
    setStatus('working');
    setError(null);
    try {
      await clearLocation();
      onChanged?.(null);
    } catch (err) {
      setError(err.message || 'Could not remove your area.');
    }
    setStatus('idle');
  }, [onChanged]);

  return { share, remove, status, error };
}
