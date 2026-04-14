import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    const tl = gsap.timeline();
    const title = content.querySelector('.splash-title');
    const mult = content.querySelector('.splash-mult');
    const bar = content.querySelector('.splash-bar-inner');
    const streaks = content.querySelectorAll('.splash-streak');

    tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 })
      .fromTo(
        title,
        { y: -60, opacity: 0, scale: 0.6, rotateX: 40 },
        { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.6, ease: 'back.out(2)' },
        0.1,
      )
      .fromTo(
        mult,
        { scale: 0.2, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)' },
        0.3,
      )
      .fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, duration: 1, ease: 'power2.out', transformOrigin: 'left center' },
        0.4,
      )
      .fromTo(
        streaks,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1, opacity: 0.6, duration: 0.4, stagger: 0.08,
          ease: 'power2.out',
        },
        0.2,
      );

    return () => { tl.kill(); };
  }, [round]);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(15,25,35,0.9)',
        backdropFilter: 'blur(8px)',
        perspective: '800px',
        opacity: 0,
      }}
    >
      <div ref={contentRef} className="flex flex-col items-center gap-3">
        {/* Energy streaks */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="splash-streak absolute"
            style={{
              width: `${60 + i * 20}%`,
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
              top: `${40 + (i - 2) * 8}%`,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          />
        ))}

        <span
          className="splash-title text-5xl font-black tracking-wider"
          style={{ color, textShadow: `0 0 30px ${color}60` }}
        >
          第{ROUND_CN[round]}轮
        </span>

        <span
          className="splash-mult text-3xl font-bold text-white/70"
          style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}
        >
          ×{MULTS[round]}
        </span>

        <div className="relative mt-4 h-1.5 w-[140px] overflow-hidden rounded-full bg-white/10">
          <div
            className="splash-bar-inner absolute inset-0 rounded-full"
            style={{ background: color, transformOrigin: 'left center', transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </div>
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
      横屏体验更佳
    </motion.div>
  );
}

export default function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const setPhase = useGameStore((s) => s.setPhase);
  const confirmPlay = useGameStore((s) => s.confirmPlay);
  const bp = useResponsive();
  const isMobile = bp === 'mobile';
  const gameContainerRef = useRef<HTMLDivElement>(null);

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

  // GSAP screen shake for win/lose
  useEffect(() => {
    if (!gameContainerRef.current) return;
    if (showWin || showLose) {
      const intensity = showWin && isBigWin ? 6 : 3;
      gsap.to(gameContainerRef.current, {
        x: intensity,
        duration: 0.05,
        yoyo: true,
        repeat: 7,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(gameContainerRef.current, { x: 0 });
        },
      });
    }
  }, [showWin, showLose, isBigWin]);

  return (
    <div
      ref={gameContainerRef}
      className={`flex min-h-dvh flex-col ${isMobile ? 'pb-[160px]' : ''}`}
    >
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
          <div className="relative h-full w-full overflow-visible">
            <SeatRing game={game} />

            {!isLastRound && phase !== 'round-splash' && phase !== 'flip-reveal' && (
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
                <CommunityCards game={game} />
              </div>
            )}

            {isLastRound && phase !== 'round-splash' && (
              <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
                <span className="text-sm font-bold text-white/40">决胜轮</span>
              </div>
            )}
          </div>
        </PokerTable>
      </div>

      {/* Bottom area — overflow-visible for selected card lift */}
      <div
        className={`shrink-0 overflow-visible ${isMobile ? 'fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[var(--bg-deep)] via-[var(--bg-deep)]/95 to-transparent pt-3 pb-[env(safe-area-inset-bottom)]' : ''}`}
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
