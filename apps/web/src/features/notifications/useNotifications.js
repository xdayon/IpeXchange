import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotifications, fetchUnreadNotificationCount, markNotificationsRead,
} from '../../api/notifications.js';

export function useNotifications(userId, active) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [countFor, setCountFor] = useState(null);
  const [loadedFor, setLoadedFor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoadedFor(null);
    setError(null);
    try {
      const [page, count] = await Promise.all([
        fetchNotifications(), fetchUnreadNotificationCount().catch(() => null),
      ]);
      setItems(page.notifications ?? []);
      setCursor(page.next_cursor ?? null);
      if (count) { setUnreadCount(count.unread_count ?? 0); setCountFor(userId); }
    } catch (err) {
      setError(err);
    } finally {
      setLoadedFor(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchUnreadNotificationCount()
      .then((result) => {
        if (!cancelled) { setUnreadCount(result.unread_count ?? 0); setCountFor(userId); }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!active || !userId) return undefined;
    let cancelled = false;
    fetchNotifications()
      .then((page) => {
        if (cancelled) return;
        setItems(page.notifications ?? []);
        setCursor(page.next_cursor ?? null);
        setLoadedFor(userId);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) { setError(err); setLoadedFor(userId); }
      });
    return () => { cancelled = true; };
  }, [active, userId]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchNotifications({ cursor });
      setItems((current) => [...current, ...(page.notifications ?? [])]);
      setCursor(page.next_cursor ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const markRead = async (id) => {
    const unread = items.some((item) => item.id === id && !item.read_at);
    setError(null);
    try {
      const result = await markNotificationsRead([id]);
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, read_at: item.read_at || result.read_at } : item
      )));
      if (unread && result.updated > 0) setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  const markAllRead = async () => {
    setError(null);
    try {
      const result = await markNotificationsRead('all');
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || result.read_at })));
      setUnreadCount(0);
      setCountFor(userId);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    items: loadedFor === userId ? items : [],
    unreadCount: countFor === userId ? unreadCount : 0,
    loading: Boolean(userId && active && loadedFor !== userId),
    loadingMore, error, hasMore: Boolean(userId && loadedFor === userId && cursor),
    refresh, loadMore, markRead, markAllRead,
  };
}
