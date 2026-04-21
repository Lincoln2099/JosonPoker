import { motion } from 'framer-motion';
import { MULTS, ROUND_CN, STEP_COLORS } from '../../game/Card';

interface TopBarProps {
  round: number;
  loserRank: number;
  np: number;
}

export default function TopBar({ round, loserRank, np }: TopBarProps) {
  const color = STEP_COLORS[round] ?? '#c9a84c';

  return (
    <motion.div
      className="relative z-20 flex items-center justify-between px-4 py-2"
      style={{
        background: 'rgba(8,22,14,0.9)',
        borderBottom: '1px solid rgba(240,202,80,0.12)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="text-[14px] font-black"
          style={{ color: '#f2ede4' }}
        >
          第{ROUND_CN[round]}轮
        </span>

        <span
          className="rounded px-2 py-0.5 text-[12px] font-bold"
          style={{
            background: color,
            color: '#1a1610',
          }}
        >
          ×{MULTS[round]}
        </span>
      </div>

      <span className="text-[11px] font-medium" style={{ color: '#b0a898' }}>
        {np}人局 · 第{loserRank}名输
      </span>
    </motion.div>
  );
}
