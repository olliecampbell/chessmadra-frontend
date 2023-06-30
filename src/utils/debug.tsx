const debug_epds: string[] = [
  // "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -",
  // "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -",
];

export const shouldDebugEpd = (epd: string) => {
  return debug_epds.includes(epd);
};
