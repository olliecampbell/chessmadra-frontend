import { Move } from "@lubert/chess.ts/dist/types";
import { LichessGame } from "~/utils/models";
import { filter, sample } from "lodash-es";
import { ChessboardState, createChessState } from "./chessboard_state";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick, QuickUpdate } from "./quick";

export interface GameSearchState extends QuickUpdate<GameSearchState> {
  chessboardState?: ChessboardState;
  whiteRating: [number, number];
  blackRating: [number, number];
  numberMoves: [number, number];
  whiteBlunders: [number, number];
  blackBlunders: [number, number];
  gameResult: GameSearchResult;
  startingMoves: string[];
  returnedGames: LichessGame[];
  loading: boolean;
}

export enum GameSearchResult {
  White = 1,
  Draw = 0,
  Black = -1,
}

interface MyGamesResponse {
  games: LichessGame[];
  gameStatuses: Record<string, MemorizedGameStatus>;
  needsReview: string[];
}

export interface MemorizedGameStatus {
  needsReview: boolean;
  everReviewed: boolean;
  everPerfect: boolean;
}

function getRandomWithStatus(
  games: LichessGame[],
  gameStatuses: Record<string, MemorizedGameStatus>,
  f: (s: MemorizedGameStatus) => boolean
): LichessGame {
  console.log("Getting a random game w/ this check");
  let filteredGames = filter(games, (game) => {
    let status = gameStatuses[game.id];
    return f(status);
  });
  let randomGame = sample(filteredGames) as LichessGame;
  return randomGame;
}

export type Stack = [GameSearchState, AppState];

export const MIN_ELO = 2200;
export const MAX_ELO = 2800;

export const getInitialGameSearchState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T): T => {
    return _set((s) => fn([s.gameSearchState, s]));
  };
  const setOnly = <T,>(fn: (stack: GameSearchState) => T): T => {
    return set(([s]) => fn(s));
  };
  const get = <T,>(fn: (stack: Stack) => T): T => {
    return _get((s) => fn([s.gameSearchState, s]));
  };
  let initialState = {
    ...createQuick(setOnly),

    numberMoves: [2, 50],
    startingMoves: [],
    whiteRating: [MIN_ELO, MAX_ELO],
    blackRating: [MIN_ELO, MAX_ELO],
    whiteBlunders: [0, 3],
    blackBlunders: [0, 3],
    gameResult: null,
    returnedGames: [],
    loading: false,
  } as GameSearchState;

  const setChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _set((s) => fn(s.gameSearchState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _get((s) => fn(s.gameSearchState.chessboardState));
  };
  initialState.chessboardState = createChessState(setChess, getChess);
  initialState.chessboardState.delegate = {
    shouldMakeMove: (move: Move) =>
      set(([state]) => {
        return true;
      }),
  };
  return initialState;
};
