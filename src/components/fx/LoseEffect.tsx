import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoseEffectProps {
  delta: number;
}

export default function LoseEffect({ delta }: LoseEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const vignette = vignetteRef.current;
    const text = textRef.current;
    const tint = tintRef.current;
    if (!container || !vignette || !text || !tint) return;

    const tl = gsap.timeline();

    // Dark red tint flash
    tl.fromTo(
      tint,
      { opacity: 0.5 },
      { opacity: 0, duration: 0.8, ease: 'power2.out' },
      0,
    );

    // Red vignette — thick and visible
    tl.fromTo(
      vignette,
      { opacity: 1 },
      { opacity: 0, duration: 1.5, ease: 'power2.out' },
      0,
    );

    // Score text — dramatic downward slam
    tl.fromTo(
      text,
      { y: -80, scale: 1.5, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.35, ease: 'power4.out' },
      0.05,
    )
      .to(text, { y: 4, scale: 0.97, duration: 0.08 }, 0.4)
      .to(text, { y: 0, scale: 1, duration: 0.12 }, 0.48)
      .to(text, { y: 30, opacity: 0, duration: 0.7, ease: 'power2.in' }, 1.2);

    // Screen shake
    tl.to(
      container,
      { x: 4, duration: 0.04, yoyo: true, repeat: 9, ease: 'power2.inOut' },
      0,
    );

    return () => { tl.kill(); };
  }, [delta]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50"
    >
      {/* Dark red tint */}
      <div
        ref={tintRef}
        className="absolute inset-0"
        style={{ background: 'rgba(120,20,20,0.3)', opacity: 0 }}
      />

      {/* Red vignette — very visible */}
      <div
        ref={vignetteRef}
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 150px rgba(248,113,113,0.7), inset 0 0 60px rgba(220,38,38,0.4)',
          opacity: 0,
        }}
      />

      {/* Score text — downward slam */}
      <div className="flex h-full items-center justify-center">
        <div
          ref={textRef}
          className="text-7xl font-black"
          style={{
            color: 'var(--lose)',
            textShadow: '0 0 30px rgba(248,113,113,0.6), 0 4px 20px rgba(0,0,0,0.5)',
            WebkitTextStroke: '1px rgba(0,0,0,0.2)',
            opacity: 0,
          }}
        >
          {delta}
        </div>
      </div>
    </div>
  );
}
