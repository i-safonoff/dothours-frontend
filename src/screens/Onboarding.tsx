import { motion } from 'framer-motion';
import Shape from '../components/Shape';
import './Onboarding.css';

const FLOATERS: { kind: 'circle' | 'square' | 'triangle' | 'hex' | 'blob' | 'diamond'; color: string; top: string; left: string; size: number; delay: number }[] = [
  { kind: 'circle', color: '#FF5A45', top: '7%', left: '12%', size: 46, delay: 0 },
  { kind: 'triangle', color: '#FFB627', top: '12%', left: '72%', size: 40, delay: 0.4 },
  { kind: 'hex', color: '#9B6BFF', top: '30%', left: '80%', size: 48, delay: 0.8 },
  { kind: 'blob', color: '#FF6FA5', top: '38%', left: '10%', size: 42, delay: 0.2 },
  { kind: 'diamond', color: '#4CB944', top: '20%', left: '44%', size: 28, delay: 1.1 },
  { kind: 'square', color: '#2AA9E0', top: '44%', left: '66%', size: 32, delay: 0.6 },
];

export default function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <div className="onboarding">
      <div className="onboarding-floaters">
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            className="floater"
            style={{ top: f.top, left: f.left, opacity: 0.85 }}
            initial={{ opacity: 0, y: 16, scale: 0.6 }}
            animate={{ opacity: 0.85, y: [0, -10, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.6, delay: f.delay },
              scale: { duration: 0.6, delay: f.delay, type: 'spring', bounce: 0.4 },
              y: { duration: 4.2 + i * 0.35, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
            }}
          >
            <Shape kind={f.kind} color={f.color} size={f.size} />
          </motion.div>
        ))}
      </div>

      <div className="onboarding-content">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.span
            className="brand-dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.6, duration: 0.7, delay: 0.15 }}
          >
            .
          </motion.span>
          hours
        </motion.h1>

        <motion.p
          className="onboarding-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48, duration: 0.5 }}
        >
          Трекай время, ставь цели вместе с друзьями и держите streak сообща
        </motion.p>

        <motion.button
          className="onboarding-cta"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62, duration: 0.5 }}
          whileTap={{ scale: 0.94, y: 4, boxShadow: '0 2px 0 rgba(0,0,0,0.15)' }}
          onClick={onStart}
        >
          Начать
        </motion.button>
      </div>
    </div>
  );
}
