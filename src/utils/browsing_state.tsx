import { Move } from "@lubert/chess.ts/dist/types";
import { EcoCode, MoveTag, PositionReport } from "app/models";
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
} from "lodash-es";
import {
  RepertoireMove,
  RepertoireMiss,
  Side,
  SIDES,
  BySide,
  otherSide,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { AppState, quick } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { FetchRepertoireResponse, RepertoireState } from "./repertoire_state";
import { START_EPD } from "./chess";
import { getPlayRate, getTotalGames, getWinRate } from "./results_distribution";
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

export interface SidebarState {
  isPastCoverageGoal?: boolean;
  tableResponses: TableResponse[];
  hasAnyPendingResponses?: boolean;
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
}

export interface BrowsingState {
  // Functions
  fetchNeededPositionReports: () => void;
  updateRepertoireProgress: () => void;
  reviewFromCurrentLine: () => void;
  finishSidebarOnboarding: () => void;
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

  // Fields
  chessboardState?: ChessboardState;
  sidebarState: SidebarState;
  previousSidebarState: SidebarState;
  sidebarDirection: "left" | "right";
  previousSidebarAnim: Animated.Value;
  currentSidebarAnim: Animated.Value;
  activeSide?: Side;
  repertoireProgressState: BySide<RepertoireProgressState>;
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
    currentEpd: START_EPD,
    isPastCoverageGoal: false,
    tableResponses: [],
    hasAnyPendingResponses: false,
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
    sidebarState: makeDefaultSidebarState(),
    hasPendingLineToAdd: false,
    activeSide: null,
    repertoireProgressState: {
      white: createEmptyRepertoireProgressState(),
      black: createEmptyRepertoireProgressState(),
    },
    updateRepertoireProgress: () =>
      set(([s, rs, gs]) => {
        SIDES.forEach((side) => {
          let progressState = s.repertoireProgressState[side];
          let threshold = gs.userState.getCurrentThreshold();
          let biggestMissIncidence =
            rs.repertoireGrades[side]?.biggestMiss?.incidence;
          let numMoves = rs.numResponsesAboveThreshold[side];
          let completed =
            isNil(biggestMissIncidence) || biggestMissIncidence < threshold;
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
        });
      }),
    updateTableResponses: () =>
      get(([s, rs, gs]) => {
        if (!s.activeSide) {
          s.sidebarState.tableResponses = [];
          return;
        }
        let threshold = gs.userState.getCurrentThreshold();
        let currentSide: Side =
          s.chessboardState.position.turn() === "b" ? "black" : "white";
        let currentEpd = s.chessboardState.getCurrentEpd();
        let positionReport = rs.positionReports[s.sidebarState.currentEpd];
        let _tableResponses: Record<string, TableResponse> = {};
        positionReport?.suggestedMoves.map((sm) => {
          _tableResponses[sm.sanPlus] = {
            suggestedMove: cloneDeep(sm),
            tags: [],
            side: s.activeSide,
          };
        });
        let existingMoves =
          rs.repertoire[s.activeSide].positionResponses[
            s.chessboardState.getCurrentEpd()
          ];
        existingMoves?.map((r) => {
          if (_tableResponses[r.sanPlus]) {
            _tableResponses[r.sanPlus].repertoireMove = r;
          } else {
            _tableResponses[r.sanPlus] = {
              repertoireMove: r,
              tags: [],
              side: s.activeSide,
            };
          }
        });
        let ownSide = currentSide === s.activeSide;
        const usePeerRates = shouldUsePeerRates(positionReport);
        let tableResponses = scoreTableResponses(
          values(_tableResponses),
          positionReport,
          currentSide,
          currentEpd,
          ownSide
            ? usePeerRates
              ? EFFECTIVENESS_WEIGHTS_PEERS
              : EFFECTIVENESS_WEIGHTS_MASTERS
            : PLAYRATE_WEIGHTS
        );
        let currentLineIncidence = s.getIncidenceOfCurrentLine();
        tableResponses.forEach((tr) => {
          let epd = tr.suggestedMove?.epdAfter;
          let knownIncidence = rs.knownEpdIncidences[s.activeSide][epd];
          if (knownIncidence) {
            tr.incidence = knownIncidence;
            return;
          }
          let moveIncidence = 0.0;
          tr.incidence = currentLineIncidence * moveIncidence;
          tr.incidenceUpperBound = tr.incidence;
          if (ownSide) {
            moveIncidence = 1.0;
            tr.incidence = currentLineIncidence;
            tr.incidenceUpperBound = tr.incidence;
          } else if (tr.suggestedMove) {
            moveIncidence = getPlayRate(tr.suggestedMove, positionReport);
            tr.incidence = currentLineIncidence * moveIncidence;
            // TODO: better check here
            tr.incidenceUpperBound = currentLineIncidence * moveIncidence;
          }
        });
        let biggestMisses =
          rs.repertoireGrades[s.activeSide].biggestMisses ?? {};
        tableResponses.forEach((tr) => {
          let epd = tr.suggestedMove?.epdAfter;
          if (biggestMisses[epd]) {
            tr.biggestMiss = biggestMisses[epd];
          }
        });
        tableResponses.forEach((tr) => {
          if (!ownSide) {
            if (isCommonMistake(tr, positionReport, threshold)) {
              tr.tags.push(MoveTag.CommonMistake);
            }
            if (isDangerousMove(tr, positionReport, threshold)) {
              tr.tags.push(MoveTag.Dangerous);
            }
          }
        });
        tableResponses.forEach((tr) => {
          let epdAfter = tr.suggestedMove?.epdAfter;
          if (!ownSide || tr.repertoireMove) {
            return;
          }
          if (!tr.repertoireMove && rs.epdNodes[s.activeSide][epdAfter]) {
            tr.tags.push(MoveTag.Transposes);
            if (!ownSide) {
              tr.disableBadgePriority = true;
            }
          }
          if (isTheoryHeavy(tr, currentEpd)) {
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
            let allOthersInaccurate = every(tableResponses, (tr, j) => {
              return !isNil(tr.moveRating) || j === i;
            });
            if (allOthersInaccurate && isNil(tr.moveRating)) {
              tr.tags.push(MoveTag.BestMove);
            }
          });
        }
        if (!ownSide) {
          tableResponses.forEach((tr) => {
            let incidence = tr.incidenceUpperBound ?? tr.incidence;
            tr.needed = incidence > threshold;
          });
        }
        s.sidebarState.tableResponses = tableResponses;
        let noneNeeded =
          every(tableResponses, (tr) => !tr.needed) && !isEmpty(tableResponses);
        s.sidebarState.isPastCoverageGoal =
          s.getIncidenceOfCurrentLine() < threshold || (!ownSide && noneNeeded);
      }),
    getMissInThisLine: (sidebarState: SidebarState) =>
      get(([s, rs, gs]) => {
        let threshold = gs.userState.getCurrentThreshold();
        let miss =
          rs.repertoireGrades[s.activeSide].biggestMisses?.[
            sidebarState.currentEpd
          ];
        if (miss?.incidence > threshold) {
          return miss;
        }
      }),
    getNearestMiss: (sidebarState: SidebarState) =>
      get(([s, rs, gs]) => {
        let threshold = gs.userState.getCurrentThreshold();
        return findLast(
          map(sidebarState.positionHistory, (epd) => {
            let miss = rs.repertoireGrades[s.activeSide].biggestMisses?.[epd];
            if (
              miss?.incidence > threshold &&
              miss?.epd !== sidebarState.currentEpd
            ) {
              return miss;
            }
          })
        );
      }),
    dismissTransientSidebarState: () =>
      set(([s, rs]) => {
        if (s.sidebarState.submitFeedbackState.visible) {
          s.sidebarState.submitFeedbackState.visible = false;
          return true;
        } else if (s.sidebarState.addedLineState.visible) {
          s.sidebarState.addedLineState.visible = false;
          return true;
        } else if (s.sidebarState.deleteLineState.visible) {
          s.sidebarState.deleteLineState.visible = false;
          return true;
        }
        return false;
      }),
    finishSidebarOnboarding: () =>
      set(([s, rs]) => {
        s.moveSidebarState("right");
        s.sidebarState.sidebarOnboardingState.stageStack = [];
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
        let side = s.activeSide;
        let neededPositions = [START_EPD];
        if (!isNil(side)) {
          s.chessboardState.positionHistory.forEach((epd) => {
            if (!rs.positionReports[epd]) {
              neededPositions.push(epd);
            }
          });
          let currentReport =
            rs.positionReports[s.chessboardState.getCurrentEpd()];
          if (currentReport) {
            currentReport.suggestedMoves.forEach((sm) => {
              let epd = sm.epdAfter;
              if (!rs.positionReports[epd]) {
                neededPositions.push(epd);
              }
            });
          }
        }
        if (isNil(side)) {
          let startResponses =
            rs.repertoire?.["white"]?.positionResponses[START_EPD];
          if (startResponses?.length === 1) {
            neededPositions.push(startResponses[0].epdAfter);
          }
        }
        neededPositions = filter(
          neededPositions,
          (epd) => !rs.positionReports[epd]
        );
        neededPositions = uniq(neededPositions);
        if (isEmpty(neededPositions)) {
          return;
        }
        client
          .post("/api/v1/openings/position_reports", {
            epds: neededPositions,
          })
          .then(({ data: reports }: { data: PositionReport[] }) => {
            set(([s, rs]) => {
              reports.forEach((report) => {
                rs.positionReports[report.epd] = report;
              });
              s.updateTableResponses();
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
          trackEvent("repertoire.add_pending_line");
          s.addPendingLine();
        }
      }),
    onPositionUpdate: () =>
      set(([s, rs]) => {
        s.sidebarState.moveLog = s.chessboardState.moveLog;
        s.sidebarState.currentEpd = s.chessboardState.getCurrentEpd();
        s.sidebarState.currentSide =
          s.chessboardState.position.turn() === "b" ? "black" : "white";
        s.sidebarState.positionHistory = s.chessboardState.positionHistory;
        s.sidebarState.pendingResponses = {};

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
            let mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
            if (
              !some(
                rs.repertoire[s.activeSide].positionResponses[position],
                (m) => {
                  return m.sanPlus === san;
                }
              )
            ) {
              s.sidebarState.pendingResponses[position] = {
                epd: position,
                epdAfter: s.chessboardState.positionHistory[i + 1],
                sanPlus: san,
                side: s.activeSide,
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
        s.fetchNeededPositionReports();
        s.updateRepertoireProgress();
        s.updateTableResponses();
      }),
    getLineIncidences: (options: GetIncidenceOptions = {}) =>
      get(([s, rs]) => {
        let startPosition = START_EPD;
        if (!s.activeSide) {
          return [];
        }

        let incidence = 1.0;
        return map(
          zip(s.chessboardState.positionHistory, s.chessboardState.moveLog),
          ([position, san], i) => {
            let moveSide = i % 2 === 0 ? "white" : "black";
            let knownIncidence = rs.knownEpdIncidences[s.activeSide][position];
            if (knownIncidence) {
              incidence = knownIncidence;
              return incidence;
            }
            let mine = moveSide === s.activeSide;
            if (!mine) {
              let positionReport = rs.positionReports[position];
              if (positionReport) {
                let suggestedMove = find(
                  positionReport.suggestedMoves,
                  (sm) => sm.sanPlus === san
                );
                if (suggestedMove) {
                  let moveIncidence = getPlayRate(
                    suggestedMove,
                    positionReport
                  );
                  incidence *= moveIncidence;
                }
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
          if (finished) {
            quick((s) => {
              s.repertoireState.browsingState.previousSidebarAnim.setValue(0.0);
              s.repertoireState.browsingState.currentSidebarAnim.setValue(0.0);
              s.repertoireState.browsingState.sidebarDirection = null;
            });
          }
        });
      }),
    addPendingLine: (cfg) =>
      set(([s, gs]) => {
        let { replace } = cfg ?? { replace: false };
        s.sidebarState.isAddingPendingLine = true;
        client
          .post("/api/v1/openings/add_moves", {
            moves: flatten(cloneDeep(values(s.sidebarState.pendingResponses))),
            side: s.activeSide,
            replace: replace,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s, rs]) => {
              s.moveSidebarState("right");
              // s.backToStartPosition(s);
              rs.repertoire = data.repertoire;
              rs.repertoireGrades = data.grades;
              rs.onRepertoireUpdate();
              s.onPositionUpdate();
              s.sidebarState.addedLineState = {
                visible: true,
              };
            });
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
        madeMove: () => {
          trackEvent("builder.chessboard.played_move");
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
  if (tr.incidence < threshold) {
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

const isDangerousMove = (
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
  if (tr.incidence < threshold / 2) {
    return false;
  }
  if (
    getWinRate(tr.suggestedMove.results, otherSide(tr.side)) >
    getWinRate(positionReport.results, otherSide(tr.side)) + 0.05
  ) {
    return true;
  }
  return false;
};

export const getCoverageProgress = (
  numMoves: number,
  expectedNumMoves: number
): number => {
  let k = 0 - (1 / expectedNumMoves) * 3;
  let y = (1 / (1 + Math.exp(k * numMoves)) - 0.5) * 2;
  return y * 100;
  // return (
  //   (Math.atan((x / expectedNumMoves) * magic) / (Math.PI / 2)) * 100
  // );
};
