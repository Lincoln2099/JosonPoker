import { useEffect, useRef, useMemo, type ReactNode } from 'react';
import { usePerformance } from '../../hooks/usePerformance';
import gsap from 'gsap';

const PETAL_COUNT = 24;

function SakuraPetals() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLowEnd } = usePerformance();
  const count = isLowEnd ? 10 : PETAL_COUNT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const petals: HTMLDivElement[] = [];
    for (let i = 0; i < count; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';
      const size = 6 + Math.random() * 8;
      const hue = Math.random() > 0.5 ? 0 : 10;
      petal.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size * 1.4}px;
        background: linear-gradient(135deg,
          hsl(${340 + hue}, 80%, 82%),
          hsl(${345 + hue}, 70%, 75%));
        border-radius: 50% 0 50% 50%;
        pointer-events: none;
        opacity: 0;
        will-change: transform, opacity;
      `;
      container.appendChild(petal);
      petals.push(petal);
      animatePetal(petal, true);
    }

    function animatePetal(el: HTMLElement, first = false) {
      const startX = Math.random() * (container?.clientWidth ?? 400);
      const drift = (Math.random() - 0.5) * 160;
      const h = container?.clientHeight ?? 600;
      const delay = first ? Math.random() * 6 : 0;

      gsap.set(el, {
        x: startX,
        y: first ? Math.random() * h * -0.1 : -20,
        rotation: Math.random() * 360,
        opacity: 0,
      });

      gsap.to(el, {
        y: h + 30,
        x: startX + drift + Math.sin(Math.random() * Math.PI * 2) * 60,
        rotation: `+=${300 + Math.random() * 400}`,
        opacity: 0.65,
        duration: 5 + Math.random() * 5,
        delay,
        ease: 'none',
        onUpdate: function () {
          const progress = this.progress();
          if (progress > 0.85) {
            gsap.set(el, { opacity: 0.65 * (1 - (progress - 0.85) / 0.15) });
          }
        },
        onComplete: () => animatePetal(el),
      });
    }

    return () => {
      petals.forEach((p) => {
        gsap.killTweensOf(p);
        p.remove();
      });
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ borderRadius: 'inherit' }}
    />
  );
}

interface PokerTableProps {
  children: ReactNode;
}

export default function PokerTable({ children }: PokerTableProps) {
  const { isLowEnd } = usePerformance();

  const diamondPattern = useMemo(() => {
    const size = 20;
    return `url("data:image/svg+xml,%3Csvg width='${size}' height='${size}' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M${size / 2} 2L${size - 2} ${size / 2}L${size / 2} ${size - 2}L2 ${size / 2}Z' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='0.5'/%3E%3C/svg%3E")`;
  }, []);

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        aspectRatio: '3 / 4',
        maxWidth: 420,
        maxHeight: 'calc(100dvh - 200px)',
      }}
    >
      {/* Outer shadow & bevel */}
      <div
        className="absolute inset-0 rounded-[36px]"
        style={{
          boxShadow:
            '0 8px 48px rgba(0,0,0,0.6), 0 2px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      />

      {/* Grass stripes — vertical for portrait */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[36px]"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            var(--field) 0px,
            var(--field) 28px,
            var(--field-light) 28px,
            var(--field-light) 56px
          )`,
        }}
      />

      {/* Diamond pattern overlay */}
      <div
        className="absolute inset-0 rounded-[36px]"
        style={{
          backgroundImage: diamondPattern,
          backgroundSize: '20px 20px',
          opacity: 0.6,
        }}
      />

      {/* Outer border */}
      <div
        className="absolute inset-0 rounded-[36px]"
        style={{
          border: '3px solid rgba(255,255,255,0.45)',
          boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.05)',
        }}
      />

      {/* Inner border */}
      <div
        className="absolute rounded-[30px]"
        style={{
          inset: '8px',
          border: '1.5px solid rgba(255,255,255,0.15)',
        }}
      />

      {/* Center star accent */}
      <div
        className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: 0.1 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4l5.5 14.5H44l-12 8.5 4.5 15L24 34l-12.5 8 4.5-15-12-8.5h14.5z"
            fill="rgba(255,255,255,0.3)"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Cherry blossoms */}
      {!isLowEnd && <SakuraPetals />}

      {/* Children (community cards, seat ring, etc.) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-visible">
        {children}
      </div>
    </div>
  );
}
