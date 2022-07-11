export interface LichessPuzzle {
  id: string;
  moves: string[];
  fen: string;
  popularity: number;
  tags: string[];
  gameLink: string;
  rating: number;
  ratingDeviation: number;
  numberPlays: number;
  allMoves: string[];
  maxPly: number;
}

export interface BlunderPuzzle {
  id: string;
  fen: string;
  bestMove: string;
  blunder: string;
  centipawnsLost: number;
}

export interface User {
  // paid?: string;
  email: string;
  // subscription: ApplicationSubscription;
  apiKey: string;
  betaAccess: boolean;
}

export interface LichessGame {
  id: string;
  gameLink: string;
  result: number; // GameResult
  moves: string[];
  blackCentipawnLoss: number;
  whiteCentipawnLoss: number;
  numberMoves: number;
  whiteElo: number;
  blackElo: number;
  time: number;
  whiteBlunders: number;
  blackBlunders: number;
  whiteName: string;
  blackName: string;
  whiteMistakes: number;
  blackMistakes: number;
}

export interface RepertoireTemplate {
  title: string;
  id: string;
  followUp: string;
  line: string;
  num_moves: number;
  tags: string[];
}
