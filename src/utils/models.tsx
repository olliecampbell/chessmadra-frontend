import { Square } from "@lubert/chess.ts/dist/types";
import { BySide, RepertoireGrade, Side } from "./utils/repertoire";

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
  id: string;
  // paid?: string;
  email: string;
  // subscription: ApplicationSubscription;
  apiKey: string;
  betaAccess: boolean;
  // The behind-the-scenes range
  eloRange: string;
  temporary: boolean;
  isAdmin: boolean;
  missThreshold: number;
  // The range/system that's visible to the user
  ratingRange: string;
  ratingSystem: string;
  theme?: string;
  pieceSet?: string;
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

export interface PlayerTemplate {
  id: string;
  meta: PlayerTemplateMeta;
  grade: RepertoireGrade;
}

export interface PlayerTemplateMeta {
  link: string;
  title: string;
  openings: string[];
  image: string;
  description: string;
}

export interface PositionReport {
  epd: string;
  suggestedMoves: SuggestedMove[];
  instructiveGames: InstructiveGame[];
  pawnStructure: PawnStructure;
  stockfish?: StockfishReport;
  results: GameResultsDistribution;
  masterResults: GameResultsDistribution;
  plans: Plan[];
  side: Side;
}

export interface InstructiveGame {
  gameLink: string;
  whiteName: string;
  blackName: string;
  moves: string[];
  numberMoves: number;
}

export interface PawnStructure {
  name: string;
  reversed: boolean;
}

export interface StockfishReport {
  eval: number;
  mate: number;
  nodesK: number;
}

export interface SuggestedMove {
  danger?: number;
  sanPlus: string;
  epdAfter: string;
  stockfish?: StockfishReport;
  results: GameResultsDistribution;
  masterResults: GameResultsDistribution;
  percentagePlayedAtLevel: number;
  annotation: string;
  needed: boolean;
  incidence: number;
}

export interface GameResultsDistribution {
  white: number;
  black: number;
  draw: number;
}

export interface EcoCode {
  epd: string;
  fullName: string;
  code: string;
}

export interface PawnStructureDetails {
  id: string;
  name: string;
  moreInfoLink: string;
  plans: string;
  pawnEpds: string;
  opponentPlans: string;
}

export interface MoveAnnotationReview {
  epd: string;
  san: string;
  annotations: {
    userId: string;
    userEmail: string;
    text: string;
  }[];
}

export interface MoveAnnotation {
  epd: string;
  san: string;
  text: string;
  userId: string;
}

export enum MoveTag {
  RareDangerous,
  CommonMistake,
  TheoryHeavy,
  BestMove,
  Transposes,
}

export interface Plan {
  fromSquare: Square;
  toSquare: Square;
  side: Side;
  san: string;
  occurences: number;
}

export interface ModelGame {
  gameLink: string;
  result: Side;
  moves: string[];
}

export interface LineReport {
  modelGames: BySide<ModelGame[]>;
}

export interface AuthResponse {
  user: User;
  token: string;
  firstAuthentication?: boolean;
}
