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

  const newCardIds = new Set(game.newCards.map((c) => c.id));

  return (
    <div className="scrollbar-hide flex justify-center gap-1.5 overflow-x-auto px-2 py-1">
      <AnimatePresence mode="popLayout">
        {human.hand.map((card, i) => {
          const selected = game.selectedIndices.includes(i);
          const isPlayed = playedIds.has(card.id);
          const dimmed = isResult && !isPlayed && humanResult != null;
          const isNew = newCardIds.has(card.id);

          return (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: -100, scale: 0.5, rotate: -6 }}
              animate={{
                opacity: dimmed ? 0.35 : 1,
                scale: 1,
                y: 0,
                rotate: 0,
              }}
              exit={{ opacity: 0, scale: 0.5, y: -200 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: i * 0.1,
              }}
            >
              <PlayingCard
                card={card}
                size="md"
                selectable={selectable}
                selected={selected || (isLastRound && game.phase === 'select')}
                disabled={!selectable}
                isNew={isNew && game.phase === 'select'}
                onClick={() => toggleCard(i)}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
