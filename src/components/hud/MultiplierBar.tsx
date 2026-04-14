import { motion } from 'framer-motion';
import { MULTS, STEP_COLORS } from '../../game/Card';

interface MultiplierBarProps {
  currentRound: number;
}

export default function MultiplierBar({ currentRound }: MultiplierBarProps) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-1.5">
      {MULTS.map((mult, i) => {
        const isCurrent = i === currentRound;
        const isCompleted = i < currentRound;
        const color = STEP_COLORS[i]!;

        return (
          <motion.div
            key={i}
            className="relative flex flex-col items-center"
            animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
            transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
          >
            <div
              className="flex h-7 w-12 items-center justify-center rounded-md text-xs font-bold transition-all"
              style={{
                background: isCurrent
                  ? color
                  : isCompleted
                    ? `${color}44`
                    : 'rgba(255,255,255,0.06)',
                color: isCurrent ? '#fff' : isCompleted ? color : 'rgba(255,255,255,0.3)',
                boxShadow: isCurrent ? `0 0 12px ${color}66` : 'none',
                ...(isCurrent
                  ? {
                      animation: 'multiplier-breathe 2s ease-in-out infinite',
                      ['--glow-color' as string]: color,
                    }
                  : {}),
              }}
            >
              {isCompleted ? '✓' : `×${mult}`}
            </div>

            {i < MULTS.length - 1 && (
              <div
                className="absolute right-0 top-1/2 h-0.5 translate-x-full"
                style={{
                  width: 4,
                  background: isCompleted ? color : 'rgba(255,255,255,0.1)',
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
