import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGameStore } from '../../store/useGameStore';
import {
  playSound,
  stopBgm,
  playFileSfx,
  preloadFileSfx,
} from '../../hooks/useSound';
import { getChickenSrc, BG_CATCH_SCENE } from '../../assets/images';

/** 玩家确定后播放的"鸡鸣"音效(用户提供的 mp3 文件)。 */
const CHICKEN_CROW_SFX = '/assets/sfx/chicken-caught.mp3';

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
 *  3D 卡通鸡 —— 每个编号一张独立的 Pixar 风格鸡 PNG。
 *  - 每只鸡有独有的 idle 小动作（IDLE_PATTERNS）
 *  - 选中时:
 *      · 整体放大 1.2 倍(spring 弹性回弹)
 *      · 鸡身后浮现柔和金色光环 + 地面暖光
 *      · idle 动作幅度略增加(更活跃)
 *  - 玩家按下"抓它"后会触发 crowing 动画(头部上扬 + 微微伸脖子叫一声)
 *  ============================================================ */
function ChickenFigure({
  number,
  selected,
  pickable,
  onPick,
  dimmed,
  crowing,
  scale = 1,
}: {
  number: number;
  selected: boolean;
  pickable: boolean;
  onPick: () => void;
  dimmed: boolean;
  /** 玩家确定后,选中的那只鸡会进入 crowing 状态(头部上扬叫一声) */
  crowing: boolean;
  /** 视觉缩放（1 = 260×260）。鸡数量多时自动缩小避免出框。 */
  scale?: number;
}) {
  const w = 260 * scale;
  const h = 260 * scale;
  const bobPhase = ((number * 13) % 7) * 0.15;
  const idle = IDLE_PATTERNS[number] ?? IDLE_PATTERNS[2];

  const idleAnim: Record<string, number[]> = {};
  if (idle.y) idleAnim.y = idle.y;
  if (idle.x) idleAnim.x = idle.x;
  if (idle.rotate) idleAnim.rotate = idle.rotate;
  if (idle.scaleX) idleAnim.scaleX = idle.scaleX;
  if (idle.scaleY) idleAnim.scaleY = idle.scaleY;
  const selectedAnim: Record<string, number[]> = { ...idleAnim };
  if (idle.y) selectedAnim.y = idle.y.map((v) => v * 1.3);
  return (
    // 外层 wrapper 负责"选中放大 1.2x"的整体缩放(脱离 idle 动画系统,不会和它冲突)
    <motion.div
      className="relative inline-block"
      style={{ transformOrigin: 'center bottom' }}
      animate={{ scale: selected ? 1.2 : 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18, mass: 0.7 }}
    >
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
          opacity: dimmed ? 0.42 : 1,
          filter: dimmed ? 'grayscale(0.45) brightness(0.7)' : 'none',
          transition: 'opacity .35s ease, filter .35s ease',
          transformOrigin: '50% 50%',
        }}
        animate={
          crowing
            ? {
                // 鸡鸣瞬间:头脖前倾上扬,身体微微后挺,像在打鸣
                y: [-2 * scale, -10 * scale, -4 * scale],
                rotate: [-2, -10, -4],
                scaleY: [1, 1.05, 1.02],
                scaleX: [1, 0.97, 0.99],
              }
            : selected
              ? selectedAnim
              : idleAnim
        }
        transition={
          crowing
            ? { duration: 0.9, ease: 'easeInOut', times: [0, 0.4, 1] }
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
        {/* 选中时:鸡身后柔和金色光环 */}
        {selected && (
          <div
            className="pointer-events-none absolute"
            style={{ left: '50%', top: '50%', width: 0, height: 0, zIndex: 0 }}
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

        {/* 选中时:地面金色暖光(呼应上方光环) */}
        {selected && (
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

        {/* === 鸡本体 === */}
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

        {/* === 胸前白色号码牌 === */}
        <ChickenNumber number={number} scale={scale} />
      </motion.button>
    </motion.div>
  );
}

/** 渲染设计稿里那种「正方形白纸牌 + 粗黑毛笔字」,挂在小鸡胸前。
 *  - 正方形白纸,字几乎填满牌子(对齐设计图视觉比重)
 *  - 不再画挂绳(设计稿没有,挂绳反而让画面零碎)
 *  - 粗黑笔锋字体 + 略微纸张质感 */
function ChickenNumber({ number, scale }: { number: number; scale: number }) {
  const safeScale = Math.max(0.6, scale);
  // 字号放大一档,牌子也跟着变大,跟设计稿的视觉比重一致
  const fontSize = Math.max(20, 40 * safeScale);
  // 正方形:边长 ≈ 字号 × 1.18,字几乎顶满牌面
  const plateW = Math.round(fontSize * 1.18);
  const plateH = Math.round(fontSize * 1.18);
  const radius = Math.max(2, 3 * safeScale);
  const borderW = Math.max(1.4, 2 * safeScale);
  const posY = NUMBER_POS_Y[number] ?? 0.60;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: `${posY * 100}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: 4,
      }}
    >
      <div
        style={{
          width: plateW,
          height: plateH,
          borderRadius: radius,
          // 半透明的米白纸感(对齐设计稿——能透出鸡羽毛的颜色,不是死白纸)
          background: 'rgba(252, 248, 232, 0.55)',
          border: `${borderW}px solid rgba(38, 24, 12, 0.85)`,
          boxShadow:
            '0 2px 5px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.35) inset',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            // 用 Ma Shan Zheng (毛笔/碑刻风),呼应背景木牌"选择要抓的鸡"的字体
            fontFamily:
              "'Ma Shan Zheng', 'STKaiti', 'KaiTi', 'Noto Serif SC', serif",
            fontWeight: 700,
            fontSize,
            color: '#1a0d04',
            lineHeight: 1,
            letterSpacing: 0,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            textShadow:
              '0 0 0.6px rgba(0,0,0,0.55), 0 0.5px 0 rgba(0,0,0,0.3)',
            transform: 'translateY(-1px)',
          }}
        >
          {CN_NUM[number]}
        </span>
      </div>
    </div>
  );
}

export default function ChickenCatchScreen() {
  const pending = useGameStore((s) => s.pending);
  const startGameWithLoser = useGameStore((s) => s.startGameWithLoser);
  const goToMenu = useGameStore((s) => s.goToMenu);

  const np = pending?.np ?? 4;
  const numbers = useMemo(() => Array.from({ length: np - 1 }, (_, i) => i + 2), [np]);

  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  /** 玩家确定后,中签的那只鸡进入"打鸣"动画状态 */
  const [crowing, setCrowing] = useState(false);

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
    // 抓鸡屏不再播 BGM(BGM 进入正式游戏后再开始,避免选鸡时被吵)。
    // 但仍需把"鸡鸣"音效提前解码,避免确认时首次播放卡顿。
    preloadFileSfx(CHICKEN_CROW_SFX);
    // 进入抓鸡屏时,把上一局可能残留的短 BGM 立刻停掉
    stopBgm();
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
    playSound('cluck');
    setSelected(n);
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    playSound('confirm');
    // 简化流程:确认 → 中签鸡进入打鸣动画 + 播一声鸡鸣 → 1.4s 后进入游戏
    // (不再有手抓/抬升/烟尘震屏等动画 VFX)
    setTimeout(() => {
      setCrowing(true);
      playFileSfx(CHICKEN_CROW_SFX, { volume: 0.95 });
    }, 240);
    setTimeout(() => {
      startGameWithLoser(selected);
    }, 1700);
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
        // 整体底色 —— 顶部接背景图天空粉色,中段过渡,底部草地深绿,
        // 让背景图和下方草地无缝衔接,不会再出现"一片黄色"。
        background:
          'linear-gradient(180deg, #dc89a6 0%, #cf9a8a 14%, #133008 22%, #1a3e10 50%, #15300d 100%)',
      }}
    >
      {/* 顶栏 —— 浮动在背景图上方,不挤占内容区 */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-start justify-between pl-3 pr-14 pt-3 sm:pr-3">
        <button
          onClick={() => {
            playSound('back');
            goToMenu();
          }}
          className="rounded-full px-3 py-1.5 text-[12px] font-bold tracking-wider"
          style={{
            background: 'rgba(20,12,4,0.72)',
            border: '1px solid rgba(240,202,80,0.55)',
            color: '#ffd868',
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          ← 返回
        </button>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wider"
          style={{
            background: 'rgba(20,12,4,0.72)',
            color: '#ffd868',
            border: '1px solid rgba(240,202,80,0.55)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {np} 人局
        </div>
      </div>

      {/* 入场动画的隐藏锚点 */}
      <div ref={titleRef} aria-hidden style={{ height: 0, width: 0 }} />

      {/* 顶部留白 —— 让浮动顶栏按钮跟下方背景图里的木牌之间有清晰间距,
          这段空白用页面渐变天空色,跟图片顶部颜色无缝接续 */}
      <div className="shrink-0" style={{ height: 'calc(env(safe-area-inset-top, 0px) + 52px)' }} />

      {/* 背景图作为顶部"自然 header":
          - 始终按视口宽度铺满,不裁切两侧 → 木牌"选择要抓的鸡"完整可见
          - 横屏/超宽屏下用 max-height 限制(56vh),避免一图占满整屏挤掉鸡 */}
      <img
        src={BG_CATCH_SCENE}
        alt="樱花林木牌"
        draggable={false}
        className="block w-full select-none"
        style={{
          maxHeight: '56vh',
          objectFit: 'cover',
          objectPosition: 'center top',
          flexShrink: 0,
          marginBottom: -1,
          pointerEvents: 'none',
        }}
      />

      {/* 舞台 —— 鸡群直接站在草地渐变上,跟图底无缝衔接 */}
      <div className="relative z-10 mt-auto mb-4 flex flex-col items-center px-5 sm:mb-8">
        <div
          ref={stageRef}
          className="relative w-full max-w-[720px] overflow-visible py-2"
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
                  const dimmed = selected !== null && !isSelected;
                  return (
                    <div key={n} className="relative">
                      <ChickenFigure
                        number={n}
                        selected={isSelected}
                        pickable={!confirmed}
                        onPick={() => handlePick(n)}
                        dimmed={dimmed}
                        crowing={isSelected && crowing}
                        scale={chickenScale}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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

      {/* 鸡鸣瞬间柔和的金色暖光过场 */}
      <AnimatePresence>
        {crowing && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(255,225,140,0.20) 0%, rgba(255,200,90,0) 80%)',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
