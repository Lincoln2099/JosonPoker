import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../game/GameEngine';
import { useGameStore } from '../../store/useGameStore';

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const diff = value - start;
    const steps = 20;
    let step = 0;

    const id = setInterval(() => {
      step++;
      setDisplay(Math.round(start + (diff * step) / steps));
      if (step >= steps) {
        clearInterval(id);
        setDisplay(value);
      }
    }, 25);

    prev.current = value;
    return () => clearInterval(id);
  }, [value]);

  const scoreColor =
    display > 0 ? 'text-[var(--win)]' : display < 0 ? 'text-[var(--lose)]' : 'text-white/60';

  return (
    <motion.span
      className={`text-xs font-semibold leading-tight ${scoreColor}`}
      key={value}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3 }}
    >
      {display > 0 ? '+' : ''}{display}
    </motion.span>
  );
}

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
          <AnimatedScore value={human.score} />
        </div>
      </div>

      {/* Action button */}
      <div>
        {phase === 'select' && !isLastRound && (
          <motion.button
            onClick={confirmPlay}
            disabled={!canConfirm}
            whileHover={canConfirm ? { scale: 1.03 } : {}}
            whileTap={canConfirm ? { scale: 0.97 } : {}}
            className="min-h-[44px] min-w-[44px] rounded-xl px-6 py-2.5 text-base font-bold transition-all"
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="min-h-[44px] min-w-[44px] rounded-xl px-6 py-2.5 text-base font-bold"
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="min-h-[44px] min-w-[44px] rounded-xl px-6 py-2.5 text-base font-bold"
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
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="min-h-[44px] min-w-[44px] rounded-xl px-6 py-2.5 text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--sunlight), #ff8c00)',
              color: '#1a1a2e',
              boxShadow: '0 4px 16px rgba(255,215,0,0.4)',
            }}
          >
            查看结算
          </motion.button>
        )}

        {(phase === 'thinking' || phase === 'dealing') && (
          <span className="animate-pulse text-sm text-white/40">
            {phase === 'dealing' ? '发牌中...' : '对局中...'}
          </span>
        )}
      </div>
    </div>
  );
}
