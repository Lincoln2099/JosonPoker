import { useMemo, type ReactNode } from 'react';

const PETAL_COUNT = 18;

function SakuraPetals() {
  const petals = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 8}s`,
        duration: `${6 + Math.random() * 6}s`,
        size: 6 + Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.4,
      })),
    [],
  );

  return (
    <>
      {petals.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none absolute select-none"
          style={{
            left: p.left,
            top: '-4%',
            fontSize: p.size,
            opacity: p.opacity,
            animation: `sakura-fall ${p.duration} ${p.delay} linear infinite`,
          }}
        >
          🌸
        </span>
      ))}
    </>
  );
}

function CornerFlag({ className }: { className: string }) {
  return (
    <div
      className={`absolute h-3 w-3 ${className}`}
      style={{
        background: 'linear-gradient(135deg, var(--sunlight) 50%, transparent 50%)',
      }}
    />
  );
}

interface PokerTableProps {
  children: ReactNode;
}

export default function PokerTable({ children }: PokerTableProps) {
  return (
    <div className="relative mx-auto w-full" style={{ aspectRatio: '3 / 2', maxWidth: 800 }}>
      {/* Outer shadow & bevel */}
      <div
        className="absolute inset-0 rounded-[50%]"
        style={{
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.08)',
        }}
      />

      {/* Grass stripes */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[50%]"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            var(--field) 0px,
            var(--field) 32px,
            var(--field-light) 32px,
            var(--field-light) 64px
          )`,
        }}
      />

      {/* Sideline borders */}
      <div
        className="absolute inset-0 rounded-[50%]"
        style={{
          border: '3px solid rgba(255,255,255,0.5)',
          boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.06)',
        }}
      />
      <div
        className="absolute rounded-[50%]"
        style={{
          inset: '6px',
          border: '2px solid rgba(255,255,255,0.18)',
        }}
      />

      {/* Center circle */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '30%',
          aspectRatio: '1',
          border: '2px solid rgba(255,255,255,0.18)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '4%',
          aspectRatio: '1',
          background: 'rgba(255,255,255,0.12)',
        }}
      />

      {/* Corner flags */}
      <CornerFlag className="top-[12%] left-[12%]" />
      <CornerFlag className="top-[12%] right-[12%] rotate-90" />
      <CornerFlag className="bottom-[12%] left-[12%] -rotate-90" />
      <CornerFlag className="bottom-[12%] right-[12%] rotate-180" />

      {/* Cherry blossoms */}
      <SakuraPetals />

      {/* Children (community cards, seat ring, etc.) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
