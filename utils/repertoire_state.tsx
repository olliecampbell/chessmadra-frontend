import { Move, Square } from "@lubert/chess.ts/dist/types";
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
import { RepertoireMiss } from "./repertoire";
import create from "zustand";
import { devtools } from "zustand/middleware";

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
  ChessboardDelegate,
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
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { OpDraft } from "./op_draft";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { logProxy } from "./state";
// let COURSE = "99306";
let COURSE = null;
// let ASSUME = "1.c4";
let ASSUME = null;
let NUM_MOVES_DEBUG_PAWN_STRUCTURES = 10;
export interface QuizMove {
  move: RepertoireMove;
  line: string;
}

export enum AddLineFromOption {
  Initial = "Start Position",
  Current = "Current Position",
  BiggestMiss = "Biggest Gap in Repertoire",
  BiggestMissOpening = "Biggest Gap in Opening",
}

export interface RepertoireState {
  quick: (fn: (_: RepertoireState) => void) => void;
  chessboardState: ChessboardState;
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
  repertoireShareId?: string;
  activeSide: Side;
  failedCurrentMove?: boolean;
  setUser: (user: User) => void;
  reviewLine: (line: string[], side: Side) => void;
  fetchSharedRepertoire: (id: string) => void;
  fetchRepertoire: () => void;
  fetchEcoCodes: () => void;
  fetchSupplementary: () => Promise<void>;
  fetchRepertoireTemplates: () => void;
  fetchPlayerTemplates: () => void;
  initializeRepertoire: (_: {
    lichessUsername?: string;
    whitePgn?: string;
    blackPgn?: string;
    state?: RepertoireState;
  }) => void;
  user?: User;
  initState: () => void;
  playPgn: (pgn: string) => void;
  playSan: (pgn: string) => void;
  addPendingLine: () => void;
  isAddingPendingLine: boolean;
  hasGivenUp?: boolean;
  giveUp: () => void;
  usePlayerTemplate: (id: string) => void;
  setupNextMove: () => void;
  startReview: (side?: Side) => void;
  reviewWithQueue: (queues: BySide<QuizMove[]>) => void;
  isReviewingWithCustomQueue?: boolean;
  backToOverview: () => void;
  startEditing: (side: Side) => void;
  startBrowsing: (side: Side) => void;
  showImportView?: boolean;
  startImporting: () => void;
  updateRepertoireStructures: () => void;
  onMove: () => void;
  getMyResponsesLength: (side?: Side) => number;
  getQueueLength: (side?: Side) => number;
  getIsRepertoireEmpty: () => boolean;
  getLastMoveInRepertoire: () => RepertoireMove;
  getCurrentPositionReport: () => PositionReport;
  getCurrentEpd: () => string;
  onEditingPositionUpdate: () => void;
  analyzeLineOnLichess: () => void;
  searchOnChessable: (side: Side) => void;
  backOne: () => void;
  backToStartPosition: () => void;
  deleteRepertoire: (side: Side) => void;
  deleteMoveConfirmed: () => void;
  exportPgn: (side: Side) => void;
  addTemplates: () => void;
  updateQueue: (cram: boolean) => void;
  onRepertoireUpdate: () => void;
  markMoveReviewed: (m: string, correct: boolean) => void;
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
  getMovesDependentOnPosition: (epd: string) => number;
  inProgressUsingPlayerTemplate?: boolean;
  fetchPositionReportIfNeeded: () => void;
  ecoCodes: EcoCode[];
  pawnStructures: PawnStructureDetails[];
  ecoCodeLookup: Record<string, EcoCode>;
  pawnStructureLookup: Record<string, PawnStructureDetails>;
  browsingState: {
    readOnly: boolean;
    drilldownState?: BrowserDrilldownState;
    previousDrilldownStates?: BrowserDrilldownState[];
    selectDrilldownState: (drilldownState: BrowserDrilldownState) => void;
    updateDrilldownStateAndSections: (epd: string, line: string[]) => void;
    selectBrowserSection: (
      section: BrowserSection,
      includeInPreviousStates: boolean
    ) => void;
  };
  updateEloRange: (range: [number, number]) => void;
  isUpdatingEloRange: boolean;
  editingState: {
    lastEcoCode?: EcoCode;
    selectedTab: EditingTab;
    etcModalOpen: boolean;
    deleteConfirmationModalOpen: boolean;
    deleteConfirmationResponse?: RepertoireMove;
    isDeletingMove: boolean;
  };
  addedLineState: {
    line: string[];
    addNewLineChoices?: AddNewLineChoice[];
    addNewLineSelectedIndex?: number;
    ecoCode: EcoCode;
    stage: AddedLineStage;
    positionReport: PositionReport;
  };
  //
  overviewState: {
    isShowingShareModal: boolean;
  };

  // Debug pawn structure stuff
  debugPawnStructuresState: any & {};
  fetchDebugGames: () => void;
  fetchDebugPawnStructureForPosition: () => void;
  selectDebugGame: (i: number) => void;

  // Chessboard delegate stuff
  attemptMove?: (
    move: Move,
    cb: (shouldMove: boolean, cb: () => void) => void
  ) => boolean;
}

export interface AddNewLineChoice {
  title: string;
  line: string;
  active?: boolean;
  incidence?: number;
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

export interface BrowserDrilldownState {
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
  shareId: string;
}

interface GetSharedRepertoireResponse {
  repertoire: Repertoire;
  // grades: BySide<RepertoireGrade>;
  // shareId: string;
}

const START_EPD = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
export const DEFAULT_ELO_RANGE = [1300, 1500] as [number, number];
const EMPTY_QUEUES = { white: [], black: [] };

let pendingState = null;

export const createRepertoireState = () => {};

type Stack = [RepertoireState, AppState];

export const getInitialRepertoireState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([s.repertoireState, s]));
  };
  const setOnly = <T,>(fn: (stack: RepertoireState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([s.repertoireState, s]));
  };
  let initialState = {
    // TODO: clone?
    ...createQuick<RepertoireState>(setOnly),
    chessboardState: null,
    ecoCodes: [],
    debugPawnStructuresState: null,
    addedLineState: null,
    isAddingPendingLine: false,
    repertoireNumMoves: null,
    pawnStructures: [],
    isUpdatingEloRange: false,
    repertoire: undefined,
    overviewState: {
      isShowingShareModal: false,
    },
    browsingState: {
      readOnly: false,
      selectDrilldownState: (browserState: BrowserDrilldownState) =>
        set(([s]) => {
          while (true) {
            let lastState = s.browsingState.previousDrilldownStates.pop();
            if (lastState.ecoCode.code === browserState.ecoCode.code) {
              s.browsingState.previousDrilldownStates.push(lastState);
              s.browsingState.drilldownState = browserState;
              break;
            }
          }
        }),
      updateDrilldownStateAndSections: (epd: string, line: string[]) =>
        set(([s]) => {
          s.browsingState.drilldownState = {
            epd: epd,
            sections: [],
            line: line,
            lines: [],
            ecoCode: s.ecoCodeLookup[epd],
          };

          let sections: BrowserSection[] = [];
          let responses = s.repertoire[s.activeSide].positionResponses;
          let paths = [];
          if (!isEmpty(line)) {
            paths.push({ line: lineToPgn(line), epd: epd });
          }
          let seenEpds = new Set(
            s.browsingState.drilldownState?.sections?.map((s) => s.epd) ?? []
          );
          let historyEcoFullNames = new Set();
          [
            ...s.browsingState.previousDrilldownStates,
            s.browsingState.drilldownState,
          ].forEach((p) => {
            if (p.ecoCode) {
              historyEcoFullNames.add(p.ecoCode.fullName);
            }
          });
          console.log({ historyEcoFullNames });
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
                !historyEcoFullNames.has(ecoCode.fullName) &&
                (m.mine ||
                  (!m.mine && !nextEcoCode) ||
                  (!m.mine && numMovesNext.withTranspositions === 0))
              ) {
                console.log(`${ecoCode.fullName} is not included in set!`);
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
              if (s.browsingState.drilldownState.sections.length === 1) {
                s.browsingState.updateDrilldownStateAndSections(
                  s.browsingState.drilldownState.sections[0].epd,
                  s.browsingState.drilldownState.sections[0].line
                );
              }
            });
          };
          recurse(
            lineToPgn(s.browsingState.drilldownState.line),
            s.browsingState.drilldownState.epd,
            s.browsingState.drilldownState.line.length ?? 0
          );
          // TODO: can optimize this probably
          paths = paths.filter(({ line }) => {
            if (
              some(
                paths,
                (p2) => p2.line.startsWith(line) && line !== p2.line
              ) ||
              some(sections, (s) => s.pgn.startsWith(line) && line !== s.pgn)
            ) {
              return false;
            } else {
              return true;
            }
          });
          s.browsingState.drilldownState.lines = paths.map((p) => {
            return {
              line: p.line,
              epd: p.epd,
            };
          });
          s.browsingState.drilldownState.sections = sortBy(
            sections,
            (s) => -s.numMoves.withTranspositions
          );
        }, "updateDrilldownStateAndSections"),
      selectBrowserSection: (
        browserSection: BrowserSection,
        includeInPreviousStates: boolean
      ) =>
        set(([s]) => {
          // s.browsingState.line = browserSection.line;
          // s.browsingState.epd = browserSection.epd;
          s.browsingState.updateDrilldownStateAndSections(
            browserSection.epd,
            browserSection.line
          );
          if (includeInPreviousStates) {
            s.browsingState.previousDrilldownStates.push(
              s.browsingState.drilldownState
            );
          }
        }),
    },
    editingState: {
      selectedTab: EditingTab.Position,
      etcModalOpen: false,
      deleteConfirmationModalOpen: false,
      isDeletingMove: false,
    },
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
    initState: () =>
      set(([s]) => {
        s.fetchRepertoire();
        s.fetchSupplementary();
      }, "initState"),
    setUser: (user: User) =>
      set(([s]) => {
        s.user = user;
      }, "setUser"),
    giveUp: () =>
      set(([s]) => {
        let moveObj = s.chessboardState.position.validateMoves([
          s.currentMove.move.sanPlus,
        ])?.[0];
        s.chessboardState.frozen = true;
        s.failedCurrentMove = true;
        s.chessboardState.animatePieceMove(
          moveObj,
          PlaybackSpeed.Normal,
          (completed) => {
            set(([s]) => {
              s.hasGivenUp = true;
            });
          }
        );
      }, "giveUp"),
    updateEloRange: (range: [number, number]) =>
      set(([s]) => {
        s.isUpdatingEloRange = true;
        client
          .post("/api/v1/user/elo_range", {
            min: range[0],
            max: range[1],
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.user.eloRange = formatEloRange(range);
            });
          })
          .finally(() => {
            set(([s]) => {
              s.isUpdatingEloRange = false;
              s.fetchRepertoire();
            });
          });
      }, "updateEloRange"),
    playPgn: (pgn: string) =>
      set(([s]) => {
        s.backToStartPosition();
        pgnToLine(pgn).map((san) => {
          s.chessboardState.position.move(san);
          if (s.isEditing) {
            s.onMove();
          }
        });
      }, "playPgn"),
    playSan: (san: string) =>
      set(([s]) => {
        s.chessboardState.position.move(san);
        if (s.isEditing) {
          s.onMove();
        }
      }, "playSan"),
    usePlayerTemplate: (id: string) =>
      set(async ([s]) => {
        s.inProgressUsingPlayerTemplate = true;
        let { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/openings/use_player_template",
          {
            id,
          }
        );
        set(([s]) => {
          s.inProgressUsingPlayerTemplate = false;
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.backToOverview();
          s.hasCompletedRepertoireInitialization = true;
        });
      }, "usePlayerTemplate"),
    addTemplates: () =>
      set(async ([s]) => {
        let { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/openings/add_templates",
          {
            templates: Object.values(s.selectedTemplates),
          }
        );
        set(([s]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.backToOverview();
          s.hasCompletedRepertoireInitialization = true;
        });
      }, "addTemplates"),
    initializeRepertoire: ({ state, lichessUsername, blackPgn, whitePgn }) =>
      set(async ([s]) => {
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
        let { data }: { data: FetchRepertoireResponse } = await client.post(
          "/api/v1/initialize_repertoire",
          {
            lichessGames,
            lichessUsername,
            chessComGames,
            whitePgn,
            blackPgn,
          }
        );
        set(([s]) => {
          s.repertoire = data.repertoire;
          s.repertoireGrades = data.grades;
          s.onRepertoireUpdate();
          s.hasCompletedRepertoireInitialization = true;
          s.backToOverview();
        }, "initializeRepertoire");
      }),
    searchOnChessable: (side: Side) =>
      set(([s]) => {
        let fen = s.chessboardState.position.fen();
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
      }, "searchOnChessable"),
    analyzeLineOnLichess: () =>
      set(([s]) => {
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
      }, "analyzeLineOnLichess"),
    getMovesDependentOnPosition: (epd: string) =>
      get(([s]) => {
        if (!s.repertoire) {
          return 0;
        }
        let total = 0;
        let seenEpds = new Set();
        let recurse = (epd, isStart?: boolean) => {
          let responses = s.repertoire[s.activeSide].positionResponses[epd];
          if (isStart && first(responses)?.mine == false) {
            return;
          }
          map(responses, (r) => {
            if (r.mine) {
              total += 1;
            }
            if (!seenEpds.has(r.epdAfter)) {
              seenEpds.add(r.epdAfter);
              recurse(r.epdAfter);
            }
          });
        };
        recurse(epd, true);
        return total;
      }),
    onEditingPositionUpdate: () =>
      set(([s]) => {
        let line = s.chessboardState.position.history();
        s.currentLine = line;
        s.chessboardState.moveLogPgn = lineToPgn(line);
        s.pendingResponses = {};
        s.differentMoveIndices = [];
        if (s.ecoCodeLookup && s.editingState) {
          s.editingState.lastEcoCode = last(
            filter(
              map(s.positions, (p) => {
                return s.ecoCodeLookup[p];
              })
            )
          );
        }
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
            let mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
            // let checker = () => {
            //   console.log(
            //     "Checking position and san",
            //     position,
            //     san,
            //     mine
            //   );
            //   let chess = new Chess();
            //   chess.load(position);
            //   console.log(chess.ascii());
            //   if (!chess.validateMoves([san])) {
            //     console.warn("This was an invalid move!", i);
            //   }
            // };
            // checker();
            s.pendingResponses[position] = [
              {
                epd: position,
                epdAfter: s.positions[i + 1],
                sanPlus: san,
                side: s.activeSide,
                pending: true,
                mine: mine,
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
          s.divergencePosition
        );
        s.fetchPositionReportIfNeeded();
      }, "onEditingPositionUpdate"),
    fetchPositionReportIfNeeded: () =>
      set(([s]) => {
        let epd = s.getCurrentEpd();
        let side = s.activeSide;
        if (!isNil(s.getCurrentPositionReport())) {
          return;
        }
        client
          .post("/api/v1/openings/position_report", {
            epd: epd,
          })
          .then(({ data }: { data: PositionReport }) => {
            set(([s]) => {
              s.positionReports[side][epd] = data;
            });
          })
          .finally(() => {
            // set(([s]) => {});
          });
      }, "fetchPositionReportIfNeeded"),
    onMove: () =>
      set(([s]) => {
        let epd = genEpd(s.chessboardState.position);
        s.positions.push(epd);
        if (s.debugPawnStructuresState) {
          s.fetchDebugPawnStructureForPosition();
        }
        if (s.isEditing) {
          s.onEditingPositionUpdate();
        }
      }, "onMove"),
    reviewLine: (line: string[], side: Side) =>
      set(([s]) => {
        s.backToOverview();
        let queues = cloneDeep(EMPTY_QUEUES);
        let sideQueue = [];
        let epd = START_EPD;
        let lineSoFar = [];
        line.map((move) => {
          let response = find(
            s.repertoire[side].positionResponses[epd],
            (m) => m.sanPlus === move
          );
          epd = response?.epdAfter;
          if (response && response.mine && response.epd !== START_EPD) {
            sideQueue.push({
              move: response,
              line: lineToPgn(lineSoFar),
            });
          } else {
            console.log("Couldn't find a move for ", epd);
          }
          lineSoFar.push(move);
        });
        queues[side] = sideQueue;
        s.reviewWithQueue(queues);
      }, "reviewLine"),
    updateQueue: (cram: boolean) =>
      set(([s]) => {
        let seen_epds = new Set();
        s.queues = {
          white: [],
          black: [],
        };
        const recurse = (epd, line, side: Side) => {
          map(shuffle(s.repertoire[side].positionResponses[epd]), (m) => {
            if (m.mine && (cram || m.srs.needsReview) && m.epd !== START_EPD) {
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
      }, "updateQueue"),
    updateRepertoireStructures: () =>
      set(([s]) => {
        console.log("Updating structures!");
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
                  let x = recurse(m.epdAfter, [...line, m.sanPlus], m.mine);
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
      }, "updateRepertoireStructures"),

    markMoveReviewed: (m: string, correct: boolean) =>
      set(([s]) => {
        client
          .post("/api/v1/openings/move_reviewed", { correct, epd: m })
          .then(({ data }) => {});
      }),
    setupNextMove: () =>
      set(([s]) => {
        s.chessboardState.frozen = false;
        s.hasGivenUp = false;
        if (s.currentMove) {
          if (s.failedCurrentMove) {
            s.queues[s.currentMove.move.side].push(s.currentMove);
            s.markMoveReviewed(s.currentMove.move.epd, false);
          } else {
            s.markMoveReviewed(s.currentMove.move.epd, true);
          }
        }
        s.currentMove = s.queues[s.reviewSide].shift();
        if (!s.currentMove) {
          s.reviewSide = otherSide(s.reviewSide);
          s.currentMove = s.queues[s.reviewSide].shift();
          if (!s.currentMove) {
            s.backToOverview();
            return;
          }
        }
        s.chessboardState.moveLogPgn = s.currentMove.line;
        s.failedCurrentMove = false;
        s.chessboardState.flipped = s.currentMove.move.side === "black";
        s.chessboardState.position = new Chess();
        // s.frozen = false;
        s.chessboardState.position.loadPgn(s.currentMove.line);
        // s.position.undo();
        let lastOpponentMove = s.chessboardState.position.undo();

        if (lastOpponentMove) {
          window.setTimeout(() => {
            set(([s]) => {
              if (s.isReviewing) {
                s.chessboardState.animatePieceMove(
                  lastOpponentMove,
                  PlaybackSpeed.Normal,
                  (completed) => {}
                );
              }
            });
          }, 300);
        }
      }, "setupNextMove"),

    deleteMoveConfirmed: () =>
      set(([s]) => {
        let response = s.editingState.deleteConfirmationResponse;
        s.editingState.isDeletingMove = true;
        client
          .post("/api/v1/openings/delete_move", {
            response: response,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              s.backToStartPosition();
            });
          })
          .finally(() => {
            set(([s]) => {
              s.editingState.isDeletingMove = false;
              s.editingState.deleteConfirmationModalOpen = false;
            });
          });
      }, "deleteMoveConfirmed"),
    deleteRepertoire: (side: Side) =>
      set(([s]) => {
        client
          .post("/api/v1/openings/delete", {
            sides: [side],
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
            });
          });
      }, "deleteRepertoire"),
    exportPgns: () => set(([s]) => {}),
    exportPgn: (side: Side) =>
      set(([s]) => {
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
      }, "exportPgn"),

    backToOverview: () =>
      set(([s]) => {
        if (s.isReviewingWithCustomQueue) {
          s.isReviewingWithCustomQueue = false;
          s.updateQueue(false);
        }
        s.showImportView = false;
        s.backToStartPosition();
        s.reviewSide = null;
        s.chessboardState.moveLogPgn = null;
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
        s.chessboardState.position = new Chess();
        s.chessboardState.frozen = true;
        s.chessboardState.flipped = false;
        s.divergencePosition = null;
        s.divergenceIndex = null;
        s.hasPendingLineToAdd = false;
        s.pendingResponses = {};
        s.chessboardState.showMoveLog = false;
        s.addedLineState = null;
      }),
    startImporting: () =>
      set(([s]) => {
        s.showImportView = true;
      }, "startImporting"),
    startBrowsing: (side: Side) =>
      set(([s]) => {
        s.isBrowsing = true;
        s.activeSide = side;
        s.browsingState.drilldownState = {
          epd: START_EPD,
          sections: [],
          line: [],
          lines: [],
          ecoCode: null,
        };
        s.browsingState.previousDrilldownStates = [];
        s.browsingState.updateDrilldownStateAndSections(
          s.browsingState.drilldownState.epd,
          s.browsingState.drilldownState.line
        );

        if (s.browsingState.drilldownState.sections.length === 1) {
          s.browsingState.previousDrilldownStates.pop();
          s.browsingState.selectBrowserSection(
            s.browsingState.drilldownState.sections[0],
            true
          );
        }
        // s.browsingState.previousDrilldownStates.push(s.browsingState.drilldownState);
      }, "startBrowsing"),
    startEditing: (side: Side) =>
      set(([s]) => {
        s.activeSide = side;
        s.isEditing = true;
        s.chessboardState.frozen = false;
        s.chessboardState.flipped = side === "black";
        s.editingState = {
          ...s.editingState,
          selectedTab: EditingTab.Responses,
          etcModalOpen: false,
        };
        s.onEditingPositionUpdate();
      }),
    reviewWithQueue: (queues: BySide<QuizMove[]>) =>
      set(([s]) => {
        let side = shuffle(SIDES)[0];
        s.isReviewingWithCustomQueue = true;
        s.queues = queues;
        s.reviewSide = side;
        s.chessboardState.showMoveLog = true;
        s.isReviewing = true;
        s.setupNextMove();
      }),
    startReview: (_side?: Side) =>
      set(([s]) => {
        let side = _side ?? shuffle(SIDES)[0];
        s.reviewSide = side;
        if (s.getQueueLength(side) === 0) {
          s.updateQueue(true);
          s.isCramming = true;
        }
        s.chessboardState.showMoveLog = true;
        s.isReviewing = true;
        s.setupNextMove();
      }),
    onRepertoireUpdate: () =>
      set(([s]) => {
        console.log("Repertoire during update?", logProxy(s.repertoire));
        s.updateRepertoireStructures();
        s.updateQueue(false);
      }),
    fetchRepertoireTemplates: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/template_repertoires")
          .then(({ data }: { data: RepertoireTemplate[] }) => {
            set(([s]) => {
              s.repertoireTemplates = data;
            });
          });
      }),
    fetchPlayerTemplates: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/player_templates")
          .then(({ data }: { data: PlayerTemplate[] }) => {
            set(([s]) => {
              s.playerTemplates = data;
            });
          });
      }),
    fetchSupplementary: () =>
      set(([s]) => {
        return client.get("/api/v1/openings/supplementary").then(
          ({
            data,
          }: {
            data: {
              ecoCodes: EcoCode[];
              pawnStructures: PawnStructureDetails[];
            };
          }) => {
            set(([s]) => {
              s.ecoCodes = data.ecoCodes;
              s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
              s.pawnStructures = data.pawnStructures;
              s.pawnStructureLookup = keyBy(s.pawnStructures, (e) => e.id);
            });
          }
        );
      }),
    fetchEcoCodes: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings/eco_codes")
          .then(({ data }: { data: EcoCode[] }) => {
            set(([s]) => {
              s.ecoCodes = data;
              s.ecoCodeLookup = keyBy(s.ecoCodes, (e) => e.epd);
            });
          });
      }),
    fetchDebugPawnStructureForPosition: () =>
      set(([s]) => {
        let epd = s.getCurrentEpd();
        s.debugPawnStructuresState.loadingPosition;
        client
          .post("/api/v1/debug/position", {
            epd,
          })
          .then(({ data }: { data: any }) => {
            set(([s]) => {
              s.debugPawnStructuresState.byPosition[epd] = data;
              console.log("Should?", s.getCurrentEpd(), epd);
              if (s.getCurrentEpd() === epd) {
                console.log("Setting pawnStructures");
                s.debugPawnStructuresState.loadingPosition = false;
                s.debugPawnStructuresState.pawnStructures = sortBy(
                  data,
                  (p) => {
                    return !p.passed;
                  }
                );
              }
            });
          });
      }),
    fetchDebugGames: () =>
      set(([s]) => {
        s.chessboardState.frozen = false;
        s.debugPawnStructuresState = {
          games: [],
          loadingGames: true,
          byPosition: {},
          mode: "games",
          i: 0,
        };
        client
          .post("/api/v1/debug/master_games", {
            move_number: NUM_MOVES_DEBUG_PAWN_STRUCTURES,
          })
          .then(({ data }: { data: any }) => {
            set(([s]) => {
              s.debugPawnStructuresState.i = 0;
              s.debugPawnStructuresState.loadingGames = false;
              s.debugPawnStructuresState.games = sortBy(data.games, (g) => {
                return !some(g.pawnStructures, (s) => s.passed);
              });
              if (s.debugPawnStructuresState.mode === "games") {
                s.selectDebugGame(0);
              }
            });
          });
      }),
    selectDebugGame: (i: number) =>
      set(([s]) => {
        let { game, pawnStructures } = s.debugPawnStructuresState.games[i];
        s.debugPawnStructuresState.i = i;
        s.debugPawnStructuresState.game = game;
        s.debugPawnStructuresState.moves = NUM_MOVES_DEBUG_PAWN_STRUCTURES;
        s.debugPawnStructuresState.pawnStructures = sortBy(
          pawnStructures,
          (p) => {
            return !p.passed;
          }
        );
        // s.debugPawnStructuresState.r
        s.playPgn(lineToPgn(take(game.moves, NUM_MOVES_DEBUG_PAWN_STRUCTURES)));
      }),
    fetchSharedRepertoire: (id: string) =>
      set(([s]) => {
        Promise.all([
          s.fetchSupplementary(),

          client
            .get(`/api/v1/openings/shared/${id}`)
            .then(({ data }: { data: GetSharedRepertoireResponse }) => {
              set(([s]) => {
                s.repertoire = data.repertoire;
                console.log(logProxy(s));
                s.onRepertoireUpdate();
              });
            }),
        ]).then(() => {
          set(([s]) => {
            console.log("Eco code lookup?");
            console.log(logProxy(s.ecoCodeLookup));
            s.startBrowsing("white");
            s.browsingState.readOnly = true;
          });
        });
      }),
    fetchRepertoire: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings")
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              console.log("Fetched repertoire!");
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.repertoireShareId = data.shareId;
              if (getAllRepertoireMoves(s.repertoire).length > 0) {
                s.hasCompletedRepertoireInitialization = true;
              } else {
                if (!s.hasCompletedRepertoireInitialization) {
                  s.showImportView = true;
                }
              }
              console.log("Repertoire here?", logProxy(s.repertoire));
              s.onRepertoireUpdate();
            });
          });
      }),
    getMyResponsesLength: (side?: Side) =>
      get(([s]) => {
        if (side) {
          return values(s.repertoire[side].positionResponses)
            .flatMap((v) => v)
            .filter((v) => v.mine).length;
        } else {
          return getAllRepertoireMoves(s.repertoire).length;
        }
      }),
    getQueueLength: (side?: Side) =>
      get(([s]) => {
        if (side) {
          return s.queues[side].length;
        } else {
          return s.queues["white"].length + s.queues["black"].length;
        }
      }),
    getIsRepertoireEmpty: () =>
      get(([s]) => {
        return isEmpty(getAllRepertoireMoves(s.repertoire));
      }),
    getLastMoveInRepertoire: () =>
      get(([s]) => {
        let previousEpd = nth(s.positions, -2);
        let currentEpd = last(s.positions);
        return find(
          s.repertoire[s.activeSide].positionResponses[previousEpd],
          (response: RepertoireMove) => {
            return response.epdAfter === currentEpd;
          }
        );
      }),
    getCurrentPositionReport: () =>
      get(([s]) => {
        return s.positionReports[s.activeSide][s.getCurrentEpd()];
      }),
    getCurrentEpd: () =>
      get(([s]) => {
        return last(s.positions);
      }),
    backOne: () =>
      set(([s]) => {
        let m = s.chessboardState.position.undo();
        if (m) {
          s.positions.pop();
        }
        if (s.debugPawnStructuresState) {
          s.fetchDebugPawnStructureForPosition();
        }
        if (s.isEditing) {
          s.onEditingPositionUpdate();
        }
        // s.onEditingPositionUpdate(s);
      }),
    backToStartPosition: () =>
      set(([s]) => {
        s.chessboardState.position = new Chess();
        s.positions = [START_EPD];
        s.onEditingPositionUpdate();
      }),
    editRepertoireSide: (side: Side) =>
      set(([s]) => {
        s.editingSide = side;
        s.isEditing = true;
      }),
    addPendingLine: () =>
      set(([s]) => {
        s.isAddingPendingLine = true;
        client
          .post("/api/v1/openings/add_moves", {
            moves: _.flatten(cloneDeep(_.values(s.pendingResponses))),
            side: s.activeSide,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              // s.backToStartPosition(s);
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              s.onEditingPositionUpdate();

              s.addedLineState = {
                line: s.currentLine,
                stage: AddedLineStage.Initial,
                addNewLineSelectedIndex: 0,
                positionReport:
                  s.positionReports[s.activeSide][s.getCurrentEpd()],
                ecoCode: findLast(map(s.positions, (p) => s.ecoCodeLookup[p])),
              };
              let choices = [];
              let seenMisses = new Set();
              let addMiss = (miss: RepertoireMiss, title) => {
                if (!miss || seenMisses.has(miss.epd)) {
                  return;
                }
                seenMisses.add(miss.epd);
                choices.push({
                  line: miss.lines[0],
                  title: title,
                  incidence: miss.incidence,
                });
              };
              let biggestMiss = s.repertoireGrades[s.activeSide].biggestMiss;
              if (biggestMiss) {
                addMiss(biggestMiss, `Biggest miss overall`);
              }

              let ecoCode = s.addedLineState.ecoCode;
              if (ecoCode) {
                let ecoName = getNameEcoCodeIdentifier(ecoCode.fullName);
                let miss = find(
                  s.repertoireGrades[s.activeSide].biggestMisses,
                  (m) => m.ecoCodeName == ecoName
                );
                addMiss(miss, `Biggest miss in ${ecoName}`);
                let fullEcoName = ecoCode.fullName;
                miss = find(
                  s.repertoireGrades[s.activeSide].biggestMisses,
                  (m) => m.ecoCodeName == fullEcoName
                );
                addMiss(miss, `Biggest miss in ${fullEcoName}`);
              }

              choices.push({
                line: "",
                title: "Start position",
              });
              choices.push({
                line: lineToPgn(s.addedLineState.line),
                title: "Current position",
              });
              choices = take(choices, 3);
              s.addedLineState.addNewLineChoices = choices;
            });
          })
          .finally(() => {
            set(([s]) => {
              s.isAddingPendingLine = false;
            });
          });
      }),
    selectedTemplates: {},
  } as RepertoireState;

  const setChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _get((s) => fn(s.repertoireState.chessboardState));
  };
  initialState.chessboardState = createChessState(
    setChess,
    getChess,
    (c: ChessboardState) => {
      c.frozen = true;
      c.delegate = {
        completedMoveAnimation: () => {},
        madeMove: () =>
          set(([s]) => {
            s.chessboardState.flashRing(true);
            window.setTimeout(() => {
              set(([s]) => {
                if (s.isReviewing) {
                  if (s.failedCurrentMove) {
                    s.hasGivenUp = true;
                  } else {
                    s.setupNextMove();
                  }
                }
              });
            }, 100);
          }),

        shouldMakeMove: (move: Move) =>
          set(([s]) => {
            if (s.debugPawnStructuresState) {
              return true;
            }
            if (s.isEditing) {
              return true;
            } else if (s.isReviewing) {
              if (move.san == s.currentMove.move.sanPlus) {
                return true;
              } else {
                s.chessboardState.flashRing(false);
                s.failedCurrentMove = true;
                return false;
              }
            }
          }),
      };
    }
  );
  return initialState;
};

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
