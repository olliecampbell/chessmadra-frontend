import { Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import {
  LichessGame,
  PlayerTemplate,
  RepertoireTemplate,
  User,
  PositionReport,
  EcoCode,
  PawnStructureDetails,
} from "app/models";
import create from "zustand";
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
  sum,
  sortBy,
  findLast,
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
import { formatEloRange } from "./elo_range";
// let COURSE = "99306";
let COURSE = null;
// let ASSUME = "1.c4";
let ASSUME = null;

export interface QuizMove {
  move: RepertoireMove;
  line: string;
}

export enum AddLineFromOption {
  Initial = "Start Position",
  Current = "Current Position",
  BiggestMiss = "Biggest Gap in Repertoire",
}

export interface RepertoireState
  extends ChessboardState,
    ChessboardStateParent<RepertoireState> {
  quick: (fn: (_: RepertoireState) => void) => void;
  repertoire: Repertoire;
  repertoireNumMoves: BySide<
    Record<
      string,
      { withTranspositions: number; withoutTranspositions: number }
    >
  >;
  queues: BySide<QuizMove[]>;
  positionReports: BySide<Record<string, PositionReport>>;
  currentMove?: QuizMove;
  reviewSide?: Side;
  repertoireGrades: BySide<RepertoireGrade>;
  activeSide: Side;
  failedCurrentMove?: boolean;
  setUser: (user: User, _state?: RepertoireState) => void;
  reviewLine: (line: string[], side: Side, _state?: RepertoireState) => void;
  fetchRepertoire: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  fetchEcoCodes: (_state?: RepertoireState) => void;
  fetchSupplementary: (_state?: RepertoireState) => void;
  fetchRepertoireTemplates: (_state?: RepertoireState) => void;
  fetchPlayerTemplates: (_state?: RepertoireState) => void;
  initializeRepertoire: (_: {
    lichessUsername?: string;
    whitePgn?: string;
    blackPgn?: string;
    state?: RepertoireState;
  }) => void;
  user?: User;
  initState: (_state?: RepertoireState) => void;
  playPgn: (pgn: string, _state?: RepertoireState) => void;
  playSan: (pgn: string, _state?: RepertoireState) => void;
  addPendingLine: (_state?: RepertoireState) => void;
  isAddingPendingLine: boolean;
  hasGivenUp?: boolean;
  giveUp: (_state?: RepertoireState) => void;
  usePlayerTemplate: (id: string, _state?: RepertoireState) => void;
  setupNextMove: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  startReview: (side?: Side, _state?: RepertoireState) => void;
  reviewWithQueue: (
    queues: BySide<QuizMove[]>,
    _state?: RepertoireState
  ) => void;
  isReviewingWithCustomQueue?: boolean;
  backToOverview: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  startEditing: (side: Side, _state?: RepertoireState) => void;
  startBrowsing: (side: Side, _state?: RepertoireState) => void;
  selectBrowserState: (
    browserState: BrowserState,
    _state?: RepertoireState
  ) => void;
  generateBrowsingSections: (
    epd: string,
    _state?: RepertoireState
  ) => BrowserSection[];
  showImportView?: boolean;
  startImporting: (_state?: RepertoireState) => void;
  updateRepertoireStructures: (_state?: RepertoireState) => void;
  onMove: (_state?: RepertoireState | WritableDraft<RepertoireState>) => void;
  getMyResponsesLength: (
    side?: Side,
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => number;
  getQueueLength: (
    side?: Side,
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => number;
  getIsRepertoireEmpty: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => RepertoireMove;
  getLastMoveInRepertoire: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => RepertoireMove;
  getCurrentPositionReport: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => PositionReport;
  getCurrentEpd: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => string;
  onEditingPositionUpdate: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  analyzeLineOnLichess: (_state?: RepertoireState) => void;
  searchOnChessable: (_state?: RepertoireState) => void;
  backOne: (_state?: RepertoireState) => void;
  backToStartPosition: (
    _state?: RepertoireState | WritableDraft<RepertoireState>
  ) => void;
  deleteRepertoire: (side: Side, _state?: RepertoireState) => void;
  deleteCurrentMove: (cb: () => void, _state?: RepertoireState) => void;
  exportPgn: (side: Side, _state?: RepertoireState) => void;
  addTemplates: (_state?: RepertoireState) => void;
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
  isBrowsing?: boolean;
  isReviewing?: boolean;
  editingSide?: Side;
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  // Previous positions, starting with the EPD after the first move
  positions?: string[];
  pendingMoves?: RepertoireMove[];
  hasCompletedRepertoireInitialization?: boolean;
  hasPendingLineToAdd?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  playerTemplates?: PlayerTemplate[];
  selectedTemplates: Record<string, string>;
  numMovesWouldBeDeleted?: number;
  conflictingId?: string;
  // The first position where the user does not have a response for
  divergencePosition?: string;
  divergenceIndex?: number;
  differentMoveIndices?: number[];
  isCramming?: boolean;
  pendingResponses?: Record<string, RepertoireMove[]>;
  getMovesDependentOnPosition: (
    epd: string,
    _state?: RepertoireState
  ) => number;
  isDeletingMove?: boolean;
  inProgressUsingPlayerTemplate?: boolean;
  fetchPositionReportIfNeeded: (_state?: RepertoireState) => void;
  updateBrowserStateAndSections: (
    epd: string,
    line: string[],
    _state?: RepertoireState
  ) => void;
  selectBrowserSection: (
    section: BrowserSection,
    includeInPreviousStates: boolean,
    _state?: RepertoireState
  ) => void;
  previousBrowserStates: BrowserState[];
  ecoCodes: EcoCode[];
  pawnStructures: PawnStructureDetails[];
  ecoCodeLookup: Record<string, EcoCode>;
  pawnStructureLookup: Record<string, PawnStructureDetails>;
  browserState?: BrowserState;
  updateEloRange: (range: [number, number], _state?: RepertoireState) => void;
  isUpdatingEloRange: boolean;
  editingState: {
    lastEcoCode?: EcoCode;
    selectedTab: EditingTab;
    etcModalOpen: boolean;
  };
  addedLineState: {
    addLineFrom: AddLineFromOption;
    line: string[];
    ecoCode: EcoCode;
    stage: AddedLineStage;
    positionReport: PositionReport;
  };
}

export enum EditingTab {
  Position = "Position",
  MoveLog = "Move Log",
  Responses = "Responses",
}

export enum AddedLineStage {
  Initial,
  AddAnother,
}

export interface BrowserState {
  epd: string;
  line: string[];
  sections: BrowserSection[];
  lines: BrowserLine[];
  ecoCode: EcoCode;
}

interface BrowserSection {
  epd: string;
  pgn: string;
  eco_code?: EcoCode;
  line?: string[];
  numMoves?: { withTranspositions: number; withoutTranspositions: number };
}

interface BrowserLine {
  line: string;
  epd: string;
}

interface FetchRepertoireResponse {
  repertoire: Repertoire;
  grades: BySide<RepertoireGrade>;
}

const START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
export const DEFAULT_ELO_RANGE = [1300, 1500] as [number, number];
const EMPTY_QUEUES = { white: [], black: [] };

export const useRepertoireState = create<RepertoireState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer(
      (set, get): RepertoireState =>
        ({
          // TODO: clone?
          ...createQuick(set),
          isUpdatingEloRange: false,
          repertoire: undefined,
          repertoireGrades: { white: null, black: null },
          activeSide: "white",
          ecoCodeLookup: {},
          pawnStructureLookup: {},
          inProgressUsingPlayerTemplate: false,
          pendingResponses: {},
          positions: [START_EPD],
          positionReports: { white: {}, black: {} },
          currentLine: [],
          queues: EMPTY_QUEUES,
          // hasCompletedRepertoireInitialization: failOnTrue(true),
          initState: () => {
            let state = get();
            state.fetchRepertoire(state);
            // TODO: remove
            state.fetchEcoCodes(state);
            state.fetchSupplementary(state);
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
                (completed, s: RepertoireState) => {
                  s.hasGivenUp = true;
                },
                s
              );
            }),
          updateEloRange: (range: [number, number], _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.isUpdatingEloRange = true;
              client
                .post("/api/v1/user/elo_range", {
                  min: range[0],
                  max: range[1],
                })
                .then(({ data }: { data: FetchRepertoireResponse }) => {
                  set((s) => {
                    s.user.eloRange = formatEloRange(range);
                  });
                })
                .finally(() => {
                  set((s) => {
                    s.isUpdatingEloRange = false;
                    s.fetchRepertoire(s);
                  });
                });
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
          playSan: (san: string, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.position.move(san);
              if (s.isEditing) {
                s.onMove(s);
              }
            }),
          usePlayerTemplate: (id: string, _state?: RepertoireState) =>
            setter(set, _state, async (s: RepertoireState) => {
              s.inProgressUsingPlayerTemplate = true;
              let { data }: { data: FetchRepertoireResponse } =
                await client.post("/api/v1/openings/use_player_template", {
                  id,
                });
              set((s) => {
                s.inProgressUsingPlayerTemplate = false;
                s.repertoire = data.repertoire;
                s.repertoireGrades = data.grades;
                s.onRepertoireUpdate(s);
                s.backToOverview(s);
                s.hasCompletedRepertoireInitialization = true;
              });
            }),
          addTemplates: (_state?: RepertoireState) =>
            setter(set, _state, async (s: RepertoireState) => {
              let { data }: { data: FetchRepertoireResponse } =
                await client.post("/api/v1/openings/add_templates", {
                  templates: Object.values(s.selectedTemplates),
                });
              set((s) => {
                s.repertoire = data.repertoire;
                s.repertoireGrades = data.grades;
                s.onRepertoireUpdate(s);
                s.backToOverview(s);
                s.hasCompletedRepertoireInitialization = true;
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
                s.backToOverview(s);
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
          analyzeLineOnLichess: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              console.log({ s });
              var bodyFormData = new FormData();
              bodyFormData.append("pgn", lineToPgn(s.currentLine));
              if (isEmpty(s.currentLine)) {
                // TODO: figure out a way to open up analysis from black side
                window.open(`https://lichess.org/analysis`, "_blank");
                return;
              }
              var windowReference = window.open("about:blank", "_blank");
              let side = s.activeSide;
              client
                .post(`https://lichess.org/api/import`, bodyFormData)
                .then(({ data }) => {
                  let url = data["url"];
                  windowReference.location = `${url}/${side}#999`;
                });
            }),
          getMovesDependentOnPosition: (
            epd: string,
            _state?: RepertoireState
          ) => {
            let s = _state ?? get();
            if (!s.repertoire) {
              return 0;
            }
            let total = 0;
            let seen_epds = new Set();
            let recurse = (epd, isStart?: boolean) => {
              let responses = s.repertoire[s.activeSide].positionResponses[epd];
              if (isStart && first(responses)?.mine == false) {
                return;
              }
              map(responses, (r) => {
                if (r.mine) {
                  total += 1;
                }
                if (!seen_epds.has(r.epdAfter)) {
                  seen_epds.add(r.epdAfter);
                  recurse(r.epdAfter);
                }
              });
            };
            recurse(epd, true);
            return total;
          },
          onEditingPositionUpdate: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let line = s.position.history();
              s.currentLine = line;
              s.moveLogPgn = lineToPgn(line);
              s.pendingResponses = {};
              s.differentMoveIndices = [];
              s.editingState.lastEcoCode =
                s.ecoCodeLookup[
                  findLast(s.positions, (p) => {
                    return s.ecoCodeLookup[p];
                  }) as string
                ];
              map(zip(s.positions, line), ([position, san], i) => {
                if (!san) {
                  return;
                }
                if (
                  !some(
                    s.repertoire[s.activeSide].positionResponses[position],
                    (m) => {
                      return m.sanPlus === san;
                    }
                  )
                ) {
                  s.differentMoveIndices.push(i);
                  s.pendingResponses[position] = [
                    {
                      epd: position,
                      epdAfter: s.positions[i + 1],
                      sanPlus: san,
                      side: s.activeSide,
                      pending: true,
                      mine: i % 2 === (s.activeSide === "white" ? 0 : 1),
                      srs: {
                        needsReview: false,
                        firstReview: false,
                      },
                    },
                  ] as RepertoireMove[];
                }
              });

              s.hasPendingLineToAdd = some(
                flatten(values(s.pendingResponses)),
                (m) => m.mine
              );
              s.numMovesWouldBeDeleted = s.getMovesDependentOnPosition(
                s.divergencePosition,
                s
              );
              s.fetchPositionReportIfNeeded(s);
            }),
          selectBrowserSection: (
            browserSection: BrowserSection,
            includeInPreviousStates: boolean,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              // s.browsingState.line = browserSection.line;
              // s.browsingState.epd = browserSection.epd;
              console.log(
                "browser section line: ",
                logProxy(browserSection.line)
              );
              s.updateBrowserStateAndSections(
                browserSection.epd,
                browserSection.line,
                s
              );
              if (includeInPreviousStates) {
                s.previousBrowserStates.push(s.browserState);
              }
            }),
          fetchPositionReportIfNeeded: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let epd = s.getCurrentEpd(s);
              let side = s.activeSide;
              if (!isNil(s.getCurrentPositionReport(s))) {
                return;
              }
              client
                .post("/api/v1/openings/position_report", {
                  epd: epd,
                })
                .then(({ data }: { data: PositionReport }) => {
                  set((s) => {
                    s.positionReports[side][epd] = data;
                  });
                })
                .finally(() => {
                  // set((s) => {});
                });
            }),
          onMove: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.positions.push(genEpd(s.position));
              s.onEditingPositionUpdate(s);
            }),
          reviewLine: (line: string[], side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.backToOverview(s);
              let queues = cloneDeep(EMPTY_QUEUES);
              let sideQueue = [];
              let epd = START_EPD;
              let lineSoFar = [];
              console.log("Yeah?", side);
              line.map((move) => {
                let response = find(
                  s.repertoire[side].positionResponses[epd],
                  (m) => m.sanPlus === move
                );
                epd = response?.epdAfter;
                console.log("Yeah 1?");
                console.log("Yeah 2?");
                if (response && response.mine) {
                  sideQueue.push({
                    move: response,
                    line: lineToPgn(lineSoFar),
                  });
                } else {
                  console.log("Couldn't find a move for ", epd);
                }
                lineSoFar.push(move);
                console.log("Yeah 3?");
              });
              console.log("pre-Review w/ queue?");
              queues[side] = sideQueue;
              console.log("Review w/ queue?");
              s.reviewWithQueue(queues, s);
            }),
          updateQueue: (cram: boolean, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let seen_epds = new Set();
              s.queues = {
                white: [],
                black: [],
              };
              const recurse = (epd, line, side: Side) => {
                map(shuffle(s.repertoire[side].positionResponses[epd]), (m) => {
                  if (
                    m.mine &&
                    (cram || m.srs.needsReview) &&
                    m.epd !== START_EPD
                  ) {
                    s.queues[side].push({ move: m, line: lineToPgn(line) });
                  }

                  if (!seen_epds.has(m.epdAfter)) {
                    seen_epds.add(m.epdAfter);
                    recurse(m.epdAfter, [...line, m.sanPlus], side);
                  }
                });
              };
              for (const side of SIDES) {
                recurse(START_EPD, [], side);
                seen_epds = new Set();
              }
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
              s.repertoireNumMoves = mapSides(
                s.repertoire,
                (repertoireSide: RepertoireSide) => {
                  let epdToNumMoves = {};
                  let seen_epds = new Set();
                  const recurse = (epd, line, mine) => {
                    let sum = 0;
                    let sumTranspositions = 0;
                    map(repertoireSide.positionResponses[epd], (m) => {
                      let inc = m.mine ? 1 : 0;
                      if (!seen_epds.has(m.epdAfter)) {
                        seen_epds.add(m.epdAfter);
                        let x = recurse(
                          m.epdAfter,
                          [...line, m.sanPlus],
                          m.mine
                        );
                        sum += x.withoutTranspositions + inc;
                        sumTranspositions +=
                          x.withTranspositions - x.withoutTranspositions;
                      } else {
                        if (epdToNumMoves[m.epdAfter]) {
                          sumTranspositions +=
                            epdToNumMoves[m.epdAfter].withTranspositions + inc;
                        }
                      }
                    });
                    epdToNumMoves[epd] = {
                      withTranspositions: sum + sumTranspositions,
                      withoutTranspositions: sum,
                    };
                    return {
                      withTranspositions: sum + sumTranspositions,
                      withoutTranspositions: sum,
                    };
                  };
                  recurse(START_EPD, [], false);
                  return epdToNumMoves;
                }
              );
            }),

          attemptMove: (
            move,
            cb: (
              shouldMove: boolean,
              then: (completed: boolean, s: RepertoireState) => void
            ) => void,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              if (s.isEditing) {
                cb(true, (completed: boolean, s: RepertoireState) => {
                  if (completed === false || completed === null) {
                    s.onMove(s);
                  }
                });
              } else if (s.isReviewing) {
                if (move.san == s.currentMove.move.sanPlus) {
                  cb(true, (completed: boolean, s: RepertoireState) => {
                    if (!completed) {
                      s.flashRing(true, s);
                      window.setTimeout(() => {
                        set((s) => {
                          if (s.isReviewing) {
                            if (s.failedCurrentMove) {
                              s.hasGivenUp = true;
                            } else {
                              s.setupNextMove(s);
                            }
                          }
                        });
                      }, 100);
                    }
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
                  s.queues[s.currentMove.move.side].push(s.currentMove);
                  s.markMoveReviewed(s.currentMove.move.epd, false, s);
                } else {
                  s.markMoveReviewed(s.currentMove.move.epd, true, s);
                }
              }
              s.currentMove = s.queues[s.reviewSide].shift();
              if (!s.currentMove) {
                s.reviewSide = otherSide(s.reviewSide);
                s.currentMove = s.queues[s.reviewSide].shift();
                if (!s.currentMove) {
                  s.backToOverview(s);
                  return;
                }
              }
              s.moveLogPgn = s.currentMove.line;
              s.failedCurrentMove = false;
              s.flipped = s.currentMove.move.side === "black";
              s.position = new Chess();
              // s.frozen = false;
              s.position.loadPgn(s.currentMove.line);
              // s.position.undo();
              let lastOpponentMove = s.position.undo();

              if (lastOpponentMove) {
                window.setTimeout(() => {
                  set((s) => {
                    if (s.isReviewing) {
                      s.animatePieceMove(
                        lastOpponentMove,
                        PlaybackSpeed.Normal,
                        (completed, s: RepertoireState) => {},
                        s
                      );
                    }
                  });
                }, 300);
              }
            }),

          deleteCurrentMove: (cb: () => void, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let response = s.getLastMoveInRepertoire();
              s.isDeletingMove = true;
              client
                .post("/api/v1/openings/delete_move", {
                  response: response,
                })
                .then(({ data }: { data: FetchRepertoireResponse }) => {
                  set((s) => {
                    s.repertoire = data.repertoire;
                    s.repertoireGrades = data.grades;
                    s.onRepertoireUpdate(s);
                    s.backToStartPosition(s);
                    cb();
                  });
                })
                .finally(() => {
                  set((s) => {
                    s.isDeletingMove = false;
                  });
                });
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
              if (s.isReviewingWithCustomQueue) {
                s.isReviewingWithCustomQueue = false;
                s.updateQueue(false, s);
              }
              s.showImportView = false;
              s.backToStartPosition(s);
              s.reviewSide = null;
              s.moveLogPgn = null;
              s.isReviewing = false;
              if (s.currentMove) {
                s.queues[s.currentMove.move.side].unshift(s.currentMove);
              }
              if (s.isCramming) {
                s.queues = EMPTY_QUEUES;
              }
              s.isCramming = false;
              s.currentMove = null;
              s.activeSide = "white";
              s.isEditing = false;
              s.isBrowsing = false;
              s.position = new Chess();
              s.frozen = true;
              s.flipped = false;
              s.divergencePosition = null;
              s.divergenceIndex = null;
              s.hasPendingLineToAdd = false;
              s.pendingResponses = {};
              s.showMoveLog = false;
              s.addedLineState = null;
            }),
          startImporting: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.showImportView = true;
            }),
          startBrowsing: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.isBrowsing = true;
              s.activeSide = side;
              s.browserState = {
                epd: START_EPD,
                sections: [],
                line: [],
                lines: [],
                ecoCode: null,
              };
              s.previousBrowserStates = [];
              s.updateBrowserStateAndSections(
                s.browserState.epd,
                s.browserState.line,
                s
              );
              // s.previousBrowserStates.push(s.browserState);
            }),
          selectBrowserState: (
            browserState: BrowserState,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              while (true) {
                let lastState = s.previousBrowserStates.pop();
                if (lastState.ecoCode.code === browserState.ecoCode.code) {
                  s.previousBrowserStates.push(lastState);
                  s.browserState = browserState;
                  break;
                }
              }
            }),
          updateBrowserStateAndSections: (
            epd: string,
            line: string[],
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              s.browserState = {
                epd: epd,
                sections: [],
                line: line,
                lines: [],
                ecoCode: s.ecoCodeLookup[epd],
              };

              let sections: BrowserSection[] = [];
              let responses = s.repertoire[s.activeSide].positionResponses;
              let paths = [];
              let seenEpds = new Set(
                s.browserState?.sections?.map((s) => s.epd) ?? []
              );
              let recurse = (path: string, epd: string, moveNumber: number) => {
                responses[epd]?.forEach((m) => {
                  let n = moveNumber / 2 + 1;
                  let newPath = null;
                  if (moveNumber % 2 == 0) {
                    if (moveNumber == 0) {
                      newPath = `${n}.${m.sanPlus}`;
                    } else {
                      newPath = `${path} ${n}.${m.sanPlus}`;
                    }
                  } else {
                    newPath = `${path} ${m.sanPlus}`;
                  }
                  let ecoCode = s.ecoCodeLookup[m.epdAfter];
                  let myResponse = responses[m.epdAfter]?.[0];
                  const nextEcoCode = s.ecoCodeLookup[myResponse?.epdAfter];
                  const numMovesNext =
                    s.repertoireNumMoves[s.activeSide][myResponse?.epdAfter];
                  if (
                    ecoCode &&
                    (m.mine ||
                      (!m.mine && !nextEcoCode) ||
                      (!m.mine && numMovesNext.withTranspositions === 0))
                  ) {
                    sections.push({
                      epd: m.epdAfter,
                      eco_code: ecoCode,
                      line: pgnToLine(newPath),
                      pgn: newPath,
                      numMoves: s.repertoireNumMoves[s.activeSide][m.epdAfter],
                    } as BrowserSection);
                    seenEpds.add(m.epdAfter);
                  }
                  // if (
                  //   (side == "white" && moveNumber % 2 == 0) ||
                  //   (side == "black" && moveNumber % 2 == 1)
                  // ) {
                  // }
                  if (!seenEpds.has(m.epdAfter)) {
                    seenEpds.add(m.epdAfter);
                    paths.push({ line: newPath, epd: m.epdAfter });
                    recurse(newPath, m.epdAfter, moveNumber + 1);
                  }
                });
              };
              recurse(
                lineToPgn(s.browserState.line),
                s.browserState.epd,
                s.browserState.line.length ?? 0
              );
              // TODO: can optimize this probably
              paths = paths.filter(({ line }) => {
                if (
                  some(
                    paths,
                    (p2) => p2.line.startsWith(line) && line !== p2.line
                  ) ||
                  some(
                    sections,
                    (s) => s.pgn.startsWith(line) && line !== s.pgn
                  )
                ) {
                  return false;
                } else {
                  return true;
                }
              });
              s.browserState.lines = paths.map((p) => {
                return {
                  line: p.line,
                  epd: p.epd,
                };
              });
              s.browserState.sections = sortBy(
                sections,
                (s) => -s.numMoves.withTranspositions
              );

              if (sections.length === 1) {
                console.log(
                  "Sections length is 1, popping",
                  logProxy(s.previousBrowserStates),
                  logProxy(sections)
                );
                s.previousBrowserStates.pop();
                s.selectBrowserSection(sections[0], true, s);
              }
            }),
          startEditing: (side: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              s.activeSide = side;
              s.isEditing = true;
              s.frozen = false;
              s.flipped = side === "black";
              s.onEditingPositionUpdate(s);
              s.editingState = {
                selectedTab: EditingTab.Position,
                etcModalOpen: false,
              };
            }),
          reviewWithQueue: (
            queues: BySide<QuizMove[]>,
            _state?: RepertoireState
          ) =>
            setter(set, _state, (s) => {
              let side = shuffle(SIDES)[0];
              s.isReviewingWithCustomQueue = true;
              s.queues = queues;
              s.reviewSide = side;
              s.showMoveLog = true;
              s.isReviewing = true;
              s.setupNextMove(s);
            }),
          startReview: (_side?: Side, _state?: RepertoireState) =>
            setter(set, _state, (s) => {
              let side = _side ?? shuffle(SIDES)[0];
              s.reviewSide = side;
              if (s.getQueueLength(side) === 0) {
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
          fetchPlayerTemplates: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client
                .get("/api/v1/openings/player_templates")
                .then(({ data }: { data: PlayerTemplate[] }) => {
                  set((s) => {
                    s.playerTemplates = data;
                  });
                });
            }),
          fetchSupplementary: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client.get("/api/v1/openings/supplementary").then(
                ({
                  data,
                }: {
                  data: {
                    ecoCodes: EcoCode[];
                    pawnStructures: PawnStructureDetails[];
                  };
                }) => {
                  set((s) => {
                    s.ecoCodes = data.ecoCodes;
                    s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
                    s.pawnStructures = data.pawnStructures;
                    s.pawnStructureLookup = keyBy(
                      s.pawnStructures,
                      (e) => e.name
                    );
                  });
                }
              );
            }),
          fetchEcoCodes: (_state?: RepertoireState) =>
            setter(set, _state, (s) => {
              client
                .get("/api/v1/openings/eco_codes")
                .then(({ data }: { data: EcoCode[] }) => {
                  set((s) => {
                    s.ecoCodes = data;
                    s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
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
                    } else {
                      if (!s.hasCompletedRepertoireInitialization) {
                        s.showImportView = true;
                      }
                    }
                    s.onRepertoireUpdate(s);
                  });
                });
            }),
          getMyResponsesLength: (side?: Side, _state?: RepertoireState) => {
            let s = _state ?? get();
            if (side) {
              return values(s.repertoire[side].positionResponses)
                .flatMap((v) => v)
                .filter((v) => v.mine).length;
            } else {
              return getAllRepertoireMoves(s.repertoire).length;
            }
          },
          getQueueLength: (side?: Side, _state?: RepertoireState) => {
            let s = _state ?? get();
            if (side) {
              return s.queues[side].length;
            } else {
              return s.queues["white"].length + s.queues["black"].length;
            }
          },
          getIsRepertoireEmpty: (_state?: RepertoireState) => {
            let s = _state ?? get();
            return isEmpty(getAllRepertoireMoves(s.repertoire));
          },
          getLastMoveInRepertoire: (_state?: RepertoireState) => {
            let s = _state ?? get();
            let previousEpd = nth(s.positions, -2);
            let currentEpd = last(s.positions);
            return find(
              s.repertoire[s.activeSide].positionResponses[previousEpd],
              (response: RepertoireMove) => {
                return response.epdAfter === currentEpd;
              }
            );
          },
          getCurrentPositionReport: (_state?: RepertoireState) => {
            let s = _state ?? get();
            return s.positionReports[s.activeSide][s.getCurrentEpd(s)];
          },
          getCurrentEpd: (_state?: RepertoireState) => {
            let s = _state ?? get();
            return last(s.positions);
          },
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
                    s.addedLineState = {
                      line: s.currentLine,
                      addLineFrom: AddLineFromOption.BiggestMiss,
                      stage: AddedLineStage.Initial,
                      positionReport:
                        s.positionReports[s.activeSide][s.getCurrentEpd()],
                      ecoCode: findLast(
                        map(s.positions, (p) => s.ecoCodeLookup[p])
                      ),
                    };
                    // s.backToStartPosition(s);
                    s.repertoire = data.repertoire;
                    s.repertoireGrades = data.grades;
                    s.onRepertoireUpdate(s);
                    s.onEditingPositionUpdate(s);
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
