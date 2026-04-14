import { motion } from 'framer-motion';
import type { PlayerState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';
import type { GamePhase } from '../../game/GameEngine';

interface SeatProps {
  player: PlayerState;
  result?: RoundResult;
  phase: GamePhase;
  compact?: boolean;
}

export default function Seat({ player, result, phase, compact }: SeatProps) {
  const showResult = phase === 'result' && result;
  const scoreColor =
    player.score > 0 ? 'text-[var(--win)]' : player.score < 0 ? 'text-[var(--lose)]' : 'text-white/60';
  const deltaColor =
    result && result.delta > 0
      ? 'text-[var(--win)]'
      : result && result.delta < 0
        ? 'text-[var(--lose)]'
        : 'text-white/60';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-0.5"
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full text-lg shadow-lg"
        style={{
          width: compact ? 32 : 40,
          height: compact ? 32 : 40,
          background: 'linear-gradient(135deg, var(--field-dark), var(--field))',
          border: '2px solid rgba(255,255,255,0.25)',
        }}
      >
        {player.emoji}
      </div>

      {/* Name */}
      <span className="text-[10px] font-semibold leading-tight text-white/90 drop-shadow">
        {player.name}
      </span>

      {/* Style tag */}
      {!compact && player.style && (
        <span className="hidden text-[8px] text-white/40 sm:inline">{player.style}</span>
      )}

      {/* Score */}
      <span className={`text-[10px] font-bold leading-tight ${scoreColor}`}>
        {player.score > 0 ? '+' : ''}
        {player.score}
      </span>

      {/* Hand count badge */}
      <span className="rounded-full bg-white/10 px-1.5 text-[8px] text-white/50">
        {player.hand.length}牌
      </span>

      {/* Result overlay */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-0.5 flex flex-col items-center rounded-md bg-black/60 px-1.5 py-0.5 backdrop-blur-sm"
        >
          <span className="text-[9px] text-[var(--sakura)]">{result.ev.name}</span>
          <span className="text-[9px] text-white/60">#{result.rank}</span>
          <span className={`text-[10px] font-bold ${deltaColor}`}>
            {result.delta > 0 ? '+' : ''}
            {result.delta}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
