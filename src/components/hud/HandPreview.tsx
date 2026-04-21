import { motion, AnimatePresence } from 'framer-motion';
import { evalHand } from '../../game/evaluate';
import type { GameState } from '../../game/GameEngine';

interface HandPreviewProps {
  game: GameState;
}

export default function HandPreview({ game }: HandPreviewProps) {
  const { selectedIndices, round, phase, players, comm } = game;
  const human = players[0]!;
  const isLastRound = round === 4;

  const showPreview =
    phase === 'select' &&
    !isLastRound &&
    selectedIndices.length === 2;

  if (!showPreview) return null;

  const selectedCards = selectedIndices.map((i) => human.hand[i]!);
  const cc = comm[round]!;
  const combo = [...selectedCards, cc];
  const ev = evalHand(combo);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center gap-2 py-1"
      >
        <span
          className="inline-flex items-center rounded-md px-3.5 py-1 text-[13px] font-bold"
          style={{
            background: 'var(--surface-el)',
            color: 'var(--accent-bright)',
            border: '1px solid rgba(240,202,80,0.2)',
          }}
        >
          {ev.name}
        </span>

        {ev.hasJoker && (
          <span
            className="text-[11px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            含王牌
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
