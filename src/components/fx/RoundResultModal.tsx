import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState } from '../../game/GameEngine';
import { MULTS, ROUND_CN } from '../../game/Card';
import CharacterAvatar from '../avatar/CharacterAvatar';
import PlayingCard from '../cards/PlayingCard';
import { playSound } from '../../hooks/useSound';

const CN_NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八'];

interface RoundResultModalProps {
  open: boolean;
  game: GameState;
  onContinue: () => void;
}

export default function RoundResultModal({ open, game, onContinue }: RoundResultModalProps) {
  useEffect(() => {
    if (open) playSound('modal');
  }, [open]);

  if (!game.lastResults) return null;

  const round = game.round;
  const isFinal = round === 4;
  const mult = MULTS[round] ?? 1;
  const loserRankCn = CN_NUM[game.loserRank];

  const sorted = [...game.lastResults].sort((a, b) => a.rank - b.rank);
  const loser = sorted.find((r) => r.rank === game.loserRank) ?? sorted[sorted.length - 1]!;
  const loserPlayer = game.players[loser.pi]!;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ background: 'rgba(20,8,16,0.62)', zIndex: 1000 }}
        >
          <motion.div
            className="relative w-full max-w-[400px] overflow-hidden rounded-3xl"
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            style={{
              background: 'linear-gradient(180deg, #fff5f0 0%, #ffe9e0 50%, #ffd5d8 100%)',
              boxShadow: '0 20px 60px rgba(180,60,90,0.35), inset 0 1px 0 rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,210,210,0.7)',
            }}
          >
            {/* 角落樱花装饰 */}
            <CornerBlossom corner="tl" />
            <CornerBlossom corner="tr" />

            {/* 顶部：第N轮结算 + 倍率 */}
            <div className="flex items-center justify-center gap-4 pt-6 text-[12px]">
              <span style={{ color: '#a89090' }}>
                第{ROUND_CN[round] ?? round + 1}轮结算
              </span>
              <span style={{ color: '#a89090' }}>·</span>
              <span style={{ color: '#a89090' }}>
                倍率 <span style={{ color: '#e07050', fontWeight: 700 }}>×{mult}</span>
              </span>
            </div>

            {/* 标题：老X买单！ */}
            <motion.h2
              className="mt-2 text-center"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 38,
                fontWeight: 900,
                background: 'linear-gradient(180deg, #ff6a85, #d83a60)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.04em',
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 18 }}
            >
              老{loserRankCn}买单！
            </motion.h2>

            {/* 输家信息卡 */}
            <motion.div
              className="mx-5 mt-4 overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,240,240,0.88))',
                border: '1px solid rgba(232,150,160,0.35)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-3 px-5 pb-3 pt-4">
                <CharacterAvatar
                  charIdx={loserPlayer.charIdx}
                  mood="lose"
                  size={56}
                  ringColor="rgba(232,90,120,0.55)"
                  ringWidth={2}
                  fallbackEmoji={loserPlayer.emoji}
                />
                <div className="flex flex-col">
                  <div
                    className="text-[20px] font-black"
                    style={{ color: '#5a1a30', fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {loserPlayer.name}
                  </div>
                  <div className="text-[11px]" style={{ color: '#a07070' }}>
                    本轮排名第 {loser.rank} 名 · 老{loserRankCn}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div
                    className="text-[26px] font-black leading-none"
                    style={{ color: '#d8344a', fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {loser.delta}
                  </div>
                  <div className="text-[10px]" style={{ color: '#a87070' }}>
                    积分
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 排名列表 */}
            <div className="mx-5 mt-4 max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
              {sorted.map((r, idx) => {
                const p = game.players[r.pi]!;
                const isLoser = r.rank === game.loserRank;
                const isWinner = idx === 0 && !isLoser;
                return (
                  <motion.div
                    key={r.pi}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2"
                    style={{
                      background: isLoser
                        ? 'linear-gradient(90deg, rgba(255,220,220,0.85), rgba(255,200,200,0.85))'
                        : isWinner
                          ? 'linear-gradient(90deg, rgba(255,240,210,0.85), rgba(250,230,180,0.85))'
                          : 'rgba(255,255,255,0.72)',
                      border: isLoser
                        ? '1px solid rgba(232,90,120,0.4)'
                        : '1px solid rgba(225,210,200,0.55)',
                    }}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.04 }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black"
                      style={{
                        background: isLoser
                          ? 'linear-gradient(180deg, #ff6a85, #d83a60)'
                          : isWinner
                            ? 'linear-gradient(180deg, #ffcd5a, #e89818)'
                            : 'linear-gradient(180deg, #b8d8a8, #6cab68)',
                        color: '#fff',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
                      }}
                    >
                      {r.rank}
                    </div>
                    <CharacterAvatar
                      charIdx={p.charIdx}
                      mood={r.delta > 0 ? 'win' : r.delta < 0 ? 'lose' : 'neutral'}
                      size={34}
                      ringColor="rgba(180,140,120,0.35)"
                      ringWidth={1.5}
                      fallbackEmoji={p.emoji}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span
                        className="truncate text-[13px] font-bold"
                        style={{ color: isLoser ? '#5a1a30' : '#3a2820' }}
                      >
                        {p.name}
                        {p.isHuman && (
                          <span
                            className="ml-1 rounded px-1 py-px text-[8px] font-bold"
                            style={{ background: 'rgba(240,160,40,0.2)', color: '#a86010' }}
                          >
                            你
                          </span>
                        )}
                      </span>
                      <span className="text-[10px]" style={{ color: '#a09080' }}>
                        {r.ev.name}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-[3px]">
                      {r.combo.map((c, ci) => (
                        <PlayingCard key={ci} card={c} size="xs" />
                      ))}
                    </div>
                    <span
                      className="w-[40px] shrink-0 text-right text-[15px] font-black"
                      style={{
                        color: r.delta > 0 ? '#3a8c4a' : r.delta < 0 ? '#d8344a' : '#807068',
                        fontFamily: "'Noto Serif SC', serif",
                      }}
                    >
                      {r.delta > 0 ? '+' : ''}
                      {r.delta}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* 继续按钮 */}
            <div className="px-5 pb-5 pt-4">
              <motion.button
                onClick={() => {
                  playSound('confirm');
                  onContinue();
                }}
                className="w-full rounded-2xl py-3 text-[15px] font-black tracking-[0.18em]"
                style={{
                  background: 'linear-gradient(180deg, #ff8d6a, #e85a55)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Noto Serif SC', serif",
                  boxShadow:
                    '0 8px 24px rgba(232,90,85,0.45), inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.12)',
                }}
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                {isFinal ? '查看总结算 →' : '继续下一轮'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CornerBlossom({ corner }: { corner: 'tl' | 'tr' }) {
  const left = corner === 'tl';
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        [left ? 'left' : 'right']: 16,
        top: 14,
        width: 18,
        height: 18,
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="12"
            cy="6"
            rx="3.2"
            ry="5"
            fill="#ff9bb8"
            opacity="0.85"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
        <circle cx="12" cy="12" r="2" fill="#f5d260" />
      </svg>
    </div>
  );
}
