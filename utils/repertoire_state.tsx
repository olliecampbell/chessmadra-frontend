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
import { createQuick, DEFAULT_CHESS_STATE, logProxy, immer } from "./state";

export type Repertoire = BySide<RepertoireSide>;

export interface BySide<T> {
  white: T;
  black: T;
}

export type Side = "Black" | "White";

export interface RepertoireSide {
  tree: RepertoireMove[];
  side: Side;
}

export interface RepertoireMove {
  id: string;
  sanPlus: string;
  mine: boolean;
  side: Side;
  responses: RepertoireMove[];
}

export type MoveIdentifier = string;

export interface RepertoireGrade {
  moveIncidence: Record<MoveIdentifier, number>;
  expectedDepth: number;
  exampleGames: LichessGame[];
  biggestMiss: RepertoireMiss;
}

export interface RepertoireMiss {
  move: RepertoireMove;
  incidence: number;
}

export interface RepertoireState {
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire;
  repertoireGrades: BySide<RepertoireGrade>;
  activeSide: Side;
  fetchRepertoireGrade: () => void;
  onSquarePress: (square: Square) => void;
  chessState: ChessboardState;
}

export const DEFAULT_REPERTOIRE = {
  white: {
    side: "White",
    tree: [
      {
        id: "1.e4",
        sanPlus: "e4",
        mine: true,
        side: "White",
        responses: [
          {
            id: "1.e4 e5",
            sanPlus: "e5",
            mine: false,
            side: "Black",
            responses: [
              {
                id: "1.e4 e5 2.f4",
                sanPlus: "f4",
                mine: true,
                side: "White",
                responses: [],
              },
            ],
          },
          {
            id: "1.e4 d5",
            sanPlus: "d5",
            mine: false,
            side: "Black",
            responses: [],
          },
        ],
      },
    ],
  },
  black: {
    side: "Black",
    tree: [],
  },
} as Repertoire;

export const useRepertoireState = create<RepertoireState>(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      // TODO: figure out why typescript hates this
      // @ts-ignore
      (
        set: SetState<RepertoireState>,
        get: GetState<RepertoireState>
      ): RepertoireState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          repertoire: DEFAULT_REPERTOIRE,
          repertoireGrades: { white: null, black: null },
          activeSide: "white",
          fetchRepertoireGrade: () => {
            let state = get();
            console.log("state repertoire", logProxy(state));
            let side = state.activeSide;
            client
              .post("/api/v1/grade_opening", state.repertoire[side])
              .then(({ data }) => {
                console.log("data", data);
                set((s) => {
                  s.repertoireGrades[side] = data as RepertoireGrade;
                });
              });
          },
          chessState: DEFAULT_CHESS_STATE,
          onSquarePress: (square: Square) =>
            set((state) => {
              let availableMove = state.chessState.availableMoves.find(
                (m) => m.to == square
              );
              if (availableMove) {
                return;
              }
              let moves = state.chessState.position.moves({
                square,
                verbose: true,
              });
              state.chessState.availableMoves = moves;
            }),
        } as RepertoireState)
    ),
    { name: "RepertoireTrainingState" }
  )
);
