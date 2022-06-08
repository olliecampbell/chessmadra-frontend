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
import { cloneDeep, dropWhile, isEmpty, last, take } from "lodash";
import {
  BySide,
  lineToPgn,
  PendingLine,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
} from "./repertoire";
import { StorageItem } from "./storageItem";
import {
  ChessboardState,
  ChessboardStateParent,
  createChessState,
} from "./chessboard_state";

export interface RepertoireState
  extends ChessboardState,
    ChessboardStateParent<RepertoireState> {
  getPendingLine: (_state?: RepertoireState) => PendingLine;
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: StorageItem<Repertoire>;
  repertoireGrades: BySide<RepertoireGrade>;
  activeSide: Side;
  fetchRepertoireGrade: (_state?: RepertoireState) => void;
  initializeRepertoire: (_: {
    lichessUsername: string;
    chessComUsername: string;
    whitePgn: string;
    blackPgn: string;
    state?: RepertoireState;
  }) => void;
  initState: (_state?: RepertoireState) => void;
  playPgn: (pgn: string, _state?: RepertoireState) => void;
  addPendingLine: (_state?: RepertoireState) => void;
  onSquarePress: (square: Square) => void;
}

export const DEFAULT_REPERTOIRE = {
  white: {
    side: "white",
    tree: [
      {
        id: "1.e4",
        sanPlus: "e4",
        mine: true,
        side: "white",
        responses: [
          {
            id: "1.e4 e5",
            sanPlus: "e5",
            mine: false,
            side: "black",
            responses: [
              {
                id: "1.e4 e5 2.f4",
                sanPlus: "f4",
                mine: true,
                side: "white",
                responses: [],
              },
            ],
          },
          {
            id: "1.e4 d5",
            sanPlus: "d5",
            mine: false,
            side: "black",
            responses: [],
          },
        ],
      },
    ],
  },
  black: {
    side: "black",
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
          // repertoire: null,
          repertoire: new StorageItem("repertoire_v2", null),
          repertoireGrades: { white: null, black: null },
          activeSide: "white",
          initState: () => {
            let state = get();
            // state.position.move("e4");
            // state.position.move("c5");
            // state.position.move("d4");
            if (state.repertoire.value) {
              state.fetchRepertoireGrade(state);
            }
          },
          playPgn: (pgn: string, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.position.loadPgn(pgn);
            }),
          initializeRepertoire: ({
            state,
            lichessUsername,
            chessComUsername,
            blackPgn,
            whitePgn,
          }) =>
            setter(set, state, async (s) => {
              let lichessGames = [];
              let chessComGames = [];
              if (lichessUsername) {
                let max = 200;
                let { data }: { data: string } = await client.get(
                  `https://lichess.org/api/games/user/${encodeURIComponent(
                    lichessUsername
                  )}?max=${max}`,
                  {
                    headers: { Accept: "application/x-ndjson" },
                  }
                );
                lichessGames = data
                  .split("\n")
                  .filter((s) => s.length > 2)
                  .map((s) => JSON.parse(s));
              }
              let { data } = await client.post(
                "/api/v1/initialize_repertoire",
                {
                  lichessGames,
                  lichessUsername,
                  chessComGames,
                  whitePgn,
                  blackPgn,
                }
              );
              set((s) => {
                s.repertoire.value = data;
                s.fetchRepertoireGrade(s);
              });
            }),
          fetchRepertoireGrade: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log("s repertoire", logProxy(s));
              let side = s.activeSide;
              client
                .post(
                  "/api/v1/grade_opening",
                  cloneDeep(s.repertoire.value[side])
                )
                .then(({ data }) => {
                  console.log("data", data);
                  set((s) => {
                    s.repertoireGrades[side] = data as RepertoireGrade;
                  });
                });
            }),
          ...createChessState(get, set, () => {}),
          addPendingLine: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log("Before getting pending line");
              const { knownLine, pendingLine } = s.getPendingLine(s);
              console.log("Before adding pending line");
              let line = [...knownLine];
              let activeRepertoire: RepertoireSide =
                s.repertoire.value[s.activeSide];
              let node = getNodeFromRepertoire(activeRepertoire, knownLine);
              while (pendingLine.length > 0) {
                let move = pendingLine.shift();
                line.push(move);
                node.responses.push({
                  id: lineToPgn(line),
                  sanPlus: move,
                  mine: sideOfLastmove(line) === s.activeSide,
                  side: sideOfLastmove(line),
                  responses: [],
                });
                node = last(node.responses);
              }
              console.log("After adding pending line");
              s.repertoire.save();
              s.fetchRepertoireGrade(s);
            }),
          getPendingLine: (_state?: RepertoireState) => {
            let state = _state ?? get();
            if (state.repertoire.value === null) {
              return null;
            }
            let history = state.position.history();
            let activeRepertoire: RepertoireSide =
              state.repertoire.value[state.activeSide];
            let currentLine: string[] = [];
            let missedMoves = dropWhile(history, (move) => {
              currentLine.push(move);
              return (
                getNodeFromRepertoire(activeRepertoire, currentLine) != null
              );
            });
            console.log("Missed moves", missedMoves);
            if (!isEmpty(missedMoves)) {
              let knownMoves = take(
                history,
                history.length - missedMoves.length
              );
              return {
                pendingLine: missedMoves,
                knownLine: knownMoves,
              };
            }
            return null;
          },
        } as RepertoireState)
    ),
    { name: "RepertoireTrainingState" }
  )
);

function getNodeFromRepertoire(repertoire: RepertoireSide, _line: string[]) {
  let line = [..._line];
  let responses = repertoire.tree;
  let node: RepertoireMove = null;
  // console.log("Line is ", line);
  // console.log("Repertoire", repertoire);
  while (line.length > 0) {
    let move = line.shift();

    node = responses.find((n) => {
      return n.sanPlus == move;
    });
    if (!node) {
      break;
    }
    responses = node.responses;
  }
  // console.log("Node is ", node);

  return node;
}
