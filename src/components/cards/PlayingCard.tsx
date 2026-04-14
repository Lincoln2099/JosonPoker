import { motion } from 'framer-motion';
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
      ? 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 50%, #ffd700 100%)'
      : 'linear-gradient(135deg, #c0c0c0 0%, #87ceeb 50%, #c0c0c0 100%)'
    : 'linear-gradient(145deg, var(--card-white) 0%, #f0f0f0 100%)';

  const suitDisplay = isJoker
    ? isBigJoker ? '大王' : '小王'
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
        className="absolute flex flex-col items-center leading-none font-bold"
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
        className="absolute flex flex-col items-center leading-none font-bold"
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

  return (
    <motion.div
      layout
      onClick={!disabled && selectable ? onClick : undefined}
      className={`relative ${selectable && !disabled ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: s.w,
        height: s.h,
        perspective: 600,
        transformStyle: 'preserve-3d',
      }}
      animate={{
        y: selected ? -16 : 0,
        scale: selected ? 1.08 : 1,
      }}
      whileHover={selectable && !disabled ? { scale: 1.04, y: -3 } : {}}
      whileTap={selectable && !disabled ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="relative"
        style={{
          width: s.w,
          height: s.h,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <CardFace card={card} s={s} />
        <CardBack s={s} />
      </motion.div>

      {selected && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ animation: 'card-select-glow 1.5s ease-in-out infinite' }}
        />
      )}

      {isNew && !selected && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          style={{ animation: 'card-new-highlight 1.2s ease-out forwards' }}
        />
      )}
    </motion.div>
  );
}
