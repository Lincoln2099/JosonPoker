import { motion } from 'framer-motion';

interface LoseEffectProps {
  delta: number;
}

export default function LoseEffect({ delta }: LoseEffectProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Red vignette flash */}
      <div
        className="absolute inset-0"
        style={{ animation: 'red-vignette 0.8s ease-out forwards' }}
      />

      {/* Screen micro-shake wrapper */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: [0, 3, -3, 2, -2, 0] }}
        transition={{ duration: 0.15 }}
      />

      {/* Floating score */}
      <div className="flex h-full items-center justify-center">
        <motion.span
          className="text-4xl font-black drop-shadow-lg"
          style={{
            color: 'var(--lose)',
            textShadow: '0 0 20px rgba(248,113,113,0.5)',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [20, -10, -30, -50],
            scale: [0.5, 1.1, 1.05, 0.9],
            x: [0, -2, 2, -1, 1, 0, -2, 2, 0],
          }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          {delta}
        </motion.span>
      </div>
    </div>
  );
}
