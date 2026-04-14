import { motion } from 'framer-motion';
import type { GameState } from '../../game/GameEngine';
import { useGameStore } from '../../store/useGameStore';

interface ActionBarProps {
  game: GameState;
}

export default function ActionBar({ game }: ActionBarProps) {
  const confirmPlay = useGameStore((s) => s.confirmPlay);
  const nextRound = useGameStore((s) => s.nextRound);
  const goToGameOver = useGameStore((s) => s.goToGameOver);

  const { phase, round, selectedIndices } = game;
  const isLastRound = round === 4;
  const human = game.players[0]!;
  const canConfirm = phase === 'select' && selectedIndices.length === 2;

  const scoreColor =
    human.score > 0 ? 'text-[var(--win)]' : human.score < 0 ? 'text-[var(--lose)]' : 'text-white/60';

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Player info */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
          style={{
            background: 'linear-gradient(135deg, var(--field-dark), var(--field))',
            border: '2px solid var(--gold)',
          }}
        >
          {human.emoji}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold leading-tight">{human.name}</span>
          <span className={`text-xs font-semibold leading-tight ${scoreColor}`}>
            {human.score > 0 ? '+' : ''}{human.score}
          </span>
        </div>
      </div>

      {/* Action button */}
      <div>
        {phase === 'select' && !isLastRound && (
          <motion.button
            onClick={confirmPlay}
            disabled={!canConfirm}
            whileHover={canConfirm ? { scale: 1.04 } : {}}
            whileTap={canConfirm ? { scale: 0.96 } : {}}
            className="rounded-xl px-6 py-2.5 text-base font-bold transition-all"
            style={{
              background: canConfirm
                ? 'linear-gradient(135deg, var(--field), var(--field-light))'
                : 'rgba(255,255,255,0.08)',
              color: canConfirm ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: canConfirm ? '0 4px 16px rgba(45,138,78,0.4)' : 'none',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
            }}
          >
            确认出牌
          </motion.button>
        )}

        {phase === 'select' && isLastRound && (
          <motion.button
            onClick={confirmPlay}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl px-6 py-2.5 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--sunlight), #ff8c00)',
              color: '#1a1a2e',
              boxShadow: '0 4px 16px rgba(255,215,0,0.4)',
            }}
          >
            亮牌！
          </motion.button>
        )}

        {phase === 'result' && !isLastRound && (
          <motion.button
            onClick={nextRound}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl px-6 py-2.5 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--field), var(--field-light))',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(45,138,78,0.4)',
            }}
          >
            下一轮
          </motion.button>
        )}

        {phase === 'result' && isLastRound && (
          <motion.button
            onClick={goToGameOver}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl px-6 py-2.5 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--sunlight), #ff8c00)',
              color: '#1a1a2e',
              boxShadow: '0 4px 16px rgba(255,215,0,0.4)',
            }}
          >
            查看结算
          </motion.button>
        )}

        {phase === 'thinking' && (
          <span className="animate-pulse text-sm text-white/40">对局中...</span>
        )}
      </div>
    </div>
  );
}
