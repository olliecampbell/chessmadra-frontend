import { Move, Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import { LichessGame } from "app/models";
import { drop, filter, first, isEmpty, sample, shuffle, sortBy } from "lodash";
import { StorageItem } from "./storageItem";
import { Chess } from "@lubert/chess.ts";
import {
  PlaybackSpeed,
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";
import { ChessboardState, createChessState } from "./chessboard_state";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { logProxy } from "./state";
import { MoveIdentifier } from "./repertoire";

export interface GameMemorizationState {
  quick: (fn: (_: GameMemorizationState) => void) => void;
  chessboardState: ChessboardState;
  progressMessage: ProgressMessage;
  activeGame: LichessGame;
  onSquarePress: (square: Square) => void;
  setActiveGame: (game: LichessGame) => void;
  fetchGames: () => void;
  retryGame: () => void;
  makeNextMove: (animateOwnMove: boolean) => void;
  _makeNextMove: (
    animate: boolean,
    onAnimationEnd: (state: GameMemorizationState) => void
  ) => void;
  newRandomGame: () => void;
  giveUpOnMove: () => void;
  nextMoves: MoveIdentifier[];
  movesMissed: number;
  games: LichessGame[];
  gameStatuses: Record<string, MemorizedGameStatus>;
  missedCurrentMove: boolean;
  numReviewed: StorageItem<number>;
  moveNumber: number;
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

export type Stack = [GameMemorizationState, AppState];

export const getInitialGameMemorizationState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T): T => {
    return _set((s) => fn([s.gameMemorizationState, s]));
  };
  const setOnly = <T,>(fn: (stack: GameMemorizationState) => T): T => {
    return set(([s]) => fn(s));
  };
  const get = <T,>(fn: (stack: Stack) => T): T => {
    return _get((s) => fn([s.gameMemorizationState, s]));
  };
  let initialState = {
    ...createQuick(setOnly),
    numReviewed: new StorageItem("memorized-games-review", 0),
    retryGame: () =>
      set(([s]) => {
        s.setActiveGame(s.activeGame);
      }),
    makeNextMove: (animateOwnMove: boolean) =>
      set(([s]) => {
        s.chessboardState.availableMoves = [];
        s._makeNextMove(animateOwnMove, () => {
          set(([s]) => {
            s._makeNextMove(true, () => {});
            s.missedCurrentMove = false;
            if (isEmpty(s.nextMoves)) {
              s.numReviewed.value += 1;
              s.progressMessage = {
                message: `You're done reviewing this game! You got ${s.movesMissed} moves wrong. New game or retry?`,
                type: ProgressMessageType.Success,
              };
              client
                .post("/api/v1/my_games/mark_reviewed", {
                  gameId: s.activeGame.id,
                  movesMissed: s.movesMissed,
                })
                .then(() => {
                  set(([s]) => {
                    s.fetchGames();
                  });
                });
            }
          });
        });
      }),
    newRandomGame: () =>
      set(([s]) => {
        console.log("Getting a new random game");
        let game =
          getRandomWithStatus(
            s.games,
            s.gameStatuses,
            (s: MemorizedGameStatus) => s.needsReview
          ) ??
          getRandomWithStatus(
            s.games,
            s.gameStatuses,
            (s: MemorizedGameStatus) => !s.needsReview && !s.everReviewed
          );
        // let gamesNeededToReview = s.games.filter();
        // let game = sample(s.games);
        s.setActiveGame(game);
      }),
    giveUpOnMove: () =>
      set(([s]) => {
        console.log("s", s);
        s.movesMissed += 1;
        s.makeNextMove(true);
      }),
    _makeNextMove: (animate: boolean, onAnimationEnd: () => void) =>
      set(([s]) => {
        let move = first(s.nextMoves);
        if (!move) {
          return;
        }
        s.moveNumber += 1;
        console.log("Move is ", move);
        s.nextMoves = drop(s.nextMoves, 1);
        console.log("next moves", logProxy(s.nextMoves));
        let moveObj = s.chessboardState.position.validateMoves([move])?.[0];
        console.log("Move obj", moveObj);
        if (animate) {
          s.chessboardState.animatePieceMove(
            moveObj,
            PlaybackSpeed.Normal,
            (completed) => {
              if (completed) {
                onAnimationEnd();
              }
            }
          );
        } else {
          s.chessboardState.position.move(moveObj);
          onAnimationEnd();
        }
      }),

    setActiveGame: (game: LichessGame) =>
      set(([s]) => {
        s.activeGame = game;
        s.missedCurrentMove = false;
        s.moveNumber = 0;
        s.progressMessage = null;
        s.chessboardState.position = new Chess();
        s.movesMissed = 0;
        if (s.activeGame) {
          s.nextMoves = s.activeGame.moves;
          if (s.activeGame.result === -1) {
            s.chessboardState.flipped = true;
            s._makeNextMove(false, () => {});
          } else {
            s.chessboardState.flipped = false;
          }
        }
      }),
    fetchGames: () =>
      set(([s]) => {
        (async () => {
          let { data: resp }: { data: MyGamesResponse } = await client.get(
            "/api/v1/my_games"
          );
          // @ts-ignore
          set(([s]) => {
            s.games = sortBy(shuffle(resp.games), (g) => {
              if (resp.gameStatuses[g.id].needsReview) {
                return -100;
              }
              if (resp.gameStatuses[g.id].everReviewed) {
                return -10;
              }
              return g.numberMoves;
            });
            s.gameStatuses = resp.gameStatuses;
          });
        })();
      }),
  } as GameMemorizationState;

  const setChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _set((s) => fn(s.gameMemorizationState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T): T => {
    return _get((s) => fn(s.gameMemorizationState.chessboardState));
  };
  initialState.chessboardState = createChessState(setChess, getChess);
  initialState.chessboardState.delegate = {
    shouldMakeMove: (move: Move) =>
      set(([state]) => {
        if (move.san == state.nextMoves[0]) {
          state.makeNextMove(false);
          state.chessboardState.flashRing(true);
        } else {
          state.chessboardState.flashRing(false);
          if (!state.missedCurrentMove) {
            state.movesMissed += 1;
          }
          state.missedCurrentMove = true;
        }
        return false;
      }),
  };
  return initialState;
};
