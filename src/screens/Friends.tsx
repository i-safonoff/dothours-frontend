import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import BottomSheet from '../components/BottomSheet';
import { friendsApi, usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useRealtimeEvent } from '../api/RealtimeContext';
import type { ApiFriend, ApiFriendRequest } from '../api/types';
import './Friends.css';

function MiniRing({ progress, color }: { progress: number; color: string }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, progress);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-soft)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c * (1 - clamped) }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

const PALETTE = ['#FF6FA5', '#2AA9E0', '#9B6BFF', '#FFB627', '#4CB944', '#FF5A45'];
function colorFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Friends({ onOpenProfile }: { onOpenProfile: (userId: string) => void }) {
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [incoming, setIncoming] = useState<ApiFriendRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [addBusy, setAddBusy] = useState(false);
  const [addMessage, setAddMessage] = useState<string | null>(null);

  async function refresh() {
    const [f, r] = await Promise.all([friendsApi.list(), friendsApi.incomingRequests()]);
    setFriends(f);
    setIncoming(r);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить друзей'));
  }, []);

  useRealtimeEvent('friend.request_received', () => {
    refresh().catch(() => {});
  });
  useRealtimeEvent('friend.request_accepted', () => {
    refresh().catch(() => {});
  });

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    setAddMessage(null);
    try {
      const target = await usersApi.searchByEmail(email);
      await friendsApi.sendRequest(target.id);
      setAddMessage('Заявка отправлена!');
      setEmail('');
    } catch (err) {
      setAddMessage(err instanceof ApiError ? err.message : 'Не получилось отправить заявку');
    } finally {
      setAddBusy(false);
    }
  }

  async function respond(requestId: string, accept: boolean) {
    try {
      if (accept) await friendsApi.accept(requestId);
      else await friendsApi.decline(requestId);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось ответить на заявку');
    }
  }

  const sorted = [...friends].sort((a, b) => b.streak - a.streak);

  return (
    <div className="friends">
      <div className="friends-header">
        <h2>Друзья</h2>
        <motion.button className="friends-add" whileTap={{ scale: 0.9, rotate: 90 }} onClick={() => setAddOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2V16M2 9H16" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </motion.button>
      </div>

      <div className="friends-scroll">
        {error && <p className="friends-error">{error}</p>}

        {incoming.length > 0 && (
          <div className="friends-requests">
            <p className="friends-hint">Заявки в друзья</p>
            {incoming.map((r) => (
              <div key={r.id} className="friend-request-row">
                <span>Новая заявка</span>
                <div className="friend-request-actions">
                  <button className="friend-request-accept" onClick={() => respond(r.id, true)}>
                    Принять
                  </button>
                  <button className="friend-request-decline" onClick={() => respond(r.id, false)}>
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="friends-hint">{friends.length} друзей</p>

        {sorted.map((f, i) => {
          const color = colorFor(f.id);
          return (
            <motion.div
              key={f.id}
              className="friend-card"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.45, type: 'spring', bounce: 0.35 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onOpenProfile(f.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="friend-avatar-wrap">
                <MiniRing progress={f.today_minutes / 120} color={color} />
                <div className="friend-avatar" style={{ background: color }}>
                  {f.initials}
                </div>
              </div>

              <div className="friend-info">
                <span className="friend-name">{f.name}</span>
                <span className="friend-activity">{f.today_minutes} мин сегодня</span>
              </div>

              <div className="friend-streak">
                <span>🔥{f.streak}</span>
              </div>
            </motion.div>
          );
        })}

        {friends.length === 0 && !error && <p className="friends-empty">Пока нет друзей — добавь первого по email</p>}
        <div style={{ height: 24 }} />
      </div>

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)}>
        <form className="add-friend-form" onSubmit={addFriend}>
          <h3>Добавить друга</h3>
          <input
            className="add-friend-input"
            type="email"
            placeholder="Email друга"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {addMessage && <p className="add-friend-message">{addMessage}</p>}
          <motion.button className="add-friend-cta" type="submit" whileTap={{ scale: 0.96 }} disabled={addBusy}>
            {addBusy ? 'Отправляю…' : 'Отправить заявку'}
          </motion.button>
        </form>
      </BottomSheet>
    </div>
  );
}
