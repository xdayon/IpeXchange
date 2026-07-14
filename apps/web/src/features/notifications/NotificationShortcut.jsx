import { Bell, ChevronRight } from 'lucide-react';
import './notifications.css';

export default function NotificationShortcut({ unreadCount, onOpen }) {
  return (
    <button className="notification-shortcut glass-panel pressable" onClick={onOpen}>
      <span className="notification-shortcut__icon"><Bell size={20} /></span>
      <span className="notification-shortcut__copy">
        <strong>Notifications</strong>
        <small>{unreadCount ? `${unreadCount} unread updates` : 'Interest, trades and payments'}</small>
      </span>
      {unreadCount > 0 && <span className="notification-badge">{Math.min(unreadCount, 99)}</span>}
      <ChevronRight size={18} />
    </button>
  );
}
