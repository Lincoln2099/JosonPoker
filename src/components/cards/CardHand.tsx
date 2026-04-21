import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import { useResponsive } from '../../hooks/useResponsive';
import PlayingCard from './PlayingCard';
import type { GameState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';
import { playSound } from '../../hooks/useSound';

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

  useEffect(() => {
    if (game.phase !== 'dealing' && game.phase !== 'select') return;
    const container = containerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const cards = container.querySelectorAll<HTMLElement>('[data-card-slot]');
      if (cards.length === 0) return;
      const count = cards.length;
      const mid = (count - 1) / 2;

      cards.forEach((card, i) => {
        const offsetFromCenter = i - mid;
        // 错峰播放发牌音效，每张牌一个 deal
        setTimeout(() => playSound('deal'), i * 80);
        gsap.fromTo(
          card,
          {
            y: -260,
            x: 0,
            rotation: 0,
            scale: 0.4,
            opacity: 0,
          },
          {
            y: 0,
            x: 0,
            rotation: offsetFromCenter * 2,
            scale: 1,
            opacity: 1,
            duration: 0.6,
            delay: i * 0.08,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        );
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.round]);

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide flex justify-center gap-1.5 overflow-visible px-2 pt-2 pb-1"
    >
      {human.hand.map((card, i) => {
        const selected = game.selectedIndices.includes(i);
        const isPlayed = playedIds.has(card.id);
        const dimmed = isResult && !isPlayed && humanResult != null;
        const isNew = newCardIds.has(card.id);

        return (
          <div
            key={card.id}
            data-card-slot={i}
            style={{
              opacity: dimmed ? 0.35 : 1,
              transition: 'opacity 0.3s ease',
              padding: 4,
            }}
          >
            <PlayingCard
              card={card}
              size={cardSize}
              selectable={selectable}
              selected={selected || (isLastRound && game.phase === 'select')}
              disabled={!selectable}
              isNew={isNew && game.phase === 'select'}
              onClick={() => {
                if (selectable) {
                  playSound(selected ? 'deselect' : 'select');
                }
                toggleCard(i);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
