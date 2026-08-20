import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import './TabBar.css';

export type TabId = 'tracker' | 'city' | 'friends' | 'paired';

const TABS: { id: TabId; label: string; icon: (active: boolean) => ReactElement }[] = [
  {
    id: 'tracker',
    label: 'Трекер',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke={a ? '#fff' : 'var(--ink-soft)'} strokeWidth="2" />
        <path d="M12 7.5V12L15 14" stroke={a ? '#fff' : 'var(--ink-soft)'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'city',
    label: 'Город',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3.5" y="11" width="6" height="9.5" rx="1.4" fill={a ? '#fff' : 'var(--ink-soft)'} />
        <rect x="9.5" y="6" width="6" height="14.5" rx="1.4" fill={a ? '#fff' : 'var(--ink-soft)'} />
        <rect x="15.5" y="9.5" width="5.5" height="11" rx="1.4" fill={a ? '#fff' : 'var(--ink-soft)'} />
      </svg>
    ),
  },
  {
    id: 'friends',
    label: 'Друзья',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3.4" fill={a ? '#fff' : 'var(--ink-soft)'} />
        <path d="M2.5 20c0-4 3-6.6 6.5-6.6s6.5 2.6 6.5 6.6" stroke={a ? '#fff' : 'var(--ink-soft)'} strokeWidth="2" strokeLinecap="round" />
        <circle cx="17.5" cy="9" r="2.6" fill={a ? '#fff' : 'var(--ink-soft)'} opacity="0.7" />
      </svg>
    ),
  },
  {
    id: 'paired',
    label: 'Задания',
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 4h9a3 3 0 0 1 3 3v13l-4.5-2.5L9 20V7a3 3 0 0 1 3-3"
          stroke={a ? '#fff' : 'var(--ink-soft)'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function TabBar({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="tabbar">
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <button key={t.id} className="tabbar-item" onClick={() => onChange(t.id)}>
            <div className="tabbar-icon-wrap">
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="tabbar-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <motion.div
                className="tabbar-icon"
                animate={isActive ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              >
                {t.icon(isActive)}
              </motion.div>
            </div>
            <span className={isActive ? 'tabbar-label active' : 'tabbar-label'}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
