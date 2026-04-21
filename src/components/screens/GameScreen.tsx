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
import StadiumBg from '../fx/StadiumBg';
import GameHints from '../hud/GameHints';
import RoundResultModal from '../fx/RoundResultModal';
import { playSound, playBgm } from '../../hooks/useSound';

function RoundSplash({ round }: { round: number }) {
  const color = STEP_COLORS[round] ?? '#f0ca50';
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 决胜轮（round===4，倍率 ×16）单独换一段更厚重的 BGM；其余轮次保持原 splash 短音
    if (round === 4) {
      playBgm('decisive');
    } else {
      playSound('splash');
    }
    const el = containerRef.current;
    if (!el) return;

    const tl = gsap.timeline();
    const bg = el.querySelector('.sp-bg') as HTMLElement;
    const glow = el.querySelector('.sp-glow') as HTMLElement;
    const rays = el.querySelector('.sp-rays') as HTMLElement;
    const ring = el.querySelector('.sp-ring') as HTMLElement;
    const num = el.querySelector('.sp-num') as HTMLElement;
    const label = el.querySelector('.sp-label') as HTMLElement;
    const mult = el.querySelector('.sp-mult') as HTMLElement;
    const line1 = el.querySelector('.sp-line-l') as HTMLElement;
    const line2 = el.querySelector('.sp-line-r') as HTMLElement;

    tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' })
      .fromTo(glow, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, 0.05)
      .fromTo(rays, { opacity: 0, rotation: -30 }, { opacity: 1, rotation: 0, duration: 0.8, ease: 'power2.out' }, 0.1)
      .fromTo(ring,
        { scale: 0.2, opacity: 0, borderWidth: '6px' },
        { scale: 1.8, opacity: 0, borderWidth: '1px', duration: 0.7, ease: 'power2.out' },
        0.15,
      )
      .fromTo(num,
        { scale: 3, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' },
        0.12,
      )
      .fromTo(label,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
        0.35,
      )
      .fromTo([line1, line2],
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.35, ease: 'power2.out' },
        0.4,
      )
      .fromTo(mult,
        { y: 20, opacity: 0, scale: 0.7 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2.5)' },
        0.5,
      )
      .to(num, { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0.65)
      .to(
        [bg, glow, rays, num, label, mult, line1, line2],
        { opacity: 0, y: '-=12', duration: 0.35, ease: 'power2.in' },
        1.2,
      );

    return () => { tl.kill(); };
  }, [round]);

  const roundTitle = round === 4 ? '决胜轮' : `第${ROUND_CN[round]}轮`;
  const displayChar = round === 4 ? '决' : ROUND_CN[round];

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="sp-bg absolute inset-0"
        style={{ background: 'rgba(4,14,8,0.96)' }}
      />

      {/* Color glow behind center */}
      <div
        className="sp-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}30 0%, ${color}08 40%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
      />

      {/* Rotating rays — CSS conic gradient */}
      <div
        className="sp-rays absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, transparent 0deg, ${color}12 10deg, transparent 20deg, transparent 30deg, ${color}08 40deg, transparent 50deg, transparent 60deg, ${color}12 70deg, transparent 80deg, transparent 90deg, ${color}08 100deg, transparent 110deg, transparent 120deg, ${color}12 130deg, transparent 140deg, transparent 150deg, ${color}08 160deg, transparent 170deg, transparent 180deg, ${color}12 190deg, transparent 200deg, transparent 210deg, ${color}08 220deg, transparent 230deg, transparent 240deg, ${color}12 250deg, transparent 260deg, transparent 270deg, ${color}08 280deg, transparent 290deg, transparent 300deg, ${color}12 310deg, transparent 320deg, transparent 330deg, ${color}08 340deg, transparent 350deg, transparent 360deg)`,
          mask: 'radial-gradient(circle, transparent 15%, black 30%, black 80%, transparent 100%)',
          WebkitMask: 'radial-gradient(circle, transparent 15%, black 30%, black 80%, transparent 100%)',
        }}
      />

      {/* Expanding ring pulse */}
      <div
        className="sp-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 120,
          height: 120,
          border: `3px solid ${color}`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Big round number */}
        <div
          className="sp-num font-black leading-none"
          style={{
            fontSize: 'clamp(80px, 22vw, 120px)',
            color,
            textShadow: `0 0 40px ${color}60, 0 0 80px ${color}20, 0 4px 12px rgba(0,0,0,0.5)`,
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          {displayChar}
        </div>

        {/* Title with decorative lines */}
        <div className="mt-1 flex items-center gap-3">
          <div
            className="sp-line-l h-px w-12"
            style={{
              background: `linear-gradient(90deg, transparent, ${color}80)`,
              transformOrigin: 'right center',
            }}
          />
          <div
            className="sp-label text-lg font-bold tracking-[0.25em]"
            style={{
              color: '#f2ede4',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
              fontFamily: "'Noto Serif SC', serif",
            }}
          >
            {roundTitle}
          </div>
          <div
            className="sp-line-r h-px w-12"
            style={{
              background: `linear-gradient(270deg, transparent, ${color}80)`,
              transformOrigin: 'left center',
            }}
          />
        </div>

        {/* Multiplier badge */}
        <div
          className="sp-mult mt-5 rounded-lg px-6 py-2 text-2xl font-black"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: '#0a1610',
            boxShadow: `0 4px 20px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            letterSpacing: '0.05em',
          }}
        >
          ×{MULTS[round]}
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
      className="fixed left-1/2 top-4 z-[100] -translate-x-1/2 rounded-xl px-4 py-2 text-sm text-white/90"
      style={{
        background: 'rgba(18,16,14,0.95)',
        border: '1px solid rgba(201,168,76,0.1)',
      }}
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
  const showRoundModal = useGameStore((s) => s.showRoundModal);
  const nextRound = useGameStore((s) => s.nextRound);
  const goToGameOver = useGameStore((s) => s.goToGameOver);
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
    const timer = setTimeout(autoAdvanceFromSplash, 1800);
    return () => clearTimeout(timer);
  }, [phase, autoAdvanceFromSplash]);

  const handleFlipRevealComplete = useCallback(() => {
    // 第四轮确认出牌后触发 FlipReveal，翻完暗牌继续结算。
    useGameStore.getState().resolveAfterFlip();
  }, []);

  const humanResult =
    phase === 'result' && game.lastResults
      ? game.lastResults.find((r) => r.pi === 0)
      : undefined;

  const showWin = humanResult && humanResult.delta > 0;
  const showLose = humanResult && humanResult.delta < 0;
  const isBigWin = showWin && round >= 2 && humanResult.rank === 1;

  // GSAP screen shake for win/lose + 同步播放胜负音效
  useEffect(() => {
    if (!gameContainerRef.current) return;
    if (showWin || showLose) {
      playSound(showWin ? 'win' : 'lose');
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
      className={`relative flex min-h-dvh flex-col ${isMobile ? 'pb-[140px]' : ''}`}
    >
      <StadiumBg />
      <LandscapeToast />
      <GameHints phase={phase} round={round} />

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
      <div className="flex flex-1 items-center justify-center overflow-visible px-0 py-0">
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

      {/* Bottom area — glass container for hand + controls */}
      <div
        className={`shrink-0 overflow-visible ${isMobile ? 'fixed inset-x-0 bottom-0 z-40 pt-6 pb-[env(safe-area-inset-bottom)]' : ''}`}
        style={{
          background: isMobile
            ? 'linear-gradient(to top, rgba(6,18,12,0.98) 0%, rgba(8,22,14,0.94) 60%, rgba(10,26,16,0.55) 85%, transparent 100%)'
            : undefined,
        }}
      >
        {phase !== 'round-splash' && phase !== 'flip-reveal' && (
          <>
            <CardHand game={game} />
            <HandPreview game={game} />
            <ActionBar game={game} />
          </>
        )}
      </div>

      {/* 每手结算弹窗 */}
      <RoundResultModal
        open={showRoundModal && phase === 'result'}
        game={game}
        onContinue={isLastRound ? goToGameOver : nextRound}
      />
    </div>
  );
}
