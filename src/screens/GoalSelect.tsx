import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Shape from '../components/Shape';
import Confetti from '../components/Confetti';
import { BUILDING_FAMILIES } from '../data/buildingFamilies';
import { categoriesApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import './GoalSelect.css';

export default function GoalSelect({ onDone, onClose }: { onDone: () => void; onClose?: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [burst, setBurst] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      for (const key of selected) {
        const meta = BUILDING_FAMILIES.find((f) => f.key === key)!;
        await categoriesApi.create({
          title: meta.title,
          color: meta.color,
          shape: meta.shape,
          building_family: meta.key,
          minutes_per_day_target: meta.minutesPerDayDefault,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не получилось сохранить цели');
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setBurst((b) => ({ ...b, [id]: (b[id] ?? 0) + 1 }));
      }
      return next;
    });
  }

  return (
    <div className="goalselect">
      <div className="goalselect-header">
        {onClose && (
          <motion.button
            className="goalselect-close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </motion.button>
        )}
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          Выбери свои цели
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          Можно выбрать несколько — позже добавишь ещё
        </motion.p>
      </div>

      <div className="goalselect-grid">
        {BUILDING_FAMILIES.map((g, i) => {
          const active = selected.has(g.key);
          return (
            <motion.button
              key={g.key}
              className="goal-card"
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: active ? 1.04 : 1,
                backgroundColor: active ? g.color : 'var(--surface)',
                borderColor: active ? g.colorDeep : 'var(--line)',
              }}
              transition={{
                opacity: { delay: 0.06 * i, duration: 0.4 },
                y: { delay: 0.06 * i, duration: 0.4, type: 'spring', bounce: 0.4 },
                scale: { type: 'spring', bounce: 0.55, duration: 0.5 },
                backgroundColor: { duration: 0.25 },
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() => toggle(g.key)}
            >
              <div className="goal-card-shape">
                <motion.div
                  animate={active ? { rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Shape kind={g.shape} color={active ? '#fff' : g.color} size={36} />
                </motion.div>
                <Confetti burstKey={burst[g.key] ?? 0} />
              </div>
              <span className="goal-card-title" style={{ color: active ? '#fff' : 'var(--ink)' }}>
                {g.title}
              </span>
              <span className="goal-card-sub" style={{ color: active ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)' }}>
                ~{g.minutesPerDayDefault} мин/день
              </span>

              <AnimatePresence>
                {active && (
                  <motion.div
                    className="goal-card-check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', bounce: 0.6, duration: 0.4 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7.2L5.5 10.2L11.5 3.8" stroke={g.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="goalselect-footer">
        {error && <p className="goalselect-error">{error}</p>}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.button
              className="goalselect-cta"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
              whileTap={{ scale: 0.95, y: 4 }}
              onClick={confirm}
              disabled={busy}
            >
              {busy ? 'Сохраняю…' : `Далее · выбрано ${selected.size}`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
