import { useMemo } from 'react';
import { usePerformance } from '../../hooks/usePerformance';

const SPRING_COLORS = ['#c9a84c', '#e0bf62', '#ffffff', '#d4a0ac', '#7bb8cc', '#6abb7c'];

interface ParticleSystemProps {
  density?: 'normal' | 'high';
  colors?: string[];
}

export default function ParticleSystem({
  density = 'normal',
  colors = SPRING_COLORS,
}: ParticleSystemProps) {
  const { isLowEnd } = usePerformance();
  const base = density === 'high' ? 60 : 30;
  const count = isLowEnd ? Math.round(base / 3) : base;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const size = 4 + Math.random() * 4;
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 1.8 + Math.random() * 1.5;
      const rotation = 360 + Math.random() * 720;
      const color = colors[Math.floor(Math.random() * colors.length)]!;
      const shape = Math.random() > 0.5 ? 'circle' : 'rect';
      return { i, size, left, delay, duration, rotation, color, shape };
    });
  }, [count, colors]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            top: -10,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            opacity: 0,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            ['--rot' as string]: `${p.rotation}deg`,
            ['--s-end' as string]: '0.3',
          }}
        />
      ))}
    </div>
  );
}
