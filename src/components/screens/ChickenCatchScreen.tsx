import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import { playSound, playBgm, stopBgm } from '../../hooks/useSound';
import { TABLE_LANDSCAPE, CHICKEN_POSE } from '../../assets/images';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八'];

/** ============================================================
 *  3D 卡通鸡 —— 直接用 AI 生成的与启动图同款的 Pixar 风格鸡 PNG
 *  - 用 hue-rotate 让不同编号的鸡略有色差（冠/羽毛颜色微变），避免完全雷同
 *  - 编号汉字以金色徽章叠加在鸡身上
 *  - 选中时金光 + 缓慢呼吸
 *  ============================================================ */
function ChickenFigure({
  number,
  selected,
  caught,
  pickable,
  onPick,
  dimmed,
  flyUp,
  scale = 1,
}: {
  number: number;
  selected: boolean;
  caught: boolean;
  pickable: boolean;
  onPick: () => void;
  dimmed: boolean;
  flyUp: boolean;
  /** 视觉缩放（1 = 112×112）。鸡数量多时自动缩小避免出框。 */
  scale?: number;
}) {
  const w = 112 * scale;
  const h = 112 * scale;
  // 每只鸡一个轻微的色相偏移，让不同编号的鸡看上去不完全一样（-15° ~ +30°）
  const hueShift = ((number - 2) * 11) % 45 - 10;
  const tagSize = Math.max(22, 28 * scale);
  return (
    <motion.button
      type="button"
      onClick={pickable ? onPick : undefined}
      className="relative inline-block"
      style={{
        width: w,
        height: h,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: pickable ? 'pointer' : 'default',
        opacity: dimmed ? 0.32 : 1,
        filter: dimmed ? 'grayscale(0.55) brightness(0.6)' : 'none',
        transition: 'opacity .35s ease, filter .35s ease',
      }}
      animate={
        flyUp
          ? { y: -380, scale: 0.55, rotate: -10, opacity: 0 }
          : caught
            ? { x: [0, -2, 2, -1.5, 0], y: [0, 1, 0], scale: 0.96 }
            : selected
              ? { y: [0, -2, 0] }
              : { y: [0, -1, 0] }
      }
      transition={
        flyUp
          ? { duration: 0.85, delay: 0.05, ease: [0.4, 0, 0.3, 1] }
          : caught
            ? { duration: 0.45, ease: 'easeOut', repeat: 1, repeatType: 'mirror' }
            : selected
              ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
      }
      whileHover={pickable ? { y: -4 } : undefined}
      whileTap={pickable ? { scale: 0.97 } : undefined}
    >
      {/* 地面阴影 */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 2,
          width: 78 * scale,
          height: 10 * scale,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
        }}
      />

      {/* === AI 生成的 3D 鸡图 === */}
      <img
        src={CHICKEN_POSE}
        alt={`老${CN_NUM[number]}号小鸡`}
        draggable={false}
        style={{
          width: w,
          height: h,
          objectFit: 'contain',
          display: 'block',
          filter: `hue-rotate(${hueShift}deg) saturate(${1 + Math.abs(hueShift) * 0.008})`,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* === 胸前 / 腹部的金色编号徽章 === */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          bottom: h * 0.12,
          width: tagSize,
          height: tagSize,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse 60% 60% at 40% 35%, #fff5c0 0%, #f5c540 55%, #a87018 100%)',
          border: '2px solid #5a3010',
          boxShadow:
            '0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(90,50,10,0.4)',
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontWeight: 900,
            fontSize: Math.max(12, tagSize * 0.55),
            color: '#3a1a06',
            lineHeight: 1,
            textShadow: '0 1px 0 rgba(255,255,255,0.5)',
          }}
        >
          {CN_NUM[number]}
        </span>
      </div>


      {/* 选中时地面金光 */}
      {selected && !caught && !flyUp && (
        <motion.div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -2,
            width: w,
            height: 18 * scale,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(240,202,80,0.7) 0%, rgba(240,202,80,0.22) 50%, transparent 80%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
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
  const [stageW, setStageW] = useState(0);

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

  // 监听舞台真实宽度，计算鸡的缩放比例
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setStageW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePick = (n: number) => {
    // 已经按下"抓它"进入抓取动画后才锁定，否则一直允许切换
    if (confirmed) return;
    if (n === selected) return; // 点同一只无效，避免抖动
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

  // 用真实测量的舞台宽度计算缩放：保证所有鸡 + 间隙加起来恰好放下，最大 1.0
  const baseChickenW = 96;
  const baseGap = numbers.length >= 7 ? 0 : numbers.length >= 5 ? 4 : 8;
  const stagePadding = 32; // 左右各 16px 缓冲
  const usable = Math.max(0, stageW - stagePadding);
  const totalNeeded = numbers.length * baseChickenW + (numbers.length - 1) * baseGap;
  const chickenScale = stageW > 0 && totalNeeded > usable ? usable / totalNeeded : 1;
  const chickenGap = baseGap * chickenScale;

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden"
      style={{
        // 与桌布同色系：木框暖棕 + 草地深绿过渡
        background: `
          radial-gradient(ellipse 80% 50% at 50% 18%, rgba(255,225,140,0.10) 0%, transparent 70%),
          radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,0,0,0.45) 0%, transparent 60%),
          linear-gradient(180deg, #3a2818 0%, #2a4028 35%, #1d4a2a 60%, #11381f 100%)
        `,
      }}
    >
      {/* 顶部金色光晕 */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '85%',
          height: '40%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,225,140,0.12) 0%, transparent 75%)',
        }}
      />

      {/* 暗角 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 180px 50px rgba(0,0,0,0.55)',
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
      <div className="relative z-10 mt-3 flex flex-col items-center px-5 sm:mt-6">
        <div className="mb-2 flex items-center gap-3 sm:mb-3">
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
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 900,
            color: '#ffd868',
            letterSpacing: '0.08em',
            textShadow: '0 2px 24px rgba(240,202,80,0.35), 0 1px 0 rgba(0,0,0,0.5)',
          }}
        >
          今天抓老几？
        </h1>

        <p className="mt-2 text-center text-[11px] sm:mt-3 sm:text-[12px]" style={{ color: '#a8a090' }}>
          点击下方一只小鸡 · 中签者即为本局输家
        </p>
      </div>

      {/* 舞台 —— 直接用游戏桌布图作背景，与牌桌完全同款木框 + 足球场 */}
      <div className="relative z-10 mt-auto flex flex-col items-center px-5">
        <motion.div
          ref={stageRef}
          className="relative w-full max-w-[480px] overflow-visible rounded-[24px]"
          style={{
            aspectRatio: '16 / 9',
            boxShadow: '0 14px 40px rgba(0,0,0,0.6)',
          }}
          animate={shake ? { x: [0, -6, 6, -4, 4, 0], y: [0, 2, -2, 1, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* 舞台底图：足球场桌布（与游戏桌完全同款） */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[24px]"
            style={{
              backgroundImage: `url(${TABLE_LANDSCAPE})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.32)',
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
              background: 'linear-gradient(90deg, transparent, rgba(240,202,80,0.45), transparent)',
            }}
          />

          {/* 鸡群（自适应缩放，溢出舞台时不被裁切） */}
          <div
            className="absolute inset-x-0 flex items-end justify-center px-3"
            style={{ bottom: 16, gap: chickenGap }}
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
                    pickable={!confirmed}
                    onPick={() => handlePick(n)}
                    dimmed={dimmed}
                    flyUp={isSelected && flyUp}
                    scale={chickenScale}
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

          {/* 铭牌（半透明融入桌布） */}
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
      <div className="relative z-10 flex flex-col items-center gap-2 px-6 pb-6 pt-4 sm:gap-3 sm:pb-10 sm:pt-6">
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
              {!confirmed && (
                <div
                  className="text-[10px] tracking-wider"
                  style={{ color: 'rgba(168,160,144,0.7)' }}
                >
                  可继续点其它小鸡切换 · 确认请按下方按钮
                </div>
              )}
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
