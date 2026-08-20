import { motion } from 'framer-motion';

interface BuildingProps {
  level: number;
  color: string;
  colorDeep: string;
  width?: number;
  animate?: boolean;
}

const TIER_WIDTHS = [58, 47, 37, 28, 20];
const TIER_H = 19;
const GROUND_Y = 118;

export default function Building({ level, color, colorDeep, width = 100, animate = true }: BuildingProps) {
  const tiers = Math.max(1, Math.min(level, 5));
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  let y = GROUND_Y;
  for (let i = 0; i < tiers; i++) {
    const w = TIER_WIDTHS[i];
    const topY = y - TIER_H;
    rects.push({ x: 50 - w / 2, y: topY, w, h: TIER_H });
    y = topY;
  }
  const topY = y;
  const topW = TIER_WIDTHS[tiers - 1];

  return (
    <svg width={width} height={width * 1.3} viewBox="0 0 100 130">
      <ellipse cx="50" cy={GROUND_Y + 6} rx={TIER_WIDTHS[0] / 1.7} ry="6" fill="rgba(44,33,23,0.10)" />

      {tiers >= 4 && (
        <motion.circle
          cx="50"
          cy={topY - 6}
          r="26"
          fill={color}
          opacity={0.18}
          animate={animate ? { r: [24, 30, 24], opacity: [0.22, 0.1, 0.22] } : undefined}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {rects.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="6" fill={i % 2 === 0 ? color : colorDeep} />
          <rect x={50 - 5} y={r.y + r.h / 2 - 4} width="10" height="8" rx="2" fill="rgba(255,255,255,0.55)" />
        </g>
      ))}

      <path d={`M ${50 - topW / 2 - 3} ${topY} L 50 ${topY - 14} L ${50 + topW / 2 + 3} ${topY} Z`} fill={colorDeep} />

      {tiers >= 3 && (
        <g>
          <rect x="49" y={topY - 28} width="2" height="16" fill="var(--ink)" />
          <motion.path
            d={`M 51 ${topY - 28} L 66 ${topY - 24} L 51 ${topY - 19} Z`}
            fill={color}
            animate={animate ? { d: [`M 51 ${topY - 28} L 66 ${topY - 24} L 51 ${topY - 19} Z`, `M 51 ${topY - 28} L 63 ${topY - 25} L 51 ${topY - 19} Z`, `M 51 ${topY - 28} L 66 ${topY - 24} L 51 ${topY - 19} Z`] } : undefined}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </g>
      )}

      {tiers >= 5 && (
        <>
          <motion.path
            d="M 22 40 l 2.5 6 l 6 2.5 l -6 2.5 l -2.5 6 l -2.5 -6 l -6 -2.5 l 6 -2.5 Z"
            fill="#FFB627"
            animate={animate ? { opacity: [0.3, 1, 0.3] } : undefined}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="76"
            cy="34"
            r="2.6"
            fill="#FFB627"
            animate={animate ? { opacity: [1, 0.2, 1] } : undefined}
            transition={{ duration: 1.4, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}
    </svg>
  );
}
