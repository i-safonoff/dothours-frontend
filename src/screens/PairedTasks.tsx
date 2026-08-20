import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Shape from '../components/Shape';
import BottomSheet from '../components/BottomSheet';
import { categoriesApi, friendsApi, pairedTasksApi, timeEntriesApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../api/AuthContext';
import { BUILDING_FAMILIES, familyMeta } from '../data/buildingFamilies';
import type { ApiFriend, ApiPairedTask } from '../api/types';
import type { BuildingFamilyKey } from '../types';
import './PairedTasks.css';

function RaceBar({ task, myId }: { task: ApiPairedTask; myId: string }) {
  const meta = familyMeta(task.building_family);
  const me = task.participants.find((p) => p.user_id === myId);
  const others = task.participants.filter((p) => p.user_id !== myId);
  const otherMinutes = others.reduce((s, p) => s + p.minutes_logged, 0);
  const mePct = Math.min(100, ((me?.minutes_logged ?? 0) / task.target_minutes) * 100);
  const otherPct = Math.min(100, (otherMinutes / task.target_minutes) * 100);
  return (
    <div className="race">
      <div className="race-track">
        <motion.div
          className="race-fill race-fill-me"
          style={{ background: meta.color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${mePct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="race-track">
        <motion.div
          className="race-fill race-fill-friend"
          style={{ background: meta.colorDeep }}
          initial={{ width: 0 }}
          whileInView={{ width: `${otherPct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

export default function PairedTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ApiPairedTask[]>([]);
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [family, setFamily] = useState<BuildingFamilyKey>('study');
  const [targetMinutes, setTargetMinutes] = useState(300);
  const [dueInDays, setDueInDays] = useState(7);
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());
  const [createBusy, setCreateBusy] = useState(false);

  async function refresh() {
    const [t, f] = await Promise.all([pairedTasksApi.listMine(), friendsApi.list()]);
    setTasks(t);
    setFriends(f);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить задания'));
  }, []);

  const openTask = tasks.find((t) => t.id === openId) ?? null;

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreateBusy(true);
    try {
      await pairedTasksApi.create({
        title,
        building_family: family,
        target_minutes: targetMinutes,
        target_type: 'combined',
        due_at: new Date(Date.now() + dueInDays * 86400000).toISOString(),
        participant_user_ids: [...participantIds],
      });
      setCreateOpen(false);
      setTitle('');
      setParticipantIds(new Set());
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось создать задание');
    } finally {
      setCreateBusy(false);
    }
  }

  async function startSession(task: ApiPairedTask) {
    setActionMessage(null);
    try {
      const categories = await categoriesApi.list();
      let category = categories.find((c) => c.building_family === task.building_family);
      if (!category) {
        const meta = familyMeta(task.building_family);
        category = await categoriesApi.create({
          title: meta.title,
          color: meta.color,
          shape: meta.shape,
          building_family: meta.key,
          minutes_per_day_target: meta.minutesPerDayDefault,
        });
      }
      await timeEntriesApi.start(category.id, task.id);
      setActionMessage('Таймер запущен — переключись на «Трекер», чтобы его увидеть.');
    } catch (err) {
      setActionMessage(err instanceof ApiError ? err.message : 'Не получилось запустить таймер');
    }
  }

  return (
    <div className="paired">
      <div className="paired-header">
        <div className="paired-header-top">
          <h2>Задания на пару</h2>
          <motion.button className="paired-add" whileTap={{ scale: 0.9, rotate: 90 }} onClick={() => setCreateOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2V16M2 9H16" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </motion.button>
        </div>
        <p>Трекайте цели вместе и поддерживайте друг друга</p>
      </div>

      <div className="paired-scroll">
        {error && <p className="paired-error">{error}</p>}
        {tasks.length === 0 && !error && <p className="paired-empty">Пока нет заданий — создай первое</p>}

        {tasks.map((t, i) => {
          const meta = familyMeta(t.building_family);
          const others = t.participants.filter((p) => p.user_id !== user?.id);
          return (
            <motion.button
              key={t.id}
              className="paired-card"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.07, duration: 0.45, type: 'spring', bounce: 0.35 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenId(t.id)}
            >
              <div className="paired-card-top">
                <div className="paired-icon" style={{ background: `${meta.color}22` }}>
                  <Shape kind={meta.shape} color={meta.color} size={26} />
                </div>
                <div className="paired-card-title">
                  <span>{t.title}</span>
                  <span className="paired-due">{t.status === 'completed' ? 'Завершено 🎉' : new Date(t.due_at).toLocaleDateString('ru-RU')}</span>
                </div>
                {others[0] && (
                  <div className="paired-friend-avatar" style={{ background: meta.colorDeep }}>
                    {others[0].name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <RaceBar task={t} myId={user?.id ?? ''} />

              <div className="paired-card-legend">
                <span>
                  <i style={{ background: meta.color }} /> Ты · {t.participants.find((p) => p.user_id === user?.id)?.minutes_logged ?? 0} мин
                </span>
                <span>
                  <i style={{ background: meta.colorDeep }} /> {others.map((o) => o.name.split(' ')[0]).join(', ') || '—'} ·{' '}
                  {others.reduce((s, o) => s + o.minutes_logged, 0)} мин
                </span>
              </div>
            </motion.button>
          );
        })}
        <div style={{ height: 24 }} />
      </div>

      <BottomSheet open={!!openTask} onClose={() => { setOpenId(null); setActionMessage(null); }}>
        {openTask &&
          (() => {
            const meta = familyMeta(openTask.building_family);
            const others = openTask.participants.filter((p) => p.user_id !== user?.id);
            const combined = openTask.participants.reduce((s, p) => s + p.minutes_logged, 0);
            return (
              <div className="paired-detail">
                <div className="paired-detail-icon" style={{ background: `${meta.color}22` }}>
                  <Shape kind={meta.shape} color={meta.color} size={34} />
                </div>
                <h3>{openTask.title}</h3>
                {openTask.description && <p className="paired-detail-desc">{openTask.description}</p>}

                <RaceBar task={openTask} myId={user?.id ?? ''} />
                <div className="paired-card-legend" style={{ marginBottom: 20 }}>
                  <span>
                    <i style={{ background: meta.color }} /> Ты · {openTask.participants.find((p) => p.user_id === user?.id)?.minutes_logged ?? 0} мин
                  </span>
                  <span>
                    <i style={{ background: meta.colorDeep }} /> {others.map((o) => o.name.split(' ')[0]).join(', ') || '—'}
                  </span>
                </div>

                <div className="paired-detail-stats">
                  <div>
                    <span className="stat-value">{openTask.target_minutes}</span>
                    <span className="stat-label">цель, мин</span>
                  </div>
                  <div>
                    <span className="stat-value">{combined}</span>
                    <span className="stat-label">вместе, мин</span>
                  </div>
                  <div>
                    <span className="stat-value">{openTask.status === 'completed' ? '🎉' : Math.max(0, Math.ceil((new Date(openTask.due_at).getTime() - Date.now()) / 86400000))}</span>
                    <span className="stat-label">{openTask.status === 'completed' ? 'готово' : 'дней осталось'}</span>
                  </div>
                </div>

                {actionMessage && <p className="paired-action-message">{actionMessage}</p>}

                {openTask.status === 'active' && (
                  <motion.button
                    className="paired-detail-cta"
                    style={{ background: meta.color }}
                    whileTap={{ scale: 0.95, y: 3 }}
                    onClick={() => startSession(openTask)}
                  >
                    Начать сессию
                  </motion.button>
                )}
              </div>
            );
          })()}
      </BottomSheet>

      <BottomSheet open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="paired-create-form" onSubmit={createTask}>
          <h3>Новое задание</h3>
          <input
            className="paired-create-input"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="paired-create-families">
            {BUILDING_FAMILIES.map((f) => (
              <button
                type="button"
                key={f.key}
                className="paired-create-family"
                style={{
                  background: family === f.key ? f.color : 'var(--bg)',
                  borderColor: family === f.key ? 'transparent' : 'var(--line)',
                }}
                onClick={() => setFamily(f.key)}
              >
                <Shape kind={f.shape} color={family === f.key ? '#fff' : f.color} size={16} />
                <span style={{ color: family === f.key ? '#fff' : 'var(--ink)' }}>{f.title}</span>
              </button>
            ))}
          </div>

          <label className="paired-create-label">
            Цель, минут суммарно
            <input
              className="paired-create-input"
              type="number"
              min={10}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
            />
          </label>

          <label className="paired-create-label">
            Срок, дней
            <input
              className="paired-create-input"
              type="number"
              min={1}
              value={dueInDays}
              onChange={(e) => setDueInDays(Number(e.target.value))}
            />
          </label>

          <p className="paired-create-label" style={{ marginBottom: 0 }}>
            Участники
          </p>
          <div className="paired-create-friends">
            {friends.length === 0 && <span className="paired-empty">Добавь друзей на вкладке «Друзья»</span>}
            {friends.map((f) => {
              const checked = participantIds.has(f.id);
              return (
                <button
                  type="button"
                  key={f.id}
                  className="paired-create-friend"
                  style={{ background: checked ? 'var(--ink)' : 'var(--bg)' }}
                  onClick={() =>
                    setParticipantIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(f.id)) next.delete(f.id);
                      else next.add(f.id);
                      return next;
                    })
                  }
                >
                  <span style={{ color: checked ? '#fff' : 'var(--ink)' }}>{f.name}</span>
                </button>
              );
            })}
          </div>

          <motion.button
            className="paired-detail-cta"
            style={{ background: 'var(--ink)', marginTop: 8 }}
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={createBusy || participantIds.size === 0}
          >
            {createBusy ? 'Создаю…' : 'Создать задание'}
          </motion.button>
        </form>
      </BottomSheet>
    </div>
  );
}
