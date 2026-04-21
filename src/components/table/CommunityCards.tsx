import { motion } from 'framer-motion';
import PlayingCard from '../cards/PlayingCard';
import type { GameState } from '../../game/GameEngine';

const LABELS = ['底牌1', '底牌2', '底牌3', '底牌4'];

interface CommunityCardsProps {
  game: GameState;
}

export default function CommunityCards({ game }: CommunityCardsProps) {
  const { comm, round, phase, loserRank, np } = game;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
    >
      {/* 公牌台面 */}
      <div
        className="relative flex items-end justify-center gap-1.5 rounded-xl px-3 py-2"
        style={{
          background: 'rgba(10,28,18,0.88)',
          border: '1px solid rgba(240,202,80,0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* 当前轮卡片下方的氛围光 */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at ${25 + Math.min(round, 3) * 20}% 50%, rgba(201,168,76,0.10), transparent 60%)`,
          }}
        />

        {comm.map((card, i) => {
          const isCurrent = i === round && round < 4;
          const isLastCard = i === 3;
          // 新规则：前 3 张（i=0,1,2）始终亮出；第 4 张（暗牌）要等玩家在第四轮
          // 确认出牌后才翻开——即 round<3 时一直背面；round===3 且仍处于 splash
          // 或 select 阶段时也保持背面；其余（flip-reveal/thinking/result）视为已翻开。
          const lastCardRevealed =
            round > 3 ||
            (round === 3 && phase !== 'round-splash' && phase !== 'select');
          const faceDown = isLastCard && !lastCardRevealed;
          const dimmed = !isCurrent && !faceDown && i < round;

          return (
            <motion.div
              key={card.id}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: -16 }}
              animate={{
                opacity: dimmed ? 0.55 : 1,
                y: 0,
                scale: isCurrent ? 1.08 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.06 }}
            >
              <span
                className="text-[9px] font-medium"
                style={{
                  color: isCurrent ? '#ffd868' : 'rgba(240,220,160,0.55)',
                }}
              >
                {LABELS[i]}
              </span>
              <div className="relative">
                <PlayingCard
                  card={card}
                  faceDown={faceDown}
                  size="sm"
                  isCommunity
                />
                {isCurrent && (
                  <div
                    className="pointer-events-none absolute rounded-lg"
                    style={{
                      inset: '-4px',
                      border: '2px solid rgba(240,202,80,0.9)',
                      borderRadius: 10,
                      boxShadow: '0 0 12px rgba(240,202,80,0.32)',
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 本局输家名次徽章 */}
      <LoserBadge loserRank={loserRank} np={np} phase={phase} />
    </motion.div>
  );
}

function LoserBadge({
  loserRank,
  np,
  phase,
}: {
  loserRank: number;
  np: number;
  phase: GameState['phase'];
}) {
  const ordinals = ['', '一', '二', '三', '四', '五', '六', '七', '八'];
  const cn = ordinals[loserRank] ?? loserRank;
  const dimmed = phase === 'result';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: dimmed ? 0.7 : 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.3 }}
      className="flex items-center gap-1.5 rounded-full px-3 py-1"
      style={{
        background: 'linear-gradient(180deg, rgba(232,90,120,0.92), rgba(195,60,90,0.95))',
        border: '1px solid rgba(255,210,220,0.35)',
        boxShadow: '0 4px 16px rgba(195,60,90,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <span style={{ fontSize: 12 }}>🐔</span>
      <span
        className="text-[11px] font-bold tracking-wider"
        style={{
          color: '#fff7e6',
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}
      >
        本局抓 老{cn}
      </span>
      <span
        className="text-[10px] font-medium"
        style={{ color: 'rgba(255,235,220,0.7)' }}
      >
        ({loserRank}/{np})
      </span>
    </motion.div>
  );
}
