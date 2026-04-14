import { motion } from 'framer-motion';
import PlayingCard from '../cards/PlayingCard';
import type { GameState } from '../../game/GameEngine';

const LABELS = ['底牌1', '底牌2', '底牌3', '底牌4'];

interface CommunityCardsProps {
  game: GameState;
}

export default function CommunityCards({ game }: CommunityCardsProps) {
  const { comm, round, phase } = game;

  return (
    <div className="flex items-end justify-center gap-2">
      {comm.map((card, i) => {
        const isCurrent = i === round;
        const isFuture = i > round;
        const isLastCard = i === 3;
        const revealHidden =
          isLastCard && round === 3 && phase === 'result';

        const faceDown = isFuture && !revealHidden;
        const highlight = isCurrent;
        const dimmed = !isCurrent && !isFuture;

        return (
          <motion.div
            key={card.id}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{
              opacity: dimmed ? 0.5 : 1,
              y: 0,
              scale: highlight ? 1.08 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.05 }}
          >
            <span className="text-[9px] font-medium text-white/50">
              {LABELS[i]}
            </span>
            <div className="relative">
              <PlayingCard
                card={card}
                faceDown={faceDown}
                size="sm"
                isCommunity
              />
              {highlight && (
                <div
                  className="pointer-events-none absolute -inset-1 rounded-lg"
                  style={{
                    border: '2px solid var(--gold)',
                    animation: 'glow-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
