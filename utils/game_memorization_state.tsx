import { Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import { LichessGame } from "app/models";
import create, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from "zustand";
import { devtools } from "zustand/middleware";
import { createQuick, logProxy, immer, setter } from "./state";
import {
  cloneDeep,
  drop,
  dropWhile,
  first,
  isEmpty,
  last,
  sample,
  take,
} from "lodash";
import {
  BySide,
  lineToPgn,
  MoveIdentifier,
  PendingLine,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
} from "./repertoire";
import { StorageItem } from "./storageItem";
import { Chess } from "@lubert/chess.ts";
import {
  PlaybackSpeed,
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";
import {
  ChessboardState,
  ChessboardStateParent,
  createChessState,
} from "./chessboard_state";

export interface GameMemorizationState
  extends ChessboardState,
    ChessboardStateParent<GameMemorizationState> {
  quick: (fn: (_: GameMemorizationState) => void) => void;
  chessState: ChessboardState;
  progressMessage: ProgressMessage;
  activeGame: LichessGame;
  onSquarePress: (square: Square) => void;
  setActiveGame: (game: LichessGame, _state?: GameMemorizationState) => void;
  fetchGames: (_state?: GameMemorizationState) => void;
  retryGame: (_state?: GameMemorizationState) => void;
  makeNextMove: (
    animateOwnMove: boolean,
    _state?: GameMemorizationState
  ) => void;
  _makeNextMove: (
    animate: boolean,
    onAnimationEnd: (state: GameMemorizationState) => void,
    _state?: GameMemorizationState
  ) => void;
  newRandomGame: (_state?: GameMemorizationState) => void;
  giveUpOnMove: (_state?: GameMemorizationState) => void;
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

export const useGameMemorizationState = create<GameMemorizationState>(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      // TODO: figure out why typescript hates this
      // @ts-ignore
      (
        set: SetState<GameMemorizationState>,
        get: GetState<GameMemorizationState>
      ): GameMemorizationState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          ...createChessState(set, get, () => {}),
          numReviewed: new StorageItem("memorized-games-review", 0),
          attemptMove: (move, _state: GameMemorizationState) =>
            setter(set, _state, (state: GameMemorizationState) => {
              if (move.san == state.nextMoves[0]) {
                state.makeNextMove(false, state);
                state.flashRing(true, state);
              } else {
                state.flashRing(false, state);
                if (!state.missedCurrentMove) {
                  state.movesMissed += 1;
                }
                state.missedCurrentMove = true;
              }
              return;
            }),
          // onSquarePress: (square: Square) =>
          //   set((state) => {
          //     if (state.nextMoves.length === 0) {
          //       return;
          //     }
          //     let availableMove = state.chessState.availableMoves.find(
          //       (m) => m.to == square
          //     );
          //     if (availableMove) {
          //     }
          //     let from = state.chessState.availableMoves[0]?.from;
          //     if (from === square) {
          //       state.chessState.availableMoves = [];
          //       return;
          //     }
          //     let moves = state.chessState.position.moves({
          //       square,
          //       verbose: true,
          //     });
          //     state.chessState.availableMoves = moves;
          //   }),
          retryGame: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              s.setActiveGame(s.activeGame, s);
            }),
          makeNextMove: (
            animateOwnMove: boolean,
            _state?: GameMemorizationState
          ) =>
            setter(set, _state, (s) => {
              s.availableMoves = [];
              s._makeNextMove(
                animateOwnMove,
                (s) => {
                  s._makeNextMove(true, () => {}, s);
                  s.missedCurrentMove = false;
                  if (isEmpty(s.nextMoves)) {
                    s.numReviewed.value += 1;
                    s.progressMessage = {
                      message: `You're done reviewing this game! You got ${s.movesMissed} moves wrong. New game or retry?`,
                      type: ProgressMessageType.Success,
                    };
                    client.post("/api/v1/my_games/mark_reviewed", {
                      gameId: s.activeGame.id,
                      movesMissed: s.movesMissed,
                    });
                    s.fetchGames(s);
                  }
                },
                s
              );
            }),
          newRandomGame: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              let game = sample(s.games);
              s.setActiveGame(game, s);
            }),
          giveUpOnMove: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              console.log("s", s);
              s.movesMissed += 1;
              s.makeNextMove(true, s);
            }),
          _makeNextMove: (
            animate: boolean,
            onAnimationEnd: (state: GameMemorizationState) => void,
            _state?: GameMemorizationState
          ) =>
            setter(set, _state, (s) => {
              let move = first(s.nextMoves);
              if (!move) {
                return;
              }
              s.moveNumber += 1;
              console.log("Move is ", move);
              s.nextMoves = drop(s.nextMoves, 1);
              console.log("next moves", logProxy(s.nextMoves));
              let moveObj = s.position.validateMoves([move])?.[0];
              console.log("Move obj", moveObj);
              if (animate) {
                s.animatePieceMove(
                  moveObj,
                  PlaybackSpeed.Normal,
                  (s: GameMemorizationState) => {
                    onAnimationEnd(s);
                  },
                  s
                );
              } else {
                s.position.move(moveObj);
                onAnimationEnd(s);
              }
            }),

          setActiveGame: (game: LichessGame, _state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              s.activeGame = game;
              s.missedCurrentMove = false;
              s.moveNumber = 0;
              s.progressMessage = null;
              s.position = new Chess();
              s.movesMissed = 0;
              if (s.activeGame) {
                s.nextMoves = s.activeGame.moves;
                if (s.activeGame.result === -1) {
                  s.flipped = true;
                  s._makeNextMove(false, () => {}, s);
                } else {
                  s.flipped = false;
                }
              }
            }),
          fetchGames: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              (async () => {
                let { data: resp }: { data: MyGamesResponse } =
                  await client.get("/api/v1/my_games");
                set((s) => {
                  s.games = resp.games;
                  s.gameStatuses = resp.gameStatuses;
                });
              })();
            }),
        } as GameMemorizationState)
    ),
    { name: "GameMemorizationTrainingState" }
  )
);
