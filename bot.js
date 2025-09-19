// A tiny, beatable bot: prefers captures and promotions, otherwise random legal move.
export function pickBotMove(chess) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  // Prefer promotions
  const promos = moves.filter(m => m.promotion);
  if (promos.length) return promos[Math.floor(Math.random()*promos.length)];

  // Prefer captures
  const captures = moves.filter(m => m.flags.includes("c"));
  if (captures.length) return captures[Math.floor(Math.random()*captures.length)];

  // Otherwise, random
  return moves[Math.floor(Math.random()*moves.length)];
}
