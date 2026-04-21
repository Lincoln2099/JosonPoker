import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '../../hooks/useResponsive';
import type { PlayerState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';
import type { GamePhase } from '../../game/GameEngine';
import { AI_REACT_HAPPY, AI_REACT_ANGRY, AI_REACT_NEUTRAL } from '../../game/Card';
import CharacterAvatar from '../avatar/CharacterAvatar';
import type { AvatarMood } from '../../assets/images';
import { useGameStore } from '../../store/useGameStore';

function pickReaction(delta: number): string {
  if (delta > 0) return AI_REACT_HAPPY[Math.floor(Math.random() * AI_REACT_HAPPY.length)]!;
  if (delta < 0) return AI_REACT_ANGRY[Math.floor(Math.random() * AI_REACT_ANGRY.length)]!;
  return AI_REACT_NEUTRAL[Math.floor(Math.random() * AI_REACT_NEUTRAL.length)]!;
}

const IDLE_CHAT = [
  '嗯...选哪张好呢🤔', '我的牌太烂了💀', '稳住，我们能赢！',
  '这牌面有点意思', '快点选啦⏰', '我有一种不祥的预感...',
  '哈哈看我的！', '冷静冷静...', '要不要赌一把？',
  '上一轮亏惨了😭', '这次一定行💪', '你们慢慢选，我不急',
  '我已经想好了😏', '天命之子就是我！', '暴富就在今晚🤑', '菜就多练😎',
];
const WIN_CHAT = [
  '太简单了😎', '谢谢各位打赏💰', '就这？就这？？',
  '赢麻了哈哈哈', '请叫我赌神🔥', '技术赢的，不是运气',
  '再来一局！', '不好意思，手气好',
];
const LOSE_CHAT = [
  '这不合理！！！', '肯定有人作弊💢', '下局翻盘给我等着',
  '我要举报🤬', '算了算了不气了', '运气差而已...',
  '谁说我菜了？？', '啊啊啊好气💀',
];
const THINKING_CHAT = [
  '让我算算...', '嗯...有了！', '随便出了',
  '闭眼选牌.jpg', '期望值最高的是...', '不管了，梭了！',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function PortalChatBubble({ text, anchorRef }: { text: string; anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const updatePos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 6,
    });
  }, [anchorRef]);

  useEffect(() => {
    updatePos();
    const id = setInterval(updatePos, 200);
    window.addEventListener('resize', updatePos);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', updatePos);
    };
  }, [updatePos]);

  if (!pos) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.7, y: -6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="pointer-events-none fixed z-[200]"
      style={{
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -100%)',
        maxWidth: 130,
      }}
    >
      <div
        className="rounded-lg px-2.5 py-1.5 text-center text-[9px] font-medium leading-snug text-white/90"
        style={{
          background: 'rgba(10,28,18,0.95)',
          border: '1px solid rgba(240,202,80,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {text}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: -4,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid rgba(10,28,18,0.95)',
          }}
        />
      </div>
    </motion.div>,
    document.body,
  );
}

interface SeatProps {
  player: PlayerState;
  result?: RoundResult;
  phase: GamePhase;
  compact?: boolean;
}

export default function Seat({ player, result, phase, compact }: SeatProps) {
  const bp = useResponsive();
  const isMobile = bp === 'mobile';
  const showResult = phase === 'result' && result;
  // 弹结算窗时不展示任何聊天气泡，避免气泡盖在弹窗之上
  const modalOpen = useGameStore((s) => s.showRoundModal);
  const scoreColor =
    player.score > 0 ? 'text-[var(--win)]' : player.score < 0 ? 'text-[var(--lose)]' : 'text-white/60';
  const deltaColor =
    result && result.delta > 0
      ? 'text-[var(--win)]'
      : result && result.delta < 0
        ? 'text-[var(--lose)]'
        : 'text-white/60';

  const reaction = useMemo(() => {
    if (!showResult || player.isHuman) return null;
    return pickReaction(result.delta);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, player.isHuman, result?.delta]);

  const [chatText, setChatText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (player.isHuman) return;
    if (phase === 'result' && result) {
      if (Math.random() < 0.6) {
        const msg = result.delta > 0 ? pick(WIN_CHAT) : result.delta < 0 ? pick(LOSE_CHAT) : pick(IDLE_CHAT);
        setChatText(msg);
        timerRef.current = setTimeout(() => setChatText(null), 2500);
      }
      return;
    }
    if (phase === 'thinking') {
      if (Math.random() < 0.4) {
        const delay = 300 + Math.random() * 800;
        timerRef.current = setTimeout(() => {
          setChatText(pick(THINKING_CHAT));
          timerRef.current = setTimeout(() => setChatText(null), 2000);
        }, delay);
      }
      return;
    }
    if (phase === 'select') {
      const delay = 2000 + Math.random() * 6000;
      timerRef.current = setTimeout(() => {
        if (Math.random() < 0.3) {
          setChatText(pick(IDLE_CHAT));
          timerRef.current = setTimeout(() => setChatText(null), 2500);
        }
      }, delay);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, player.isHuman, result?.delta]);

  const avatarSize = compact ? 38 : 48;

  const mood: AvatarMood = (() => {
    if (phase === 'thinking' && !player.isHuman) return 'think';
    if (showResult && result) {
      if (result.delta > 0) return 'win';
      if (result.delta < 0) return 'lose';
    }
    return 'neutral';
  })();

  return (
    <motion.div
      ref={seatRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-0.5"
    >
      {/* Chat bubble via portal — never clipped；结算弹窗打开期间彻底隐藏 */}
      <AnimatePresence>
        {chatText && !modalOpen && <PortalChatBubble text={chatText} anchorRef={seatRef} />}
      </AnimatePresence>

      {/* Seat pedestal */}
      <div
        className="relative flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5"
        style={{
          background: 'rgba(12,30,20,0.92)',
          border: '1px solid rgba(240,202,80,0.12)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Avatar */}
        <div className="relative">
          <CharacterAvatar
            charIdx={player.charIdx}
            mood={mood}
            size={avatarSize}
            ringWidth={2}
            ringColor={
              phase === 'thinking' && !player.isHuman
                ? 'rgba(240,202,80,0.7)'
                : 'rgba(255,255,255,0.22)'
            }
            glow={phase === 'thinking' && !player.isHuman}
            fallbackEmoji={player.emoji}
          />

          {/* Thinking dots */}
          {phase === 'thinking' && !player.isHuman && (
            <div className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
              {[0, 1, 2].map((d) => (
                <motion.div
                  key={d}
                  className="rounded-full"
                  style={{ width: 3, height: 3, background: '#f0ca50' }}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: d * 0.2 }}
                />
              ))}
            </div>
          )}

          {reaction && (
            <motion.span
              className="absolute -right-2 -top-2 text-base drop-shadow"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.3 }}
            >
              {reaction}
            </motion.span>
          )}
        </div>

        {/* Name */}
        <span
          className="max-w-[56px] truncate text-center font-semibold leading-tight text-white/90 drop-shadow"
          style={{ fontSize: compact ? '9px' : '10px' }}
        >
          {player.name}
        </span>

        {/* Score */}
        <span className={`font-bold leading-tight ${scoreColor}`} style={{ fontSize: '10px' }}>
          {player.score > 0 ? '+' : ''}{player.score}
        </span>

        {/* Hand count badge */}
        {!isMobile && !compact && (
          <span
            className="rounded-full px-1.5 text-[8px] text-white/45"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {player.hand.length}牌
          </span>
        )}

        {/* Result overlay */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mt-0.5 flex flex-col items-center rounded-lg px-2 py-1"
            style={{
              background: 'rgba(12,30,20,0.92)',
              border: '1px solid rgba(240,202,80,0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <span className="text-[9px] font-medium" style={{ color: '#b0a898' }}>{result.ev.name}</span>
            <span className="text-[9px] text-white/50">#{result.rank}</span>
            <motion.span
              className={`text-[10px] font-bold ${deltaColor}`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              {result.delta > 0 ? '+' : ''}{result.delta}
            </motion.span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
