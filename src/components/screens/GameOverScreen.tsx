import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { ROUND_CN, MULTS } from '../../game/Card';
import type { GameState } from '../../game/GameEngine';
import CharacterAvatar from '../avatar/CharacterAvatar';
import { playSound, playBgm, stopBgm } from '../../hooks/useSound';

const MEDALS = ['🥇', '🥈', '🥉'];

function Standings({ game }: { game: GameState }) {
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  return (
    <div className="mx-auto w-full max-w-md space-y-1">
      {sorted.map((p, i) => {
        const scoreColor =
          p.score > 0 ? '#45d870' : p.score < 0 ? '#e85555' : '#707060';
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center justify-between rounded-lg px-4 py-2.5"
            style={{
              background: p.isHuman
                ? 'rgba(240,202,80,0.08)'
                : i === 0
                  ? 'rgba(255,255,255,0.03)'
                  : 'transparent',
              border: p.isHuman
                ? '1px solid rgba(240,202,80,0.16)'
                : '1px solid transparent',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 text-center text-[15px]">{MEDALS[i] ?? `${i + 1}`}</span>
              <CharacterAvatar
                charIdx={p.charIdx}
                mood={p.score > 0 ? 'win' : p.score < 0 ? 'lose' : 'neutral'}
                size={32}
                ringWidth={1.5}
                ringColor="rgba(255,255,255,0.18)"
                fallbackEmoji={p.emoji}
              />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold" style={{ color: '#f2ede4' }}>{p.name}</span>
                {p.style && <span className="text-[9px]" style={{ color: '#808070' }}>{p.style}</span>}
              </div>
            </div>
            <span className="text-[14px] font-black" style={{ color: scoreColor }}>
              {p.score > 0 ? '+' : ''}{p.score}
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
        background: 'linear-gradient(180deg, rgba(14,36,24,0.95), rgba(10,28,18,0.98))',
        border: '1px solid rgba(240,202,80,0.1)',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <table className="w-full text-center text-[11px]">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-left font-medium" style={{ color: '#808070' }}>玩家</th>
            {Array.from({ length: maxRounds }, (_, i) => (
              <th key={i} className="px-2 py-2.5 font-medium" style={{ color: '#808070' }}>
                {ROUND_CN[i]}
                <br />
                <span style={{ fontSize: 9, color: '#506050' }}>×{MULTS[i]}</span>
              </th>
            ))}
            <th className="px-3 py-2.5 font-medium" style={{ color: '#808070' }}>总计</th>
          </tr>
        </thead>
        <tbody>
          {game.players.map((p, pi) => (
            <tr
              key={pi}
              style={{
                background: p.isHuman ? 'rgba(240,202,80,0.05)' : 'transparent',
                borderTop: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <td className="px-3 py-2 text-left font-semibold" style={{ color: '#f2ede4' }}>
                <span className="inline-flex items-center gap-1.5 align-middle">
                  <CharacterAvatar
                    charIdx={p.charIdx}
                    mood="neutral"
                    size={22}
                    ringWidth={1}
                    ringColor="rgba(255,255,255,0.14)"
                    fallbackEmoji={p.emoji}
                  />
                  <span>{p.name}</span>
                </span>
              </td>
              {p.roundScores.map((d, ri) => (
                <td
                  key={ri}
                  className="px-2 py-2"
                  style={{
                    color: d > 0 ? '#45d870' : d < 0 ? '#e85555' : '#506050',
                    fontWeight: d !== 0 ? 600 : 400,
                  }}
                >
                  {d > 0 ? '+' : ''}{d}
                </td>
              ))}
              <td className="px-3 py-2 font-black" style={{
                color: p.score > 0 ? '#45d870' : p.score < 0 ? '#e85555' : '#707060',
              }}>
                {p.score > 0 ? '+' : ''}{p.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

export default function GameOverScreen() {
  const game = useGameStore((s) => s.game);
  const quickRestart = useGameStore((s) => s.quickRestart);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const [hoverRestart, setHoverRestart] = useState(false);
  const [hoverMenu, setHoverMenu] = useState(false);

  // 进入结算页时根据胜负播放 fanfare BGM（hooks 必须在 early-return 之前）
  useEffect(() => {
    if (!game) return;
    const score = game.players[0]!.score;
    if (score > 0) playBgm('fanfareWin');
    else if (score < 0) playBgm('fanfareLose');
    else playSound('chime');
    return () => {
      stopBgm();
    };
  }, [game]);

  // 切换到菜单时 game 会被置 null，但 AnimatePresence 可能还短暂保留本组件，
  // 此时直接返回空避免读取 null.players。
  if (!game) return null;

  const humanScore = game.players[0]!.score;
  const humanRank =
    [...game.players]
      .sort((a, b) => b.score - a.score)
      .findIndex((p) => p.isHuman) + 1;

  const resultEmoji =
    humanRank === 1 ? '🏆' : humanRank === 2 ? '🥈' : humanRank === 3 ? '🥉' : humanScore >= 0 ? '🎮' : '😢';

  const resultText =
    humanScore > 0 ? '大获全胜' : humanScore < 0 ? '惜败' : '游戏结束';

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center px-5 py-10"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 15%, rgba(240,202,80,0.05) 0%, transparent 60%),
          linear-gradient(180deg, #081610 0%, #0e2016 50%, #081610 100%)
        `,
      }}
    >
      <motion.div
        className="mb-2 text-5xl"
        initial={{ scale: 0, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        {resultEmoji}
      </motion.div>

      <motion.h1
        className="mb-1 text-[28px] font-black tracking-wide"
        style={{
          fontFamily: "'Noto Serif SC', serif",
          color: humanScore > 0 ? '#45d870' : humanScore < 0 ? '#e85555' : '#ffd868',
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {resultText}
      </motion.h1>

      <motion.p
        className="mb-8 flex items-center gap-2 text-[12px]"
        style={{ color: '#808070' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span>第{humanRank}名</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>
          总分&thinsp;
          <span className="font-bold" style={{ color: humanScore > 0 ? '#45d870' : humanScore < 0 ? '#e85555' : '#b0a898' }}>
            {humanScore > 0 ? '+' : ''}{humanScore}
          </span>
        </span>
      </motion.p>

      <Standings game={game} />

      <div className="my-5 h-px w-full max-w-lg" style={{ background: 'rgba(240,202,80,0.1)' }} />

      <DetailTable game={game} />

      <motion.div
        className="mt-7 flex gap-3"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <button
          onClick={() => {
            playSound('confirm');
            quickRestart();
          }}
          onMouseEnter={() => setHoverRestart(true)}
          onMouseLeave={() => setHoverRestart(false)}
          className="rounded-xl px-8 py-3 text-[14px] font-black"
          style={{
            fontFamily: "'Noto Serif SC', serif",
            background: hoverRestart
              ? 'linear-gradient(180deg, #ffd868, #f0ca50)'
              : 'linear-gradient(180deg, #f0ca50, #d4a840)',
            color: '#0e1e16',
            border: 'none',
            cursor: 'pointer',
            boxShadow: hoverRestart
              ? '0 6px 24px rgba(240,202,80,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 2px 12px rgba(240,202,80,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
            transform: hoverRestart ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
          }}
        >
          再来一局
        </button>
        <button
          onClick={() => {
            playSound('back');
            goToMenu();
          }}
          onMouseEnter={() => setHoverMenu(true)}
          onMouseLeave={() => setHoverMenu(false)}
          className="rounded-xl px-8 py-3 text-[14px] font-bold"
          style={{
            background: hoverMenu ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            color: hoverMenu ? '#c0b8a0' : '#8a8878',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            transform: hoverMenu ? 'translateY(-1px)' : 'translateY(0)',
            transition: 'all 0.2s ease',
          }}
        >
          返回菜单
        </button>
      </motion.div>
    </div>
  );
}
