import { MULTS, ROUND_CN, STEP_COLORS } from '../../game/Card';

interface TopBarProps {
  round: number;
  loserRank: number;
  np: number;
}

export default function TopBar({ round, loserRank, np }: TopBarProps) {
  const color = STEP_COLORS[round] ?? '#fff';

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <span
          className="text-lg font-black tracking-wide"
          style={{ color }}
        >
          第{ROUND_CN[round]}轮
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-sm font-bold"
          style={{ background: `${color}22`, color }}
        >
          ×{MULTS[round]}
        </span>
      </div>
      <div className="text-xs text-white/50">
        {np}人局 · 第{loserRank}名输
      </div>
    </div>
  );
}
