import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayingCard from '../cards/PlayingCard';
import type { Card } from '../../game/Card';

interface FlipRevealProps {
  card: Card;
  onComplete: () => void;
}

export default function FlipReveal({ card, onComplete }: FlipRevealProps) {
  const [countdown, setCountdown] = useState(3);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 600);
      return () => clearTimeout(t);
    }
    setRevealed(true);
    const done = setTimeout(onComplete, 1500);
    return () => clearTimeout(done);
  }, [countdown, onComplete]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(10,15,25,0.92)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Spotlight effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 55%, rgba(255,215,0,0.12) 0%, transparent 50%)',
        }}
      />

      <motion.span
        className="mb-6 text-2xl font-black tracking-widest text-[var(--gold)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        暗牌揭晓
      </motion.span>

      <AnimatePresence mode="wait">
        {countdown > 0 ? (
          <motion.span
            key={countdown}
            className="text-6xl font-black text-white/80"
            style={{ animation: 'countdown-pop 0.6s ease-out forwards' }}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {countdown}
          </motion.span>
        ) : (
          <motion.div
            key="card"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <PlayingCard
              card={card}
              faceDown={!revealed}
              size="lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
