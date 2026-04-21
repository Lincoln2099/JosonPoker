import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HowToPlayProps {
  onClose: () => void;
}

interface Step {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

function RankBar({ total, loserRank }: { total: number; loserRank: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const rank = i + 1;
        const isLoser = rank === loserRank;
        const isFirst = rank === 1;
        return (
          <motion.div
            key={rank}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div
              className="flex h-9 w-10 items-center justify-center rounded text-[12px] font-black"
              style={{
                background: isLoser
                  ? 'linear-gradient(180deg, #c75050, #a34040)'
                  : isFirst
                    ? 'linear-gradient(180deg, #c9a84c, #a8893a)'
                    : 'rgba(255,255,255,0.04)',
                color: isLoser || isFirst ? '#1a1610' : '#6b6358',
                border: isLoser || isFirst ? 'none' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: isLoser
                  ? '0 2px 8px rgba(199,80,80,0.2)'
                  : isFirst
                    ? '0 2px 8px rgba(201,168,76,0.15)'
                    : 'none',
              }}
            >
              {rank}
            </div>
            <span className="mt-1 text-[8px]" style={{ color: isLoser ? '#c75050' : '#5c5548' }}>
              {isLoser ? '输' : isFirst ? '冠军' : '赢'}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function MultiplierTimeline() {
  const rounds = [
    { label: '一', mult: '×1' },
    { label: '二', mult: '×2' },
    { label: '三', mult: '×4' },
    { label: '四', mult: '×8' },
    { label: '决', mult: '×16' },
  ];

  return (
    <div className="flex items-center gap-0">
      {rounds.map((r, i) => {
        const intensity = i / (rounds.length - 1);
        const bg = `rgba(201,168,76,${0.08 + intensity * 0.92})`;
        return (
          <div key={i} className="flex items-center">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
            >
              <div
                className="flex h-10 w-12 items-center justify-center rounded text-[13px] font-black"
                style={{
                  background: bg,
                  color: intensity > 0.35 ? '#1a1610' : '#c9a84c',
                  boxShadow: intensity > 0.6 ? `0 2px 10px rgba(201,168,76,${intensity * 0.2})` : 'none',
                }}
              >
                {r.mult}
              </div>
              <span className="mt-1 text-[9px]" style={{ color: '#5c5548' }}>第{r.label}轮</span>
            </motion.div>
            {i < rounds.length - 1 && (
              <div className="mx-0.5 h-px w-3" style={{ background: 'rgba(201,168,76,0.12)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CardDemo() {
  const cards = [
    { rank: 'A', suit: '♠', red: false },
    { rank: '3', suit: '♥', red: true },
    { rank: '7', suit: '♣', red: false },
    { rank: 'J', suit: '♦', red: true },
    { rank: 'K', suit: '♠', red: false },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-1.5">
        {cards.map((c, i) => {
          const sel = i === 1 || i === 3;
          return (
            <motion.div
              key={i}
              className="flex flex-col items-center justify-center rounded"
              style={{
                width: 34, height: 48,
                background: sel ? '#f5f0e8' : '#ebe6de',
                border: sel ? '2px solid #c9a84c' : '1px solid rgba(0,0,0,0.08)',
                boxShadow: sel ? '0 2px 10px rgba(201,168,76,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                color: c.red ? '#b93030' : '#2a2520',
                fontSize: 11, fontWeight: 800, lineHeight: 1,
              }}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: sel ? -8 : 0, opacity: 1, rotate: (i - 2) * 2 }}
              transition={{ delay: 0.12 + i * 0.05, type: 'spring', stiffness: 280, damping: 20 }}
            >
              <span>{c.rank}</span>
              <span style={{ fontSize: 9, marginTop: 1 }}>{c.suit}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[10px]" style={{ color: '#6b6358' }}>
        <span>选2张</span>
        <span>+</span>
        <motion.div
          className="flex flex-col items-center justify-center rounded"
          style={{
            width: 34, height: 48,
            background: '#f5f0e8',
            border: '2px solid #c9a84c',
            boxShadow: '0 2px 10px rgba(201,168,76,0.2)',
            color: '#b93030',
            fontSize: 11, fontWeight: 800, lineHeight: 1,
          }}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 280, damping: 20 }}
        >
          <span>Q</span>
          <span style={{ fontSize: 9, marginTop: 1 }}>♥</span>
        </motion.div>
        <span>底牌</span>
        <span>=</span>
        <motion.span
          className="rounded px-2.5 py-1 text-[11px] font-bold"
          style={{ background: 'rgba(201,168,76,0.1)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.12)' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          3张牌型
        </motion.span>
      </div>
    </div>
  );
}

export default function HowToPlay({ onClose }: HowToPlayProps) {
  const [step, setStep] = useState(0);

  const steps: Step[] = useMemo(() => [
    {
      title: '核心规则',
      subtitle: '只有一个特定名次的玩家输',
      content: (
        <div className="flex flex-col items-center gap-4">
          <p className="max-w-[280px] text-center text-[12px] leading-relaxed" style={{ color: '#8a8070' }}>
            每局中，<span style={{ color: '#e8d5a3', fontWeight: 700 }}>只有一个名次输</span>，
            其余全部赢。不是最弱输——是指定排名输。
          </p>
          <div className="rounded-lg p-3.5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(201,168,76,0.06)' }}>
            <p className="mb-2 text-center text-[9px] font-medium" style={{ color: '#5c5548' }}>
              例：6人局 · 第4名输
            </p>
            <RankBar total={6} loserRank={4} />
          </div>
        </div>
      ),
    },
    {
      title: '选牌出牌',
      subtitle: '5张手牌选2张搭配公共底牌',
      content: (
        <div className="flex flex-col items-center gap-3">
          <p className="max-w-[280px] text-center text-[12px] leading-relaxed" style={{ color: '#8a8070' }}>
            每轮<span style={{ color: '#e8d5a3', fontWeight: 700 }}>5张手牌</span>选
            <span style={{ color: '#c9a84c', fontWeight: 700 }}>2张</span>，
            搭配公共底牌组成3张牌型。
          </p>
          <CardDemo />
          <p className="text-[10px]" style={{ color: '#5c5548' }}>出完后补2张新牌</p>
        </div>
      ),
    },
    {
      title: '倍率递增',
      subtitle: '×1 到 ×16，后期一锤定音',
      content: (
        <div className="flex flex-col items-center gap-4">
          <p className="max-w-[280px] text-center text-[12px] leading-relaxed" style={{ color: '#8a8070' }}>
            五轮比赛，倍率逐轮翻倍。
            <span style={{ color: '#e8d5a3', fontWeight: 700 }}>决胜轮定胜负。</span>
          </p>
          <MultiplierTimeline />
          <div className="rounded px-3.5 py-1.5 text-center text-[11px]" style={{
            background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.08)', color: '#c9a84c',
          }}>
            决胜轮得失 = 前四轮总和的好几倍
          </div>
        </div>
      ),
    },
    {
      title: '策略要点',
      subtitle: '何时出强牌？何时藏牌？',
      content: (
        <div className="w-full max-w-[300px] space-y-1.5">
          {[
            { label: '避开输家名次', desc: '目标不是第一——别落在输家名次就行。' },
            { label: '强牌留后面', desc: '后面倍率高，好牌留到×8、×16收益翻倍。' },
            { label: '王牌是关键', desc: '大小王万能牌，能凑同花顺，用对时机逆天改命。' },
            { label: '暗牌变数', desc: '第四轮底牌延后翻开，要留足余地。' },
          ].map((tip, i) => (
            <motion.div
              key={i}
              className="rounded-lg px-3 py-2"
              style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(201,168,76,0.04)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.07 }}
            >
              <span className="text-[11px] font-bold" style={{ color: '#c9a84c' }}>{tip.label}</span>
              <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: '#7a7568' }}>{tip.desc}</p>
            </motion.div>
          ))}
        </div>
      ),
    },
  ], []);

  const current = steps[step]!;
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(8,6,4,0.92)' }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 mx-4 w-full max-w-[400px]"
        initial={{ scale: 0.96, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 16, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(22,20,18,0.98) 0%, rgba(16,14,12,0.99) 100%)',
            border: '1px solid rgba(201,168,76,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Top accent */}
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(201,168,76,0.2) 50%, transparent 85%)' }} />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded text-[12px]"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#5c5548',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#a09888';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#5c5548';
            }}
          >
            ✕
          </button>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 pt-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? 20 : 6,
                  height: 4,
                  background: i === step ? '#c9a84c' : i < step ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.06)',
                }}
              />
            ))}
          </div>

          <div className="px-6 pb-5 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center"
              >
                <h2
                  className="mb-0.5 text-[18px] font-black tracking-wide"
                  style={{ color: '#e8d5a3', fontFamily: "'Noto Serif SC', serif" }}
                >
                  {current.title}
                </h2>
                <p className="mb-4 text-center text-[11px]" style={{ color: '#5c5548' }}>
                  {current.subtitle}
                </p>
                {current.content}
              </motion.div>
            </AnimatePresence>

            {/* Nav */}
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="rounded-lg px-3.5 py-1.5 text-[12px] font-bold"
                style={{
                  background: step === 0 ? 'transparent' : 'rgba(255,255,255,0.04)',
                  color: step === 0 ? '#3d3830' : '#6b6358',
                  border: step === 0 ? '1px solid transparent' : '1px solid rgba(255,255,255,0.04)',
                  cursor: step === 0 ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                上一步
              </button>

              <span className="text-[10px]" style={{ color: '#3d3830' }}>
                {step + 1} / {steps.length}
              </span>

              <button
                onClick={isLast ? onClose : () => setStep((s) => s + 1)}
                className="rounded-lg px-5 py-1.5 text-[12px] font-bold"
                style={{
                  background: 'linear-gradient(180deg, #c9a84c, #a8893a)',
                  color: '#1a1610',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(201,168,76,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #e0bf62, #c9a84c)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(180deg, #c9a84c, #a8893a)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isLast ? '开始游戏' : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
