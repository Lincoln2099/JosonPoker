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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="flex items-center justify-center gap-2 py-1"
      >
        <span
          className="rounded-full px-3 py-0.5 text-sm font-bold"
          style={{
            background: 'rgba(255,183,197,0.15)',
            color: 'var(--sakura)',
            border: '1px solid rgba(255,183,197,0.3)',
          }}
        >
          {ev.name}
        </span>
        {ev.hasJoker && (
          <span className="text-xs text-[var(--gold)]">含王牌</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
