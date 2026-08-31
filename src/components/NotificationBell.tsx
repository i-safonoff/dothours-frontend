import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BottomSheet from './BottomSheet';
import { notificationsApi } from '../api/endpoints';
import { useRealtimeEvent } from '../api/RealtimeContext';
import type { ApiNotification, NotificationKind } from '../api/types';
import './NotificationBell.css';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

const KIND_ICON: Record<NotificationKind, string> = {
  daily_reminder: '⏰',
  streak_at_risk: '🔥',
  paired_task_expired: '⌛',
  paired_task_completed: '🎉',
  friend_request: '🤝',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    notificationsApi
      .unreadCount()
      .then((r) => setUnread(r.unread_count))
      .catch(() => {});
  }, []);

  // A "hint, not data" event — just bump the badge, the sheet re-fetches the real list on open.
  useRealtimeEvent('notification.created', () => setUnread((n) => n + 1));

  function openSheet() {
    setOpen(true);
    notificationsApi
      .list()
      .then((page) => {
        setItems(page.items);
        setUnread(page.unread_count);
        setLoaded(true);
      })
      .catch(() => {});
  }

  async function markRead(notification: ApiNotification) {
    if (notification.read_at) return;
    setItems((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n)));
    setUnread((n) => Math.max(0, n - 1));
    try {
      await notificationsApi.markRead(notification.id);
    } catch {
      // The badge stays optimistic — worst case it's one off until the next open.
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnread(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Ditto — optimistic and cheap to reconcile on next open.
    }
  }

  return (
    <>
      <motion.button
        className="bell-btn"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.6, delay: 0.24 }}
        whileTap={{ scale: 0.85 }}
        onClick={openSheet}
        aria-label="Уведомления"
      >
        <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2.5c-2.5 0-4.3 2-4.3 4.5v2.4c0 .5-.2 1-.6 1.4l-1 1.1c-.7.7-.2 1.9.8 1.9h10.2c1 0 1.5-1.2.8-1.9l-1-1.1c-.4-.4-.6-.9-.6-1.4V7c0-2.5-1.8-4.5-4.3-4.5Z"
            stroke="var(--ink)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M8 16.5a2 2 0 0 0 4 0" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="bell-badge">{unread > 9 ? '9+' : unread}</span>}
      </motion.button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <div className="bell-sheet">
          <div className="bell-sheet-header">
            <h3>Уведомления</h3>
            {items.some((n) => !n.read_at) && (
              <button className="bell-mark-all" onClick={markAllRead}>
                Прочитать всё
              </button>
            )}
          </div>

          {loaded && items.length === 0 && <p className="bell-empty">Пока тихо — заглянем позже</p>}

          <div className="bell-list">
            {items.map((n) => (
              <button key={n.id} className={n.read_at ? 'bell-item' : 'bell-item bell-item-unread'} onClick={() => markRead(n)}>
                <span className="bell-item-icon">{KIND_ICON[n.kind] ?? '🔔'}</span>
                <span className="bell-item-body">
                  <span className="bell-item-title">{n.title}</span>
                  {n.body && <span className="bell-item-text">{n.body}</span>}
                  <span className="bell-item-time">{timeAgo(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="bell-item-dot" />}
              </button>
            ))}
          </div>
          <div style={{ height: 8 }} />
        </div>
      </BottomSheet>
    </>
  );
}
