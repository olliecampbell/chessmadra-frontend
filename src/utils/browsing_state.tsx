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
  includes,
} from "lodash-es";
import {
  RepertoireMove,
  RepertoireMiss,
  Side,
  SIDES,
  BySide,
  otherSide,
  lineToPgn,
  pgnToLine,
} from "./repertoire";
import { AppState, quick } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { FetchRepertoireResponse, RepertoireState } from "./repertoire_state";
import { genEpd, START_EPD } from "./chess";
import {
  getPlayRate,
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
import { Responsive, useResponsive } from "./useResponsive";
// solid TODO
// import { Identify, identify } from "@amplitude/analytics-browser";
import client from "./client";
import { Component, createContext, createSignal, JSXElement } from "solid-js";
import { identify, Identify } from "@amplitude/analytics-browser";
import { Animated } from "./animation";
import { animateTo } from "./animation";
import {
  ChessboardInterface,
  ChessboardViewState,
  createChessboardInterface,
} from "./chessboard_interface";
import { unwrap } from "solid-js/store";
import { UpgradeSubscriptionView } from "~/components/UpgradeSubscriptionView";
import { Chess } from "@lubert/chess.ts";
import { PAYMENT_ENABLED } from "./payment";
import {
  Dropdown,
  FirstLineSavedOnboarding,
} from "~/components/SidebarOnboarding";
import { c, s } from "./styles";
import { CMText } from "~/components/CMText";
import { Spacer } from "~/components/Space";
import { Pressable } from "~/components/Pressable";
import { LichessLogoIcon } from "~/components/icons/LichessLogoIcon";
import { View } from "~/types/View";
import * as Sentry from "@sentry/browser";

export interface GetIncidenceOptions {
  placeholder: void;
  // onlyCovered?: boolean;
}

export enum SidebarOnboardingStage {
  Initial,
  ConnectAccount,
  SetRating,
  CoverageGoalFyi,
  GoalSet,
  // Probably skip this for now
  Import,
  AskAboutExistingRepertoire,
  ChooseImportSource,
  TrimRepertoire,
}

export interface SidebarOnboardingState {
  stageStack: SidebarOnboardingStage[];
  importType?: SidebarOnboardingImportType | null;
}

export enum SidebarOnboardingImportType {
  LichessUsername = "lichess_username",
  PGN = "pgn",
  PlayerTemplates = "player_templates",
}
export type BrowsingMode = "browse" | "build" | "review" | "overview" | "home";

export const modeToUI = (mode: BrowsingMode) => {
  switch (mode) {
    case "browse":
      return "Review";
    case "build":
      return "Browse / add new";
    case "review":
      return "Practice";
    case "overview":
      return "Overview";
    case "home":
      return "Home";
  }
};

export interface SidebarState {
  viewStack: View[];
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
    loading: boolean;
  };
  pendingResponses?: Record<string, RepertoireMove>;
  currentSide: Side;
  hasPendingLineToAdd: boolean;
  sidebarOnboardingState: SidebarOnboardingState;
  moveLog: string[];
  positionHistory: string[] | null;
  currentEpd: string;
  lastEcoCode?: EcoCode;
  planSections?: (() => JSXElement)[];
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
  dismissTransientSidebarState: () => void;
  getNearestMiss: (sidebarState: SidebarState) => RepertoireMiss;
  getMissInThisLine: (sidebarState: SidebarState) => RepertoireMiss;
  onPositionUpdate: () => void;
  updateTableResponses: () => void;
  requestToAddCurrentLine: () => void;
  quick: (fn: (_: BrowsingState) => void) => void;
  addPendingLine: (_?: { replace: boolean }) => Promise<void>;
  moveSidebarState: (direction: "left" | "right") => void;
  currentView: () => View;
  clearViews: () => void;
  pushView: (
    view: Component<any>,
    opts?: { direction?: "left" | "right"; props?: any }
  ) => void;
  replaceView: (
    view: Component<any>,
    opts?: { direction?: "left" | "right"; props?: any }
  ) => void;
  popView: () => void;
  updatePlans: () => void;
  checkShowTargetDepthReached: () => void;
  goToBuildOnboarding(): unknown;

  // Fields
  chessboard: ChessboardInterface;
  sidebarState: SidebarState;
  chessboardShown: boolean;
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

export const makeDefaultSidebarState = () => {
  return {
    viewStack: [],
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
      loading: false,
    },
    pendingResponses: {},
    currentSide: "white",
    hasPendingLineToAdd: false,
    sidebarOnboardingState: {
      stageStack: [],
      importType: null,
    },
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
    chessboard: undefined as ChessboardInterface,
    activeSide: "white",
    sidebarState: makeDefaultSidebarState(),
    hasPendingLineToAdd: false,
    // TODO: solid
    chessboardShown: false,
    plans: {},
    showPlans: false,
    repertoireProgressState: {
      white: createEmptyRepertoireProgressState(),
      black: createEmptyRepertoireProgressState(),
    },

    goToBuildOnboarding: () =>
      set(([s, rs]) => {
        s.clearViews();
        let side = rs.onboarding.side;
        if (!side) {
          return;
        }
        const biggestMiss = rs.repertoireGrades[side]?.biggestMiss;
        if (!biggestMiss) {
          console.log("No biggest miss");
          return;
        }
        const line = pgnToLine(biggestMiss.lines[0]);
        rs.startBrowsing(side, "build", { pgnToPlay: lineToPgn(line) });
      }),
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
          console.log("Aborting updateTableResponses");
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
            if (ci > 0.12 && Math.abs(positionWinRate - moveWinRate) > 0.02) {
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
              const playedByMasters =
                tr.suggestedMove &&
                getPlayRate(tr.suggestedMove, positionReport, true) > 0.02;
              return (!isNil(tr.moveRating) && !playedByMasters) || j === i;
            });
            const playedEnough =
              getTotalGames(tr.suggestedMove?.results) /
                getTotalGames(positionReport?.results) >
              0.02;
            if (allOthersInaccurate && isNil(tr.moveRating) && playedEnough) {
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
          rs.repertoireGrades[s.sidebarState.activeSide]?.biggestMisses?.[
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
              rs.repertoireGrades[s.sidebarState.activeSide]?.biggestMisses?.[
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
        }
        if (s.sidebarState.addedLineState.visible) {
          s.sidebarState.addedLineState.visible = false;
          s.sidebarState.addedLineState.loading = false;
        }
        if (s.sidebarState.deleteLineState.visible) {
          s.sidebarState.deleteLineState.visible = false;
        }
        if (s.sidebarState.transposedState.visible) {
          s.sidebarState.transposedState.visible = false;
        }
        if (s.sidebarState.showPlansState.visible) {
          s.sidebarState.showPlansState.visible = false;
          s.sidebarState.showPlansState.coverageReached = false;
          s.chessboard.set((c) => {
            c.showPlans = false;
          });
        }
      }),
    finishSidebarOnboarding: (responsive: Responsive) =>
      set(([s, rs]) => {
        quick((s) => {
          s.repertoireState.browsingState.moveSidebarState("right");
          s.repertoireState.browsingState.sidebarState =
            makeDefaultSidebarState();
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
                if (report.instructiveGames) {
                  report.instructiveGames.forEach((game) => {
                    const chess = new Chess();
                    const epds: string[] = [];
                    game.moves.forEach((move) => {
                      chess.move(move);
                      let epd = genEpd(chess);
                      epds.push(epd);
                    });
                    game.epds = epds;
                  });
                }
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
      set(([s, rs, gs]) => {
        const subscribed = gs.userState.isSubscribed();

        console.log("subscribed? ", subscribed);
        if (
          !subscribed &&
          rs.pastFreeTier(s.sidebarState.activeSide) &&
          PAYMENT_ENABLED &&
          !rs.onboarding.isOnboarding
        ) {
          s.replaceView(UpgradeSubscriptionView, {
            props: { pastLimit: true },
          });
          return;
        }
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
          console.log("updating plans to ", c.plans);
          s.sidebarState.planSections = consumer.planSections;
          c.maxPlanOccurence = maxOccurence;
        });
      }),
    onPositionUpdate: () =>
      set(([s, rs]) => {
        s.sidebarState.moveLog = s.chessboard.get((s) => s.moveLog);
        s.sidebarState.currentEpd = s.chessboard.getCurrentEpd();
        s.sidebarState.currentSide = s.chessboard.getTurn();
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
                  difficulty: 0.3,
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
        console.log("hasPendingLineToAdd", s.sidebarState.hasPendingLineToAdd);
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
    clearViews: () =>
      set(([s, gs]) => {
        s.sidebarState.viewStack = [];
      }),
    currentView: () =>
      get(([s, gs]) => {
        return last(s.sidebarState.viewStack);
      }),
    pushView: (view, { direction, props } = {}) =>
      set(([s, gs]) => {
        s.moveSidebarState(direction ?? "right");
        console.log("doing this?");
        s.sidebarState.viewStack.push({ component: view, props: props ?? {} });
      }),
    replaceView: (view, { direction, props } = {}) =>
      set(([s, gs]) => {
        s.moveSidebarState(direction ?? "right");
        s.sidebarState.viewStack.pop();
        s.sidebarState.viewStack.push({ component: view, props: props ?? {} });
      }),
    popView: () =>
      set(([s, gs]) => {
        s.sidebarState.viewStack.pop();
        console.log("view stack", s.sidebarState.viewStack);
      }),
    moveSidebarState: (direction: "left" | "right") =>
      set(([s, gs]) => {
        gs.animateSidebarState?.(direction);
      }),
    addPendingLine: (cfg) =>
      set(([s, gs]) => {
        const { replace } = cfg ?? { replace: false };
        s.sidebarState.showPlansState.hasShown = false;
        s.dismissTransientSidebarState();
        s.sidebarState.addedLineState = {
          visible: true,
          loading: true,
        };
        return client
          .post("/api/v1/openings/add_moves", {
            moves: flatten(cloneDeep(values(s.sidebarState.pendingResponses))),
            side: s.sidebarState.activeSide,
            replace: replace,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s, rs]) => {
              if (rs.onboarding.isOnboarding) {
                rs.browsingState.pushView(FirstLineSavedOnboarding);
              } else {
                s.sidebarState.addedLineState = {
                  visible: true,
                  loading: false,
                };
              }
              rs.repertoire = data.repertoire;
              rs.repertoireGrades = data.grades;
              rs.onRepertoireUpdate();
              s.onPositionUpdate();
            });
          })
          .catch((err) => {
            console.log("Error adding lines!", err);
            Sentry.Browser.captureException(err);
          })
          .finally(() => {
            set(([s]) => {
              s.sidebarState.addedLineState.loading = false;
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
        set(([s, rs]) => {
          if (includes(["home", "overview"], s.sidebarState.mode)) {
            rs.startBrowsing(s.sidebarState.activeSide ?? "white", "build", {
              keepPosition: true,
            });
          }
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
