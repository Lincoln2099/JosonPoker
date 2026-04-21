import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GamePhase } from '../../game/GameEngine';

const STORAGE_KEY = 'joson-poker-hints-seen';

interface Hint {
  id: string;
  phase: GamePhase;
  round?: number;
  text: string;
  icon: string;
}

const HINTS: Hint[] = [
  {
    id: 'select-intro',
    phase: 'select',
    round: 0,
    text: '从手牌中选择2张，搭配上方的底牌组成3张牌型。牌型越大，排名越高！',
    icon: '👆',
  },
  {
    id: 'select-strategy',
    phase: 'select',
    round: 1,
    text: '倍率翻倍了！后面倍率更高——好牌可以留到后面再出，收益更大。',
    icon: '💡',
  },
  {
    id: 'result-explain',
    phase: 'result',
    round: 0,
    text: '只有"输家名次"的玩家输钱，其他所有人都赢！排名越高赢越多。',
    icon: '📊',
  },
  {
    id: 'dealing-hint',
    phase: 'dealing',
    round: 1,
    text: '每轮出完牌后补2张新牌。注意规划手牌，好牌留给高倍率轮次。',
    icon: '🃏',
  },
];

interface GameHintsProps {
  phase: GamePhase;
  round: number;
}

export default function GameHints({ phase, round }: GameHintsProps) {
  const [activeHint, setActiveHint] = useState<Hint | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const dismiss = useCallback(() => {
    if (!activeHint) return;
    const next = new Set(seenIds);
    next.add(activeHint.id);
    setSeenIds(next);
    setActiveHint(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch { /* noop */ }
  }, [activeHint, seenIds]);

  useEffect(() => {
    const match = HINTS.find(
      (h) =>
        h.phase === phase &&
        (h.round === undefined || h.round === round) &&
        !seenIds.has(h.id),
    );
    if (match) {
      const timer = setTimeout(() => setActiveHint(match), 600);
      return () => clearTimeout(timer);
    } else {
      setActiveHint(null);
    }
  }, [phase, round, seenIds]);

  useEffect(() => {
    if (!activeHint) return;
    const timer = setTimeout(dismiss, 8000);
    return () => clearTimeout(timer);
  }, [activeHint, dismiss]);

  return (
    <AnimatePresence>
      {activeHint && (
        <motion.div
          key={activeHint.id}
          className="fixed left-1/2 top-[120px] z-[90] -translate-x-1/2"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
          <div
            className="flex max-w-[340px] items-start gap-2.5 rounded-2xl px-4 py-3"
            style={{
              background: 'rgba(10,28,18,0.95)',
              border: '1px solid rgba(240,202,80,0.14)',
            }}
          >
            <span className="mt-0.5 text-xl">{activeHint.icon}</span>
            <div className="flex-1">
              <p className="text-xs leading-relaxed" style={{ color: '#f2ede4' }}>
                {activeHint.text}
              </p>
              <button
                type="button"
                onClick={dismiss}
                className="mt-1.5 text-[10px] font-medium text-[#f0ca50]/60 transition-colors hover:text-[#ffd868]/90"
              >
                知道了
              </button>
            </div>
          </div>
          {/* Bottom tail */}
          <div
            className="mx-auto h-2 w-2 rotate-45"
            style={{
              background: 'rgba(10,28,18,0.95)',
              borderRight: '1px solid rgba(240,202,80,0.14)',
              borderBottom: '1px solid rgba(240,202,80,0.14)',
              marginTop: -5,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
