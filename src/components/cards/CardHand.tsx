import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import PlayingCard from './PlayingCard';
import type { GameState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';

interface CardHandProps {
  game: GameState;
}

export default function CardHand({ game }: CardHandProps) {
  const toggleCard = useGameStore((s) => s.toggleCardSelection);
  const human = game.players[0]!;
  const isLastRound = game.round === 4;
  const selectable = game.phase === 'select' && !isLastRound;
  const isResult = game.phase === 'result';

  const humanResult: RoundResult | undefined =
    isResult && game.lastResults
      ? game.lastResults.find((r) => r.pi === 0)
      : undefined;

  const playedIds = humanResult
    ? new Set(humanResult.played.map((c) => c.id))
    : new Set<string>();

  return (
    <div className="scrollbar-hide flex justify-center gap-1.5 overflow-x-auto px-2 py-1">
      <AnimatePresence mode="popLayout">
        {human.hand.map((card, i) => {
          const selected = game.selectedIndices.includes(i);
          const isPlayed = playedIds.has(card.id);
          const dimmed = isResult && !isPlayed && humanResult != null;

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{
                opacity: dimmed ? 0.35 : 1,
                scale: 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.6, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <PlayingCard
                card={card}
                size="md"
                selectable={selectable}
                selected={selected || (isLastRound && game.phase === 'select')}
                disabled={!selectable}
                onClick={() => toggleCard(i)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
