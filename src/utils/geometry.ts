export interface SeatPosition {
  x: number;
  y: number;
  angle: number;
}

/**
 * Distribute AI seats around a portrait rounded-rectangle table perimeter.
 * Human player (index 0) is always below the table in the card-hand area,
 * so we only return positions for AI opponents starting from index 1.
 */
export function getSeatPositions(totalPlayers: number): SeatPosition[] {
  const seats: SeatPosition[] = [];

  // Index 0: human — placed below the table (not rendered on table)
  seats.push({ x: 50, y: 105, angle: 0 });

  const aiCount = totalPlayers - 1;
  if (aiCount === 0) return seats;

  if (aiCount === 1) {
    seats.push({ x: 50, y: 6, angle: 180 });
  } else if (aiCount === 2) {
    seats.push({ x: 30, y: 6, angle: 180 });
    seats.push({ x: 70, y: 6, angle: 180 });
  } else if (aiCount === 3) {
    seats.push({ x: 25, y: 6, angle: 180 });
    seats.push({ x: 50, y: 6, angle: 180 });
    seats.push({ x: 75, y: 6, angle: 180 });
  } else if (aiCount === 4) {
    seats.push({ x: 20, y: 6, angle: 180 });
    seats.push({ x: 50, y: 6, angle: 180 });
    seats.push({ x: 80, y: 6, angle: 180 });
    seats.push({ x: 6, y: 45, angle: 90 });
  } else if (aiCount === 5) {
    seats.push({ x: 20, y: 6, angle: 180 });
    seats.push({ x: 50, y: 6, angle: 180 });
    seats.push({ x: 80, y: 6, angle: 180 });
    seats.push({ x: 6, y: 35, angle: 90 });
    seats.push({ x: 94, y: 35, angle: 270 });
  } else if (aiCount === 6) {
    seats.push({ x: 20, y: 6, angle: 180 });
    seats.push({ x: 50, y: 6, angle: 180 });
    seats.push({ x: 80, y: 6, angle: 180 });
    seats.push({ x: 6, y: 30, angle: 90 });
    seats.push({ x: 94, y: 30, angle: 270 });
    seats.push({ x: 6, y: 55, angle: 90 });
  } else {
    // 7+ AI: top 3, left 2, right 2
    seats.push({ x: 20, y: 6, angle: 180 });
    seats.push({ x: 50, y: 6, angle: 180 });
    seats.push({ x: 80, y: 6, angle: 180 });
    seats.push({ x: 6, y: 28, angle: 90 });
    seats.push({ x: 94, y: 28, angle: 270 });
    seats.push({ x: 6, y: 52, angle: 90 });
    seats.push({ x: 94, y: 52, angle: 270 });
    // Any remaining go along the bottom-sides
    for (let i = 7; i < aiCount; i++) {
      const t = (i - 7 + 1) / (aiCount - 7 + 2);
      seats.push({ x: 15 + t * 70, y: 90, angle: 0 });
    }
  }

  return seats;
}
