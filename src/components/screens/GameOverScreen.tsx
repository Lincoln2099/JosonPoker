import { useGameStore } from '../../store/useGameStore';
import { ROUND_CN, MULTS } from '../../game/Card';
import type { GameState } from '../../game/GameEngine';

const MEDALS = ['🥇', '🥈', '🥉'];

function Standings({ game }: { game: GameState }) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <div className="mx-auto w-full max-w-md space-y-2">
      {sorted.map((p, i) => (
        <div
          key={i}
          className={`flex items-center justify-between rounded-lg px-4 py-3 ${
            p.isHuman ? 'bg-indigo-900/50 ring-1 ring-indigo-500' : 'bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 text-center text-lg">{MEDALS[i] ?? `${i + 1}`}</span>
            <span className="text-xl">{p.emoji}</span>
            <span className="font-semibold">{p.name}</span>
          </div>
          <span
            className={`text-lg font-bold ${
              p.score > 0 ? 'text-green-400' : p.score < 0 ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {p.score > 0 ? '+' : ''}{p.score}
          </span>
        </div>
      ))}
    </div>
  );
}

function DetailTable({ game }: { game: GameState }) {
  const maxRounds = game.players[0]!.roundScores.length;
  return (
    <div className="mx-auto w-full max-w-lg overflow-x-auto">
      <table className="w-full text-center text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="px-2 py-1 text-left">玩家</th>
            {Array.from({ length: maxRounds }, (_, i) => (
              <th key={i} className="px-2 py-1">
                第{ROUND_CN[i]}轮<br />
                <span className="text-xs text-slate-500">×{MULTS[i]}</span>
              </th>
            ))}
            <th className="px-2 py-1">总计</th>
          </tr>
        </thead>
        <tbody>
          {game.players.map((p, pi) => (
            <tr key={pi} className={p.isHuman ? 'bg-indigo-900/30' : ''}>
              <td className="px-2 py-1 text-left font-semibold">
                {p.emoji} {p.name}
              </td>
              {p.roundScores.map((d, ri) => (
                <td
                  key={ri}
                  className={`px-2 py-1 ${
                    d > 0 ? 'text-green-400' : d < 0 ? 'text-red-400' : 'text-slate-500'
                  }`}
                >
                  {d > 0 ? '+' : ''}{d}
                </td>
              ))}
              <td
                className={`px-2 py-1 font-bold ${
                  p.score > 0 ? 'text-green-400' : p.score < 0 ? 'text-red-400' : 'text-slate-300'
                }`}
              >
                {p.score > 0 ? '+' : ''}{p.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GameOverScreen() {
  const game = useGameStore((s) => s.game)!;
  const quickRestart = useGameStore((s) => s.quickRestart);
  const goToMenu = useGameStore((s) => s.goToMenu);

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">游戏结束</h1>

      <Standings game={game} />

      <div className="my-6 h-px w-full max-w-lg bg-slate-700" />

      <DetailTable game={game} />

      <div className="mt-8 flex gap-4">
        <button
          onClick={quickRestart}
          className="rounded-xl bg-indigo-600 px-8 py-3 text-lg font-bold shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 active:scale-95"
        >
          同配置再来
        </button>
        <button
          onClick={goToMenu}
          className="rounded-xl bg-slate-700 px-8 py-3 text-lg font-bold transition hover:bg-slate-600 active:scale-95"
        >
          返回菜单
        </button>
      </div>
    </div>
  );
}
