import { useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { MULTS, ROUND_CN, STEP_COLORS } from '../../game/Card';
import type { Card } from '../../game/Card';
import type { GameState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';

/* ─── tiny card renderer ─── */

function CardFace({ card, dimmed, highlight }: { card: Card; dimmed?: boolean; highlight?: boolean }) {
  const color = card.color === 'red' ? 'text-red-500' : 'text-slate-100';
  const suitDisplay = card.isJoker ? (card.jokerType === 'big' ? '🃏' : '🂠') : card.suit;

  return (
    <div
      className={`relative flex h-20 w-14 flex-col items-center justify-center rounded-lg border font-bold select-none ${
        highlight
          ? 'border-yellow-400 bg-slate-700 ring-2 ring-yellow-400'
          : 'border-slate-600 bg-slate-800'
      } ${dimmed ? 'opacity-40' : ''} ${color}`}
    >
      <span className="absolute top-0.5 left-1 text-xs">{card.displayRank}</span>
      <span className="text-xl">{suitDisplay}</span>
    </div>
  );
}

function CardBack() {
  return (
    <div className="flex h-20 w-14 items-center justify-center rounded-lg border border-slate-600 bg-gradient-to-br from-indigo-800 to-indigo-950 text-2xl select-none">
      🂠
    </div>
  );
}

/* ─── community cards ─── */

function CommunityCards({ game }: { game: GameState }) {
  const { comm, round, phase } = game;
  return (
    <div className="flex justify-center gap-3">
      {comm.map((card, i) => {
        const isCurrent = i === round;
        const isFuture = i > round;
        const isLastCard = i === 3;

        if (isFuture) {
          if (isLastCard && round === 3 && phase === 'result') {
            return <CardFace key={card.id} card={card} />;
          }
          return <CardBack key={card.id} />;
        }
        if (isCurrent) return <CardFace key={card.id} card={card} highlight />;
        return <CardFace key={card.id} card={card} dimmed />;
      })}
    </div>
  );
}

/* ─── player hand ─── */

function PlayerHand({ game }: { game: GameState }) {
  const toggleCard = useGameStore((s) => s.toggleCardSelection);
  const human = game.players[0]!;
  const selectable = game.phase === 'select' && game.round < 4;

  return (
    <div className="flex justify-center gap-2">
      {human.hand.map((card, i) => {
        const selected = game.selectedIndices.includes(i);
        return (
          <button
            key={card.id}
            disabled={!selectable}
            onClick={() => toggleCard(i)}
            className={`transition-transform ${selected ? '-translate-y-2 scale-105' : ''} ${selectable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <CardFace card={card} highlight={selected} />
          </button>
        );
      })}
    </div>
  );
}

/* ─── scores bar ─── */

function ScoresBar({ game }: { game: GameState }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 text-sm">
      {game.players.map((p, i) => (
        <div
          key={i}
          className={`rounded-full px-3 py-1 ${
            p.isHuman ? 'bg-indigo-700' : 'bg-slate-700'
          }`}
        >
          <span className="mr-1">{p.emoji}</span>
          <span className="font-semibold">{p.name}</span>
          <span className={`ml-1 ${p.score > 0 ? 'text-green-400' : p.score < 0 ? 'text-red-400' : 'text-slate-300'}`}>
            {p.score > 0 ? '+' : ''}{p.score}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── AI info ─── */

function AIInfo({ game }: { game: GameState }) {
  const ais = game.players.filter((p) => !p.isHuman);
  return (
    <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400">
      {ais.map((p, i) => (
        <span key={i} className="rounded bg-slate-800 px-2 py-1">
          {p.emoji} {p.name} | 手牌×{p.hand.length} | {p.score > 0 ? '+' : ''}{p.score}
        </span>
      ))}
    </div>
  );
}

/* ─── round result ─── */

function RoundResults({ results, game }: { results: RoundResult[]; game: GameState }) {
  const sorted = [...results].sort((a, b) => a.rank - b.rank);
  return (
    <div className="mx-auto max-w-sm space-y-1 rounded-lg bg-slate-800 p-3">
      {sorted.map((r) => {
        const p = game.players[r.pi]!;
        return (
          <div key={r.pi} className="flex items-center justify-between rounded px-2 py-1 text-sm">
            <span>
              <span className="mr-1 text-slate-500">#{r.rank}</span>
              <span className="mr-1">{p.emoji}</span>
              <span className="font-semibold">{p.name}</span>
              <span className="ml-2 text-slate-400">{r.ev.name}</span>
            </span>
            <span
              className={`font-bold ${r.delta > 0 ? 'text-green-400' : r.delta < 0 ? 'text-red-400' : 'text-slate-400'}`}
            >
              {r.delta > 0 ? '+' : ''}{r.delta}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── splash overlay ─── */

function RoundSplash({ round }: { round: number }) {
  const color = STEP_COLORS[round] ?? '#fff';
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-5xl font-black" style={{ color }}>
        第{ROUND_CN[round]}轮
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-300">×{MULTS[round]}</div>
    </div>
  );
}

/* ─── main screen ─── */

export default function GameScreen() {
  const game = useGameStore((s) => s.game)!;
  const setPhase = useGameStore((s) => s.setPhase);
  const confirmPlay = useGameStore((s) => s.confirmPlay);
  const nextRound = useGameStore((s) => s.nextRound);
  const goToGameOver = useGameStore((s) => s.goToGameOver);

  const { round, phase } = game;
  const isLastRound = round === 4;

  const autoAdvanceFromSplash = useCallback(() => {
    if (isLastRound) {
      confirmPlay();
    } else {
      setPhase('select');
    }
  }, [isLastRound, setPhase, confirmPlay]);

  useEffect(() => {
    if (phase !== 'round-splash') return;
    const timer = setTimeout(autoAdvanceFromSplash, 1500);
    return () => clearTimeout(timer);
  }, [phase, autoAdvanceFromSplash]);

  const canConfirm = phase === 'select' && game.selectedIndices.length === 2;

  return (
    <div className="flex min-h-screen flex-col px-4 py-4">
      {/* round indicator */}
      <div className="mb-2 text-center">
        <span className="text-lg font-bold" style={{ color: STEP_COLORS[round] }}>
          第{ROUND_CN[round]}轮
        </span>
        <span className="ml-2 text-lg text-slate-400">×{MULTS[round]}</span>
      </div>

      {/* scores */}
      <ScoresBar game={game} />

      {/* main area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        {phase === 'round-splash' && <RoundSplash round={round} />}

        {phase !== 'round-splash' && (
          <>
            {/* community */}
            {!isLastRound && (
              <div>
                <div className="mb-1 text-center text-xs text-slate-500">公共牌</div>
                <CommunityCards game={game} />
              </div>
            )}

            {/* AI info */}
            <AIInfo game={game} />

            {/* player hand */}
            <div>
              <div className="mb-1 text-center text-xs text-slate-500">
                你的手牌{phase === 'select' && !isLastRound ? '（选择2张）' : ''}
              </div>
              <PlayerHand game={game} />
            </div>

            {/* result display */}
            {phase === 'result' && game.lastResults && (
              <RoundResults results={game.lastResults} game={game} />
            )}

            {/* thinking */}
            {phase === 'thinking' && (
              <div className="text-slate-400 animate-pulse">对局中...</div>
            )}
          </>
        )}
      </div>

      {/* action bar */}
      <div className="flex justify-center gap-4 pb-4">
        {phase === 'select' && !isLastRound && (
          <button
            disabled={!canConfirm}
            onClick={confirmPlay}
            className={`rounded-xl px-8 py-3 text-lg font-bold transition ${
              canConfirm
                ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 active:scale-95'
                : 'cursor-not-allowed bg-slate-700 text-slate-500'
            }`}
          >
            确认出牌
          </button>
        )}

        {phase === 'result' && !isLastRound && (
          <button
            onClick={nextRound}
            className="rounded-xl bg-indigo-600 px-8 py-3 text-lg font-bold shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 active:scale-95"
          >
            下一轮
          </button>
        )}

        {phase === 'result' && isLastRound && (
          <button
            onClick={goToGameOver}
            className="rounded-xl bg-amber-600 px-8 py-3 text-lg font-bold shadow-lg shadow-amber-500/30 transition hover:bg-amber-500 active:scale-95"
          >
            查看结算
          </button>
        )}
      </div>
    </div>
  );
}
