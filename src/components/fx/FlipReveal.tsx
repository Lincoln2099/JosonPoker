import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayingCard from '../cards/PlayingCard';
import type { Card } from '../../game/Card';
import { playSound } from '../../hooks/useSound';

interface FlipRevealProps {
  card: Card;
  onComplete: () => void;
}

export default function FlipReveal({ card, onComplete }: FlipRevealProps) {
  const [countdown, setCountdown] = useState(3);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      playSound('click');
      const t = setTimeout(() => setCountdown(countdown - 1), 600);
      return () => clearTimeout(t);
    }
    playSound('flip');
    setRevealed(true);
    const done = setTimeout(onComplete, 1500);
    return () => clearTimeout(done);
  }, [countdown, onComplete]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(4,14,8,0.96)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Multi-layer spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(240,202,80,0.15) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(240,202,80,0.04) 0%, transparent 40%)',
        }}
      />

      {/* Title with glass pill */}
      <motion.div
        className="mb-8 rounded-full px-6 py-2"
        style={{
          background: 'rgba(10,28,18,0.92)',
          border: '1px solid rgba(240,202,80,0.15)',
          boxShadow: '0 0 14px rgba(240,202,80,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        initial={{ opacity: 0, y: -30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <span
          className="text-xl font-black tracking-[0.3em]"
          style={{
            color: 'var(--gold)',
            textShadow: '0 0 14px rgba(240,202,80,0.6)',
          }}
        >
          暗牌揭晓
        </span>
      </motion.div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {countdown > 0 ? (
            <motion.div
              key={countdown}
              className="relative flex items-center justify-center"
              style={{ width: 120, height: 120 }}
            >
              {/* Ring behind number */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: 0,
                  border: '2px solid rgba(240,202,80,0.4)',
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0.5, 0] }}
                transition={{ duration: 0.6 }}
              />
              <motion.span
                className="relative text-7xl font-black"
                style={{
                  color: 'var(--gold)',
                  textShadow: '0 0 20px rgba(240,202,80,0.7), 0 4px 8px rgba(0,0,0,0.5)',
                }}
                initial={{ scale: 2.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {countdown}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="card"
              className="relative"
              initial={{ scale: 0.4, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Card glow */}
              <div
                className="absolute -inset-4 rounded-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(240,202,80,0.2), transparent 70%)',
                  filter: 'blur(16px)',
                }}
              />

              <PlayingCard
                card={card}
                faceDown={!revealed}
                size="lg"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
