import { Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import { LichessGame } from "app/models";
import { ChessboardState } from "app/types/ChessboardBiref";
import create, {
  GetState,
  SetState,
  State,
  StateCreator,
  StoreApi,
} from "zustand";
import { devtools } from "zustand/middleware";
import {
  createQuick,
  DEFAULT_CHESS_STATE,
  logProxy,
  immer,
  setter,
  flashRing,
} from "./state";
import { cloneDeep, dropWhile, isEmpty, last, sample, take } from "lodash";
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
  ProgressMessage,
  ProgressMessageType,
} from "app/types/VisualizationState";

export interface GameMemorizationState {
  quick: (fn: (_: GameMemorizationState) => void) => void;
  chessState: ChessboardState;
  progressMessage: ProgressMessage;
  activeGame: LichessGame;
  onSquarePress: (square: Square) => void;
  setActiveGame: (game: LichessGame, _state?: GameMemorizationState) => void;
  fetchGames: (_state?: GameMemorizationState) => void;
  retryGame: (_state?: GameMemorizationState) => void;
  makeNextMove: (_state?: GameMemorizationState) => void;
  newRandomGame: (_state?: GameMemorizationState) => void;
  giveUpOnMove: (_state?: GameMemorizationState) => void;
  nextMoves: MoveIdentifier[];
  movesMissed: number;
  games: LichessGame[];
  missedCurrentMove: boolean;
  numReviewed: StorageItem<number>;
  moveNumber: number;
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
          chessState: DEFAULT_CHESS_STATE,
          numReviewed: new StorageItem("memorized-games-review", 0),
          onSquarePress: (square: Square) =>
            set((state) => {
              if (state.nextMoves.length === 0) {
                return;
              }
              let availableMove = state.chessState.availableMoves.find(
                (m) => m.to == square
              );
              if (availableMove) {
                if (availableMove.san == state.nextMoves[0]) {
                  state.makeNextMove(state);
                  flashRing(state.chessState, true);
                } else {
                  flashRing(state.chessState, false);
                  if (!state.missedCurrentMove) {
                    state.movesMissed += 1;
                  }
                }
                return;
              }
              let from = state.chessState.availableMoves[0]?.from;
              if (from === square) {
                state.chessState.availableMoves = [];
                return;
              }
              let moves = state.chessState.position.moves({
                square,
                verbose: true,
              });
              state.chessState.availableMoves = moves;
            }),
          retryGame: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              s.setActiveGame(s.activeGame, s);
            }),
          makeNextMove: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              s.chessState.availableMoves = [];
              s.moveNumber += 1;
              let move = s.nextMoves.shift();
              s.chessState.position.move(move);
              move = s.nextMoves.shift();
              s.chessState.position.move(move);
              s.missedCurrentMove = false;
              if (isEmpty(s.nextMoves)) {
                s.numReviewed.value += 1;
                s.progressMessage = {
                  message: `You're done reviewing this game! You got ${s.movesMissed} moves wrong. New game or retry?`,
                  type: ProgressMessageType.Success,
                };
              }
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
              s.makeNextMove(s);
            }),
          setActiveGame: (game: LichessGame, _state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              s.activeGame = game;
              s.missedCurrentMove = false;
              s.moveNumber = 0;
              s.progressMessage = null;
              s.chessState.position = new Chess();
              s.movesMissed = 0;
              if (s.activeGame.result === -1) {
                s.chessState.flipped = true;
              }
              s.nextMoves = s.activeGame.moves;
            }),
          fetchGames: (_state?: GameMemorizationState) =>
            setter(set, _state, (s) => {
              (async () => {
                let { data: games }: { data: LichessGame[] } = await client.get(
                  "/api/v1/my_games"
                );
                set((s) => {
                  s.games = games;
                });
              })();
            }),
        } as GameMemorizationState)
    ),
    { name: "GameMemorizationTrainingState" }
  )
);
