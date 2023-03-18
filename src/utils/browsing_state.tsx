import { Move } from "@lubert/chess.ts/dist/types";
import {
  EcoCode,
  LineReport,
  ModelGame,
  MoveTag,
  PositionReport,
  SuggestedMove,
} from "app/models";
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
  uniq,
  sortBy,
  take,
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
  lineToPgn,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { AppState, quick } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { FetchRepertoireResponse, RepertoireState } from "./repertoire_state";
import { START_EPD } from "./chess";
import {
  getPlayRate,
  getTotalGames,
  getWinRate,
  getWinRateRange,
} from "./results_distribution";
import client from "app/client";
import { createQuick } from "./quick";
import { Animated, Easing } from "react-native";
import { TableResponse } from "app/components/RepertoireMovesTable";
import {
  EFFECTIVENESS_WEIGHTS_MASTERS,
  EFFECTIVENESS_WEIGHTS_PEERS,
  PLAYRATE_WEIGHTS,
  scoreTableResponses,
  shouldUsePeerRates,
} from "./table_scoring";
import { getMoveRating, MoveRating } from "./move_inaccuracy";
import { trackEvent } from "app/hooks/useTrackEvent";
import { isTheoryHeavy } from "./theory_heavy";
import { createContext } from "react";
import { logProxy } from "./state";
import { parsePlans } from "./plans";
import * as Sentry from "sentry-expo";
import { Responsive } from "./useResponsive";
import { Identify, identify } from "@amplitude/analytics-browser";

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
  view: React.ReactNode;
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
  replaceView: (view: React.ReactNode, direction: "left" | "right") => void;
  popView: () => void;
  updatePlans: () => void;
  checkShowTargetDepthReached: () => void;

  // Fields
  chessboardState?: ChessboardState;
  sidebarState: SidebarState;
  previousSidebarState: SidebarState;
  sidebarDirection: "left" | "right";
  previousSidebarAnim: Animated.Value;
  currentSidebarAnim: Animated.Value;
  chessboardShownAnim: Animated.Value;
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
  headerOpacityAnim: Animated.Value;
  popoverOpacityAnim: Animated.Value;
  savedProgressAnim: Animated.Value;
  newProgressAnim: Animated.Value;
  newProgressLeftAnim: Animated.Value;
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
  let initialState = {
    ...createQuick(setOnly),
    previousSidebarState: null,
    sidebarDirection: null,
    previousSidebarAnim: new Animated.Value(0),
    currentSidebarAnim: new Animated.Value(0),
    activeSide: "white",
    sidebarState: makeDefaultSidebarState(),
    hasPendingLineToAdd: false,
    chessboardShownAnim: new Animated.Value(0),
    plans: {},
    showPlans: false,
    repertoireProgressState: {
      white: createEmptyRepertoireProgressState(),
      black: createEmptyRepertoireProgressState(),
    },
    updateRepertoireProgress: () =>
      set(([s, rs, gs]) => {
        SIDES.forEach((side) => {
          let progressState = s.repertoireProgressState[side];
          let biggestMiss = rs.repertoireGrades[side]?.biggestMiss;
          let numMoves = rs.numResponsesAboveThreshold?.[side] ?? 0;
          let completed = isNil(biggestMiss);
          progressState.completed = completed;
          let expectedNumMoves = rs.expectedNumMovesFromEpd[side][START_EPD];
          let savedProgress = completed
            ? 100
            : getCoverageProgress(numMoves, expectedNumMoves);
          progressState.percentComplete = savedProgress;
          Animated.timing(progressState.headerOpacityAnim, {
            toValue: progressState.showPopover ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
          Animated.timing(progressState.popoverOpacityAnim, {
            toValue: progressState.showPopover ? 100 : 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
          Animated.timing(progressState.savedProgressAnim, {
            toValue: savedProgress,
            duration: 1000,
            useNativeDriver: true,
          }).start();
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
          !s.sidebarState.showPlansState.hasShown
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
          s.chessboardState.showPlans = true;
        }
        if (!s.sidebarState.isPastCoverageGoal) {
          s.sidebarState.showPlansState.hasShown = false;
        }
      });
    },
    updateTableResponses: () =>
      get(([s, rs, gs]) => {
        if (!s.sidebarState.activeSide || !rs.repertoire) {
          s.sidebarState.tableResponses = [];
          return;
        }
        let threshold = gs.userState.getCurrentThreshold();
        let eloRange = gs.userState.user?.eloRange;
        let mode = s.sidebarState.mode;
        let currentSide: Side =
          s.chessboardState.position.turn() === "b" ? "black" : "white";
        let currentEpd = s.chessboardState.getCurrentEpd();
        let positionReport =
          rs.positionReports[s.sidebarState.activeSide][
            s.sidebarState.currentEpd
          ];
        let _tableResponses: Record<string, TableResponse> = {};
        if (mode == "build") {
          positionReport?.suggestedMoves
            .filter((sm) => getTotalGames(sm.results) > 0)
            .map((sm) => {
              _tableResponses[sm.sanPlus] = {
                suggestedMove: cloneDeep(sm),
                tags: [],
                side: s.sidebarState.activeSide,
              };
            });
        }
        let existingMoves =
          rs.repertoire[s.sidebarState.activeSide].positionResponses[
            s.chessboardState.getCurrentEpd()
          ];
        existingMoves?.map((r) => {
          if (_tableResponses[r.sanPlus]) {
            _tableResponses[r.sanPlus].repertoireMove = r;
          } else {
            _tableResponses[r.sanPlus] = {
              repertoireMove: r,
              tags: [],
              side: s.sidebarState.activeSide,
            };
          }
        });
        let ownSide = currentSide === s.sidebarState.activeSide;
        const usePeerRates = shouldUsePeerRates(positionReport);
        let tableResponses = values(_tableResponses);
        let biggestMisses =
          rs.repertoireGrades[s.sidebarState.activeSide].biggestMisses ?? {};
        tableResponses.forEach((tr) => {
          let epd = tr.suggestedMove?.epdAfter;
          if (biggestMisses[epd]) {
            tr.biggestMiss = biggestMisses[epd];
          }
        });
        tableResponses.forEach((tr) => {
          if (ownSide && tr.suggestedMove && positionReport) {
            let positionWinRate = getWinRate(
              positionReport?.results,
              s.sidebarState.activeSide
            );
            let [, , ci] = getWinRateRange(
              tr.suggestedMove.results,
              s.sidebarState.activeSide
            );
            let moveWinRate = getWinRate(
              tr.suggestedMove.results,
              s.sidebarState.activeSide
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
            let epd = tr.suggestedMove?.epdAfter || tr.repertoireMove.epdAfter;
            let dueBelow =
              rs.numMovesDueFromEpd[s.sidebarState.activeSide][epd];
            let earliestBelow =
              rs.earliestReviewDueFromEpd[s.sidebarState.activeSide][epd];
            let dueAt = tr.repertoireMove.srs?.dueAt;
            if (epd == DEBUG.epd) {
              console.log("epd", { epd, dueBelow, dueAt, earliestBelow });
            }
            if (dueAt && (dueAt < earliestBelow || !earliestBelow)) {
              earliestBelow = dueAt;
            }
            let isDue = tr.repertoireMove.srs?.needsReview;
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
          let epdAfter = tr.suggestedMove?.epdAfter;
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
          let moveRating = getMoveRating(
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
            let allOthersInaccurate = every(tableResponses, (tr, j) => {
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
        let noneNeeded = every(
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
        let miss =
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
        let threshold = gs.userState.getCurrentThreshold();
        return findLast(
          map(sidebarState.positionHistory, (epd) => {
            let miss =
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
        s.chessboardState.showPlans = false;
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
          s.chessboardState.showPlans = false;
          return true;
        }
        return false;
      }),
    finishSidebarOnboarding: (responsive: Responsive) =>
      set(([s, rs]) => {
        rs.animateChessboardShown(responsive, true, () => {
          quick((s) => {
            s.repertoireState.browsingState.moveSidebarState("right");
            s.repertoireState.browsingState.sidebarState.sidebarOnboardingState.stageStack =
              [];
          });
        });
      }),
    reviewFromCurrentLine: () =>
      set(([s, rs]) => {
        return rs.positionReports[s.chessboardState.getCurrentEpd()];
      }),
    getCurrentPositionReport: (sidebarState: SidebarState) =>
      get(([s, rs]) => {
        return rs.positionReports[sidebarState.currentEpd];
      }),
    fetchNeededPositionReports: () =>
      set(([s, rs]) => {
        let side = s.sidebarState.activeSide;
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
          let moveLog = [];
          let epdLog = [];
          forEach(
            zip(s.chessboardState.positionHistory, s.chessboardState.moveLog),
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
          let currentEpd = s.chessboardState.getCurrentEpd();
          let currentReport =
            rs.positionReports[s.sidebarState.activeSide][currentEpd];
          if (currentReport) {
            currentReport.suggestedMoves.forEach((sm) => {
              let epd = sm.epdAfter;
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
          let startResponses =
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
        let plans =
          rs.positionReports[s.sidebarState.activeSide][
            s.sidebarState.currentEpd
          ]?.plans ?? [];

        let maxOccurence = plans[0]?.occurences ?? 0;
        let consumer = parsePlans(
          cloneDeep(plans),
          s.sidebarState.activeSide,
          s.chessboardState.position
        );
        s.chessboardState.focusedPlans = [];
        s.chessboardState.plans = consumer.metaPlans.filter((p) =>
          consumer.consumed.has(p.id)
        );
        s.sidebarState.planSections = consumer.planSections;
        s.chessboardState.maxPlanOccurence = maxOccurence;
      }),
    onPositionUpdate: () =>
      set(([s, rs]) => {
        s.sidebarState.moveLog = s.chessboardState.moveLog;
        s.sidebarState.currentEpd = s.chessboardState.getCurrentEpd();
        s.sidebarState.currentSide =
          s.chessboardState.position.turn() === "b" ? "black" : "white";
        s.sidebarState.positionHistory = s.chessboardState.positionHistory;
        s.sidebarState.pendingResponses = {};

        s.updatePlans();

        let incidences = s.getLineIncidences({});
        if (rs.ecoCodeLookup) {
          s.sidebarState.lastEcoCode = last(
            filter(
              map(s.chessboardState.positionHistory, (p) => {
                return rs.ecoCodeLookup[p];
              })
            )
          );
        }
        let line = s.chessboardState.moveLog;
        map(
          zip(s.chessboardState.positionHistory, line, incidences),
          ([position, san, incidence], i) => {
            if (!san) {
              return;
            }
            let mine =
              i % 2 === (s.sidebarState.activeSide === "white" ? 0 : 1);
            if (
              !some(
                rs.repertoire[s.sidebarState.activeSide].positionResponses[
                  position
                ],
                (m) => {
                  return m.sanPlus === san;
                }
              )
            ) {
              s.sidebarState.pendingResponses[position] = {
                epd: position,
                epdAfter: s.chessboardState.positionHistory[i + 1],
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
          zip(s.chessboardState.positionHistory, s.chessboardState.moveLog),
          ([position, san], i) => {
            let positionReport =
              rs.positionReports[s.sidebarState.activeSide][position];
            if (positionReport) {
              let suggestedMove = find(
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
    replaceView: (view: React.ReactNode, direction: "left" | "right") =>
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
        const duration = 200;
        s.previousSidebarAnim.setValue(0.0);
        s.currentSidebarAnim.setValue(0.0);
        Animated.parallel([
          Animated.timing(s.previousSidebarAnim, {
            toValue: 1.0,
            duration: duration,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(s.currentSidebarAnim, {
            toValue: 1.0,
            easing: Easing.out(Easing.quad),
            duration: duration,
            delay: duration * 1.0,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (!finished) {
            quick((s) => {
              s.repertoireState.browsingState.previousSidebarAnim.setValue(1.0);
              s.repertoireState.browsingState.currentSidebarAnim.setValue(1.0);
              s.repertoireState.browsingState.sidebarDirection = null;
            });
          }
        });
      }),
    addPendingLine: (cfg) =>
      set(([s, gs]) => {
        let { replace } = cfg ?? { replace: false };
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
  } as BrowsingState;

  const setChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _set((s) => fn(s.repertoireState.browsingState.chessboardState));
  };
  const getChess = <T,>(fn: (s: ChessboardState) => T, id?: string): T => {
    return _get((s) => fn(s.repertoireState.browsingState.chessboardState));
  };
  initialState.chessboardState = createChessState(
    setChess,
    getChess,
    (c: ChessboardState) => {
      // c.frozen = true;
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
    }
  );
  return initialState;
};

function createEmptyRepertoireProgressState(): RepertoireProgressState {
  return {
    newProgressAnim: new Animated.Value(0.0),
    newProgressLeftAnim: new Animated.Value(0.0),
    savedProgressAnim: new Animated.Value(0.0),
    popoverOpacityAnim: new Animated.Value(0.0),
    headerOpacityAnim: new Animated.Value(0.0),
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
  let moveRating = getMoveRating(
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
