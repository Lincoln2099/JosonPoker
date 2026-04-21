import { useCallback, useRef, useState } from 'react';
import type { Card } from '../../game/Card';

const SIZES = {
  xs: { w: 20, h: 28, rank: '6px', suit: '8px', corner: '4px' },
  sm: { w: 48, h: 68, rank: '10px', suit: '16px', corner: '8px' },
  md: { w: 60, h: 85, rank: '12px', suit: '22px', corner: '9px' },
  lg: { w: 72, h: 102, rank: '14px', suit: '28px', corner: '10px' },
} as const;

interface PlayingCardProps {
  card: Card;
  faceDown?: boolean;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  isCommunity?: boolean;
  isNew?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

function CardBack({ s }: { s: (typeof SIZES)[keyof typeof SIZES] }) {
  return (
    <div
      className="absolute inset-0 rounded-lg"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: `repeating-linear-gradient(
          45deg,
          var(--field-dark) 0px,
          var(--field-dark) 4px,
          var(--field) 4px,
          var(--field) 8px
        )`,
        border: '2px solid var(--gold)',
        width: s.w,
        height: s.h,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div className="absolute inset-1 rounded border border-[var(--gold)]/30" />
    </div>
  );
}

function CardFace({ card, s }: { card: Card; s: (typeof SIZES)[keyof typeof SIZES] }) {
  const isRed = card.color === 'red';
  const color = isRed ? 'var(--suit-red)' : 'var(--suit-black)';
  const isJoker = card.isJoker;
  const isBigJoker = card.jokerType === 'big';

  const bgStyle = isJoker
    ? isBigJoker
      ? 'linear-gradient(135deg, #c9a84c 0%, #c9a84c 50%, #c9a84c 100%)'
      : 'linear-gradient(135deg, #6b6358 0%, #8a8070 50%, #6b6358 100%)'
    : 'linear-gradient(145deg, var(--card-white) 0%, #f0f0f0 100%)';

  const suitDisplay = isJoker
    ? isBigJoker
      ? '大王'
      : '小王'
    : card.suit;

  return (
    <div
      className="absolute inset-0 flex flex-col rounded-lg"
      style={{
        backfaceVisibility: 'hidden',
        background: bgStyle,
        width: s.w,
        height: s.h,
        border: `1px solid ${isJoker ? 'var(--gold)' : 'rgba(0,0,0,0.12)'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        color,
      }}
    >
      <div
        className="absolute flex flex-col items-center font-bold leading-none"
        style={{ top: 2, left: 3, fontSize: s.corner }}
      >
        <span>{card.displayRank}</span>
        {!isJoker && <span style={{ fontSize: s.corner }}>{card.suit}</span>}
      </div>

      <div
        className="flex flex-1 items-center justify-center font-bold"
        style={{ fontSize: s.suit }}
      >
        {suitDisplay}
      </div>

      <div
        className="absolute flex flex-col items-center font-bold leading-none"
        style={{
          bottom: 2,
          right: 3,
          fontSize: s.corner,
          transform: 'rotate(180deg)',
        }}
      >
        <span>{card.displayRank}</span>
        {!isJoker && <span style={{ fontSize: s.corner }}>{card.suit}</span>}
      </div>
    </div>
  );
}

export default function PlayingCard({
  card,
  faceDown = false,
  selectable = false,
  selected = false,
  disabled = false,
  isNew = false,
  size = 'md',
  onClick,
  className = '',
}: PlayingCardProps) {
  const s = SIZES[size];
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, hx: 50, hy: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const isInteractive = selectable && !disabled;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isInteractive || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rx = (y - 0.5) * -12;
      const ry = (x - 0.5) * 12;
      setTilt({ rx, ry, hx: x * 100, hy: y * 100 });
    },
    [isInteractive],
  );

  const handleMouseEnter = useCallback(() => {
    if (isInteractive) setIsHovered(true);
  }, [isInteractive]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ rx: 0, ry: 0, hx: 50, hy: 50 });
    setIsHovered(false);
  }, []);

  const hoverY = isHovered && !selected ? -6 : 0;
  const hoverScale = isHovered && !selected ? 1.06 : 1;

  return (
    <div
      ref={cardRef}
      onClick={!disabled && selectable ? onClick : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: s.w,
        height: s.h,
        transform: `
          translateY(${selected ? -24 + hoverY : hoverY}px)
          scale(${selected ? 1.12 * hoverScale : hoverScale})
          rotateX(${tilt.rx}deg)
          rotateY(${tilt.ry}deg)
        `,
        perspective: 800,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* 3D card flip wrapper — isolated 3D context */}
      <div
        className="relative"
        style={{
          width: s.w,
          height: s.h,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${faceDown ? 180 : 0}deg)`,
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <CardFace card={card} s={s} />
        <CardBack s={s} />

        {/* Edge thickness simulation during flip */}
        {faceDown && (
          <div
            className="pointer-events-none absolute rounded-sm"
            style={{
              width: 2,
              height: s.h - 4,
              top: 2,
              left: s.w / 2 - 1,
              background: 'rgba(201,168,76,0.3)',
              transformOrigin: 'center',
              transform: 'rotateY(90deg) translateZ(0)',
              opacity: 0.4,
            }}
          />
        )}
      </div>

      {/* Mouse-following highlight — OUTSIDE of 3D context */}
      {isInteractive && !faceDown && (tilt.rx !== 0 || tilt.ry !== 0) && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{
            background: `radial-gradient(circle at ${tilt.hx}% ${tilt.hy}%, rgba(255,255,255,0.06), transparent 60%)`,
          }}
        />
      )}

      {/* Selected glow — OUTSIDE of 3D context so boxShadow renders correctly */}
      {selected && (
        <div
          className="pointer-events-none absolute"
          style={{
            inset: '-8px',
            borderRadius: 14,
            border: '2px solid #f0ca50',
            boxShadow: '0 0 14px rgba(240,202,80,0.4)',
          }}
        />
      )}

      {/* New card highlight */}
      {isNew && !selected && (
        <div
          className="pointer-events-none absolute rounded-lg"
          style={{
            inset: '-4px',
            border: '2px solid #7bb8cc',
            boxShadow: '0 0 8px rgba(123,184,204,0.3)',
          }}
        />
      )}
    </div>
  );
}
