export interface SeatPosition {
  x: number;
  y: number;
  angle: number;
}

export function getSeatPositions(totalPlayers: number): SeatPosition[] {
  const seats: SeatPosition[] = [];

  seats.push({ x: 50, y: 92, angle: 270 });

  const aiCount = totalPlayers - 1;
  if (aiCount === 0) return seats;

  if (aiCount === 1) {
    seats.push({ x: 50, y: 8, angle: 90 });
  } else {
    const startAngle = 200;
    const endAngle = 340;
    for (let i = 0; i < aiCount; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / (aiCount - 1);
      const rad = (angle * Math.PI) / 180;
      const x = 50 + 42 * Math.cos(rad);
      const y = 48 + 35 * Math.sin(rad);
      seats.push({ x, y, angle });
    }
  }

  return seats;
}
