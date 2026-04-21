import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { GameState } from '../../game/GameEngine';
import { useGameStore } from '../../store/useGameStore';
import CharacterAvatar from '../avatar/CharacterAvatar';
import { playSound } from '../../hooks/useSound';

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
    display > 0
      ? 'var(--win)'
      : display < 0
        ? 'var(--lose)'
        : 'var(--text-muted)';

  return (
    <motion.span
      className="text-[11px] font-bold leading-tight"
      style={{ color: scoreColor }}
      key={value}
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.25 }}
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

  const { phase, round, selectedIndices } = game;
  const isLastRound = round === 4;
  const human = game.players[0]!;
  const canConfirm = phase === 'select' && selectedIndices.length === 2;

  const humanMood =
    phase === 'thinking'
      ? 'think'
      : phase === 'result' && game.lastResults
        ? (game.lastResults.find((r) => r.pi === 0)?.delta ?? 0) > 0
          ? 'win'
          : (game.lastResults.find((r) => r.pi === 0)?.delta ?? 0) < 0
            ? 'lose'
            : 'neutral'
        : 'neutral';

  return (
    <div className="flex items-center justify-between px-4 py-2">
      {/* Player info */}
      <div className="flex items-center gap-2.5">
        <CharacterAvatar
          charIdx={human.charIdx}
          mood={humanMood}
          size={40}
          ringColor="var(--accent)"
          ringWidth={2}
          fallbackEmoji={human.emoji}
        />

        <div className="flex flex-col">
          <span className="text-[13px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
            {human.name}
          </span>
          <AnimatedScore value={human.score} />
        </div>
      </div>

      {/* Action button */}
      <div>
        {phase === 'select' && !isLastRound && (
          <motion.button
            onClick={() => {
              if (canConfirm) playSound('confirm');
              confirmPlay();
            }}
            disabled={!canConfirm}
            className="rounded-lg px-6 py-2.5 text-[14px] font-bold"
            style={{
              border: 'none',
              background: canConfirm
                ? 'linear-gradient(135deg, var(--field), var(--field-light))'
                : 'var(--surface-el)',
              color: canConfirm ? '#fff' : 'var(--text-muted)',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              boxShadow: canConfirm ? '0 2px 12px rgba(45,138,78,0.25)' : 'none',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={canConfirm ? { scale: 1.06, boxShadow: '0 4px 20px rgba(45,138,78,0.4)' } : {}}
            whileTap={canConfirm ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            确认出牌
          </motion.button>
        )}

        {phase === 'select' && isLastRound && (
          <motion.button
            onClick={() => {
              playSound('confirm');
              confirmPlay();
            }}
            className="rounded-lg px-6 py-2.5 text-[14px] font-bold"
            style={{
              border: 'none',
              cursor: 'pointer',
              background: 'var(--accent)',
              color: '#111',
              boxShadow: '0 2px 12px rgba(201,168,76,0.25)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.06, boxShadow: '0 4px 20px rgba(201,168,76,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            亮牌
          </motion.button>
        )}

        {phase === 'result' && (
          <motion.div
            className="rounded-lg px-4 py-2 text-[12px]"
            style={{
              background: 'var(--surface-el)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--text-muted)',
            }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            正在结算…
          </motion.div>
        )}

        {(phase === 'thinking' || phase === 'dealing') && (
          <motion.div
            className="flex items-center gap-1.5 rounded-lg px-4 py-2"
            style={{ background: 'var(--surface-el)', border: '1px solid rgba(255,255,255,0.04)' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {phase === 'dealing' ? '发牌中' : '对局中'}
            </span>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block h-1 w-1 rounded-full"
                style={{ background: 'var(--text-muted)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
