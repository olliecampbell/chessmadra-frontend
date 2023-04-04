import { Move } from "@lubert/chess.ts/dist/types";
import {
  EcoCode,
  MoveTag,
  PositionReport,
  SuggestedMove,
} from "~/utils/models";
import {
  isEmpty,
  last,
  map,
  isNil,
  find,
  zip,
  flatten,
  cloneDeep,
  values,
  filter,
  some,
  findLast,
  every,
  forEach,
  uniqBy,
} from "lodash-es";
import {
  RepertoireMove,
  RepertoireMiss,
  Side,
  SIDES,
  BySide,
  otherSide,
} from "./repertoire";
import { AppState, quick } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { FetchRepertoireResponse, RepertoireState } from "./repertoire_state";
import { START_EPD } from "./chess";
import {
  getTotalGames,
  getWinRate,
  getWinRateRange,
} from "./results_distribution";
import { createQuick } from "./quick";
import { TableResponse } from "~/components/RepertoireMovesTable";
import {
  EFFECTIVENESS_WEIGHTS_MASTERS,
  EFFECTIVENESS_WEIGHTS_PEERS,
  PLAYRATE_WEIGHTS,
  scoreTableResponses,
  shouldUsePeerRates,
} from "./table_scoring";
import { getMoveRating, MoveRating } from "./move_inaccuracy";
import { trackEvent } from "~/utils/trackEvent";
import { isTheoryHeavy } from "./theory_heavy";
import { parsePlans } from "./plans";
// solid TODO
// import * as Sentry from "sentry-expo";
import { Responsive } from "./useResponsive";
// solid TODO
// import { Identify, identify } from "@amplitude/analytics-browser";
import client from "./client";
import { Component, createContext, JSXElement } from "solid-js";
import { identify, Identify } from "@amplitude/analytics-browser";
import { Animated } from "./animation";
import { animateTo } from "./animation";
import {
  ChessboardInterface,
  ChessboardViewState,
  createChessboardInterface,
} from "./chessboard_interface";

export interface GetIncidenceOptions {
  // onlyCovered?: boolean;
}

export enum SidebarOnboardingStage {
  Initial,
  ConnectAccount,
  SetRating,
  GoalSet,
  // Probably skip this for now
  Import,
  AskAboutExistingRepertoire,
  ChooseImportSource,
  TrimRepertoire,
}

export interface SidebarOnboardingState {
  stageStack: SidebarOnboardingStage[];
  importType: SidebarOnboardingImportType;
}

export enum SidebarOnboardingImportType {
  LichessUsername,
  PGN,
  PlayerTemplates,
}
export type BrowsingMode = "browse" | "build" | "review" | "overview" | "home";
export const modeToUI = (mode: BrowsingMode) => {
  switch (mode) {
    case "browse":
      return "Review";
    case "build":
      return "Browse / add new";
    case "review":
      return "Review";
    case "overview":
      return "Overview";
    case "home":
      return "Home";
  }
};

export interface SidebarState {
  view?: JSXElement;
  isPastCoverageGoal?: boolean;
  mode: BrowsingMode;
  tableResponses: TableResponse[];
  hasAnyPendingResponses?: boolean;
  transposedState: {
    visible: boolean;
  };
  showPlansState: {
    visible: boolean;
    coverageReached: boolean;
    hasShown: boolean;
  };
  deleteLineState: {
    visible: boolean;
  };
  submitFeedbackState: {
    visible: boolean;
  };
  addedLineState: {
    visible: boolean;
  };
  pendingResponses?: Record<string, RepertoireMove>;
  currentSide: Side;
  hasPendingLineToAdd: boolean;
  sidebarOnboardingState: SidebarOnboardingState;
  isAddingPendingLine: boolean;
  moveLog: string[];
  positionHistory: string[];
  currentEpd: string;
  lastEcoCode?: EcoCode;
  planSections?: any;
  activeSide?: Side;
}

export interface BrowsingState {
  // Functions
  fetchNeededPositionReports: () => void;
  updateRepertoireProgress: () => void;
  reviewFromCurrentLine: () => void;
  finishSidebarOnboarding: (responsive: Responsive) => void;
  getIncidenceOfCurrentLine: () => number;
  getLineIncidences: (_: GetIncidenceOptions) => number[];
  dismissTransientSidebarState: () => boolean;
  getNearestMiss: (sidebarState: SidebarState) => RepertoireMiss;
  getMissInThisLine: (sidebarState: SidebarState) => RepertoireMiss;
  onPositionUpdate: () => void;
  updateTableResponses: () => void;
  requestToAddCurrentLine: () => void;
  quick: (fn: (_: BrowsingState) => void) => void;
  addPendingLine: (_?: { replace: boolean }) => void;
  moveSidebarState: (direction: "left" | "right") => void;
  replaceView: (view: Component, direction: "left" | "right") => void;
  popView: () => void;
  updatePlans: () => void;
  checkShowTargetDepthReached: () => void;

  // Fields
  chessboard: ChessboardInterface;
  sidebarState: SidebarState;
  previousSidebarState: SidebarState;
  sidebarDirection: "left" | "right";
  sidebarIter: number;
  previousSidebarAnim: Animated<number>;
  currentSidebarAnim: Animated<number>;
  chessboardShownAnim: Animated<number>;
  repertoireProgressState: BySide<RepertoireProgressState>;
  showPlans: boolean;
}

interface RepertoireProgressState {
  showNewProgressBar?: boolean;
  showPending?: boolean;
  completed: boolean;
  showPopover: boolean;
  percentComplete: number;
  pendingMoves: number;
}

export interface BrowserLine {
  epd: string;
  pgn: string;
  ecoCode: EcoCode;
  line: string[];
  deleteMove: RepertoireMove;
}

export interface BrowserSection {
  lines: BrowserLine[];
  ecoCode: EcoCode;
}

type Stack = [BrowsingState, RepertoireState, AppState];

export const SidebarStateContext = createContext(false);

export const makeDefaultSidebarState = () => {
  return {
    moveLog: [],
    positionHistory: null,
    mode: "home",
    currentEpd: START_EPD,
    isPastCoverageGoal: false,
    tableResponses: [],
    hasAnyPendingResponses: false,
    transposedState: {
      visible: false,
    },
    showPlansState: {
      coverageReached: false,
      visible: false,
      hasShown: false,
    },
    deleteLineState: {
      visible: false,
    },
    submitFeedbackState: {
      visible: false,
    },
    addedLineState: {
      visible: false,
    },
    pendingResponses: {},
    currentSide: "white",
    hasPendingLineToAdd: false,
    sidebarOnboardingState: {
      stageStack: [],
      importType: null,
    },
    isAddingPendingLine: false,
  } as SidebarState;
};

export const getInitialBrowsingState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) =>
      fn([s.repertoireState.browsingState, s.repertoireState, s])
    );
  };
  const setOnly = <T,>(fn: (stack: BrowsingState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState.browsingState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) =>
      fn([s.repertoireState.browsingState, s.repertoireState, s])
    );
  };
  const initialState = {
    ...createQuick(setOnly),
    previousSidebarState: null,
    sidebarDirection: null,
    sidebarIter: 0,
    // TODO: solid
    previousSidebarAnim: { value: 0, duration: 200 },
    // TODO: solid
    currentSidebarAnim: { value: 0, duration: 200 },
    activeSide: "white",
    sidebarState: makeDefaultSidebarState(),
    hasPendingLineToAdd: false,
    // TODO: solid
    chessboardShownAnim: 0,
    plans: {},
    showPlans: false,
    repertoireProgressState: {
      white: createEmptyRepertoireProgressState(),
      black: createEmptyRepertoireProgressState(),
    },
    updateRepertoireProgress: () =>
      set(([s, rs, gs]) => {
        SIDES.forEach((side) => {
          const progressState = s.repertoireProgressState[side];
          const biggestMiss = rs.repertoireGrades[side]?.biggestMiss;
          const numMoves = rs.numResponsesAboveThreshold?.[side] ?? 0;
          const completed = isNil(biggestMiss);
          progressState.completed = completed;
          const expectedNumMoves = rs.expectedNumMovesFromEpd[side][START_EPD];
          const savedProgress = completed
            ? 100
            : getCoverageProgress(numMoves, expectedNumMoves);
          progressState.percentComplete = savedProgress;
          // TODO: solid
          // Animated.timing(progressState.headerOpacityAnim, {
          //   toValue: progressState.showPopover ? 0 : 1,
          //   duration: 300,
          //   useNativeDriver: true,
          // }).start();
          // Animated.timing(progressState.popoverOpacityAnim, {
          //   toValue: progressState.showPopover ? 100 : 0,
          //   duration: 300,
          //   useNativeDriver: true,
          // }).start();
          // Animated.timing(progressState.savedProgressAnim, {
          //   toValue: savedProgress,
          //   duration: 1000,
          //   useNativeDriver: true,
          // }).start();
          const identifyObj = new Identify();
          identifyObj.set(`completed_${side}`, progressState.completed);
          identify(identifyObj);
        });
      }),
    checkShowTargetDepthReached: () => {
      set(([s, rs, gs]) => {
        if (
          s.sidebarState.isPastCoverageGoal &&
          s.sidebarState.activeSide !== s.sidebarState.currentSide &&
          s.sidebarState.hasPendingLineToAdd &&
          !s.sidebarState.showPlansState.hasShown &&
          s.sidebarState.mode === "build"
        ) {
          trackEvent(`${s.sidebarState.mode}.coverage_reached`, {
            hasPlans: !isNil(
              rs.positionReports[s.sidebarState.activeSide][
                s.sidebarState.currentEpd
              ]?.plans
            ),
          });
          s.sidebarState.showPlansState.visible = true;
          s.sidebarState.showPlansState.hasShown = true;
          s.sidebarState.showPlansState.coverageReached = true;
          s.chessboard.set((c) => {
            c.showPlans = true;
          });
        }
        if (!s.sidebarState.isPastCoverageGoal) {
          s.sidebarState.showPlansState.hasShown = false;
        }
      });
    },
    updateTableResponses: () =>
      set(([s, rs, gs]) => {
        if (!s.sidebarState.activeSide || !rs.repertoire) {
          s.sidebarState.tableResponses = [];
          return;
        }
        const threshold = gs.userState.getCurrentThreshold();
        const eloRange = gs.userState.user?.eloRange;
        const mode = s.sidebarState.mode;
        const currentSide: Side = s.chessboard.getTurn();
        const currentEpd = s.chessboard.getCurrentEpd();
        const positionReport =
          rs.positionReports[s.sidebarState.activeSide][
            s.sidebarState.currentEpd
          ];
        const _tableResponses: Record<string, TableResponse> = {};
        positionReport?.suggestedMoves
          .filter((sm) => getTotalGames(sm.results) > 0)
          .map((sm) => {
            _tableResponses[sm.sanPlus] = {
              suggestedMove: cloneDeep(sm),
              tags: [],
              side: s.sidebarState.activeSide as Side,
            };
          });
        const existingMoves =
          rs.repertoire[s.sidebarState.activeSide].positionResponses[
            s.chessboard.getCurrentEpd()
          ];
        existingMoves?.map((r) => {
          if (_tableResponses[r.sanPlus]) {
            _tableResponses[r.sanPlus].repertoireMove = r;
          } else {
            _tableResponses[r.sanPlus] = {
              repertoireMove: r,
              tags: [],
              side: s.sidebarState.activeSide as Side,
            };
          }
        });
        const ownSide = currentSide === s.sidebarState.activeSide;
        const usePeerRates = shouldUsePeerRates(positionReport);
        let tableResponses = values(_tableResponses);
        if (mode != "build") {
          tableResponses = tableResponses.filter((tr) => tr.repertoireMove);
        }
        const biggestMisses =
          rs.repertoireGrades[s.sidebarState.activeSide].biggestMisses ?? {};
        tableResponses.forEach((tr) => {
          const epd = tr.suggestedMove?.epdAfter;
          if (biggestMisses[epd]) {
            tr.biggestMiss = biggestMisses[epd];
          }
        });
        tableResponses.forEach((tr) => {
          if (ownSide && tr.suggestedMove && positionReport) {
            const positionWinRate = getWinRate(
              positionReport?.results,
              s.sidebarState.activeSide as Side
            );
            const [, , ci] = getWinRateRange(
              tr.suggestedMove.results,
              s.sidebarState.activeSide as Side
            );
            const moveWinRate = getWinRate(
              tr.suggestedMove.results,
              s.sidebarState.activeSide as Side
            );
            if (ci > 0.15 && Math.abs(positionWinRate - moveWinRate) > 0.02) {
              tr.lowConfidence = true;
            }
          }
        });
        tableResponses.forEach((tr) => {
          if (!ownSide && mode == "build") {
            if (
              tr.suggestedMove?.incidence < threshold &&
              tr.suggestedMove?.needed
            ) {
              tr.tags.push(MoveTag.RareDangerous);
            }
          }
        });
        tableResponses.forEach((tr) => {
          if (s.sidebarState.mode == "browse" && tr.repertoireMove) {
            const DEBUG = {
              epd: "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -",
            };
            const epd =
              tr.suggestedMove?.epdAfter || tr.repertoireMove.epdAfter;
            let dueBelow =
              rs.numMovesDueFromEpd[s.sidebarState.activeSide][epd];
            let earliestBelow =
              rs.earliestReviewDueFromEpd[s.sidebarState.activeSide][epd];
            const dueAt = tr.repertoireMove.srs?.dueAt;
            if (epd == DEBUG.epd) {
              console.log("epd", { epd, dueBelow, dueAt, earliestBelow });
            }
            if (dueAt && (dueAt < earliestBelow || !earliestBelow)) {
              earliestBelow = dueAt;
            }
            const isDue = tr.repertoireMove.srs?.needsReview;
            dueBelow = dueBelow + (isDue ? 1 : 0);
            tr.reviewInfo = {
              earliestDue: earliestBelow,
              due: dueBelow,
            };
          }
        });
        tableResponses.forEach((tr) => {
          if (!ownSide && mode == "build") {
            if (
              isCommonMistake(tr, positionReport, threshold) &&
              !tr.tags.includes(MoveTag.RareDangerous)
            ) {
              tr.tags.push(MoveTag.CommonMistake);
            }
          }
        });
        tableResponses.forEach((tr) => {
          const epdAfter = tr.suggestedMove?.epdAfter;
          if (mode != "build") {
            return;
          }
          if (tr.repertoireMove) {
            return;
          }

          if (
            !tr.repertoireMove &&
            rs.epdNodes[s.sidebarState.activeSide][epdAfter]
          ) {
            tr.transposes = true;
            tr.tags.push(MoveTag.Transposes);
          }

          if (isTheoryHeavy(tr, currentEpd) && ownSide) {
            tr.tags.push(MoveTag.TheoryHeavy);
          }
        });
        tableResponses.forEach((tr) => {
          const moveRating = getMoveRating(
            positionReport,
            tr.suggestedMove,
            currentSide
          );
          tr.moveRating = moveRating;
        });
        if (ownSide && tableResponses.length >= 3) {
          tableResponses.forEach((tr, i) => {
            if (mode != "build") {
              return;
            }
            const allOthersInaccurate = every(tableResponses, (tr, j) => {
              return !isNil(tr.moveRating) || j === i;
            });
            if (allOthersInaccurate && isNil(tr.moveRating)) {
              tr.tags.push(MoveTag.BestMove);
            }
          });
        }
        // if (!ownSide) {
        //   tableResponses.forEach((tr) => {
        //     let incidence = tr.incidenceUpperBound ?? tr.incidence;
        //     let dangerous =
        //       tr.suggestedMove?.dangerous?.[eloRange] ||
        //       (tr.suggestedMove && isDangerous(tr.suggestedMove, s.sidebarState.activeSide));
        //   });
        // }
        tableResponses = scoreTableResponses(
          tableResponses,
          positionReport,
          currentSide,
          currentEpd,
          s.sidebarState.mode,
          ownSide
            ? usePeerRates
              ? EFFECTIVENESS_WEIGHTS_PEERS
              : EFFECTIVENESS_WEIGHTS_MASTERS
            : PLAYRATE_WEIGHTS
        );
        s.sidebarState.tableResponses = tableResponses;
        const noneNeeded = every(
          tableResponses,
          (tr) => !tr.suggestedMove?.needed
        );
        if (!ownSide && !isEmpty(tableResponses)) {
          if (noneNeeded) {
            s.sidebarState.isPastCoverageGoal = true;
          } else {
            s.sidebarState.isPastCoverageGoal = false;
          }
        }
      }),
    getMissInThisLine: (sidebarState: SidebarState) =>
      get(([s, rs, gs]) => {
        if (!s.sidebarState.activeSide) {
          return null;
        }
        const miss =
          rs.repertoireGrades[s.sidebarState.activeSide].biggestMisses?.[
            sidebarState.currentEpd
          ];
        return miss;
      }),
    getNearestMiss: (sidebarState: SidebarState) =>
      get(([s, rs, gs]) => {
        if (!s.sidebarState.activeSide) {
          return null;
        }
        const threshold = gs.userState.getCurrentThreshold();
        return findLast(
          map(sidebarState.positionHistory, (epd) => {
            const miss =
              rs.repertoireGrades[s.sidebarState.activeSide].biggestMisses?.[
                epd
              ];
            if (miss?.epd !== sidebarState.currentEpd) {
              return miss;
            }
          })
        );
      }),
    dismissTransientSidebarState: () =>
      set(([s, rs]) => {
        s.chessboard.set((c) => {
          c.showPlans = false;
        });
        if (s.sidebarState.submitFeedbackState.visible) {
          s.sidebarState.submitFeedbackState.visible = false;
          return true;
        } else if (s.sidebarState.addedLineState.visible) {
          s.sidebarState.addedLineState.visible = false;
          return true;
        } else if (s.sidebarState.deleteLineState.visible) {
          s.sidebarState.deleteLineState.visible = false;
          return true;
        } else if (s.sidebarState.transposedState.visible) {
          s.sidebarState.transposedState.visible = false;
          return true;
        } else if (s.sidebarState.showPlansState.visible) {
          s.sidebarState.showPlansState.visible = false;
          s.sidebarState.showPlansState.hasShown = false;
          s.sidebarState.showPlansState.coverageReached = false;
          s.chessboard.set((c) => {
            c.showPlans = false;
          });
          return true;
        }
        return false;
      }),
    finishSidebarOnboarding: (responsive: Responsive) =>
      set(([s, rs]) => {
        rs.animateChessboardShown(true, responsive, () => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
              [];
          });
        });
      }),
    reviewFromCurrentLine: () =>
      set(([s, rs]) => {
        return rs.positionReports[s.chessboard.getCurrentEpd()];
      }),
    getCurrentPositionReport: (sidebarState: SidebarState) =>
      get(([s, rs]) => {
        return rs.positionReports[sidebarState.currentEpd];
      }),
    fetchNeededPositionReports: () =>
      set(([s, rs]) => {
        const side = s.sidebarState.activeSide;
        let requests: {
          epd: string;
          previousEpds: string[];
          moves: string[];
          side: Side;
        }[] = [];
        SIDES.forEach((side) => {
          requests.push({
            epd: START_EPD,
            previousEpds: [],
            moves: [],
            side: side,
          });
        });
        if (!isNil(side)) {
          const moveLog = [];
          const epdLog = [];
          forEach(
            zip(
              s.chessboard.get((s) => s).positionHistory,
              s.chessboard.get((s) => s).moveLog
            ),
            ([epd, move], i) => {
              if (move) {
                moveLog.push(move);
              }
              epdLog.push(epd);
              requests.push({
                epd: epd,
                side: side,
                moves: [...moveLog],
                previousEpds: [...epdLog],
              });
            }
          );
          const currentEpd = s.chessboard.getCurrentEpd();
          const currentReport =
            rs.positionReports[s.sidebarState.activeSide][currentEpd];
          if (currentReport) {
            currentReport.suggestedMoves.forEach((sm) => {
              const epd = sm.epdAfter;
              requests.push({
                epd: epd,
                side: side,
                moves: [...moveLog, sm.sanPlus],
                previousEpds: [...epdLog, epd],
              });
            });
          }
        }
        if (isNil(side)) {
          const startResponses =
            rs.repertoire?.["white"]?.positionResponses[START_EPD];
          if (startResponses?.length === 1) {
            requests.push({
              epd: startResponses[0].epdAfter,
              previousEpds: [START_EPD],
              moves: [startResponses[0].sanPlus],
              side: "white",
            });
          }
        }
        requests = filter(requests, (r) => !rs.positionReports[r.side][r.epd]);
        requests = uniqBy(requests, (r) => `${r.epd}-${r.side}`);
        if (isEmpty(requests)) {
          return;
        }
        client
          .post("/api/v1/openings/position_reports", requests)
          .then(({ data: reports }: { data: PositionReport[] }) => {
            set(([s, rs]) => {
              reports.forEach((report) => {
                rs.positionReports[report.side][report.epd] = report;
              });
              s.updateTableResponses();
              s.updatePlans();
              s.fetchNeededPositionReports();
            });
          })
          .finally(() => {
            // set(([s]) => {});
          });
      }),
    requestToAddCurrentLine: () =>
      set(([s, rs]) => {
        if (s.sidebarState.hasPendingLineToAdd) {
          s.addPendingLine();
        }
      }),

    updatePlans: () =>
      set(([s, rs]) => {
        if (!s.sidebarState.activeSide) {
          return;
        }
        const plans =
          rs.positionReports[s.sidebarState.activeSide][
            s.sidebarState.currentEpd
          ]?.plans ?? [];

        const maxOccurence = plans[0]?.occurences ?? 0;
        const consumer = parsePlans(
          cloneDeep(plans),
          s.sidebarState.activeSide,
          s.chessboard.get((s) => s.position)
        );
        s.chessboard.set((c) => {
          c.focusedPlans = [];
          c.plans = consumer.metaPlans.filter((p) =>
            consumer.consumed.has(p.id)
          );
          s.sidebarState.planSections = consumer.planSections;
          c.maxPlanOccurence = maxOccurence;
        });
      }),
    onPositionUpdate: () =>
      set(([s, rs]) => {
        s.sidebarState.moveLog = s.chessboard.get((s) => s.moveLog);
        s.sidebarState.currentEpd = s.chessboard.getCurrentEpd();
        s.sidebarState.currentSide =
          s.chessboard.getTurn() === "b" ? "black" : "white";
        s.sidebarState.positionHistory = s.chessboard.get(
          (s) => s.positionHistory
        );
        s.sidebarState.pendingResponses = {};

        s.updatePlans();

        const incidences = s.getLineIncidences({});
        if (rs.ecoCodeLookup) {
          s.sidebarState.lastEcoCode = last(
            filter(
              map(
                s.chessboard.get((s) => s.positionHistory),
                (p) => {
                  return rs.ecoCodeLookup[p];
                }
              )
            )
          );
        }
        const line = s.chessboard.get((s) => s.moveLog);
        map(
          zip(
            s.chessboard.get((s) => s.positionHistory),
            line,
            incidences
          ),
          ([position, san, incidence], i) => {
            if (!san) {
              return;
            }
            const mine =
              i % 2 === (s.sidebarState.activeSide === "white" ? 0 : 1);
            if (
              !some(
                rs.repertoire?.[s.sidebarState.activeSide]?.positionResponses[
                  position
                ],
                (m) => {
                  return m.sanPlus === san;
                }
              )
            ) {
              s.sidebarState.pendingResponses[position] = {
                epd: position,
                epdAfter: s.chessboard.get((s) => s.positionHistory)[i + 1],
                sanPlus: san,
                side: s.sidebarState.activeSide,
                pending: true,
                mine: mine,
                incidence: incidence,
                srs: {
                  needsReview: false,
                  firstReview: false,
                },
              } as RepertoireMove;
            }
          }
        );

        s.sidebarState.hasAnyPendingResponses = !isEmpty(
          flatten(values(s.sidebarState.pendingResponses))
        );
        s.sidebarState.hasPendingLineToAdd = some(
          flatten(values(s.sidebarState.pendingResponses)),
          (m) => m.mine
        );
        if (s.sidebarState.mode !== "review") {
          s.fetchNeededPositionReports();
          s.updateRepertoireProgress();
          s.updateTableResponses();
        }
      }),
    getLineIncidences: (options: GetIncidenceOptions = {}) =>
      get(([s, rs]) => {
        if (!s.sidebarState.activeSide) {
          return [];
        }

        let incidence = 1.0;
        return map(
          zip(
            s.chessboard.get((s) => s.positionHistory),
            s.chessboard.get((s) => s.moveLog)
          ),
          ([position, san], i) => {
            const positionReport =
              rs.positionReports[s.sidebarState.activeSide][position];
            if (positionReport) {
              const suggestedMove = find(
                positionReport.suggestedMoves,
                (sm) => sm.sanPlus === san
              );
              if (suggestedMove) {
                incidence = suggestedMove.incidence;
                return incidence;
              }
            }

            return incidence;
          }
        );
      }),
    getIncidenceOfCurrentLine: (options: GetIncidenceOptions = {}) =>
      get(([s, rs]) => {
        return last(s.getLineIncidences(options));
      }),
    replaceView: (view: JSXElement, direction: "left" | "right") =>
      set(([s, gs]) => {
        s.moveSidebarState(direction);
        s.sidebarState.view = view;
      }),
    popView: () =>
      set(([s, gs]) => {
        s.moveSidebarState("left");
        s.sidebarState.view = null;
      }),
    moveSidebarState: (direction: "left" | "right") =>
      set(([s, gs]) => {
        s.previousSidebarState = cloneDeep(s.sidebarState);
        s.sidebarDirection = direction;
        s.sidebarIter += 1;
        const duration = 200;
        // TODO: solid
        // s.previousSidebarAnim.setValue(0.0);
        // s.currentSidebarAnim.setValue(0.0);
        // skipTo(s.previousSidebarAnim, 0)
        // skipTo(s.currentSidebarAnim, 0)
        animateTo(s.previousSidebarAnim, 1.0, { duration, initial: 0.0 });
        // animateTo(s.currentSidebarAnim, 1.0, duration, duration);
      }),
    addPendingLine: (cfg) =>
      set(([s, gs]) => {
        const { replace } = cfg ?? { replace: false };
        s.sidebarState.isAddingPendingLine = true;
        s.sidebarState.showPlansState.hasShown = false;
        // let line = lineToPgn(s.sidebarState.moveLog);
        // client
        //   .post("/api/v1/openings/line_reports", {
        //     lines: [line],
        //   })
        //   .then(({ data }: { data: LineReport[] }) => {
        //     set(([s, rs]) => {
        //       rs.lineReports[line] = data[0];
        //     });
        //   });
        client
          .post("/api/v1/openings/add_moves", {
            moves: flatten(cloneDeep(values(s.sidebarState.pendingResponses))),
            side: s.sidebarState.activeSide,
            replace: replace,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s, rs]) => {
              s.moveSidebarState("right");
              s.dismissTransientSidebarState();
              // s.backToStartPosition(s);
              rs.repertoire = data.repertoire;
              rs.repertoireGrades = data.grades;
              rs.onRepertoireUpdate();
              s.onPositionUpdate();
              // s.showPlans = true;
              // s.updateArrows();
              s.sidebarState.addedLineState = {
                visible: true,
              };
            });
          })
          .catch((err) => {
            console.log("Error adding lines!", err);
            Sentry.Browser.captureException(err);
          })
          .finally(() => {
            set(([s]) => {
              s.sidebarState.isAddingPendingLine = false;
            });
          });
      }),
  } as Omit<BrowsingState, "chessboardState">;

  initialState.chessboard = createChessboardInterface()[1];
  initialState.chessboard.set((c) => {
    c.delegate = {
      completedMoveAnimation: () => {},
      onPositionUpdated: () => {
        set(([s]) => {
          s.onPositionUpdate();
        });
      },

      madeManualMove: () => {
        get(([s]) => {
          trackEvent(`${s.sidebarState.mode}.chessboard.played_move`);
        });
      },
      onBack: () => {
        set(([s]) => {});
      },
      onReset: () => {
        set(([s]) => {
          s.dismissTransientSidebarState();
          s.sidebarState.showPlansState.hasShown = false;
        });
      },
      onMovePlayed: () => {
        set(([s]) => {
          if (s.sidebarState.transposedState.visible) {
            s.sidebarState.transposedState.visible = false;
          }

          s.checkShowTargetDepthReached();
        });
      },
      shouldMakeMove: (move: Move) =>
        set(([s]) => {
          s.moveSidebarState("right");
          return true;
        }),
    };
  });
  return initialState;
};

function createEmptyRepertoireProgressState(): RepertoireProgressState {
  return {
    pendingMoves: 0,
    completed: false,
    percentComplete: 0,
    showPopover: false,
  };
}
const isCommonMistake = (
  tr: TableResponse,
  positionReport: PositionReport,
  threshold: number
): boolean => {
  if (!tr.suggestedMove || !positionReport) {
    return false;
  }
  if (getTotalGames(tr.suggestedMove.results) < 100) {
    return false;
  }
  if (!tr.suggestedMove?.needed) {
    return false;
  }
  if (
    getWinRate(tr.suggestedMove.results, otherSide(tr.side)) >
    getWinRate(positionReport.results, otherSide(tr.side)) + 0.02
  ) {
    return false;
  }
  const moveRating = getMoveRating(
    positionReport,
    tr.suggestedMove,
    otherSide(tr.side)
  );
  if (isNil(moveRating) || moveRating < MoveRating.Mistake) {
    return false;
  }
  return true;
};

export const getCoverageProgress = (
  numMoves: number,
  expectedNumMoves: number
): number => {
  return (
    (1 / (1 + Math.pow(Math.E, -4 * (numMoves / expectedNumMoves))) - 0.5) *
    2 *
    100
  );
  // let k = 0 - (1 / expectedNumMoves) * 3;
  // let y = (1 / (1 + Math.exp(k * numMoves)) - 0.5) * 2;
  // return y * 100;
  // return (
  //   (Math.atan((x / expectedNumMoves) * magic) / (Math.PI / 2)) * 100
  // );
};

const isDangerous = (suggestedMove: SuggestedMove, activeSide: Side) => {
  if (getWinRate(suggestedMove.results, otherSide(activeSide)) > 0.53) {
    return true;
  } else {
    return false;
  }
};
