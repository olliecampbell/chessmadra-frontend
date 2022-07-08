import { Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import { LichessGame, RepertoireTemplate, User } from "app/models";
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
import {
  cloneDeep,
  dropRight,
  dropWhile,
  groupBy,
  isEmpty,
  keyBy,
  last,
  take,
  some,
  map,
  filter,
} from "lodash";
import {
  BySide,
  lineToPgn,
  PendingLine,
  pgnToLine,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
  SIDES,
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
import { WritableDraft } from "immer/dist/internal";

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
  setUser: (user: User, _state?: RepertoireState) => void;
  fetchRepertoire: (_state?: RepertoireState) => void;
  fetchRepertoireTemplates: (_state?: RepertoireState) => void;
  initializeRepertoire: (_: {
    lichessUsername: string;
    chessComUsername: string;
    whitePgn: string;
    blackPgn: string;
    state?: RepertoireState;
  }) => void;
  user?: User;
  initState: (_state?: RepertoireState) => void;
  playPgn: (pgn: string, _state?: RepertoireState) => void;
  addPendingLine: (_state?: RepertoireState) => void;
  hasGivenUp?: boolean;
  giveUp: (_state?: RepertoireState) => void;
  setupNextMove: (_state?: RepertoireState) => void;
  startReview: (_state?: RepertoireState) => void;
  backToOverview: (_state?: RepertoireState) => void;
  startEditing: (side: Side, _state?: RepertoireState) => void;
  updateRepertoireStructures: (_state?: RepertoireState) => void;
  updatePendingLineFromPosition: (_state?: RepertoireState) => void;
  analyzeLineOnLichess: (side: Side, _state?: RepertoireState) => void;
  searchOnChessable: (_state?: RepertoireState) => void;
  backOne: (_state?: RepertoireState) => void;
  backToStartPosition: (_state?: RepertoireState) => void;
  onRepertoireUpdate: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  markMoveReviewed: (
    m: string,
    correct: boolean,
    _state?: RepertoireState
  ) => void;
  isEditing?: boolean;
  isReviewing?: boolean;
  editingSide?: Side;
  responseLookup?: BySide<Record<string, string[]>>;
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  uploadingMoves?: boolean;
  pendingMoves?: RepertoireMove[];
  hasCompletedRepertoireInitialization?: boolean;
  showPendingMoves?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  selectedTemplates: Record<string, string>;
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
          currentLine: [],
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
          setUser: (user: User, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.user = user;
            }),
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
              s.updatePendingLineFromPosition(s);
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
                s.updateRepertoireStructures(s);
                s.fetchRepertoireGrade(s);
                s.hasCompletedRepertoireInitialization = true;
              });
            }),
          analyzeLineOnLichess: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              var bodyFormData = new FormData();
              bodyFormData.append("pgn", lineToPgn(s.currentLine));
              if (isEmpty(s.currentLine)) {
                // TODO: figure out a way to open up analysis from black side
                window.open(`https://lichess.org/analysis`, "_blank").focus();
              }
              client
                .post(`https://lichess.org/api/import`, bodyFormData)
                .then(({ data }) => {
                  let url = data["url"];
                  window.open(`${url}/${side}#999`, "_blank").focus();
                });
            }),
          updatePendingLineFromPosition: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let line = s.position.history();
              s.currentLine = line;
              let accumLine = [];
              s.pendingMoves = map(
                filter(
                  map(line, (m) => {
                    accumLine.push(m);
                    return [m, lineToPgn(accumLine), sideOfLastmove(accumLine)];
                  }),
                  ([m, pgn, side]) => {
                    return !s.moveLookup[s.activeSide][pgn];
                  }
                ),
                ([m, pgn, side]) => {
                  return {
                    id: pgn,
                    sanPlus: m,
                    side: side,
                    mine: side === s.activeSide,
                    pending: true,
                    needsReview: false,
                    firstReview: false,
                  } as RepertoireMove;
                }
              );
              s.showPendingMoves = some(s.pendingMoves, (m) => {
                return m.mine;
              });
              s.moveLog = lineToPgn(line);
            }),
          updateRepertoireStructures: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log("Setting response lookup");
              s.myResponsesLookup = mapSides(
                s.repertoire,
                (repertoireSide: RepertoireSide) => {
                  return repertoireSide.moves.filter((m) => m.mine);
                }
              );
              s.responseLookup = mapSides(
                s.repertoire,
                (repertoireSide: RepertoireSide) => {
                  return groupBy(
                    repertoireSide.moves.map((m) => m.id),
                    (id) => {
                      return removeLastMove(id);
                    }
                  );
                }
              );
              s.moveLookup = mapSides(
                s.repertoire,
                (repertoireSide: RepertoireSide) => {
                  return keyBy(repertoireSide.moves, (m) => {
                    return m.id;
                  });
                }
              );
            }),

          attemptMove: (move, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              if (s.isEditing) {
                s.animatePieceMove(
                  move,
                  PlaybackSpeed.Fast,
                  (s: RepertoireState) => {
                    s.updatePendingLineFromPosition(s);
                  },
                  s
                );
              } else if (s.isReviewing) {
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
              if (!s.currentMove) {
                s.backToOverview(s);
                return;
              }
              s.moveLog = lineToPgn(dropRight(pgnToLine(s.currentMove.id), 1));
              s.failedCurrentMove = false;
              s.flipped = s.currentMove.side === "black";
              s.position = new Chess();
              // s.frozen = false;
              console.log(logProxy(s.currentMove));
              let parsed = s.position.loadPgn(s.currentMove.id);
              s.position.undo();
              console.log({ parsed });
              console.log(s.position.ascii());
            }),

          backToOverview: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.moveLog = null;
              s.isReviewing = false;
              if (s.currentMove) {
                s.queue.unshift(s.currentMove);
              }
              s.currentMove = null;
              s.activeSide = "white";
              s.isEditing = false;
              s.position = new Chess();
              s.frozen = true;
              s.flipped = false;
              s.updatePendingLineFromPosition(s);
              s.showMoveLog = false;
            }),
          startEditing: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.activeSide = side;
              s.isEditing = true;
              s.frozen = false;
              s.flipped = side === "black";
            }),
          startReview: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.showMoveLog = true;
              s.isReviewing = true;
              s.setupNextMove(s);
            }),
          onRepertoireUpdate: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.updateRepertoireStructures(s);
              s.queue = [
                ...s.repertoire.white.moves,
                ...s.repertoire.black.moves,
              ].filter((m) => m.mine && m.needsReview);
              let firstSide: Side = Math.random() >= 0.5 ? "white" : "black";
              s.queue = _.sortBy(s.queue, (m) => {
                return `${m.side === firstSide ? "a" : "b"} - ${m.id}`;
              });
              s.fetchRepertoireGrade(s);
            }),
          fetchRepertoireTemplates: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client
                .get("/api/v1/openings/template_repertoires")
                .then(({ data }: { data: RepertoireTemplate[] }) => {
                  set((s) => {
                    s.repertoireTemplates = data;
                  });
                });
            }),
          fetchRepertoire: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client
                .get("/api/v1/openings")
                .then(({ data }: { data: Repertoire }) => {
                  set((s) => {
                    [...data.black.moves, ...data.white.moves].map((m) => {
                      // m.lastLine = removeLastMove(m.id);
                      // m.depth = m.id.split(" ").length;
                    });
                    s.repertoire = data;
                    s.onRepertoireUpdate(s);
                  });
                });
            }),
          backOne: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.position.undo();
              s.updatePendingLineFromPosition(s);
            }),
          backToStartPosition: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.position = new Chess();
              s.updatePendingLineFromPosition(s);
            }),
          editRepertoireSide: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.editingSide = side;
              s.isEditing = true;
            }),
          fetchRepertoireGrade: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              SIDES.map((side) => {
                client
                  .post(
                    "/api/v1/grade_opening",

                    {
                      moves: s.repertoire[side].moves
                        .filter((m) => m.mine)
                        .map((m) => m.id),
                      side: side,
                    }
                  )
                  .then(({ data }) => {
                    set((s) => {
                      s.repertoireGrades[side] = data as RepertoireGrade;
                    });
                  });
              });
            }),
          ...createChessState(set, get, (c) => {
            c.frozen = true;
          }),
          addPendingLine: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.uploadingMoves = true;
              client
                .post("/api/v1/openings/add_moves", {
                  moves: _.map(s.pendingMoves, (m) => m.id),
                  side: s.activeSide,
                })
                .then(({ data }: { data: Repertoire }) => {
                  set((s) => {
                    s.position = new Chess();
                    // map(s.pendingMoves, () => {
                    //   s.position.undo();
                    // });
                    s.updatePendingLineFromPosition(s);

                    s.pendingMoves = [];
                    s.uploadingMoves = false;
                    s.repertoire = data;
                    s.onRepertoireUpdate(s);
                  });
                });
            }),
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
          selectedTemplates: {},
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

function removeLastMove(id: string) {
  return dropRight(id.split(" "), 1).join(" ");
}
function mapSides<T, Y>(bySide: BySide<T>, fn: (x: T) => Y): BySide<Y> {
  return {
    white: fn(bySide["white"]),
    black: fn(bySide["black"]),
  };
}
