import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#FF5A45', '#FFB627', '#4CB944', '#2AA9E0', '#9B6BFF', '#FF6FA5'];

interface Piece {
  id: number;
  x: number;
  rotate: number;
  color: string;
  delay: number;
  drift: number;
  shape: 'rect' | 'circle';
}

function makePieces(seed: number): Piece[] {
  return Array.from({ length: 16 }, (_, i) => ({
    id: seed * 100 + i,
    x: (Math.random() - 0.5) * 160,
    rotate: Math.random() * 360,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.08,
    drift: (Math.random() - 0.5) * 60,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }));
}

export default function Confetti({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) return null;
  const pieces = makePieces(burstKey);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
      }}
    >
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0.6 }}
            animate={{
              opacity: 0,
              x: p.x + p.drift,
              y: -70 - Math.random() * 40,
              rotate: p.rotate,
              scale: 1,
            }}
            transition={{ duration: 0.85, delay: p.delay, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 8,
              height: p.shape === 'rect' ? 12 : 8,
              background: p.color,
              borderRadius: p.shape === 'rect' ? 2 : '50%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
