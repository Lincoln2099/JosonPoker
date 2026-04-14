import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { calcWeights } from '../../game/payout';

function GrassTexture() {
  return (
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.035]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 30px,
          rgba(255,255,255,0.3) 30px,
          rgba(255,255,255,0.3) 31px
        ), repeating-linear-gradient(
          0deg,
          transparent 0px,
          transparent 30px,
          rgba(255,255,255,0.15) 30px,
          rgba(255,255,255,0.15) 31px
        )`,
      }}
    />
  );
}

function FloatingSakura() {
  const petals = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 6}s`,
        duration: `${8 + Math.random() * 8}s`,
        size: 10 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.2,
      })),
    [],
  );
  return (
    <>
      {petals.map((p) => (
        <span
          key={p.id}
          className="pointer-events-none fixed select-none"
          style={{
            left: p.left,
            top: '-5%',
            fontSize: p.size,
            opacity: p.opacity,
            animation: `sakura-fall ${p.duration} ${p.delay} linear infinite`,
          }}
        >
          🌸
        </span>
      ))}
    </>
  );
}

export default function MenuScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [np, setNp] = useState(4);
  const [loserRank, setLoserRank] = useState(4);
  const [ante, setAnte] = useState(1);

  const handleNpChange = (n: number) => {
    setNp(n);
    if (loserRank > n) setLoserRank(n);
  };

  const weights = calcWeights(np, loserRank);
  const totalWin = weights.reduce<number>((s, w) => s + (w ?? 0), 0);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <GrassTexture />
      <FloatingSakura />

      {/* Animated title */}
      <motion.div
        className="relative z-10 mb-10 flex flex-col items-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.span
          className="mb-1 text-sm tracking-[0.3em] font-medium"
          style={{ color: 'var(--sakura)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🌸 SPRING POKER 🌸
        </motion.span>
        <h1
          className="text-5xl font-black tracking-wide sm:text-6xl"
          style={{
            background: 'linear-gradient(135deg, var(--sunlight) 0%, #ffcf33 30%, var(--sakura) 60%, var(--win) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 8px rgba(255,215,0,0.3))',
          }}
        >
          分轮倍增赛
        </h1>
        <motion.div
          className="mt-3 h-0.5 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--sunlight), var(--sakura), transparent)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 160, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        />
        <motion.p
          className="mt-3 text-xs tracking-wider text-white/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          选牌 · 策略 · 倍增
        </motion.p>
      </motion.div>

      {/* Settings card */}
      <motion.div
        className="relative z-10 w-full max-w-md space-y-6 rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg, rgba(30,107,56,0.2), rgba(15,25,35,0.6))',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Player count */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            🎮 玩家人数
          </label>
          <div className="flex gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <motion.button
                key={n}
                onClick={() => handleNpChange(n)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="min-h-[44px] flex-1 rounded-lg py-2 text-base font-bold transition-colors"
                style={{
                  background:
                    np === n
                      ? 'linear-gradient(135deg, var(--field), var(--field-light))'
                      : 'rgba(255,255,255,0.06)',
                  color: np === n ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: np === n ? '0 2px 12px rgba(45,138,78,0.3)' : 'none',
                }}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Loser rank */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            💀 输家名次
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: np - 1 }, (_, i) => i + 2).map((r) => (
              <motion.button
                key={r}
                onClick={() => setLoserRank(r)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="min-h-[44px] rounded-lg px-3 py-2 text-sm font-bold transition-colors"
                style={{
                  background:
                    loserRank === r
                      ? 'linear-gradient(135deg, var(--lose), #dc2626)'
                      : 'rgba(255,255,255,0.06)',
                  color: loserRank === r ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: loserRank === r ? '0 2px 12px rgba(248,113,113,0.3)' : 'none',
                }}
              >
                第{r}名
              </motion.button>
            ))}
          </div>
        </section>

        {/* Ante */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            💰 底注
          </label>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setAnte((a) => Math.max(1, a - 1))}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              −
            </motion.button>
            <input
              type="number"
              min={1}
              value={ante}
              onChange={(e) => setAnte(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg bg-white/8 px-3 py-2 text-center text-xl font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[var(--field)]"
            />
            <motion.button
              onClick={() => setAnte((a) => a + 1)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-xl font-bold"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              +
            </motion.button>
          </div>
        </section>

        {/* Payout table */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            📊 赔率表
          </label>
          <div className="space-y-1 rounded-xl bg-black/20 p-3">
            {weights.map((w, i) => (
              <div
                key={i}
                className="flex justify-between rounded-md px-3 py-1.5 text-sm"
                style={{
                  background: w === null ? 'rgba(248,113,113,0.12)' : 'transparent',
                }}
              >
                <span className={w === null ? 'text-[var(--lose)]' : 'text-white/70'}>
                  第{i + 1}名
                </span>
                {w === null ? (
                  <span className="font-bold text-[var(--lose)]">
                    −{totalWin} × 倍率 × {ante}
                  </span>
                ) : (
                  <span className="font-bold text-[var(--win)]">
                    +{w} × 倍率 × {ante}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </motion.div>

      {/* Start button */}
      <motion.button
        onClick={() => startGame(np, ante, loserRank)}
        className="relative z-10 mt-8 min-h-[44px] rounded-xl px-10 py-3.5 text-xl font-black tracking-wide"
        style={{
          background: 'linear-gradient(135deg, var(--field), var(--field-light), #2dce71)',
          boxShadow: '0 4px 24px rgba(45,138,78,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
        whileHover={{ scale: 1.04, boxShadow: '0 6px 32px rgba(45,138,78,0.6)' }}
        whileTap={{ scale: 0.96 }}
      >
        开始游戏
      </motion.button>
    </div>
  );
}
