import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { ROUND_CN, MULTS } from '../../game/Card';
import type { GameState } from '../../game/GameEngine';

const MEDALS = ['🥇', '🥈', '🥉'];

function Standings({ game }: { game: GameState }) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <div className="mx-auto w-full max-w-md space-y-2">
      {sorted.map((p, i) => {
        const scoreColor =
          p.score > 0
            ? 'text-[var(--win)]'
            : p.score < 0
              ? 'text-[var(--lose)]'
              : 'text-white/50';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{
              background: p.isHuman
                ? 'rgba(45,138,78,0.2)'
                : 'rgba(255,255,255,0.04)',
              border: p.isHuman
                ? '1px solid rgba(45,138,78,0.4)'
                : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 text-center text-lg">{MEDALS[i] ?? `${i + 1}`}</span>
              <span className="text-xl">{p.emoji}</span>
              <span className="font-bold">{p.name}</span>
            </div>
            <span className={`text-lg font-black ${scoreColor}`}>
              {p.score > 0 ? '+' : ''}
              {p.score}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function DetailTable({ game }: { game: GameState }) {
  const maxRounds = game.players[0]!.roundScores.length;
  return (
    <motion.div
      className="mx-auto w-full max-w-lg overflow-x-auto rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <table className="w-full text-center text-sm">
        <thead>
          <tr className="text-white/40">
            <th className="px-3 py-2 text-left">玩家</th>
            {Array.from({ length: maxRounds }, (_, i) => (
              <th key={i} className="px-2 py-2">
                {ROUND_CN[i]}
                <br />
                <span className="text-[10px] text-white/25">×{MULTS[i]}</span>
              </th>
            ))}
            <th className="px-3 py-2">总计</th>
          </tr>
        </thead>
        <tbody>
          {game.players.map((p, pi) => (
            <tr
              key={pi}
              style={{
                background: p.isHuman ? 'rgba(45,138,78,0.08)' : 'transparent',
              }}
            >
              <td className="px-3 py-1.5 text-left font-semibold">
                {p.emoji} {p.name}
              </td>
              {p.roundScores.map((d, ri) => (
                <td
                  key={ri}
                  className={`px-2 py-1.5 ${
                    d > 0
                      ? 'text-[var(--win)]'
                      : d < 0
                        ? 'text-[var(--lose)]'
                        : 'text-white/30'
                  }`}
                >
                  {d > 0 ? '+' : ''}
                  {d}
                </td>
              ))}
              <td
                className={`px-3 py-1.5 font-black ${
                  p.score > 0
                    ? 'text-[var(--win)]'
                    : p.score < 0
                      ? 'text-[var(--lose)]'
                      : 'text-white/50'
                }`}
              >
                {p.score > 0 ? '+' : ''}
                {p.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

export default function GameOverScreen() {
  const game = useGameStore((s) => s.game)!;
  const quickRestart = useGameStore((s) => s.quickRestart);
  const goToMenu = useGameStore((s) => s.goToMenu);

  const humanScore = game.players[0]!.score;

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <motion.h1
        className="mb-2 text-3xl font-black"
        style={{
          background:
            humanScore > 0
              ? 'linear-gradient(135deg, var(--win), var(--sunlight))'
              : humanScore < 0
                ? 'linear-gradient(135deg, var(--lose), #ff6b6b)'
                : 'linear-gradient(135deg, var(--chalk), var(--sky))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {humanScore > 0 ? '大获全胜！' : humanScore < 0 ? '惜败...' : '游戏结束'}
      </motion.h1>
      <motion.p
        className="mb-6 text-sm text-white/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        总得分：
        <span className={humanScore > 0 ? 'text-[var(--win)]' : humanScore < 0 ? 'text-[var(--lose)]' : 'text-white/60'}>
          {humanScore > 0 ? '+' : ''}{humanScore}
        </span>
      </motion.p>

      <Standings game={game} />

      <div className="my-6 h-px w-full max-w-lg bg-white/8" />

      <DetailTable game={game} />

      <motion.div
        className="mt-8 flex gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={quickRestart}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="rounded-xl px-8 py-3 text-lg font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--field), var(--field-light))',
            boxShadow: '0 4px 16px rgba(45,138,78,0.3)',
          }}
        >
          再来一局
        </motion.button>
        <motion.button
          onClick={goToMenu}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="rounded-xl px-8 py-3 text-lg font-bold"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          返回菜单
        </motion.button>
      </motion.div>
    </div>
  );
}
