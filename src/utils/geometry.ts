export interface SeatPosition {
  x: number;
  y: number;
  angle: number;
}

/**
 * Distribute ALL seats evenly around an oval, like a real poker table.
 * Human (index 0) sits at the bottom center (6 o'clock position).
 * AI seats fill the remaining positions going clockwise.
 */
export function getSeatPositions(totalPlayers: number): SeatPosition[] {
  const seats: SeatPosition[] = [];

  const cx = 50;
  const cy = 50;
  const rx = 44;
  const ry = 38;

  const step = 360 / totalPlayers;

  for (let i = 0; i < totalPlayers; i++) {
    // Start at 90° (bottom center = human), go counter-clockwise in math
    // which is clockwise on screen
    const deg = 90 + i * step;
    const rad = (deg * Math.PI) / 180;
    const x = cx + rx * Math.cos(rad);
    const y = cy + ry * Math.sin(rad);
    seats.push({ x, y, angle: deg });
  }

  return seats;
}
