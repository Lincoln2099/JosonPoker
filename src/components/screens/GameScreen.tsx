import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useResponsive } from '../../hooks/useResponsive';
import { MULTS, ROUND_CN, STEP_COLORS } from '../../game/Card';

import PokerTable from '../table/PokerTable';
import SeatRing from '../table/SeatRing';
import CommunityCards from '../table/CommunityCards';
import CardHand from '../cards/CardHand';
import TopBar from '../hud/TopBar';
import MultiplierBar from '../hud/MultiplierBar';
import ActionBar from '../hud/ActionBar';
import HandPreview from '../hud/HandPreview';
import WinCelebration from '../fx/WinCelebration';
import LoseEffect from '../fx/LoseEffect';
import FlipReveal from '../fx/FlipReveal';
import { dealNewCards } from '../../game/GameEngine';

function RoundSplash({ round }: { round: number }) {
  const color = STEP_COLORS[round] ?? '#fff';
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(15,25,35,0.88)',
        backdropFilter: 'blur(6px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ scale: 1.3, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.span
          className="text-5xl font-black tracking-wider"
          style={{ color }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 18 }}
        >
          第{ROUND_CN[round]}轮
        </motion.span>

        <motion.span
          className="text-3xl font-bold text-white/70"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
        >
          ×{MULTS[round]}
        </motion.span>

        <div className="relative mt-4 h-1 w-[120px] overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: color,
              animation: 'loading-fill 1.2s ease-out forwards',
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

function LandscapeToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('landscape-dismissed')) return;
    const check = () => {
      if (window.innerHeight > window.innerWidth && window.innerWidth < 640) {
        setShow(true);
        sessionStorage.setItem('landscape-dismissed', '1');
        setTimeout(() => setShow(false), 3000);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!show) return null;
  return (
    <motion.div
      className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-xl bg-black/80 px-4 py-2 text-sm text-white/90 backdrop-blur"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      横屏体验更佳 🔄
    </motion.div>
  );
}

export default function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const setPhase = useGameStore((s) => s.setPhase);
  const confirmPlay = useGameStore((s) => s.confirmPlay);
  const bp = useResponsive();
  const isMobile = bp === 'mobile';

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

  const handleFlipRevealComplete = useCallback(() => {
    const g = useGameStore.getState().game;
    if (!g) return;

    const dealt = dealNewCards(g);
    const nextRound = dealt.round + 1;

    if (nextRound > 4) {
      useGameStore.setState({ screen: 'gameover', game: { ...dealt, round: nextRound } });
      return;
    }

    useGameStore.setState({
      game: {
        ...dealt,
        round: nextRound,
        phase: 'dealing',
        selectedIndices: [],
      },
    });

    setTimeout(() => {
      useGameStore.setState((s) => {
        if (!s.game) return s;
        return { game: { ...s.game, phase: 'round-splash' } };
      });
    }, 800);
  }, []);

  const humanResult =
    phase === 'result' && game.lastResults
      ? game.lastResults.find((r) => r.pi === 0)
      : undefined;

  const showWin = humanResult && humanResult.delta > 0;
  const showLose = humanResult && humanResult.delta < 0;
  const isBigWin = showWin && round >= 2 && humanResult.rank === 1;

  return (
    <div className={`flex min-h-dvh flex-col ${isMobile ? 'pb-[160px]' : ''}`}>
      <LandscapeToast />

      {/* Splash overlay */}
      <AnimatePresence>
        {phase === 'round-splash' && <RoundSplash round={round} />}
      </AnimatePresence>

      {/* Flip reveal overlay (round 3→4) */}
      <AnimatePresence>
        {phase === 'flip-reveal' && game.comm[3] && (
          <FlipReveal card={game.comm[3]} onComplete={handleFlipRevealComplete} />
        )}
      </AnimatePresence>

      {/* Win/Lose effects */}
      <AnimatePresence>
        {showWin && (
          <motion.div key="win" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <WinCelebration delta={humanResult.delta} isBigWin={isBigWin} />
          </motion.div>
        )}
        {showLose && (
          <motion.div key="lose" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <LoseEffect delta={humanResult.delta} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top HUD */}
      <TopBar round={round} loserRank={game.loserRank} np={game.np} />
      <MultiplierBar currentRound={round} />

      {/* Table area */}
      <div className="flex flex-1 items-center justify-center px-3 py-2">
        <PokerTable>
          <div className="relative h-full w-full">
            <SeatRing game={game} />

            {!isLastRound && phase !== 'round-splash' && phase !== 'flip-reveal' && (
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

      {/* Bottom area — fixed on mobile */}
      <div
        className={`shrink-0 ${isMobile ? 'fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[var(--bg-deep)] via-[var(--bg-deep)]/95 to-transparent pt-3 pb-[env(safe-area-inset-bottom)]' : ''}`}
      >
        {phase !== 'round-splash' && phase !== 'flip-reveal' && (
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
