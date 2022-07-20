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
  forEach,
  filter,
  shuffle,
  flatten,
  first,
  find,
  values,
  keys,
  findIndex,
  isNil,
  nth,
  zip,
  drop,
  forIn,
} from "lodash";
import {
  BySide,
  getAllRepertoireMoves,
  lineToPgn,
  otherSide,
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
import { failOnTrue } from "./test_settings";
import { genEpd } from "./chess";
import { ChessColor } from "app/types/Chess";
// let COURSE = "99306";
let COURSE = null;
// let ASSUME = "1.c4";
let ASSUME = null;

export interface QuizMove {
  move: RepertoireMove;
  line: string;
}

export interface RepertoireState
  extends ChessboardState,
    ChessboardStateParent<RepertoireState> {
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire;
  queue: QuizMove[];
  currentMove?: QuizMove;
  repertoireGrades: BySide<RepertoireGrade>;
  activeSide: Side;
  failedCurrentMove?: boolean;
  setUser: (user: User, _state?: RepertoireState) => void;
  fetchRepertoire: (_state?: RepertoireState) => void;
  fetchRepertoireTemplates: (_state?: RepertoireState) => void;
  initializeRepertoire: (_: {
    lichessUsername?: string;
    whitePgn?: string;
    blackPgn?: string;
    state?: RepertoireState;
  }) => void;
  user?: User;
  initState: (_state?: RepertoireState) => void;
  playPgn: (pgn: string, _state?: RepertoireState) => void;
  getResponses: (epd: string, side: Side, _state?: RepertoireState) => void;
  addPendingLine: (_state?: RepertoireState) => void;
  isAddingPendingLine: boolean;
  hasGivenUp?: boolean;
  giveUp: (_state?: RepertoireState) => void;
  setupNextMove: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  startReview: (_state?: RepertoireState) => void;
  backToOverview: (_state?: RepertoireState) => void;
  startEditing: (side: Side, _state?: RepertoireState) => void;
  updateRepertoireStructures: (_state?: RepertoireState) => void;
  onMove: (_state?: RepertoireState | WritableDraft<RepertoireState>) => void;
  currentEpd: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => string;
  onEditingPositionUpdate: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  analyzeLineOnLichess: (side: Side, _state?: RepertoireState) => void;
  searchOnChessable: (_state?: RepertoireState) => void;
  backOne: (_state?: RepertoireState) => void;
  backToStartPosition: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  deleteRepertoire: (side: Side, _state?: RepertoireState) => void;
  exportPgn: (side: Side, _state?: RepertoireState) => void;
  initializeRepertoireFromTemplates: (_state?: RepertoireState) => void;
  updateQueue: (
    cram: boolean,
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
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
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  // Previous positions, starting with the EPD after the first move
  positions?: string[];
  pendingMoves?: RepertoireMove[];
  hasCompletedRepertoireInitialization?: boolean;
  showPendingMoves?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  selectedTemplates: Record<string, string>;
  numMovesWouldBeDeleted?: number;
  conflictingId?: string;
  // The first position where the user does not have a response for
  divergencePosition?: string;
  divergenceIndex?: number;
  isCramming?: boolean;
  pendingResponses?: Record<string, RepertoireMove[]>;
}

interface FetchRepertoireResponse {
  repertoire: Repertoire;
  grades: BySide<RepertoireGrade>;
}

const START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

export const useRepertoireState = create<RepertoireState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      (set, get): RepertoireState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          repertoire: undefined,
          repertoireGrades: { white: null, black: null },
          activeSide: "white",
          pendingResponses: {},
          positions: [START_EPD],
          currentLine: [],
          // hasCompletedRepertoireInitialization: failOnTrue(true),
          initState: () => {
            let state = get();
            state.fetchRepertoire();
          },
          setUser: (user: User, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.user = user;
            }),
          giveUp: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let moveObj = s.position.validateMoves([
                s.currentMove.move.sanPlus,
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
              s.backToStartPosition(s);
              pgnToLine(pgn).map((san) => {
                s.position.move(san);
                if (s.isEditing) {
                  s.onMove(s);
                }
              });
            }),
          initializeRepertoireFromTemplates: (_state?: RepertoireState) =>
            setter(set, _state, async (s: RepertoireState) => {
              let { data }: { data: FetchRepertoireResponse } =
                await client.post("/api/v1/openings/add_templates", {
                  templates: Object.values(s.selectedTemplates),
                });
              set((s) => {
                s.repertoire = data.repertoire;
                s.repertoireGrades = data.grades;
                s.onRepertoireUpdate(s);
              });
            }),
          initializeRepertoire: ({
            state,
            lichessUsername,
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
              let { data }: { data: FetchRepertoireResponse } =
                await client.post("/api/v1/initialize_repertoire", {
                  lichessGames,
                  lichessUsername,
                  chessComGames,
                  whitePgn,
                  blackPgn,
                });
              set((s: RepertoireState) => {
                s.repertoire = data.repertoire;
                s.repertoireGrades = data.grades;
                s.onRepertoireUpdate(s);
                s.hasCompletedRepertoireInitialization = true;
              });
            }),
          searchOnChessable: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let fen = s.position.fen();
              if (COURSE) {
                window
                  .open(
                    `https://www.chessable.com/course/${COURSE}/fen/${fen
                      .replaceAll("/", ";")
                      .replaceAll(" ", "%20")}/`,
                    "_blank"
                  )
                  .focus();
                return;
              }
              window
                .open(
                  `https://www.chessable.com/courses/fen/${fen
                    .replaceAll("/", "U")
                    .replaceAll(" ", "%20")}/`,
                  "_blank"
                )
                .focus();
            }),
          analyzeLineOnLichess: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              var bodyFormData = new FormData();
              bodyFormData.append("pgn", lineToPgn(s.currentLine));
              if (isEmpty(s.currentLine)) {
                // TODO: figure out a way to open up analysis from black side
                window.open(`https://lichess.org/analysis`, "_blank");
                return;
              }
              var windowReference = window.open("about:blank", "_blank");
              client
                .post(`https://lichess.org/api/import`, bodyFormData)
                .then(({ data }) => {
                  let url = data["url"];
                  windowReference.location = `${url}/${side}#999`;
                });
            }),
          onEditingPositionUpdate: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let line = s.position.history();
              s.currentLine = line;
              s.moveLog = lineToPgn(line);
              console.log({ positions: s.positions });
              s.divergenceIndex = findIndex(s.positions, (e: string, i) => {
                let responses = s.repertoire[s.activeSide].positionResponses[e];
                let move = s.currentLine[i];
                console.log({ move });
                if (!move) {
                  return false;
                }
                if (!some(responses, (r) => r.sanPlus == move)) {
                  console.log("No responses like this, this one!");
                  return true;
                }
                console.log("No my response from this position");
                return false;
              });
              s.divergenceIndex =
                s.divergenceIndex === -1 ? null : s.divergenceIndex;
              // if (s.divergenceIndex === s.positions.length - 1) {
              //   s.divergenceIndex = null;
              // }
              s.divergencePosition = !isNil(s.divergenceIndex)
                ? s.positions[s.divergenceIndex]
                : null;
              console.log({ diIndex: s.divergenceIndex });
              console.log({ diPosition: s.divergencePosition });
              s.pendingResponses = {};
              if (!isNil(s.divergenceIndex)) {
                map(
                  zip(
                    drop(s.positions, s.divergenceIndex),
                    drop(line, s.divergenceIndex)
                  ),
                  ([position, san], i) => {
                    if (!san) {
                      return;
                    }
                    s.pendingResponses[position] = [
                      {
                        epd: position,
                        epdAfter: s.positions[i + s.divergenceIndex + 1],
                        sanPlus: san,
                        side: s.activeSide,
                        pending: true,
                        mine:
                          (i + s.divergenceIndex) % 2 ===
                          (s.activeSide === "white" ? 0 : 1),
                        srs: {
                          needsReview: false,
                          firstReview: false,
                        },
                      },
                    ] as RepertoireMove[];
                  }
                );
              }
              s.showPendingMoves = some(
                flatten(values(s.pendingResponses)),
                (m) => m.mine
              );
              console.log("____");
              console.log(s.pendingResponses);
              console.log(s.showPendingMoves);
              console.log(s.divergencePosition);
              s.numMovesWouldBeDeleted = (() => {
                if (isEmpty(s.pendingResponses[s.divergencePosition])) {
                  return 0;
                }
                if (!first(s.pendingResponses[s.divergencePosition]).mine) {
                  return 0;
                }
                let total = 0;
                let seen_epds = new Set();
                let recurse = (epd) => {
                  let responses =
                    s.repertoire[s.activeSide].positionResponses[epd];
                  map(responses, (r) => {
                    total += 1;
                    if (!seen_epds.has(r.epdAfter)) {
                      seen_epds.add(r.epdAfter);
                      recurse(r.epdAfter);
                    }
                  });
                };
                recurse(s.divergencePosition);
                return total;
              })();
              console.log("Num deleted?");
              console.log(s.numMovesWouldBeDeleted);
            }),
          onMove: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.positions.push(genEpd(s.position));
              s.onEditingPositionUpdate(s);
            }),
          updateQueue: (cram: boolean, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let queue: QuizMove[] = [];
              let seen_epds = new Set();
              const recurse = (epd, line, side: Side) => {
                map(shuffle(s.repertoire[side].positionResponses[epd]), (m) => {
                  if (
                    m.mine &&
                    (cram || m.srs.needsReview) &&
                    m.epd !== START_EPD
                  ) {
                    queue.push({ move: m, line: lineToPgn(line) });
                  }

                  if (!seen_epds.has(m.epdAfter)) {
                    seen_epds.add(m.epdAfter);
                    console.log({ after: m.epdAfter });
                    recurse(m.epdAfter, [...line, m.sanPlus], side);
                  }
                });
              };
              for (const side of shuffle(SIDES)) {
                recurse(START_EPD, [], side);
                seen_epds = new Set();
              }
              s.queue = queue;
            }),
          updateRepertoireStructures: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.myResponsesLookup = mapSides(
                s.repertoire,
                (repertoireSide: RepertoireSide) => {
                  return flatten(
                    Object.values(repertoireSide.positionResponses)
                  ).filter((m: RepertoireMove) => m.mine);
                }
              );
            }),

          attemptMove: (
            move,
            cb: (shouldMove: boolean, then: (s) => void) => void,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              if (s.isEditing) {
                cb(true, (s: RepertoireState) => {
                  s.onMove(s);
                });
              } else if (s.isReviewing) {
                console.log(move.san, s.currentMove.move.sanPlus);
                if (move.san == s.currentMove.move.sanPlus) {
                  cb(true, (s: RepertoireState) => {
                    s.flashRing(true, s);
                    window.setTimeout(() => {
                      set((s) => {
                        if (s.isReviewing) {
                          s.setupNextMove(s);
                        }
                      });
                    }, 100);
                  });
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
                .post("/api/v1/openings/move_reviewed", { correct, epd: m })
                .then(({ data }) => {});
            }),
          setupNextMove: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.frozen = false;
              s.hasGivenUp = false;
              if (s.currentMove) {
                if (s.failedCurrentMove) {
                  s.queue.push(s.currentMove);
                  s.markMoveReviewed(s.currentMove.move.epd, false, s);
                } else {
                  s.markMoveReviewed(s.currentMove.move.epd, true, s);
                }
              }
              s.currentMove = s.queue.shift();
              if (!s.currentMove) {
                s.backToOverview(s);
                return;
              }
              s.moveLog = s.currentMove.line;
              s.failedCurrentMove = false;
              s.flipped = s.currentMove.move.side === "black";
              s.position = new Chess();
              // s.frozen = false;
              s.position.loadPgn(s.currentMove.line);
              console.log(s.position.ascii());
              // s.position.undo();
              let lastOpponentMove = s.position.undo();

              console.log({ lastOpponentMove });
              if (lastOpponentMove) {
                window.setTimeout(() => {
                  set((s) => {
                    if (s.isReviewing) {
                      s.animatePieceMove(
                        lastOpponentMove,
                        PlaybackSpeed.Normal,
                        (s: RepertoireState) => {},
                        s
                      );
                    }
                  });
                }, 300);
              }
            }),

          deleteRepertoire: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client
                .post("/api/v1/openings/delete", {
                  sides: [side],
                })
                .then(({ data }: { data: FetchRepertoireResponse }) => {
                  set((s) => {
                    s.repertoire = data.repertoire;
                    s.repertoireGrades = data.grades;
                    s.onRepertoireUpdate(s);
                  });
                });
            }),
          exportPgns: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {}),
          exportPgn: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let pgn = "";

              let seen_epds = new Set();
              let recurse = (epd, line) => {
                let [mainMove, ...others] =
                  s.repertoire[side].positionResponses[epd] ?? [];
                if (!mainMove) {
                  return;
                }
                let mainLine = [...line, mainMove.sanPlus];
                pgn = pgn + getLastMoveWithNumber(lineToPgn(mainLine)) + " ";
                forEach(others, (variationMove) => {
                  if (seen_epds.has(variationMove.epdAfter)) {
                    return;
                  }
                  let variationLine = [...line, variationMove.sanPlus];
                  seen_epds.add(variationMove.epdAfter);
                  pgn += "(";
                  pgn += getLastMoveWithNumber(lineToPgn(variationLine)) + " ";

                  recurse(variationMove.epdAfter, variationLine);
                  pgn = pgn.trim();
                  pgn += ") ";
                });
                if (
                  !isEmpty(others) &&
                  sideOfLastmove(lineToPgn(mainLine)) === "white"
                ) {
                  pgn += `${getMoveNumber(lineToPgn(mainLine))}... `;
                }

                if (seen_epds.has(mainMove.epdAfter)) {
                  return;
                }
                seen_epds.add(mainMove.epdAfter);
                recurse(mainMove.epdAfter, mainLine);
              };
              recurse(START_EPD, []);
              pgn = pgn.trim();

              let downloadLink = document.createElement("a");

              let csvFile = new Blob([pgn], { type: "text" });

              let url = window.URL.createObjectURL(csvFile);
              // file name
              downloadLink.download = `${side}.pgn`;

              // create link to file
              downloadLink.href = url;

              // hide download link
              downloadLink.style.display = "none";

              // add link to DOM
              document.body.appendChild(downloadLink);

              // click download link
              downloadLink.click();
            }),

          backToOverview: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.backToStartPosition(s);
              s.moveLog = null;
              s.isReviewing = false;
              if (s.currentMove) {
                s.queue.unshift(s.currentMove);
              }
              if (s.isCramming) {
                s.queue = [];
              }
              s.isCramming = false;
              s.currentMove = null;
              s.activeSide = "white";
              s.isEditing = false;
              s.position = new Chess();
              s.frozen = true;
              s.flipped = false;
              s.divergencePosition = null;
              s.divergenceIndex = null;
              s.showPendingMoves = false;
              s.pendingResponses = {};
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
              if (isEmpty(s.queue)) {
                s.updateQueue(true, s);
                s.isCramming = true;
              }
              s.showMoveLog = true;
              s.isReviewing = true;
              s.setupNextMove(s);
            }),
          onRepertoireUpdate: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.updateRepertoireStructures(s);
              s.updateQueue(false, s);
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
                .then(({ data }: { data: FetchRepertoireResponse }) => {
                  set((s) => {
                    s.repertoire = data.repertoire;
                    s.repertoireGrades = data.grades;
                    if (getAllRepertoireMoves(s.repertoire).length > 0) {
                      s.hasCompletedRepertoireInitialization = true;
                    }
                    s.onRepertoireUpdate(s);
                  });
                });
            }),
          currentEpd: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              return last(s.positions);
            }),
          backOne: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let m = s.position.undo();
              if (m) {
                s.positions.pop();
              }
              s.onEditingPositionUpdate(s);
              // s.onEditingPositionUpdate(s);
            }),
          backToStartPosition: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.position = new Chess();
              s.positions = [START_EPD];
              s.onEditingPositionUpdate(s);
            }),
          editRepertoireSide: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.editingSide = side;
              s.isEditing = true;
            }),
          ...createChessState(set, get, (c) => {
            c.frozen = true;
          }),
          addPendingLine: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.isAddingPendingLine = true;
              client
                .post("/api/v1/openings/add_moves", {
                  moves: _.flatten(cloneDeep(_.values(s.pendingResponses))),
                  side: s.activeSide,
                })
                .then(({ data }: { data: FetchRepertoireResponse }) => {
                  set((s) => {
                    s.backToStartPosition(s);
                    s.repertoire = data.repertoire;
                    s.repertoireGrades = data.grades;
                    s.onRepertoireUpdate(s);
                  });
                })
                .finally(() => {
                  set((s) => {
                    s.isAddingPendingLine = false;
                  });
                });
            }),
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
//
//   return node;
// }

function removeLastMove(id: string) {
  return dropRight(id.split(" "), 1).join(" ");
}

function getLastMoveWithNumber(id: string) {
  let [n, m] = last(id.split(" ")).split(".");
  if (!m) {
    return n;
  }
  return `${n}. ${m}`;
}

function mapSides<T, Y>(bySide: BySide<T>, fn: (x: T) => Y): BySide<Y> {
  return {
    white: fn(bySide["white"]),
    black: fn(bySide["black"]),
  };
}
function getMoveNumber(id: string) {
  return Math.floor(id.split(" ").length / 2 + 1);
}

// function getAnySideResponse(r: Repertoire, epd: string): RepertoireMove[] {
//   return r["black"].positionResponses[epd] ?? r["black"].positionResponses[epd];
// }
