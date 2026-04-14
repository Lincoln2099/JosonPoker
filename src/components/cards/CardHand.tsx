import { useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import { useResponsive } from '../../hooks/useResponsive';
import PlayingCard from './PlayingCard';
import type { GameState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';

const SIZE_MAP = { mobile: 'sm', tablet: 'md', desktop: 'lg' } as const;

interface CardHandProps {
  game: GameState;
}

export default function CardHand({ game }: CardHandProps) {
  const toggleCard = useGameStore((s) => s.toggleCardSelection);
  const bp = useResponsive();
  const cardSize = SIZE_MAP[bp];
  const human = game.players[0]!;
  const isLastRound = game.round === 4;
  const selectable = game.phase === 'select' && !isLastRound;
  const isResult = game.phase === 'result';

  const containerRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef(game.phase);
  const prevSelectedRef = useRef<number[]>([]);

  const humanResult: RoundResult | undefined =
    isResult && game.lastResults
      ? game.lastResults.find((r) => r.pi === 0)
      : undefined;

  const playedIds = humanResult
    ? new Set(humanResult.played.map((c) => c.id))
    : new Set<string>();

  const newCardIds = new Set(game.newCards.map((c) => c.id));

  // Card play fly-out animation
  const flyOutCards = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const selectedIndices = prevSelectedRef.current;
    const cards = container.querySelectorAll<HTMLElement>('[data-card-slot]');
    const tl = gsap.timeline();

    cards.forEach((card) => {
      const idx = Number(card.dataset.cardSlot);
      if (selectedIndices.includes(idx)) {
        tl.to(
          card,
          {
            y: -280,
            scale: 0.35,
            opacity: 0,
            rotation: (Math.random() - 0.5) * 20,
            duration: 0.55,
            ease: 'power3.in',
          },
          0,
        );
      }
    });
  }, []);

  useEffect(() => {
    const wasSelect = prevPhaseRef.current === 'select';
    const nowThinking = game.phase === 'thinking';
    if (wasSelect && nowThinking) {
      flyOutCards();
    }
    prevPhaseRef.current = game.phase;
    prevSelectedRef.current = [...game.selectedIndices];
  }, [game.phase, game.selectedIndices, flyOutCards]);

  // GSAP stagger deal animation
  useEffect(() => {
    if (game.phase !== 'dealing' && game.phase !== 'select') return;
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const cards = container.querySelectorAll<HTMLElement>('[data-card-slot]');
      if (cards.length === 0) return;
      gsap.from(cards, {
        y: -180,
        rotation: -12,
        scale: 0.3,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.7)',
        clearProps: 'transform,opacity',
      });
    });
  // Only on mount / dealing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.round]);

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide flex justify-center gap-1.5 overflow-x-auto overflow-y-visible px-2 pt-6 pb-1"
    >
      <AnimatePresence mode="popLayout">
        {human.hand.map((card, i) => {
          const selected = game.selectedIndices.includes(i);
          const isPlayed = playedIds.has(card.id);
          const dimmed = isResult && !isPlayed && humanResult != null;
          const isNew = newCardIds.has(card.id);

          return (
            <motion.div
              key={card.id}
              data-card-slot={i}
              layout
              initial={{ opacity: 0, y: -60, scale: 0.7 }}
              animate={{
                opacity: dimmed ? 0.35 : 1,
                scale: 1,
                y: 0,
              }}
              exit={{ opacity: 0, scale: 0.4, y: -200, transition: { duration: 0.4 } }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 22,
                delay: i * 0.08,
              }}
              className="p-1"
            >
              <PlayingCard
                card={card}
                size={cardSize}
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
