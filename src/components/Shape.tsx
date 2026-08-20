import type { ShapeKind } from '../types';

interface ShapeProps {
  kind: ShapeKind;
  color: string;
  size?: number;
  className?: string;
}

export default function Shape({ kind, color, size = 28, className }: ShapeProps) {
  const s = size;
  const common = { width: s, height: s, className };

  switch (kind) {
    case 'circle':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill={color} />
        </svg>
      );
    case 'square':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <rect x="3" y="3" width="34" height="34" rx="11" fill={color} />
        </svg>
      );
    case 'triangle':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <path d="M20 3 L36.5 33 A4 4 0 0 1 33 37 H7 A4 4 0 0 1 3.5 33 Z" fill={color} />
        </svg>
      );
    case 'hex':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <path
            d="M14 4.5 H26 a4 4 0 0 1 3.5 2 L35.5 17 a4 4 0 0 1 0 4 L29.5 33.5 a4 4 0 0 1 -3.5 2 H14 a4 4 0 0 1 -3.5 -2 L4.5 21 a4 4 0 0 1 0 -4 L10.5 6.5 a4 4 0 0 1 3.5 -2 Z"
            fill={color}
          />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <rect x="8" y="8" width="24" height="24" rx="6" fill={color} transform="rotate(45 20 20)" />
        </svg>
      );
    case 'blob':
      return (
        <svg {...common} viewBox="0 0 40 40">
          <path
            d="M20 3.5c6.6 0 12 3 15.2 8.4 2.7 4.6 2 10.4-1.6 14.7-3.7 4.4-9.1 6.9-14.6 6.4-5.4-.5-10.4-3.9-12.7-9-2.3-5.1-1.6-11.6 2.1-15.8C11.9 4.6 15.9 3.5 20 3.5Z"
            fill={color}
          />
        </svg>
      );
    default:
      return null;
  }
}
