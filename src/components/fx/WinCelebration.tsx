import { motion } from 'framer-motion';
import ParticleSystem from './ParticleSystem';

interface WinCelebrationProps {
  delta: number;
  isBigWin?: boolean;
}

export default function WinCelebration({ delta, isBigWin = false }: WinCelebrationProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <ParticleSystem density={isBigWin ? 'high' : 'normal'} />

      {isBigWin && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255,215,0,0.25) 0%, transparent 60%)',
            animation: 'golden-flash 1.5s ease-out forwards',
          }}
        />
      )}

      <div className="flex h-full items-center justify-center">
        <motion.span
          className="text-4xl font-black drop-shadow-lg"
          style={{
            color: 'var(--win)',
            textShadow: '0 0 20px rgba(74,222,128,0.5)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: [0, 1, 1, 0], y: [20, -20, -40, -60], scale: [0.5, 1.2, 1.1, 0.9] }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
        >
          +{delta}
        </motion.span>
      </div>

      {isBigWin && (
        <motion.div
          className="absolute inset-0"
          animate={{ x: [0, 3, -3, 2, -2, 0] }}
          transition={{ duration: 0.15, delay: 0.1 }}
        />
      )}
    </div>
  );
}
