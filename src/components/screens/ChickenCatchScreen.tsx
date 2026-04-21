import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import { playSound, playBgm, stopBgm } from '../../hooks/useSound';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八'];

/** ============================================================
 *  铜雕风格的鸡 + 木质底座
 *  - 完全静止：站立姿态，仅在选中时有缓慢呼吸
 *  - 单色铜质渐变，去掉所有萌系细节（白眼高光/微笑/弹跳）
 *  - 编号刻在底座上而不是脖子挂牌
 *  ============================================================ */
function ChickenFigure({
  number,
  selected,
  caught,
  pickable,
  onPick,
  dimmed,
  flyUp,
}: {
  number: number;
  selected: boolean;
  caught: boolean;
  pickable: boolean;
  onPick: () => void;
  dimmed: boolean;
  flyUp: boolean;
}) {
  // 不同编号轻微差异化色相（保持都是铜调，避免重复）
  const hueShift = ((number - 2) * 7) % 30;

  return (
    <motion.button
      type="button"
      onClick={pickable ? onPick : undefined}
      className="relative inline-block"
      style={{
        width: 88,
        height: 130,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: pickable ? 'pointer' : 'default',
        opacity: dimmed ? 0.28 : 1,
        filter: dimmed ? 'grayscale(0.6) brightness(0.55)' : 'none',
        transition: 'opacity .35s ease, filter .35s ease',
      }}
      animate={
        flyUp
          ? { y: -440, scale: 0.55, rotate: -3, opacity: 0 }
          : caught
            ? { x: [0, -2, 2, -1.5, 0], y: [0, 1, 0], scale: 0.96 } // 被罩住后微微哆嗦
            : selected
              ? { scale: [1, 1.015, 1] }
              : { scale: 1 }
      }
      transition={
        flyUp
          ? { duration: 0.85, delay: 0.05, ease: [0.4, 0, 0.3, 1] }
          : caught
            ? { duration: 0.45, ease: 'easeOut', repeat: 1, repeatType: 'mirror' }
            : selected
              ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
      }
      whileHover={pickable ? { y: -3 } : undefined}
      whileTap={pickable ? { scale: 0.97 } : undefined}
    >
      <svg viewBox="0 0 88 130" width="88" height="130" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`bronze-${number}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={`hsl(${30 + hueShift}, 50%, 58%)`} />
            <stop offset="35%" stopColor={`hsl(${28 + hueShift}, 55%, 42%)`} />
            <stop offset="70%" stopColor={`hsl(${22 + hueShift}, 60%, 28%)`} />
            <stop offset="100%" stopColor={`hsl(${18 + hueShift}, 65%, 18%)`} />
          </linearGradient>
          <linearGradient id={`bronze-rim-${number}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,220,140,0.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id={`base-wood-${number}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a3a1c" />
            <stop offset="100%" stopColor="#2a1a0c" />
          </linearGradient>
          <radialGradient id={`base-top-${number}`} cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#3a2412" />
            <stop offset="100%" stopColor="#1a1008" />
          </radialGradient>
        </defs>

        {/* === 鸡的剪影身体（铜雕） === */}
        <g transform="translate(0 -2)">
          {/* 尾羽（角） */}
          <path
            d="M 14 56 L 4 38 L 12 28 L 22 44 Z"
            fill={`url(#bronze-${number})`}
            stroke="#1a0e04"
            strokeWidth="1.2"
            strokeLinejoin="miter"
          />
          {/* 主体（侧面立姿，更圆胖、更立体的雕像感） */}
          <path
            d="M 18 70
               C 14 56 24 40 40 38
               C 56 36 70 44 72 56
               C 74 70 68 84 56 88
               L 24 88
               C 18 84 18 76 18 70 Z"
            fill={`url(#bronze-${number})`}
            stroke="#1a0e04"
            strokeWidth="1.4"
          />
          {/* 翅膀（贴身，无煽动） */}
          <path
            d="M 28 60 L 50 56 L 56 72 L 32 78 Z"
            fill="rgba(0,0,0,0.32)"
          />
          {/* 头部（偏大、棱角分明） */}
          <ellipse
            cx="60"
            cy="34"
            rx="13"
            ry="14"
            fill={`url(#bronze-${number})`}
            stroke="#1a0e04"
            strokeWidth="1.4"
          />
          {/* 鸡冠（锯齿状，硬朗） */}
          <path
            d="M 50 22 L 54 12 L 58 22 L 62 10 L 66 22 L 70 14 L 72 24 L 64 28 L 54 28 Z"
            fill="#8a2a2a"
            stroke="#1a0e04"
            strokeWidth="1.2"
            strokeLinejoin="miter"
          />
          {/* 喙（朝右直线，金色） */}
          <path
            d="M 73 34 L 84 35 L 73 38 Z"
            fill="#d4a040"
            stroke="#1a0e04"
            strokeWidth="1"
            strokeLinejoin="miter"
          />
          {/* 眼睛（小黑点，无白） */}
          <circle cx="63" cy="33" r="1.5" fill="#0a0604" />
          {/* 高光（铜雕反光） */}
          <path
            d="M 32 44 C 38 40 50 40 56 44"
            stroke="rgba(255,220,150,0.35)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {/* 腿（短粗金属） */}
          <rect x="36" y="86" width="3.5" height="8" fill="#b88838" stroke="#1a0e04" strokeWidth="0.8" />
          <rect x="50" y="86" width="3.5" height="8" fill="#b88838" stroke="#1a0e04" strokeWidth="0.8" />
        </g>

        {/* === 木质底座 === */}
        <g transform="translate(0 96)">
          {/* 底座椭圆（侧面厚度） */}
          <ellipse cx="44" cy="14" rx="34" ry="6" fill={`url(#base-wood-${number})`} stroke="#0a0604" strokeWidth="1.2" />
          {/* 底座顶面 */}
          <ellipse cx="44" cy="6" rx="34" ry="6" fill={`url(#base-top-${number})`} stroke="#3a2412" strokeWidth="1.2" />
          {/* 金边 */}
          <ellipse
            cx="44"
            cy="6"
            rx="33"
            ry="5.5"
            fill="none"
            stroke={selected ? '#ffd868' : '#7a5018'}
            strokeWidth="0.9"
            opacity={selected ? 1 : 0.7}
          />
          {/* 编号雕刻 */}
          <text
            x="44"
            y="9"
            textAnchor="middle"
            fontSize="9"
            fontWeight="900"
            fill={selected ? '#ffd868' : '#a87e34'}
            fontFamily="'Noto Serif SC', serif"
            style={{ letterSpacing: '0.12em' }}
          >
            老 {CN_NUM[number]}
          </text>
        </g>
      </svg>

      {/* 选中时底座金光（不进入鸡身、不萌） */}
      {selected && !caught && !flyUp && (
        <motion.div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 4,
            width: 88,
            height: 18,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(240,202,80,0.6) 0%, rgba(240,202,80,0.18) 50%, transparent 80%)',
          }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}

/** ============================================================
 *  木质鸟笼 SVG —— 取代大手，从天而降扣住小鸡
 *  - 顶部圆弧 + 提钩
 *  - 8 根竖向木条（暗木 + 金属箍）
 *  - 圆形木质底盘
 *  - "落下"是一段直线下降；"拍合"瞬间是 squash + 烟尘 + 震屏
 *  ============================================================ */
function BirdCage({ phase }: { phase: 'hidden' | 'descend' | 'grip' | 'lift' }) {
  // 笼底比鸡稍宽，确保视觉上"罩住"
  const cageW = 110;
  const cageH = 150;

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        bottom: 28,
        marginLeft: -cageW / 2,
        width: cageW,
        height: cageH,
        zIndex: 30,
        transformOrigin: 'center bottom',
      }}
      initial={false}
      animate={
        phase === 'hidden'
          ? { y: -520, opacity: 0, scaleY: 1 }
          : phase === 'descend'
            ? { y: 0, opacity: 1, scaleY: 1 }
            : phase === 'grip'
              ? { y: 0, opacity: 1, scaleY: [1, 0.92, 1] }
              : { y: -440, opacity: 1, scaleY: 1, rotate: -3 }
      }
      transition={
        phase === 'descend'
          ? { duration: 0.55, ease: [0.7, 0, 0.55, 1] } // 加速下落
          : phase === 'grip'
            ? { duration: 0.35, ease: 'easeOut' } // 拍合
            : phase === 'lift'
              ? { duration: 0.85, delay: 0.05, ease: [0.4, 0, 0.3, 1] }
              : { duration: 0.2 }
      }
    >
      <svg viewBox="0 0 110 150" width={cageW} height={cageH} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="cage-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a5028" />
            <stop offset="55%" stopColor="#4a3018" />
            <stop offset="100%" stopColor="#1e1208" />
          </linearGradient>
          <linearGradient id="cage-bar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2a1a0c" />
            <stop offset="35%" stopColor="#7a5028" />
            <stop offset="65%" stopColor="#7a5028" />
            <stop offset="100%" stopColor="#2a1a0c" />
          </linearGradient>
          <linearGradient id="cage-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe88a" />
            <stop offset="55%" stopColor="#f0c040" />
            <stop offset="100%" stopColor="#a87018" />
          </linearGradient>
        </defs>

        {/* 顶部提钩 */}
        <path
          d="M 55 2 L 55 -10 Q 55 -18 47 -18 Q 39 -18 39 -10"
          stroke="url(#cage-gold)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* 顶部圆顶（实心暗木） */}
        <path
          d="M 12 28 Q 55 -10 98 28 L 98 34 L 12 34 Z"
          fill="url(#cage-wood)"
          stroke="#0a0604"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* 圆顶金线装饰 */}
        <path
          d="M 14 30 Q 55 -4 96 30"
          stroke="url(#cage-gold)"
          strokeWidth="1.4"
          fill="none"
          opacity="0.85"
        />

        {/* 顶部金属环 */}
        <rect x="10" y="32" width="90" height="6" rx="2" fill="url(#cage-gold)" stroke="#5a3a18" strokeWidth="0.8" />

        {/* 8 根竖向木条 —— 让中间的鸡能透出来 */}
        {Array.from({ length: 8 }).map((_, i) => {
          const x = 14 + i * (82 / 7);
          return (
            <rect
              key={i}
              x={x - 1.6}
              y={38}
              width={3.2}
              height={88}
              rx="1.2"
              fill="url(#cage-bar)"
              stroke="#0a0604"
              strokeWidth="0.6"
            />
          );
        })}

        {/* 中部金属横箍（增加结构感） */}
        <rect x="10" y="78" width="90" height="3" rx="1" fill="url(#cage-gold)" opacity="0.85" />

        {/* 底部金属环 */}
        <rect x="10" y="124" width="90" height="6" rx="2" fill="url(#cage-gold)" stroke="#5a3a18" strokeWidth="0.8" />

        {/* 底盘（暗木椭圆） */}
        <ellipse cx="55" cy="138" rx="48" ry="9" fill="url(#cage-wood)" stroke="#0a0604" strokeWidth="1.4" />
        <ellipse
          cx="55"
          cy="135"
          rx="46"
          ry="6"
          fill="none"
          stroke="url(#cage-gold)"
          strokeWidth="0.9"
          opacity="0.7"
        />

        {/* 笼内暗光（强化"鸡被罩住"的视觉） */}
        <ellipse cx="55" cy="84" rx="36" ry="42" fill="rgba(0,0,0,0.32)" />
      </svg>

      {/* 笼罩中心的微光（被抓中的鸡处于惊慌中的氛围光） */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: 60,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,120,0.18) 0%, transparent 70%)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  );
}

function DustPuff({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2" style={{ bottom: 10, width: 90, height: 50, zIndex: 4 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: '50%',
                bottom: 0,
                width: 16,
                height: 16,
                background: 'rgba(160,140,110,0.78)',
                filter: 'blur(2px)',
              }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0.95 }}
              animate={{ x: (i - 2) * 26, y: -22 - i * 3, scale: 1.7, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * 选中聚光（金色光柱）
 * - 底层用 linear-gradient（顶部 0 透明 → 中段微亮 → 底部 0）保证「上中下」均无硬边
 * - 用 radial mask-image 把光柱左右也羽化，整体像一束自然落下的灯光
 * - 加 8px blur 让边缘更软
 */
function Spotlight({ targetX, on }: { targetX: number | null; on: boolean }) {
  if (!on || targetX === null) return null;
  return (
    <motion.div
      className="pointer-events-none absolute"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ top: 0, bottom: 0, left: targetX, width: 0 }}
    >
      <div
        className="absolute"
        style={{
          left: -120,
          top: 0,
          width: 240,
          height: '100%',
          background:
            'linear-gradient(180deg, rgba(255,235,170,0) 0%, rgba(255,235,170,0.18) 38%, rgba(255,210,120,0.10) 72%, rgba(255,200,90,0) 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 55% 90% at 50% 55%, #000 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
          maskImage:
            'radial-gradient(ellipse 55% 90% at 50% 55%, #000 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
          filter: 'blur(8px)',
        }}
      />
    </motion.div>
  );
}

/** 主屏 */
type GrabPhase = 'hidden' | 'descend' | 'grip' | 'lift';

export default function ChickenCatchScreen() {
  const pending = useGameStore((s) => s.pending);
  const startGameWithLoser = useGameStore((s) => s.startGameWithLoser);
  const goToMenu = useGameStore((s) => s.goToMenu);

  const np = pending?.np ?? 4;
  const numbers = useMemo(() => Array.from({ length: np - 1 }, (_, i) => i + 2), [np]);

  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [grabPhase, setGrabPhase] = useState<GrabPhase>('hidden');
  const [showDust, setShowDust] = useState(false);
  const [flyUp, setFlyUp] = useState(false);
  const [spotX, setSpotX] = useState<number | null>(null);
  const [shake, setShake] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const chickenRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const el = titleRef.current;
    if (el) {
      gsap.fromTo(
        el,
        { y: -24, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.6)' },
      );
    }
    // 抓鸡屏入场 → 紧张 BGM（6s 一次性，组件卸载时立即停掉）
    playBgm('anticipation');
    return () => {
      stopBgm();
    };
  }, []);

  const handlePick = (n: number) => {
    if (selected !== null || confirmed) return;
    playSound('select');
    setSelected(n);
    requestAnimationFrame(() => {
      const stage = stageRef.current;
      const chicken = chickenRefs.current[n];
      if (!stage || !chicken) return;
      const stageBox = stage.getBoundingClientRect();
      const chBox = chicken.getBoundingClientRect();
      setSpotX(chBox.left + chBox.width / 2 - stageBox.left);
    });
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    playSound('confirm');
    // 0 → 550ms：鸟笼加速下落 + whoosh
    setGrabPhase('descend');
    setTimeout(() => playSound('whoosh'), 80);
    // 550ms：拍合 + 烟尘 + 整个舞台震屏 + thud + cluck
    setTimeout(() => {
      setGrabPhase('grip');
      setShowDust(true);
      setShake(true);
      playSound('thud');
      setTimeout(() => playSound('cluck'), 120);
      setTimeout(() => setShake(false), 380);
    }, 550);
    // 550 + 850 = 1400ms：鸟笼连鸡一起被吊起 + 上提 whoosh
    setTimeout(() => {
      setFlyUp(true);
      setGrabPhase('lift');
      playSound('whoosh');
    }, 1400);
    // 2300ms：进入游戏
    setTimeout(() => {
      startGameWithLoser(selected);
    }, 2300);
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 18%, rgba(240,202,80,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 60%),
          linear-gradient(180deg, #0a1810 0%, #0e2218 45%, #08140d 100%)
        `,
      }}
    >
      {/* 顶部金色光晕 */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '85%',
          height: '40%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,225,140,0.10) 0%, transparent 75%)',
        }}
      />

      {/* 暗角 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 180px 50px rgba(0,0,0,0.65)',
        }}
      />

      {/* 顶栏 */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button
          onClick={() => {
            playSound('back');
            goToMenu();
          }}
          className="rounded-full px-3 py-1.5 text-[12px] font-bold tracking-wider"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(240,202,80,0.22)',
            color: 'rgba(240,225,180,0.85)',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          ← 返回
        </button>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider"
          style={{
            background: 'rgba(0,0,0,0.4)',
            color: '#ffd868',
            border: '1px solid rgba(240,202,80,0.22)',
          }}
        >
          {np} 人局
        </div>
      </div>

      {/* 标题 */}
      <div className="relative z-10 mt-6 flex flex-col items-center px-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(240,202,80,0.5))' }} />
          <span
            className="text-[10px] tracking-[0.4em]"
            style={{ color: 'rgba(240,202,80,0.7)', fontWeight: 500 }}
          >
            ♠ 抓 鸡 ♠
          </span>
          <div className="h-px w-10" style={{ background: 'linear-gradient(270deg, transparent, rgba(240,202,80,0.5))' }} />
        </div>

        <h1
          ref={titleRef}
          className="text-center"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 'clamp(34px, 8vw, 48px)',
            fontWeight: 900,
            color: '#ffd868',
            letterSpacing: '0.08em',
            textShadow: '0 2px 24px rgba(240,202,80,0.35), 0 1px 0 rgba(0,0,0,0.5)',
          }}
        >
          今天抓老几？
        </h1>

        <p className="mt-3 text-center text-[12px]" style={{ color: '#a8a090' }}>
          点击下方一只小鸡 · 中签者即为本局输家
        </p>
      </div>

      {/* 舞台 —— 带轻微震屏 */}
      <div className="relative z-10 mt-auto flex flex-col items-center px-5">
        <motion.div
          ref={stageRef}
          className="relative w-full max-w-[480px] overflow-visible rounded-[24px]"
          style={{
            aspectRatio: '4 / 3',
            background:
              'radial-gradient(ellipse 100% 70% at 50% 35%, #267044 0%, #1d5634 55%, #11381f 100%)',
            border: '6px solid #6b4820',
            boxShadow:
              '0 14px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(240,202,80,0.25), inset 0 0 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,225,140,0.18)',
          }}
          animate={shake ? { x: [0, -6, 6, -4, 4, 0], y: [0, 2, -2, 1, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* 草地横纹 */}
          <div
            className="absolute inset-3 rounded-[18px]"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 18px,
                rgba(255,255,255,0.025) 18px,
                rgba(255,255,255,0.025) 36px
              )`,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />

          {/* 顶部聚光 */}
          <Spotlight targetX={spotX} on={selected !== null && !flyUp} />

          {/* 地面金线 */}
          <div
            className="pointer-events-none absolute inset-x-6"
            style={{
              bottom: 26,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(240,202,80,0.4), transparent)',
            }}
          />

          {/* 鸡群 */}
          <div
            className="absolute inset-x-0 flex items-end justify-center px-4"
            style={{ bottom: 14, gap: numbers.length > 4 ? 2 : 8 }}
          >
            {numbers.map((n) => {
              const isSelected = selected === n;
              const isCaught = isSelected && (grabPhase === 'grip' || grabPhase === 'lift');
              const dimmed = selected !== null && !isSelected;
              return (
                <div
                  key={n}
                  ref={(el) => {
                    chickenRefs.current[n] = el;
                  }}
                  className="relative"
                >
                  <ChickenFigure
                    number={n}
                    selected={isSelected}
                    caught={isCaught}
                    pickable={selected === null}
                    onPick={() => handlePick(n)}
                    dimmed={dimmed}
                    flyUp={isSelected && flyUp}
                  />
                  {isSelected && (
                    <>
                      <BirdCage phase={grabPhase} />
                      <DustPuff show={showDust && grabPhase === 'grip'} />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 铭牌 */}
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded px-3 py-0.5 text-[9px] tracking-[0.3em]"
            style={{
              bottom: 6,
              color: 'rgba(240,202,80,0.55)',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(240,202,80,0.18)',
            }}
          >
            JOSON · CHICKEN STAGE
          </div>
        </motion.div>
      </div>

      {/* 底部操作 */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 pb-10 pt-6">
        <AnimatePresence mode="wait">
          {selected === null ? (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-[12px] tracking-wider"
              style={{ color: '#9a9080' }}
            >
              小鸡 2 ~ {np} 号 · 选中即为输家
            </motion.div>
          ) : (
            <motion.div
              key="confirm"
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <div
                className="rounded-full px-4 py-1.5 text-[11px] font-bold tracking-[0.18em]"
                style={{
                  background: 'rgba(240,202,80,0.12)',
                  color: '#ffd868',
                  border: '1px solid rgba(240,202,80,0.4)',
                }}
              >
                选中 · 老{CN_NUM[selected]} 号 ({selected}/{np})
              </div>
              <motion.button
                onClick={handleConfirm}
                disabled={confirmed}
                className="relative overflow-hidden rounded-xl"
                style={{
                  padding: '14px 56px',
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: '0.18em',
                  color: '#0a1610',
                  border: 'none',
                  cursor: confirmed ? 'default' : 'pointer',
                  background: 'linear-gradient(180deg, #f0ca50 0%, #d4a840 100%)',
                  boxShadow:
                    '0 6px 24px rgba(240,202,80,0.35), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -1px 0 rgba(0,0,0,0.18) inset',
                  opacity: confirmed ? 0.65 : 1,
                }}
                whileHover={!confirmed ? { scale: 1.045, y: -2 } : undefined}
                whileTap={!confirmed ? { scale: 0.96 } : undefined}
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
                    borderRadius: 'inherit',
                  }}
                />
                <span className="relative">{confirmed ? '抓 取 中…' : '抓 它！'}</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 抓起后的金光过场 */}
      <AnimatePresence>
        {flyUp && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 35%, rgba(255,225,140,0.22) 0%, rgba(255,200,90,0.0) 80%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
