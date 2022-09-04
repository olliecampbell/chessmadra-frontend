import { Move } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import {
  PlayerTemplate,
  RepertoireTemplate,
  User,
  PositionReport,
  EcoCode,
  PawnStructureDetails,
} from "app/models";
import { RepertoireMiss } from "./repertoire";
import {
  cloneDeep,
  dropRight,
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
  isNil,
  nth,
  zip,
  sortBy,
  findLast,
  capitalize,
} from "lodash-es";
import {
  BySide,
  getAllRepertoireMoves,
  lineToPgn,
  otherSide,
  pgnToLine,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
  SIDES,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { Chess } from "@lubert/chess.ts";
import { PlaybackSpeed } from "app/types/VisualizationState";
import { genEpd, START_EPD } from "./chess";
import { formatEloRange } from "./elo_range";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { logProxy } from "./state";
import {
  BrowserDrilldownState,
  BrowserSection,
  BrowsingState,
  getInitialBrowsingState,
} from "./browsing_state";
import { failOnAny } from "./test_settings";
// let COURSE = "99306";
let COURSE = null;
// let ASSUME = "1.c4";
let ASSUME = null;
let NUM_MOVES_DEBUG_PAWN_STRUCTURES = 10;
export interface QuizMove {
  moves: RepertoireMove[];
  line: string;
}

export interface ReviewPositionResults {
  correct: boolean;
  epd: string;
  sanPlus: string;
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
  failedToFetchSharedRepertoire?: boolean;
  currentMove?: QuizMove;
  reviewSide?: Side;
  repertoireGrades: BySide<RepertoireGrade>;
  repertoireShareId?: string;
  activeSide: Side;
  failedReviewPositionMoves?: Record<string, RepertoireMove>;
  completedReviewPositionMoves?: Record<string, RepertoireMove>;
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
  playSan: (pgn: string) => void;
  addPendingLine: (_?: { replace: boolean }) => void;
  isAddingPendingLine: boolean;
  // TODO: move review state stuff to its own module
  showNext?: boolean;
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
  getCurrentPositionReport: () => PositionReport;
  getCurrentEpd: () => string;
  onEditingPositionUpdate: () => void;
  analyzeLineOnLichess: (line: string[]) => void;
  searchOnChessable: (side: Side) => void;
  backOne: () => void;
  backToStartPosition: () => void;
  deleteRepertoire: (side: Side) => void;
  deleteMoveConfirmed: () => void;
  exportPgn: (side: Side) => void;
  addTemplates: () => void;
  updateQueue: (cram: boolean) => void;
  onRepertoireUpdate: () => void;
  markMovesReviewed: (results: ReviewPositionResults[]) => void;
  isEditing?: boolean;
  isBrowsing?: boolean;
  isReviewing?: boolean;
  editingSide?: Side;
  myResponsesLookup?: BySide<RepertoireMove[]>;
  moveLookup?: BySide<Record<string, RepertoireMove>>;
  currentLine?: string[];
  pendingMoves?: RepertoireMove[];
  hasCompletedRepertoireInitialization?: boolean;
  hasPendingLineToAdd?: boolean;
  pendingLineHasConflictingMoves?: boolean;
  repertoireTemplates?: RepertoireTemplate[];
  playerTemplates?: PlayerTemplate[];
  selectedTemplates: Record<string, string>;
  conflictingId?: string;
  // The first position where the user does not have a response for
  divergencePosition?: string;
  divergenceIndex?: number;
  differentMoveIndices?: number[];
  isCramming?: boolean;
  pendingResponses?: Record<string, RepertoireMove[]>;
  inProgressUsingPlayerTemplate?: boolean;
  fetchNeededPositionReports: () => void;
  ecoCodes: EcoCode[];
  pawnStructures: PawnStructureDetails[];
  ecoCodeLookup: Record<string, EcoCode>;
  pawnStructureLookup: Record<string, PawnStructureDetails>;
  browsingState: BrowsingState;
  updateEloRange: (range: [number, number]) => void;
  isUpdatingEloRange: boolean;
  editingState: {
    lastEcoCode?: EcoCode;
    selectedTab: EditingTab;
    etcModalOpen: boolean;
    addConflictingMoveModalOpen: boolean;
  };
  deleteMoveState: {
    modalOpen: boolean;
    response?: RepertoireMove;
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
  updateShareLink: () => void;
  //
  overviewState: {
    isShowingShareModal: boolean;
  };
  getRemainingReviewPositionMoves: () => RepertoireMove[];
  getNextReviewPositionMove(): RepertoireMove;

  repertoireSettingsModalSide?: Side;
  // Nav bar stuff
  breadcrumbs: NavBreadcrumb[];
  setBreadcrumbs: (breadcrumbs: NavBreadcrumb[]) => void;

  // Debug pawn structure stuff
  debugPawnStructuresState: any & {};
  fetchDebugGames: () => void;
  fetchDebugPawnStructureForPosition: () => void;
  selectDebugGame: (i: number) => void;
}

export interface NavBreadcrumb {
  text: string;
  onPress?: () => void;
}

export interface AddNewLineChoice {
  title: string;
  line: string;
  active?: boolean;
  incidence?: number;
}

export enum EditingTab {
  Position = "Position",
  Responses = "Responses",
}

export enum AddedLineStage {
  Initial,
  AddAnother,
}

interface FetchRepertoireResponse {
  repertoire: Repertoire;
  grades: BySide<RepertoireGrade>;
  shareId: string;
}

interface GetSharedRepertoireResponse {
  repertoire: Repertoire;
}

export const DEFAULT_ELO_RANGE = [1300, 1500] as [number, number];
const EMPTY_QUEUES = { white: [], black: [] };

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
    ...createQuick<RepertoireState>(setOnly),
    chessboardState: null,
    deleteMoveState: {
      modalOpen: false,
      isDeletingMove: false,
    },
    ecoCodes: [],
    debugPawnStructuresState: null,
    addedLineState: null,
    isAddingPendingLine: false,
    repertoireNumMoves: null,
    pawnStructures: [],
    isUpdatingEloRange: false,
    repertoire: undefined,
    browsingState: getInitialBrowsingState(_set, _get),
    overviewState: {
      isShowingShareModal: false,
    },
    editingState: {
      selectedTab: EditingTab.Position,
      etcModalOpen: false,
      addConflictingMoveModalOpen: false,
    },
    breadcrumbs: [
      {
        text: "Home",
        onPress: () => {
          set(([s, appState]) => {
            appState.navigate("/");
            s.backToOverview();
          });
        },
      },
    ],
    setBreadcrumbs: (breadcrumbs: NavBreadcrumb[]) =>
      set(([s]) => {
        s.breadcrumbs = [s.breadcrumbs[0], ...breadcrumbs];
      }),
    repertoireGrades: { white: null, black: null },
    activeSide: "white",
    ecoCodeLookup: {},
    pawnStructureLookup: {},
    inProgressUsingPlayerTemplate: false,
    pendingResponses: {},
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
        let move = s.getNextReviewPositionMove();
        let moveObj = s.chessboardState.position.validateMoves([
          move.sanPlus,
        ])?.[0];
        s.chessboardState.frozen = true;
        s.completedReviewPositionMoves[move.sanPlus] = move;
        s.getRemainingReviewPositionMoves().forEach((move) => {
          s.failedReviewPositionMoves[move.sanPlus] = move;
        });
        s.showNext = true;
        s.chessboardState.animatePieceMove(
          moveObj,
          PlaybackSpeed.Normal,
          (completed) => {
            set(([s]) => {
              s.showNext = true;
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
    playSan: (san: string) =>
      set(([s]) => {
        s.chessboardState.makeMove(san);
      }),
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
    initializeRepertoire: ({ lichessUsername, blackPgn, whitePgn }) =>
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
    updateShareLink: () =>
      set(([s]) => {
        client.post(`/api/v1/openings/update-share-link`).then(({ data }) => {
          set(([s]) => {
            s.repertoireShareId = data.id;
          });
        });
      }),
    analyzeLineOnLichess: (line: string[]) =>
      set(([s]) => {
        var bodyFormData = new FormData();
        bodyFormData.append("pgn", lineToPgn(line));
        if (isEmpty(line)) {
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
    getNextReviewPositionMove: () =>
      get(([s]) => {
        return first(s.getRemainingReviewPositionMoves());
      }),
    getRemainingReviewPositionMoves: () =>
      get(([s]) => {
        return filter(s.currentMove.moves, (m) => {
          return isNil(s.completedReviewPositionMoves[m.sanPlus]);
        });
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
              map(s.chessboardState.positionHistory, (p) => {
                return s.ecoCodeLookup[p];
              })
            )
          );
        }
        s.pendingLineHasConflictingMoves = false;
        map(
          zip(s.chessboardState.positionHistory, line),
          ([position, san], i) => {
            if (!san) {
              return;
            }
            let mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
            let existingResponses =
              s.repertoire[s.activeSide].positionResponses[position];
            if (
              !isEmpty(existingResponses) &&
              mine &&
              !some(existingResponses, (m) => {
                return m.sanPlus === san;
              })
            ) {
              s.pendingLineHasConflictingMoves = true;
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
                  epdAfter: s.chessboardState.positionHistory[i + 1],
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
          }
        );

        s.hasPendingLineToAdd = some(
          flatten(values(s.pendingResponses)),
          (m) => m.mine
        );
        s.fetchNeededPositionReports();
      }, "onEditingPositionUpdate"),
    fetchNeededPositionReports: () =>
      set(([s]) => {
        let side = s.activeSide;
        if (isNil(side)) {
          return;
        }
        let neededPositions = [];
        s.chessboardState.positionHistory.forEach((epd) => {
          if (!s.positionReports[epd]) {
            neededPositions.push(epd);
          }
        });
        let currentReport = s.positionReports[side][s.getCurrentEpd()];
        if (currentReport) {
          currentReport.suggestedMoves.forEach((sm) => {
            let epd = sm.epdAfter;
            if (!s.positionReports[epd]) {
              neededPositions.push(epd);
            }
          });
        }
        if (isEmpty(neededPositions)) {
          return;
        }
        client
          .post("/api/v1/openings/position_reports", {
            epds: neededPositions,
          })
          .then(({ data: reports }: { data: PositionReport[] }) => {
            set(([s]) => {
              reports.forEach((report) => {
                s.positionReports[side][report.epd] = report;
              });
              s.fetchNeededPositionReports();
            });
          })
          .finally(() => {
            // set(([s]) => {});
          });
      }),
    onMove: () =>
      set(([s]) => {
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
              moves: [response],
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
          let responses = s.repertoire[side].positionResponses[epd];
          if (responses?.[0]?.mine) {
            let needsToReviewAny =
              some(responses, (r) => r.srs.needsReview) || cram;
            if (needsToReviewAny) {
              s.queues[side].push({ moves: responses, line: lineToPgn(line) });
            }
          }

          map(shuffle(responses), (m) => {
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
    updateRepertoireStructures: () =>
      set(([s]) => {
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

    markMovesReviewed: (results: ReviewPositionResults[]) =>
      set(([s]) => {
        client
          .post("/api/v1/openings/moves_reviewed", { results })
          .then(({ data }) => {});
      }),
    setupNextMove: () =>
      set(([s]) => {
        s.chessboardState.frozen = false;
        s.showNext = false;
        if (s.currentMove) {
          let failedMoves = values(s.failedReviewPositionMoves);
          if (!isEmpty(failedMoves)) {
            let side = failedMoves[0].side;
            s.queues[side].push({
              moves: failedMoves,
              line: s.currentMove.line,
            });
          }
          s.markMovesReviewed(
            s.currentMove.moves.map((m) => {
              let failed = s.failedReviewPositionMoves[m.sanPlus];
              return {
                epd: m.epd,
                sanPlus: m.sanPlus,
                correct: !failed,
              };
            })
          );
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
        console.log("Got a move!", logProxy(s.currentMove));
        s.chessboardState.moveLogPgn = s.currentMove.line;
        s.failedReviewPositionMoves = {};
        s.completedReviewPositionMoves = {};
        s.chessboardState.flipped = s.currentMove.moves[0].side === "black";
        s.chessboardState.position = new Chess();
        s.chessboardState.position.loadPgn(s.currentMove.line);
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
        let response = s.deleteMoveState.response;
        s.deleteMoveState.isDeletingMove = true;
        client
          .post("/api/v1/openings/delete_move", {
            response: response,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              if (s.isBrowsing) {
                s.browsingState.onPositionUpdate();
              }
            });
          })
          .finally(() => {
            set(([s]) => {
              s.deleteMoveState.isDeletingMove = false;
              s.deleteMoveState.response = null;
              s.deleteMoveState.modalOpen = false;
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
            if (sideOfLastmove(variationLine) === "black") {
              let n = Math.floor(variationLine.length / 2);

              pgn +=
                `${n}... ` +
                getLastMoveWithNumber(lineToPgn(variationLine)).trim() +
                " ";
            } else {
              pgn += getLastMoveWithNumber(lineToPgn(variationLine)) + " ";
            }

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
        console.log("Pgn exported is: ", pgn);

        let downloadLink = document.createElement("a");

        let csvFile = new Blob([pgn], { type: "text" });

        let url = window.URL.createObjectURL(csvFile);
        downloadLink.download = `${side}.pgn`;
        downloadLink.href = url;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
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
          s.queues[s.currentMove.moves[0].side].unshift(s.currentMove);
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
        let breadcrumbs = [
          {
            text: `${capitalize(side)}`,
          },
        ];
        if (s.browsingState.readOnly) {
          breadcrumbs.unshift({
            text: "Shared repertoire",
          });
        }

        s.setBreadcrumbs(breadcrumbs);
        s.isBrowsing = true;
        s.isEditing = false;
        s.browsingState.activeSide = side;
        s.browsingState.onPositionUpdate();
        s.browsingState.chessboardState.flipped =
          s.browsingState.activeSide === "black";

        if (s.browsingState.activeSide === "white") {
          let startResponses =
            s.repertoire?.[s.browsingState.activeSide]?.positionResponses[
              START_EPD
            ];
          if (startResponses?.length === 1) {
            s.browsingState.chessboardState.makeMove(startResponses[0].sanPlus);
          }
        }
      }, "startBrowsing"),
    startEditing: (side: Side) =>
      set(([s]) => {
        s.setBreadcrumbs([
          {
            text: `${capitalize(side)}`,
            onPress: () => {
              set(([s]) => {
                s.startBrowsing(side);
              });
            },
          },
          {
            text: `Add new line`,
            onPress: null,
          },
        ]);
        s.activeSide = side;
        s.isBrowsing = false;
        s.isEditing = true;
        s.chessboardState.frozen = false;
        s.chessboardState.flipped = side === "black";
        // s.isAddingPendingLine = failOnAny(true);
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
              if (s.getCurrentEpd() === epd) {
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
        s.chessboardState.playPgn(
          lineToPgn(take(game.moves, NUM_MOVES_DEBUG_PAWN_STRUCTURES))
        );
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
                s.onRepertoireUpdate();
              });
            })
            .catch(() => {
              set(([s]) => {
                s.failedToFetchSharedRepertoire = true;
              });
            }),
        ]).then(() => {
          set(([s]) => {
            s.browsingState.readOnly = true;
            s.startBrowsing("white");
          });
        });
      }),
    fetchRepertoire: () =>
      set(([s]) => {
        client
          .get("/api/v1/openings")
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
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
              s.onRepertoireUpdate();
              // s.startEditing("white");
              // s.chessboardState.playPgn(
              //   "1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 e5 6.Ndb5 d6 7.Bg5 a6 8.Na3 b5 9.Nd5 Be7 10.Bxf6 Bxf6 11.c3 O-O 12.Nc2 Bg5"
              // );
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
    getCurrentPositionReport: () =>
      get(([s]) => {
        return s.positionReports[s.activeSide][s.getCurrentEpd()];
      }),
    getCurrentEpd: () =>
      get(([s]) => {
        return last(s.chessboardState.positionHistory);
      }),
    backOne: () =>
      set(([s]) => {
        if (s.isBrowsing) {
          s.browsingState.chessboardState.backOne();
          return;
        }
        s.chessboardState.backOne();
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
        if (s.isBrowsing) {
          s.browsingState.chessboardState.resetPosition();
          return;
        }
        s.chessboardState.resetPosition();
        s.onEditingPositionUpdate();
      }),
    addPendingLine: (cfg) =>
      set(([s]) => {
        let { replace } = cfg ?? { replace: false };
        s.isAddingPendingLine = true;
        client
          .post("/api/v1/openings/add_moves", {
            moves: flatten(cloneDeep(values(s.pendingResponses))),
            side: s.activeSide,
            replace: replace,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s]) => {
              // s.backToStartPosition(s);
              s.repertoire = data.repertoire;
              s.repertoireGrades = data.grades;
              s.onRepertoireUpdate();
              s.onEditingPositionUpdate();
              s.editingState.addConflictingMoveModalOpen = false;

              s.addedLineState = {
                line: s.currentLine,
                stage: AddedLineStage.Initial,
                addNewLineSelectedIndex: 0,
                positionReport:
                  s.positionReports[s.activeSide][s.getCurrentEpd()],
                ecoCode: findLast(
                  map(
                    s.chessboardState.positionHistory,
                    (p) => s.ecoCodeLookup[p]
                  )
                ),
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
              s.editingState.addConflictingMoveModalOpen = false;
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
        onPositionUpdated: () =>
          set(([s]) => {
            if (s.isEditing) {
              s.onMove();
            }
          }),

        shouldMakeMove: (move: Move) =>
          set(([s]) => {
            if (s.debugPawnStructuresState) {
              return true;
            }
            if (s.isEditing) {
              return true;
            } else if (s.isReviewing) {
              let matchingResponse = find(
                s.currentMove.moves,
                (m) => move.san == m.sanPlus
              );
              if (matchingResponse) {
                s.chessboardState.flashRing(true);

                s.completedReviewPositionMoves[matchingResponse.sanPlus] =
                  matchingResponse;
                // TODO: this is really dirty
                const willUndo = !isEmpty(s.getRemainingReviewPositionMoves());
                window.setTimeout(
                  () => {
                    set(([s]) => {
                      if (!s.isReviewing) {
                        return;
                      }
                      if (isEmpty(s.getRemainingReviewPositionMoves())) {
                        if (s.currentMove?.moves.length > 1) {
                          s.showNext = true;
                        } else {
                          console.log("Should setup next?");
                          if (isEmpty(s.failedReviewPositionMoves)) {
                            console.log("Yup?");
                            s.setupNextMove();
                          } else {
                            s.showNext = true;
                          }
                        }
                      } else {
                        s.chessboardState.position.undo();
                      }
                    });
                  },
                  willUndo ? 500 : 100
                );
                return true;
              } else {
                s.chessboardState.flashRing(false);
                // TODO: reduce repetition
                s.getRemainingReviewPositionMoves().forEach((move) => {
                  s.failedReviewPositionMoves[move.sanPlus] = move;
                });
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
