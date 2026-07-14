import {
  ArrowLeft, Bell, CheckCheck, ChevronRight, Handshake, Info, Loader2,
  RefreshCw, Repeat, UserPlus, WalletCards,
} from 'lucide-react';
import { notificationContent } from './notificationContent.js';
import './notifications.css';

const ICONS = {
  interest: Handshake, cycle: Repeat, payment: WalletCards,
  referral: UserPlus, general: Info,
};

function NotificationRow({ notification, onOpen }) {
  const content = notificationContent(notification);
  const Icon = ICONS[content.kind];
  const date = new Date(notification.created_at).toLocaleString([], {
    dateStyle: 'medium', timeStyle: 'short',
  });

  return (
    <button
      className={`notification-row ${notification.read_at ? '' : 'is-unread'}`}
      onClick={() => onOpen(notification, content.destination)}
    >
      <span className={`notification-row__icon is-${content.kind}`}><Icon size={19} /></span>
      <span className="notification-row__content">
        <span className="notification-row__title">{content.title}</span>
        <span className="notification-row__body">{content.body}</span>
        <span className="notification-row__date">{date}</span>
      </span>
      {!notification.read_at && <span className="notification-row__unread" aria-label="Unread" />}
      {content.destination && <ChevronRight className="notification-row__chevron" size={17} />}
    </button>
  );
}

export default function NotificationPage({ center, onBack, onNavigate }) {
  const openNotification = async (notification, destination) => {
    if (!notification.read_at) await center.markRead(notification.id).catch(() => {});
    if (destination) onNavigate(...destination);
  };

  return (
    <section className="notification-page page-enter">
      <header className="notification-page__header">
        <button className="notification-back" onClick={onBack}><ArrowLeft size={17} /> Back</button>
        <div>
          <h1>Notifications</h1>
          <p>{center.unreadCount ? `${center.unreadCount} unread` : 'You are all caught up'}</p>
        </div>
        {center.unreadCount > 0 && (
          <button className="notification-mark-all" onClick={() => center.markAllRead().catch(() => {})}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </header>

      {center.loading ? (
        <div className="notification-state"><Loader2 className="spin" size={28} /><p>Loading notifications...</p></div>
      ) : center.error && center.items.length === 0 ? (
        <div className="notification-state">
          <p>Could not load notifications.</p>
          <button onClick={center.refresh}><RefreshCw size={15} /> Try again</button>
        </div>
      ) : center.items.length === 0 ? (
        <div className="notification-state">
          <Bell size={30} />
          <h2>No notifications yet</h2>
          <p>Interest, trade cycle and payment updates will appear here.</p>
        </div>
      ) : (
        <div className="notification-list glass-panel">
          {center.items.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onOpen={openNotification} />
          ))}
        </div>
      )}

      {center.hasMore && (
        <button className="notification-load-more" disabled={center.loadingMore} onClick={center.loadMore}>
          {center.loadingMore ? <Loader2 className="spin" size={16} /> : null}
          {center.loadingMore ? 'Loading...' : 'Load earlier notifications'}
        </button>
      )}
      {center.error && center.items.length > 0 && (
        <p className="notification-inline-error">Could not update notifications. Try again.</p>
      )}
    </section>
  );
}
