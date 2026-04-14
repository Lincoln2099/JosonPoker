import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { calcWeights } from '../../game/payout';

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
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      {/* Animated title */}
      <motion.div
        className="mb-10 flex flex-col items-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.span
          className="mb-1 text-sm tracking-[0.3em] text-[var(--sakura)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          🌸 SPRING POKER 🌸
        </motion.span>
        <h1
          className="text-4xl font-black tracking-wide sm:text-5xl"
          style={{
            background: 'linear-gradient(135deg, var(--sakura), var(--sunlight), var(--win))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          分轮倍增赛
        </h1>
        <div className="mt-2 h-0.5 w-24 rounded-full bg-gradient-to-r from-transparent via-[var(--sakura)] to-transparent" />
      </motion.div>

      {/* Settings card */}
      <motion.div
        className="w-full max-w-md space-y-6 rounded-2xl p-6"
        style={{
          background: 'rgba(30,107,56,0.15)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {/* Player count */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            玩家人数
          </label>
          <div className="flex gap-1.5">
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                onClick={() => handleNpChange(n)}
                className="flex-1 rounded-lg py-2 text-base font-bold transition-all"
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
              </button>
            ))}
          </div>
        </section>

        {/* Loser rank */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            输家名次
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: np - 1 }, (_, i) => i + 2).map((r) => (
              <button
                key={r}
                onClick={() => setLoserRank(r)}
                className="rounded-lg px-3 py-2 text-sm font-bold transition-all"
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
              </button>
            ))}
          </div>
        </section>

        {/* Ante */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            底注
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnte((a) => Math.max(1, a - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              value={ante}
              onChange={(e) => setAnte(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg bg-white/8 px-3 py-2 text-center text-xl font-bold text-white outline-none transition-all focus:ring-2 focus:ring-[var(--field)]"
            />
            <button
              onClick={() => setAnte((a) => a + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              +
            </button>
          </div>
        </section>

        {/* Payout table */}
        <section>
          <label className="mb-2 block text-xs font-semibold tracking-wide text-white/50">
            赔率表
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
        className="mt-8 rounded-xl px-10 py-3.5 text-xl font-black tracking-wide"
        style={{
          background: 'linear-gradient(135deg, var(--field), var(--field-light))',
          boxShadow: '0 4px 24px rgba(45,138,78,0.4)',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        开始游戏
      </motion.button>
    </div>
  );
}
