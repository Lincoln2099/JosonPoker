import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface WinCelebrationProps {
  delta: number;
  isBigWin?: boolean;
}

const CONFETTI_COLORS = ['#f0ca50', '#ffd868', '#ffffff', '#45d870', '#60c0e0'];
const CONFETTI_COUNT = 50;

export default function WinCelebration({ delta, isBigWin = false }: WinCelebrationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    const flash = flashRef.current;
    const ring = ringRef.current;
    if (!container || !text || !flash || !ring) return;

    const tl = gsap.timeline();

    // Flash overlay
    tl.fromTo(
      flash,
      { opacity: isBigWin ? 0.7 : 0.4 },
      { opacity: 0, duration: 0.6, ease: 'power2.out' },
      0,
    );

    // Golden ring burst
    tl.fromTo(
      ring,
      { scale: 0, opacity: 0.8 },
      { scale: 4, opacity: 0, duration: 1.2, ease: 'power2.out' },
      0,
    );

    // Score text slam up
    tl.fromTo(
      text,
      { y: 60, scale: 0.3, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
      0.1,
    )
      .to(text, { scale: 1.15, duration: 0.15, ease: 'power2.in' }, 0.7)
      .to(text, { scale: 1, duration: 0.15, ease: 'power2.out' }, 0.85)
      .to(text, { y: -40, opacity: 0, duration: 0.8, ease: 'power2.in' }, 1.6);

    // Confetti particles via GSAP
    const confetti: HTMLDivElement[] = [];
    for (let i = 0; i < (isBigWin ? CONFETTI_COUNT * 1.5 : CONFETTI_COUNT); i++) {
      const el = document.createElement('div');
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!;
      const size = 4 + Math.random() * 5;
      const isCircle = Math.random() > 0.5;
      el.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${isCircle ? size : size * 0.4}px;
        background: ${color};
        border-radius: ${isCircle ? '50%' : '1px'};
        top: 50%;
        left: 50%;
        pointer-events: none;
      `;
      container.appendChild(el);
      confetti.push(el);

      const angle = Math.random() * Math.PI * 2;
      const velocity = 200 + Math.random() * 300;
      const destX = Math.cos(angle) * velocity;
      const destY = Math.sin(angle) * velocity - 100;

      tl.fromTo(
        el,
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          x: destX,
          y: destY + 400,
          rotation: 360 + Math.random() * 720,
          opacity: 0,
          duration: 1.5 + Math.random() * 1,
          ease: 'power2.out',
        },
        0.05 + Math.random() * 0.3,
      );
    }

    return () => {
      tl.kill();
      confetti.forEach((el) => el.remove());
    };
  }, [delta, isBigWin]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* Flash overlay */}
      <div
        ref={flashRef}
        className="absolute inset-0"
        style={{
          background: isBigWin
            ? 'radial-gradient(circle, rgba(201,168,76,0.5) 0%, rgba(201,168,76,0.1) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(106,187,124,0.3) 0%, transparent 60%)',
          opacity: 0,
        }}
      />

      {/* Expanding ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          ref={ringRef}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: `3px solid ${isBigWin ? 'var(--gold)' : 'var(--win)'}`,
            opacity: 0,
          }}
        />
      </div>

      {/* Score text */}
      <div className="flex h-full items-center justify-center">
        <div
          ref={textRef}
          className="text-center"
          style={{ opacity: 0 }}
        >
          <div
            className="text-7xl font-black"
            style={{
              color: isBigWin ? 'var(--gold)' : 'var(--win)',
              textShadow: isBigWin
                ? '0 0 20px rgba(201,168,76,0.6), 0 4px 10px rgba(0,0,0,0.5)'
                : '0 0 15px rgba(106,187,124,0.5), 0 4px 10px rgba(0,0,0,0.5)',
              WebkitTextStroke: '1px rgba(255,255,255,0.2)',
            }}
          >
            +{delta}
          </div>
          {isBigWin && (
            <div
              className="mt-1 text-lg font-bold tracking-widest"
              style={{ color: 'var(--gold)', opacity: 0.8 }}
            >
              BIG WIN!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
