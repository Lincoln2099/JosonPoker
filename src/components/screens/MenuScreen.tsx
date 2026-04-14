import { useState } from 'react';
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-8 text-4xl font-bold tracking-wide">分轮倍增赛</h1>

      {/* Player count */}
      <section className="mb-6 w-full max-w-md">
        <label className="mb-2 block text-sm text-slate-400">玩家人数</label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button
              key={n}
              onClick={() => handleNpChange(n)}
              className={`flex-1 rounded-lg py-2 text-lg font-semibold transition ${
                np === n
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* Loser rank */}
      <section className="mb-6 w-full max-w-md">
        <label className="mb-2 block text-sm text-slate-400">输家名次（承担所有赔付）</label>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: np - 1 }, (_, i) => i + 2).map((r) => (
            <button
              key={r}
              onClick={() => setLoserRank(r)}
              className={`rounded-lg px-4 py-2 text-lg font-semibold transition ${
                loserRank === r
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              第{r}名
            </button>
          ))}
        </div>
      </section>

      {/* Ante */}
      <section className="mb-6 w-full max-w-md">
        <label className="mb-2 block text-sm text-slate-400">底注</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnte((a) => Math.max(1, a - 1))}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xl font-bold hover:bg-slate-700"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={ante}
            onChange={(e) => setAnte(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg bg-slate-800 px-3 py-2 text-center text-xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setAnte((a) => a + 1)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xl font-bold hover:bg-slate-700"
          >
            +
          </button>
        </div>
      </section>

      {/* Payout table */}
      <section className="mb-8 w-full max-w-md">
        <label className="mb-2 block text-sm text-slate-400">赔率表（× 倍率 × 底注）</label>
        <div className="space-y-1 rounded-lg bg-slate-800 p-3">
          {weights.map((w, i) => (
            <div
              key={i}
              className={`flex justify-between rounded px-3 py-1 text-sm ${
                w === null ? 'bg-red-900/40 text-red-400' : 'text-slate-200'
              }`}
            >
              <span>第{i + 1}名</span>
              {w === null ? (
                <span>输（赔付 {totalWin} × 倍率 × {ante}）</span>
              ) : (
                <span>+{w} × 倍率 × {ante}</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Start */}
      <button
        onClick={() => startGame(np, ante, loserRank)}
        className="rounded-xl bg-indigo-600 px-10 py-3 text-xl font-bold shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 active:scale-95"
      >
        开始游戏
      </button>
    </div>
  );
}
