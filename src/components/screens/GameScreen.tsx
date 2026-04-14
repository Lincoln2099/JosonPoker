import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { MULTS, ROUND_CN, STEP_COLORS } from '../../game/Card';

import PokerTable from '../table/PokerTable';
import SeatRing from '../table/SeatRing';
import CommunityCards from '../table/CommunityCards';
import CardHand from '../cards/CardHand';
import TopBar from '../hud/TopBar';
import MultiplierBar from '../hud/MultiplierBar';
import ActionBar from '../hud/ActionBar';
import HandPreview from '../hud/HandPreview';

function RoundSplash({ round }: { round: number }) {
  const color = STEP_COLORS[round] ?? '#fff';
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,25,35,0.85)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.3, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="text-5xl font-black tracking-wider" style={{ color }}>
          第{ROUND_CN[round]}轮
        </span>
        <span className="text-3xl font-bold text-white/70">×{MULTS[round]}</span>
        <motion.div
          className="mt-4 h-1 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const setPhase = useGameStore((s) => s.setPhase);
  const confirmPlay = useGameStore((s) => s.confirmPlay);

  const { round, phase } = game;
  const isLastRound = round === 4;

  const autoAdvanceFromSplash = useCallback(() => {
    if (isLastRound) {
      confirmPlay();
    } else {
      setPhase('select');
    }
  }, [isLastRound, setPhase, confirmPlay]);

  useEffect(() => {
    if (phase !== 'round-splash') return;
    const timer = setTimeout(autoAdvanceFromSplash, 1500);
    return () => clearTimeout(timer);
  }, [phase, autoAdvanceFromSplash]);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Splash overlay */}
      <AnimatePresence>
        {phase === 'round-splash' && <RoundSplash round={round} />}
      </AnimatePresence>

      {/* Top HUD */}
      <TopBar round={round} loserRank={game.loserRank} np={game.np} />
      <MultiplierBar currentRound={round} />

      {/* Table area */}
      <div className="flex flex-1 items-center justify-center px-3 py-2">
        <PokerTable>
          <div className="relative h-full w-full">
            <SeatRing game={game} />

            {/* Community cards at center */}
            {!isLastRound && phase !== 'round-splash' && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <CommunityCards game={game} />
              </div>
            )}

            {isLastRound && phase !== 'round-splash' && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="text-sm font-bold text-white/40">决胜轮</span>
              </div>
            )}
          </div>
        </PokerTable>
      </div>

      {/* Bottom area */}
      <div className="shrink-0">
        {phase !== 'round-splash' && (
          <>
            <CardHand game={game} />
            <HandPreview game={game} />
            <ActionBar game={game} />
          </>
        )}
      </div>
    </div>
  );
}
