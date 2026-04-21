import { motion } from 'framer-motion';
import { MULTS, STEP_COLORS } from '../../game/Card';

interface MultiplierBarProps {
  currentRound: number;
}

export default function MultiplierBar({ currentRound }: MultiplierBarProps) {
  return (
    <div className="relative z-20 flex items-center justify-center gap-0 px-4 py-1.5" style={{ background: 'rgba(8,22,14,0.75)' }}>
      {MULTS.map((mult, i) => {
        const isCurrent = i === currentRound;
        const isCompleted = i < currentRound;
        const color = STEP_COLORS[i]!;

        return (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <div
                className="h-px"
                style={{
                  width: 16,
                  background: i <= currentRound ? `${color}50` : 'rgba(255,255,255,0.06)',
                }}
              />
            )}

            <motion.div
              className="flex h-7 w-12 items-center justify-center rounded-md text-[11px] font-bold"
              style={{
                background: isCurrent
                  ? color
                  : isCompleted
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                color: isCurrent
                  ? '#111'
                  : isCompleted
                    ? `${color}99`
                    : 'rgba(255,255,255,0.2)',
                border: isCurrent
                  ? 'none'
                  : `1px solid rgba(255,255,255,${isCompleted ? '0.06' : '0.03'})`,
              }}
              animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
              transition={isCurrent ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : {}}
            >
              {isCompleted ? '✓' : `×${mult}`}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
