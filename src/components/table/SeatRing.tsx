import { getSeatPositions } from '../../utils/geometry';
import Seat from './Seat';
import type { GameState } from '../../game/GameEngine';
import type { RoundResult } from '../../game/payout';

interface SeatRingProps {
  game: GameState;
}

export default function SeatRing({ game }: SeatRingProps) {
  const positions = getSeatPositions(game.np);
  const aiPlayers = game.players.filter((p) => !p.isHuman);
  const aiPositions = positions.slice(1);

  const resultMap = new Map<number, RoundResult>();
  if (game.lastResults) {
    for (const r of game.lastResults) {
      resultMap.set(r.pi, r);
    }
  }

  return (
    <>
      {aiPlayers.map((player, i) => {
        const pos = aiPositions[i]!;
        const pi = game.players.indexOf(player);
        return (
          <div
            key={pi}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <Seat
              player={player}
              result={resultMap.get(pi)}
              phase={game.phase}
              compact={game.np > 5}
            />
          </div>
        );
      })}
    </>
  );
}
