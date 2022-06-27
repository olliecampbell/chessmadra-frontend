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
import { createQuick, logProxy, setter } from "./state";

import { immer } from "zustand/middleware/immer";
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
import { Chess } from "@lubert/chess.ts";
import { PlaybackSpeed } from "app/types/VisualizationState";
import _ from "lodash";

export interface RepertoireState
  extends ChessboardState,
    ChessboardStateParent<RepertoireState> {
  getPendingLine: (_state?: RepertoireState) => PendingLine;
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire;
  queue: RepertoireMove[];
  currentMove?: RepertoireMove;
  repertoireGrades: BySide<RepertoireGrade>;
  activeSide: Side;
  failedCurrentMove?: boolean;
  fetchRepertoireGrade: (_state?: RepertoireState) => void;
  fetchRepertoire: (_state?: RepertoireState) => void;
  initializeRepertoire: (_: {
    lichessUsername: string;
    chessComUsername: string;
    whitePgn: string;
    blackPgn: string;
    state?: RepertoireState;
  }) => void;
  initState: (_state?: RepertoireState) => void;
  playPgn: (pgn: string, _state?: RepertoireState) => void;
  // addPendingLine: (_state?: RepertoireState) => void;
  hasGivenUp?: boolean;
  giveUp: (_state?: RepertoireState) => void;
  setupNextMove: (_state?: RepertoireState) => void;
  startReview: (_state?: RepertoireState) => void;
  markMoveReviewed: (
    m: string,
    correct: boolean,
    _state?: RepertoireState
  ) => void;
}

// export const DEFAULT_REPERTOIRE = {
//   white: {
//     side: "white",
//     tree: [
//       {
//         id: "1.e4",
//         sanPlus: "e4",
//         mine: true,
//         side: "white",
//         responses: [
//           {
//             id: "1.e4 e5",
//             sanPlus: "e5",
//             mine: false,
//             side: "black",
//             responses: [
//               {
//                 id: "1.e4 e5 2.f4",
//                 sanPlus: "f4",
//                 mine: true,
//                 side: "white",
//                 responses: [],
//               },
//             ],
//           },
//           {
//             id: "1.e4 d5",
//             sanPlus: "d5",
//             mine: false,
//             side: "black",
//             responses: [],
//           },
//         ],
//       },
//     ],
//   },
//   black: {
//     side: "black",
//     tree: [],
//   },
// } as Repertoire;

export const useRepertoireState = create<RepertoireState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      (set, get): RepertoireState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          repertoire: undefined,
          // repertoire: new StorageItem("repertoire_v4", null),
          repertoireGrades: { white: null, black: null },
          activeSide: "white",
          initState: () => {
            let state = get();
            state.fetchRepertoire();
            // state.position.move("e4");
            // state.position.move("c5");
            // state.position.move("d4");
            // if (state.repertoire.value) {
            //   state.fetchRepertoireGrade(state);
            // }
          },
          giveUp: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let moveObj = s.position.validateMoves([
                s.currentMove.sanPlus,
              ])?.[0];
              s.frozen = true;
              s.failedCurrentMove = true;
              s.animatePieceMove(
                moveObj,
                PlaybackSpeed.Normal,
                (s: RepertoireState) => {
                  s.hasGivenUp = true;
                },
                s
              );
            }),
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
              set((s: RepertoireState) => {
                s.repertoire = data;
                s.fetchRepertoireGrade(s);
              });
            }),
          attemptMove: (move, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              if (move.san == s.currentMove.sanPlus) {
                console.log("Animating move");
                s.animatePieceMove(
                  move,
                  PlaybackSpeed.Fast,
                  (s: RepertoireState) => {
                    s.flashRing(true, s);
                    s.setupNextMove(s);
                  },
                  s
                );
              } else {
                s.flashRing(false, s);
                s.failedCurrentMove = true;
              }
            }),

          markMoveReviewed: (
            m: string,
            correct: boolean,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              client
                .post("/api/v1/openings/move_reviewed", { correct, id: m })
                .then(({ data }) => {});
            }),
          setupNextMove: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.frozen = false;
              s.hasGivenUp = false;
              if (s.currentMove) {
                if (s.failedCurrentMove) {
                  s.queue.push(s.currentMove);
                  s.markMoveReviewed(s.currentMove.id, false, s);
                } else {
                  s.markMoveReviewed(s.currentMove.id, true, s);
                }
              }
              s.currentMove = s.queue.shift();
              s.failedCurrentMove = false;
              s.flipped = s.currentMove.side === "black";
              s.position = new Chess();
              s.allowMoves = true;
              // s.frozen = false;
              console.log(logProxy(s.currentMove));
              let parsed = s.position.loadPgn(s.currentMove.id);
              s.position.undo();
              console.log({ parsed });
              console.log(s.position.ascii());
            }),
          startReview: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.setupNextMove(s);
            }),
          fetchRepertoire: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log("s repertoire", logProxy(s));
              client.get("/api/v1/openings").then(({ data }) => {
                console.log("data", data);
                set((s) => {
                  s.repertoire = data;
                  s.queue = [
                    ...s.repertoire.white.moves,
                    ...s.repertoire.black.moves,
                  ].filter((m) => m.mine && m.needsReview);
                  s.queue = _.sortBy(s.queue, (m) => m.id);
                  console.log(logProxy(s.queue));
                });
              });
            }),
          fetchRepertoireGrade: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log("s repertoire", logProxy(s));
              // let side = s.activeSide;
              // client
              //   .post(
              //     "/api/v1/grade_opening",
              //     cloneDeep(s.repertoire.value[side])
              //   )
              //   .then(({ data }) => {
              //     console.log("data", data);
              //     set((s) => {
              //       s.repertoireGrades[side] = data as RepertoireGrade;
              //     });
              //   });
            }),
          ...createChessState(set, get, () => {}),
          // addPendingLine: (_state?: RepertoireState) =>
          //   setter(set, _state, (s) => {
          //     console.log("Before getting pending line");
          //     const { knownLine, pendingLine } = s.getPendingLine(s);
          //     console.log("Before adding pending line");
          //     let line = [...knownLine];
          //     let activeRepertoire: RepertoireSide =
          //       s.repertoire.value[s.activeSide];
          //     let node = getNodeFromRepertoire(activeRepertoire, knownLine);
          //     while (pendingLine.length > 0) {
          //       let move = pendingLine.shift();
          //       line.push(move);
          //       node.responses.push({
          //         id: lineToPgn(line),
          //         sanPlus: move,
          //         mine: sideOfLastmove(line) === s.activeSide,
          //         side: sideOfLastmove(line),
          //         responses: [],
          //       });
          //       node = last(node.responses);
          //     }
          //     console.log("After adding pending line");
          //     alert("Gotta save the new repertoire");
          //     // s.repertoire.save();
          //     // s.fetchRepertoireGrade(s);
          //   }),
          getPendingLine: (_state?: RepertoireState) => {
            let state = _state ?? get();
            return null;
            // if (state.repertoire.value === null) {
            //   return null;
            // }
            // let history = state.position.history();
            // let activeRepertoire: RepertoireSide =
            //   state.repertoire.value[state.activeSide];
            // let currentLine: string[] = [];
            // let missedMoves = dropWhile(history, (move) => {
            //   currentLine.push(move);
            //   return (
            //     getNodeFromRepertoire(activeRepertoire, currentLine) != null
            //   );
            // });
            // console.log("Missed moves", missedMoves);
            // if (!isEmpty(missedMoves)) {
            //   let knownMoves = take(
            //     history,
            //     history.length - missedMoves.length
            //   );
            //   return {
            //     pendingLine: missedMoves,
            //     knownLine: knownMoves,
            //   };
            // }
            // return null;
          },
        } as RepertoireState)
    ),
    { name: "RepertoireTrainingState" }
  )
);

// function getNodeFromRepertoire(repertoire: RepertoireSide, _line: string[]) {
//   let line = [..._line];
//   let responses = repertoire.tree;
//   let node: RepertoireMove = null;
//   // console.log("Line is ", line);
//   // console.log("Repertoire", repertoire);
//   while (line.length > 0) {
//     let move = line.shift();
//
//     node = responses.find((n) => {
//       return n.sanPlus == move;
//     });
//     if (!node) {
//       break;
//     }
//     responses = node.responses;
//   }
//   // console.log("Node is ", node);
//
//   return node;
// }
