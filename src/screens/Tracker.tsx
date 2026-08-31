import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import ProgressRing from '../components/ProgressRing';
import Shape from '../components/Shape';
import NotificationBell from '../components/NotificationBell';
import { useAuth } from '../api/AuthContext';
import { categoriesApi, timeEntriesApi, usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { familyMeta } from '../data/buildingFamilies';
import type { ApiCategory, ApiTimeEntry, ApiTimeEntrySummary, ApiUserStats } from '../api/types';
import './Tracker.css';

function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function Tracker({ onEditGoals }: { onEditGoals: () => void }) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const headerScale = useTransform(scrollY, [-120, 0], [1.15, 1], { clamp: false });
  const headerY = useTransform(scrollY, [0, 140], [0, -30]);
  const headerOpacity = useTransform(scrollY, [0, 140], [1, 0.4]);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeEntry, setActiveEntry] = useState<ApiTimeEntry | null>(null);
  const [summary, setSummary] = useState<ApiTimeEntrySummary | null>(null);
  const [stats, setStats] = useState<ApiUserStats | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [cats, active, sum, myStats] = await Promise.all([
      categoriesApi.list(),
      timeEntriesApi.active(),
      timeEntriesApi.summary(),
      usersApi.stats(),
    ]);
    setCategories(cats);
    setActiveEntry(active);
    setSummary(sum);
    setStats(myStats);
    setActiveId((current) => active?.category_id ?? current ?? cats[0]?.id ?? null);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : 'Не удалось загрузить данные'));
  }, []);

  useEffect(() => {
    if (!activeEntry) {
      setSeconds(0);
      return;
    }
    const startedAt = new Date(activeEntry.started_at).getTime();
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeEntry]);

  const active = categories.find((c) => c.id === activeId);
  const activeMeta = active ? familyMeta(active.building_family) : null;
  const totalToday = summary?.total_minutes ?? 0;
  const dailyGoal = user?.daily_goal_minutes ?? 120;
  const progress = totalToday / dailyGoal;

  async function toggleRunning() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (activeEntry) {
        await timeEntriesApi.stop(activeEntry.id);
      } else if (activeId) {
        const entry = await timeEntriesApi.start(activeId);
        setActiveEntry(entry);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось обновить таймер');
    } finally {
      setBusy(false);
    }
  }

  if (categories.length === 0 && !error) {
    return (
      <div className="tracker">
        <div className="tracker-empty">Загрузка…</div>
      </div>
    );
  }

  return (
    <div className="tracker" ref={scrollRef}>
      <motion.div className="tracker-header" style={{ scale: headerScale, y: headerY, opacity: headerOpacity }}>
        <div>
          <p className="tracker-greeting">Привет, {user?.name.split(' ')[0] ?? ''} 👋</p>
          <h2>Сегодняшний прогресс</h2>
        </div>
        <div className="tracker-header-right">
          <motion.div
            className="tracker-streak"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.4 }}
              style={{ fontSize: 16 }}
            >
              🔥
            </motion.span>
            {stats?.streak ?? 0}
          </motion.div>
          <NotificationBell />
          <motion.button
            className="tracker-edit-btn"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.6, delay: 0.28 }}
            whileTap={{ scale: 0.85, rotate: 90 }}
            onClick={onEditGoals}
            aria-label="Изменить цели"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" stroke="var(--ink)" strokeWidth="1.6" />
              <path
                d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 12.6l-1.4 1.4M15.4 15.4l-1.4-1.4M6 7.4 4.6 6"
                stroke="var(--ink)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
        </div>
      </motion.div>

      <div className="tracker-scroll">
        {error && <p className="tracker-error">{error}</p>}

        <div className="tracker-ring-wrap">
          <ProgressRing progress={progress} size={224} stroke={18} color={activeMeta?.color ?? 'var(--coral)'}>
            <AnimatePresence mode="wait">
              {activeEntry ? (
                <motion.div
                  key="running"
                  className="ring-center"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                >
                  <span className="ring-clock">{formatClock(seconds)}</span>
                  <span className="ring-label" style={{ color: activeMeta?.color }}>
                    {activeMeta?.title}
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  className="ring-center"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                >
                  <span className="ring-total">
                    {Math.floor(totalToday / 60)}ч {totalToday % 60}м
                  </span>
                  <span className="ring-label">из {Math.floor(dailyGoal / 60)}ч цели</span>
                </motion.div>
              )}
            </AnimatePresence>
          </ProgressRing>

          {activeEntry && (
            <motion.div
              className="ring-pulse"
              style={{ borderColor: activeMeta?.color }}
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 1.18 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>

        <motion.button
          className="tracker-playbtn"
          style={{ background: activeEntry ? '#ff5a45' : 'var(--ink)', opacity: busy ? 0.7 : 1 }}
          whileTap={{ scale: 0.88 }}
          onClick={toggleRunning}
          disabled={busy || !activeId}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activeEntry ? (
              <motion.svg
                key="pause"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <rect x="6" y="5" width="4.5" height="14" rx="1.5" fill="#fff" />
                <rect x="13.5" y="5" width="4.5" height="14" rx="1.5" fill="#fff" />
              </motion.svg>
            ) : (
              <motion.svg
                key="play"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <path d="M7 4.5L20 12L7 19.5Z" fill="#fff" />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="tracker-chips">
          {categories.map((c, i) => {
            const meta = familyMeta(c.building_family);
            const isActive = c.id === activeId;
            const minutes = summary?.by_category[c.id] ?? 0;
            return (
              <motion.button
                key={c.id}
                className="chip"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4, type: 'spring', bounce: 0.35 }}
                whileTap={{ scale: 0.93 }}
                style={{
                  background: isActive ? meta.color : 'var(--surface)',
                  borderColor: isActive ? 'transparent' : 'var(--line)',
                }}
                onClick={() => !activeEntry && setActiveId(c.id)}
              >
                <Shape kind={meta.shape} color={isActive ? '#fff' : meta.color} size={20} />
                <div className="chip-text">
                  <span style={{ color: isActive ? '#fff' : 'var(--ink)' }}>{c.title}</span>
                  <span style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)' }}>{minutes} мин</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="tracker-list">
          <h3>Категории</h3>
          {categories.map((c, i) => {
            const meta = familyMeta(c.building_family);
            const minutes = summary?.by_category[c.id] ?? 0;
            const pct = Math.min(100, (minutes / 180) * 100);
            return (
              <motion.div
                key={c.id}
                className="tracker-row"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Shape kind={meta.shape} color={meta.color} size={30} />
                <div className="tracker-row-main">
                  <div className="tracker-row-top">
                    <span>{c.title}</span>
                    <span className="tracker-row-min">{minutes} мин</span>
                  </div>
                  <div className="tracker-row-track">
                    <motion.div
                      className="tracker-row-fill"
                      style={{ background: meta.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.05 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
