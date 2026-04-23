import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import {
  playSound,
  playBgm,
  stopBgm,
  playFileSfx,
  preloadFileSfx,
} from '../../hooks/useSound';

const CHICKEN_CAUGHT_SFX = '/assets/sfx/chicken-caught.mp3';
import { getChickenSrc, HAND_OPEN, HAND_FIST, BG_CATCH_SCENE } from '../../assets/images';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八'];

/** 每只鸡独有的 idle "小跑/小动作"帧动画 —— 让每只活起来、性格各异 */
type IdleAnim = {
  y?: number[];
  x?: number[];
  rotate?: number[];
  scaleX?: number[];
  scaleY?: number[];
  duration: number;
};

const IDLE_PATTERNS: Record<number, IdleAnim> = {
  2: {
    // 白色毛球 Silkie —— 慢吞吞大幅绵软上下 + 轻微左右歪头
    y: [0, -5, -2, -6, -1, 0],
    rotate: [0, -1.5, 1, -1, 2, 0],
    scaleY: [1, 1.03, 1, 1.02, 1, 1],
    duration: 3.2,
  },
  3: {
    // 武士公鸡 —— 昂首挺胸迈阔步，身体左右晃刀
    y: [0, -7, -2, -6, 0],
    rotate: [-3, 2, -2, 3, -3],
    scaleY: [1, 1.05, 1, 1.03, 1],
    duration: 2.0,
  },
  4: {
    // 蒸汽朋克 —— 机械抽搐式快速小幅晃动 + 齿轮感微转
    y: [0, -2, 0, -3, 0],
    x: [0, 1.5, -1, 2, 0],
    rotate: [-2, 1, -2, 2, -1],
    duration: 1.4,
  },
  5: {
    // 星空鸡 —— 超慢大幅悬浮 + 呼吸膨胀（漂浮感）
    y: [0, -8, -3, -9, -2, 0],
    rotate: [0, 1.2, -1, 1.5, 0],
    scaleX: [1, 1.02, 1, 1.03, 1, 1],
    scaleY: [1, 1.03, 1, 1.02, 1, 1],
    duration: 3.8,
  },
  6: {
    // 青花瓷 —— 典雅慢摇扇 + 柔和转身
    y: [0, -3, 0, -2, 0],
    rotate: [0, 3.5, 0, -3.5, 0],
    scaleY: [1, 1.02, 1, 1.01, 1],
    duration: 3.0,
  },
  7: {
    // 熔岩鸡 —— 暴躁快速摇头 + 羽毛喷张
    y: [0, -4, 0, -3, 0],
    rotate: [0, -4, 3, -4, 1, 0],
    scaleX: [1, 0.97, 1.03, 0.98, 1],
    scaleY: [1, 1.04, 0.98, 1.03, 1],
    duration: 1.6,
  },
  8: {
    // 忍者 —— 蹲伏警戒 + 左右偷瞄 + 不规则突然的动作
    y: [0, -6, -1, -7, -2, 0],
    x: [0, -2, 2, -1, 0],
    rotate: [0, -2, 2, -3, 1, 0],
    scaleY: [1, 1.03, 0.97, 1.04, 1],
    duration: 2.2,
  },
};

/** 号码牌统一采用设计图里的「白色纸牌 + 黑色汉字」样式
 *  （仿挂在胸前的方形挂牌），只按不同鸡身比例微调落点 */
const NUMBER_POS_Y: Record<number, number> = {
  2: 0.60,
  3: 0.60,
  4: 0.58,
  5: 0.60,
  6: 0.58,
  7: 0.60,
  8: 0.58,
};

/** ============================================================
 *  3D 卡通鸡 —— 每个编号一张独立的 Pixar 风格鸡 PNG（白鸡/红公鸡/
 *  金色胖母鸡/银丝鸡/黑白花鸡/彩色公鸡…），与加载图风格一致。
 *  - 每只鸡有独有的 idle 小动作（IDLE_PATTERNS）
 *  - 选中时鸡身后出现柔和金色光环
 *  - 胸前挂金色汉字编号徽章
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
  /** 视觉缩放（1 = 260×260）。鸡数量多时自动缩小避免出框。 */
  scale?: number;
}) {
  const w = 260 * scale;
  const h = 260 * scale;
  const bobPhase = ((number * 13) % 7) * 0.15; // 0~0.9s 错位，让各只鸡不同步
  const idle = IDLE_PATTERNS[number] ?? IDLE_PATTERNS[2];

  // 构建 animate 对象时过滤掉 undefined，避免 framer 瞬间重置未定义的 transform
  const idleAnim: Record<string, number[]> = {};
  if (idle.y) idleAnim.y = idle.y;
  if (idle.x) idleAnim.x = idle.x;
  if (idle.rotate) idleAnim.rotate = idle.rotate;
  if (idle.scaleX) idleAnim.scaleX = idle.scaleX;
  if (idle.scaleY) idleAnim.scaleY = idle.scaleY;
  const selectedAnim: Record<string, number[]> = { ...idleAnim };
  if (idle.y) selectedAnim.y = idle.y.map((v) => v * 1.3);
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
        opacity: dimmed ? 0.38 : 1,
        filter: dimmed ? 'grayscale(0.5) brightness(0.65)' : 'none',
        transition: 'opacity .35s ease, filter .35s ease',
        // 被抓/飞走时以脖子位置（顶部 22%）为支点摇摆 → "吊着"的效果
        transformOrigin: caught || flyUp ? '50% 22%' : '50% 50%',
      }}
      animate={
        flyUp
          ? {
              // 被手抓着带走：跟手的上升 y 保持同步（按 scale 缩放），边飞边摇摆倾斜
              y: -600 * scale,
              x: [0, -4 * scale, 3 * scale, -2 * scale, 0],
              scale: 0.85,
              rotate: [-2, 8, -4, 10, 6],
              opacity: [1, 1, 1, 0.6, 0],
            }
          : caught
            ? {
                // 被握住瞬间：脖子被掐，身体被拎起来一点 + 小幅挣扎摇摆（按 scale 缩放位移）
                y: [0, -4 * scale, -6 * scale, -5 * scale],
                x: [0, -2 * scale, 2 * scale, -1.5 * scale, 0],
                scaleY: [1, 1.08, 1.04, 1.06],
                scaleX: [1, 0.95, 0.98, 0.96],
                rotate: [0, -3, 2, -1],
              }
            : selected
              ? selectedAnim
              : idleAnim
      }
      transition={
        flyUp
          ? { duration: 0.85, delay: 0.08, ease: [0.4, 0, 0.3, 1] }
          : caught
            ? { duration: 0.5, ease: 'easeOut' }
            : selected
              ? {
                  duration: idle.duration * 0.7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: bobPhase,
                }
              : {
                  duration: idle.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: bobPhase,
                }
      }
      whileHover={pickable ? { y: -4 } : undefined}
      whileTap={pickable ? { scale: 0.97 } : undefined}
    >
      {/* 选中时：鸡身后柔和金色光环
          外层 wrapper 负责居中（transform translate 不会被 framer 的 animate scale 覆盖），
          内层 motion.div 负责 opacity+scale 脉冲，保证光环永远对准鸡身中心。 */}
      {selected && !caught && !flyUp && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            zIndex: 0,
          }}
        >
          <motion.div
            className="pointer-events-none absolute"
            style={{
              left: -w * 0.85,
              top: -h * 0.85,
              width: w * 1.7,
              height: h * 1.7,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,220,120,0.55) 0%, rgba(255,195,90,0.28) 28%, rgba(255,175,60,0.12) 52%, transparent 78%)',
              filter: 'blur(5px)',
            }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.06, 0.95] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      {/* 地面阴影 */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 2,
          width: 88 * scale,
          height: 12 * scale,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      {/* 选中时：地面金色暖光（呼应上方光环） */}
      {selected && !caught && !flyUp && (
        <motion.div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -2,
            width: w * 1.05,
            height: 18 * scale,
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse, rgba(255,215,120,0.42) 0%, rgba(255,200,80,0.15) 50%, transparent 85%)',
            zIndex: 1,
          }}
          animate={{ opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* === 鸡本体：按编号加载独立的 PNG === */}
      <img
        src={getChickenSrc(number)}
        alt={`老${CN_NUM[number]}号小鸡`}
        draggable={false}
        style={{
          position: 'relative',
          zIndex: 2,
          width: w,
          height: h,
          objectFit: 'contain',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
        }}
      />

      {/* === 胸前主题化数字（每只鸡专属配色/质感，画在身上） === */}
      <ChickenNumber number={number} scale={scale} />
    </motion.button>
  );
}

/** 渲染设计图里那种「挂在胸前的白色方形纸牌 + 细黑边 + 黑色毛笔汉字」。
 *  顶部再加一根细绳挂带,增强"挂在身上"的感觉。所有鸡统一同一种样式。 */
function ChickenNumber({ number, scale }: { number: number; scale: number }) {
  const safeScale = Math.max(0.55, scale);
  const fontSize = Math.max(15, 30 * safeScale);
  const plateSize = Math.max(30, fontSize * 1.35);
  const padX = Math.max(5, 7 * safeScale);
  const padY = Math.max(3, 4 * safeScale);
  const radius = Math.max(2, 3 * safeScale);
  const posY = NUMBER_POS_Y[number] ?? 0.60;
  const ropeWidth = Math.max(1, 1.3 * safeScale);
  const ropeHeight = Math.max(8, 14 * safeScale);

  return (
    <div
      className="pointer-events-none absolute left-1/2"
      style={{
        top: `${posY * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* 挂绳 —— 细黑线从牌子顶部往上斜两条,像 A 字形吊着 */}
      <svg
        width={ropeHeight * 1.3}
        height={ropeHeight}
        viewBox="0 0 13 10"
        style={{ marginBottom: -1, overflow: 'visible' }}
      >
        <line
          x1="6.5" y1="0" x2="2" y2="10"
          stroke="#2a1a10"
          strokeWidth={ropeWidth}
          strokeLinecap="round"
          opacity="0.75"
        />
        <line
          x1="6.5" y1="0" x2="11" y2="10"
          stroke="#2a1a10"
          strokeWidth={ropeWidth}
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
      <div
        style={{
          padding: `${padY}px ${padX}px`,
          minWidth: plateSize,
          minHeight: plateSize,
          borderRadius: radius,
          // 仿宣纸:淡米白略带纹理渐变
          background:
            'linear-gradient(180deg, #fbf5e2 0%, #f2e9cf 55%, #eaddb4 100%)',
          border: `${Math.max(1, 1.3 * safeScale)}px solid #2a1a10`,
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(160,130,70,0.25) inset',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'Noto Serif SC', 'STKaiti', 'KaiTi', 'PingFang SC', serif",
            fontWeight: 900,
            fontSize,
            color: '#1a0d04',
            lineHeight: 1,
            letterSpacing: 0,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            textShadow: '0 0 1px rgba(0,0,0,0.25)',
          }}
        >
          {CN_NUM[number]}
        </span>
      </div>
    </div>
  );
}

/** ============================================================
 *  Pixar 3D 风格的大手（绿袖子 + 金色袖口）—— 从天而降抓鸡脖子
 *  - descend：张开手掌垂直下落到鸡脖子高度（hand-open.png）
 *  - grip：切换为握拳（hand-fist.png），紧扣脖子 + 快速 squash + 微微下压
 *  - lift：握拳连鸡一起升起飞出画面（鸡会跟随同步，见 ChickenFigure.flyUp）
 *
 *  关键：
 *  - 手的尺寸和落位全部随 chickenScale 缩放，保持和鸡始终协调
 *  - 拳头 knuckles（在 PNG 下部 ~80%）正好落在鸡的上 1/3（头颈区域）
 *  ============================================================ */
function HandGrab({
  phase,
  scale = 1,
}: {
  phase: 'hidden' | 'descend' | 'grip' | 'lift';
  scale?: number;
}) {
  // 基础尺寸假定鸡是 260×260（scale=1）。手略比鸡窄、和鸡差不多高。
  const handW = 150 * scale;
  const handH = 215 * scale;
  const bottomOffset = 80 * scale;
  const descendEntryY = -720 * scale;
  const liftExitY = -640 * scale;
  const gripPushY = 14 * scale;
  const showOpen = phase === 'descend';
  const showFist = phase === 'grip' || phase === 'lift';

  return (
    <motion.div
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        bottom: bottomOffset,
        marginLeft: -handW / 2,
        width: handW,
        height: handH,
        zIndex: 30,
        transformOrigin: 'center 75%',
        filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.55))',
      }}
      initial={false}
      animate={
        phase === 'hidden'
          ? { y: descendEntryY, opacity: 0 }
          : phase === 'descend'
            ? { y: 0, opacity: 1, rotate: 2 }
            : phase === 'grip'
              ? {
                  y: [0, gripPushY, gripPushY * 0.6, gripPushY * 0.5, gripPushY * 0.5],
                  scale: [1, 0.82, 1.12, 0.96, 1],
                  rotate: [2, -3, 4, -1, 0],
                  opacity: 1,
                }
              : { y: liftExitY, opacity: 1, rotate: -3 }
      }
      transition={
        phase === 'descend'
          ? { duration: 0.55, ease: [0.7, 0, 0.55, 1] }
          : phase === 'grip'
            ? { duration: 0.45, ease: 'easeOut', times: [0, 0.3, 0.6, 1] }
            : phase === 'lift'
              ? { duration: 0.85, delay: 0.05, ease: [0.4, 0, 0.3, 1] }
              : { duration: 0.2 }
      }
    >
      <AnimatePresence>
        {showOpen && (
          <motion.img
            key="open"
            src={HAND_OPEN}
            alt="张开的手"
            draggable={false}
            className="absolute inset-0"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          />
        )}
        {showFist && (
          <motion.img
            key="fist"
            src={HAND_FIST}
            alt="握拳"
            draggable={false}
            className="absolute inset-0"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** ============================================================
 *  抓鸡瞬间的 VFX 套装 —— 让"咔！抓住了！"的力度感拉满
 *  所有特效都相对于鸡的 wrapper 居中叠加
 *  ============================================================ */

/** 手下落时后拖的 4 条动感线（模拟高速掉落） */
function DescendStreaks({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -380, width: 140, height: 380, zIndex: 29 }}
        >
          {[0, 1, 2, 3].map((i) => {
            const x = [20, 50, 90, 120][i];
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: x,
                  top: 0,
                  width: 3,
                  height: 110,
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(255,240,200,0.75) 55%, transparent 100%)',
                  borderRadius: 2,
                  filter: 'blur(0.5px)',
                }}
                initial={{ y: -40, opacity: 0, scaleY: 0.4 }}
                animate={{ y: 320, opacity: [0, 1, 0], scaleY: 1.2 }}
                transition={{
                  duration: 0.38,
                  delay: 0.02 + i * 0.06,
                  ease: 'easeIn',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

/** 抓到瞬间的白光爆闪（中心 radial，0.35s 内扩散消散） */
function ImpactFlash({ active, size = 340 }: { active: boolean; size?: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(255,255,230,1) 0%, rgba(255,230,120,0.7) 22%, rgba(255,200,80,0.3) 45%, transparent 72%)',
            zIndex: 27,
            mixBlendMode: 'screen',
          }}
          initial={{ scale: 0.15, opacity: 0 }}
          animate={{ scale: [0.15, 1.1, 1.4], opacity: [0, 1, 0] }}
          transition={{ duration: 0.35, times: [0, 0.25, 1], ease: 'easeOut' }}
        />
      )}
    </AnimatePresence>
  );
}

/** 3 圈扩散的金色冲击波环 */
function ShockRings({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <>
      {[0, 0.08, 0.18].map((delay, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            width: 80,
            height: 80,
            marginLeft: -40,
            marginTop: -40,
            borderRadius: '50%',
            border: `${3 - i * 0.5}px solid rgba(255,220,100,${0.9 - i * 0.15})`,
            zIndex: 27,
            boxShadow: '0 0 20px rgba(255,220,100,0.6)',
          }}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 4.2, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, delay, times: [0, 0.25, 1], ease: 'easeOut' }}
        />
      ))}
    </>
  );
}

/** 10 片羽毛四散飞出 */
function FeatherBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2"
      style={{ zIndex: 28, width: 0, height: 0 }}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 70 + Math.random() * 60;
        const size = 10 + Math.random() * 8;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist * 0.75 - 20;
        const spin = Math.random() * 720 - 360;
        const dur = 0.6 + Math.random() * 0.35;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: -size / 2,
              top: -size,
              width: size,
              height: size * 1.6,
              background:
                'linear-gradient(180deg, #ffffff 0%, #fff4e8 70%, #e8d8c4 100%)',
              borderRadius: '50% 50% 30% 70%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
              transformOrigin: 'center top',
            }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.4 }}
            animate={{
              x: [0, dx * 0.55, dx],
              y: [0, dy * 0.35, dy + 40],
              rotate: spin,
              opacity: [1, 1, 0],
              scale: [0.4, 1.1, 0.8],
            }}
            transition={{ duration: dur, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

/** 漫画式"抓!"大字从中心弹出 */
function ComicText({ active, text }: { active: boolean; text: string }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{
            marginLeft: -80,
            marginTop: -40,
            width: 160,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 35,
          }}
          initial={{ scale: 0, rotate: -18, opacity: 0 }}
          animate={{
            scale: [0, 1.4, 1.15, 1.2],
            rotate: [-18, 8, -4, 0],
            opacity: [0, 1, 1, 0],
            y: [0, -6, -12, -22],
          }}
          transition={{
            duration: 0.95,
            times: [0, 0.22, 0.5, 1],
            ease: 'backOut',
          }}
        >
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 900,
              fontSize: 62,
              color: '#ffd868',
              WebkitTextStroke: '3px #3a1a06',
              textShadow:
                '4px 5px 0 #3a1a06, 0 0 24px rgba(255,216,104,0.85), 0 0 40px rgba(255,180,60,0.6)',
              letterSpacing: '0.05em',
              transform: 'skewX(-6deg)',
              display: 'inline-block',
            }}
          >
            {text}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 被抓鸡头上转圈的"晕眩小星星" —— 3 颗星绕圈飞 */
function DazeStars({ active }: { active: boolean }) {
  if (!active) return null;
  const radius = 26;
  return (
    <div
      className="pointer-events-none absolute left-1/2"
      style={{
        top: '18%',
        marginLeft: -radius,
        width: radius * 2,
        height: radius * 2,
        zIndex: 29,
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 120, 240].map((startAng, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -7,
              transform: `rotate(${startAng}deg) translateY(-${radius}px)`,
              color: '#ffd868',
              fontSize: 16,
              fontWeight: 900,
              lineHeight: '14px',
              textAlign: 'center',
              textShadow: '0 0 6px rgba(255,216,104,0.9), 0 0 12px rgba(255,180,60,0.5)',
            }}
          >
            ★
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** 手上提时的拖影（从鸡位置向上 3 条光带） */
function LiftTrails({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{ top: -300, width: 120, height: 340, zIndex: 26 }}
        >
          {[0, 1, 2].map((i) => {
            const x = [30, 60, 90][i];
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: x,
                  bottom: 0,
                  width: 4,
                  height: 180,
                  background:
                    'linear-gradient(0deg, transparent 0%, rgba(255,220,100,0.55) 50%, transparent 100%)',
                  borderRadius: 2,
                  filter: 'blur(1px)',
                }}
                initial={{ y: 40, opacity: 0, scaleY: 0.4 }}
                animate={{ y: -220, opacity: [0, 1, 0], scaleY: 1.3 }}
                transition={{
                  duration: 0.7,
                  delay: 0.05 + i * 0.08,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
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
  const [shake, setShake] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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
    // 抓到鸡那一刻要播的音效，提前解码避免首次播放卡顿
    preloadFileSfx(CHICKEN_CAUGHT_SFX);
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
    if (confirmed) return;
    if (n === selected) return;
    // 选中一只鸡 → 播一声真实感的 "咯~" 鸡叫（共振峰 + 颤音合成）
    playSound('cluck');
    setSelected(n);
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    playSound('confirm');
    // 0 → 550ms：大手张开加速下落 + whoosh
    setGrabPhase('descend');
    setTimeout(() => playSound('whoosh'), 80);
    // 550ms：握拳 + 烟尘 + 震屏 + thud + 鸡惊叫 "squawk!"
    setTimeout(() => {
      setGrabPhase('grip');
      setShowDust(true);
      setShake(true);
      playSound('thud');
      // 抓到鸡那一刻同步播放外部 SFX（1654.mp3）
      playFileSfx(CHICKEN_CAUGHT_SFX, { volume: 0.85 });
      // 鸡被抓住瞬间发出惊叫
      setTimeout(() => playSound('squawk'), 90);
      // 紧接着再来一声短促挣扎 cluck
      setTimeout(() => playSound('cluck'), 520);
      setTimeout(() => setShake(false), 380);
    }, 550);
    // 1400ms：握拳提起带鸡飞出画面
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

  // 多于 3 只自动换两排（4→2+2，5→3+2，6→3+3，7→4+3），让每只鸡保持较大尺寸
  const chickenRowCount = numbers.length > 3 ? 2 : 1;
  const perRow = Math.ceil(numbers.length / chickenRowCount);
  const rows: number[][] = [];
  for (let i = 0; i < numbers.length; i += perRow) {
    rows.push(numbers.slice(i, i + perRow));
  }
  const maxRowLen = Math.max(...rows.map((r) => r.length));

  // 缩放按「最宽一排」宽度约束 + 纵向空间预算两路约束，取较小者
  const baseChickenW = 260;
  const baseGap = maxRowLen >= 4 ? 4 : maxRowLen >= 3 ? 8 : 14;
  const stagePadding = 16;
  const usable = Math.max(0, stageW - stagePadding);
  const totalNeeded = maxRowLen * baseChickenW + (maxRowLen - 1) * baseGap;
  const scaleByW = stageW > 0 && totalNeeded > usable ? usable / totalNeeded : 1;
  // 纵向约束：最多 45% dvh 给鸡群，防止两排鸡挤掉下方按钮
  const budgetH =
    typeof window !== 'undefined' ? window.innerHeight * 0.45 : 380;
  const verticalNeeded = rows.length * baseChickenW + (rows.length - 1) * 6;
  const scaleByH = verticalNeeded > budgetH ? budgetH / verticalNeeded : 1;
  const chickenScale = Math.min(scaleByW, scaleByH);
  const chickenGap = baseGap * chickenScale;
  const baseRowGap = 4;
  const rowGap = baseRowGap * chickenScale;

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden"
      style={{
        // 背景底色 —— 与背景图樱花/草地色调呼应,
        // 即使图片被竖屏 cover 裁切,边缘也能延续同色,不露白底。
        backgroundColor: '#9fc37b',
      }}
    >
      {/* 背景图单独一层,确保画面在竖屏时以"下方草地路径"为锚点保持框架感 */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${BG_CATCH_SCENE})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          // 优先保留下半部(路径+草地+两侧樱花根部),鸡站在草地上才不会违和
          backgroundPosition: 'center 68%',
        }}
      />
      {/* 背景之上的轻度氛围层:顶部压一点暖黄晨光,底部淡淡压暗以利于按钮/文字对比 */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 28% at 50% 0%, rgba(255,210,140,0.20) 0%, transparent 70%),
            linear-gradient(180deg, transparent 0%, transparent 58%, rgba(30,55,30,0.25) 85%, rgba(18,40,22,0.50) 100%)
          `,
        }}
      />

      {/* 顶栏 */}
      <div className="relative z-10 flex items-center justify-between pl-5 pr-14 pt-5 sm:pr-5">
        <button
          onClick={() => {
            playSound('back');
            goToMenu();
          }}
          className="rounded-full px-3 py-1.5 text-[12px] font-bold tracking-wider"
          style={{
            background: 'rgba(42,22,8,0.65)',
            border: '1px solid rgba(240,202,80,0.55)',
            color: '#ffd868',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          ← 返回
        </button>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider"
          style={{
            background: 'rgba(42,22,8,0.7)',
            color: '#ffd868',
            border: '1px solid rgba(240,202,80,0.55)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {np} 人局
        </div>
      </div>

      {/* 标题 —— 仿设计图樱花林里挂着的木质招牌 */}
      <div className="relative z-10 mt-3 flex flex-col items-center px-5 sm:mt-4">
        <div
          ref={titleRef}
          className="relative"
          style={{
            // 木板基底
            background: `
              linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.18) 100%),
              repeating-linear-gradient(92deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 2%, rgba(255,220,180,0.05) 4%, rgba(0,0,0,0.1) 7%),
              linear-gradient(180deg, #8a5a30 0%, #6e4220 25%, #89582b 50%, #6a4120 75%, #542f18 100%)
            `,
            padding: 'clamp(8px, 1.8vw, 14px) clamp(26px, 7vw, 56px)',
            borderRadius: 'clamp(12px, 3vw, 22px)',
            border: '2.5px solid #2a1608',
            boxShadow: `
              0 10px 28px rgba(0,0,0,0.55),
              inset 0 2px 0 rgba(255,210,160,0.35),
              inset 0 -3px 0 rgba(0,0,0,0.5),
              inset 0 0 0 1.5px rgba(255,210,160,0.18)
            `,
            // 两侧略微凸出的木头边,增加立体"匾额"感
            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
          }}
        >
          {/* 四角小铆钉 */}
          {([
            { top: 6, left: 10 },
            { top: 6, right: 10 },
            { bottom: 6, left: 10 },
            { bottom: 6, right: 10 },
          ] as const).map((pos, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                ...pos,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle at 35% 35%, #ffde8c 0%, #c18a2e 55%, #5a3610 100%)',
                boxShadow:
                  '0 1px 1.5px rgba(0,0,0,0.55), inset 0 -0.5px 0.5px rgba(0,0,0,0.4)',
              }}
            />
          ))}

          <h1
            className="text-center"
            style={{
              fontFamily: "'Noto Serif SC', 'KaiTi', 'STKaiti', serif",
              fontSize: 'clamp(22px, 5.8vw, 38px)',
              fontWeight: 900,
              color: '#f6c960',
              letterSpacing: '0.08em',
              textShadow: `
                0 0 1px #3a1a06,
                1.5px 1.5px 0 #3a1a06,
                -1px -1px 0 #3a1a06,
                0 2px 0 rgba(0,0,0,0.45),
                0 0 14px rgba(255,205,90,0.4)
              `,
              margin: 0,
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            选择要抓的鸡
          </h1>
        </div>

        <p
          className="mt-3 text-center text-[11px] sm:text-[12px]"
          style={{
            color: '#2a1a08',
            fontWeight: 700,
            textShadow: '0 1px 0 rgba(255,245,220,0.55)',
            letterSpacing: '0.04em',
          }}
        >
          点击下方一只小鸡 · 中签者即为本局输家
        </p>
      </div>

      {/* 舞台 —— 无独立背景，仅作为鸡群容器（保留 shake 抖动） */}
      <div className="relative z-10 mt-auto mb-4 flex flex-col items-center px-5 sm:mb-8">
        <motion.div
          ref={stageRef}
          className="relative w-full max-w-[720px] overflow-visible py-2"
          animate={shake ? { x: [0, -6, 6, -4, 4, 0], y: [0, 2, -2, 1, 0] } : { x: 0, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* 鸡群：>4 只自动换两排，每排居中 */}
          <div
            className="flex flex-col items-center"
            style={{ gap: rowGap }}
          >
            {rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className="flex items-end justify-center"
                style={{ gap: chickenGap }}
              >
                {row.map((n) => {
                  const isSelected = selected === n;
                  const isCaught =
                    isSelected && (grabPhase === 'grip' || grabPhase === 'lift');
                  const dimmed = selected !== null && !isSelected;
                  return (
                    <div key={n} className="relative">
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
                          {/* 手下落时的动感线 */}
                          <DescendStreaks active={grabPhase === 'descend'} />
                          {/* 手本体（带下落 / 握拳 / 提起三阶段，随鸡 scale 一起缩放保持比例） */}
                          <HandGrab phase={grabPhase} scale={chickenScale} />
                          {/* 握拳瞬间爆发的 VFX 群组 */}
                          <ImpactFlash active={grabPhase === 'grip'} />
                          <ShockRings active={grabPhase === 'grip'} />
                          <FeatherBurst active={grabPhase === 'grip'} />
                          <ComicText active={grabPhase === 'grip'} text="抓!" />
                          {/* 被抓鸡头顶的晕星（只在 grip 阶段，避免 lift 时星星留在原位脱节） */}
                          <DazeStars active={grabPhase === 'grip'} />
                          {/* 提起时的上升拖影 */}
                          <LiftTrails active={grabPhase === 'lift'} />
                          {/* 地面烟尘（原有） */}
                          <DustPuff show={showDust && grabPhase === 'grip'} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
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
