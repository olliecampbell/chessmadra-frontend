import { Move } from "@lubert/chess.ts/dist/types";
import { EcoCode, PositionReport } from "app/models";
import {
  isEmpty,
  last,
  map,
  isNil,
  sortBy,
  groupBy,
  find,
  nth,
  zip,
  flatten,
  cloneDeep,
  values,
  filter,
  some,
  take,
  findLast,
  every,
  keys,
} from "lodash-es";
import {
  lineToPgn,
  pgnToLine,
  RepertoireMove,
  RepertoireMiss,
  Side,
  SIDES,
  BySide,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import {
  AddedLineStage,
  AddNewLineChoice,
  EditingTab,
  FetchRepertoireResponse,
  RepertoireState,
} from "./repertoire_state";
import { getPawnOnlyEpd } from "./pawn_structures";
import { logProxy } from "./state";
import { START_EPD } from "./chess";
import { getPlayRate } from "./results_distribution";
import client from "app/client";
import { createQuick } from "./quick";
import { Animated } from "react-native";
import { getExpectedNumberOfMovesForTarget } from "app/components/RepertoireOverview";
import { TableResponse } from "app/components/RepertoireMovesTable";
import {
  EFFECTIVENESS_WEIGHTS_MASTERS,
  EFFECTIVENESS_WEIGHTS_PEERS,
  PLAYRATE_WEIGHTS,
  scoreTableResponses,
  shouldUsePeerRates,
} from "./table_scoring";
import { getMoveRating } from "./move_inaccuracy";
import { trackEvent } from "app/hooks/useTrackEvent";
import { isTheoryHeavy } from "./theory_heavy";

export interface GetIncidenceOptions {
  // onlyCovered?: boolean;
}

export enum BrowsingTab {
  Position = "Position",
  Responses = "Responses",
  Lines = "My lines",
  InstructiveGames = "Instructive games",
  Misses = "Biggest gaps",
}

export interface BrowsingState {
  showMetGoal?: boolean;
  dismissedPastCoverageGoalNotification: boolean;
  isPastCoverageGoal?: boolean;
  updateTableResponses: () => void;
  tableResponses: TableResponse[];
  requestToAddCurrentLine: () => void;
  hasAnyPendingResponses?: boolean;
  quick: (fn: (_: BrowsingState) => void) => void;
  readOnly: boolean;
  selectedTab: BrowsingTab;
  activeSide?: Side;
  chessboardState?: ChessboardState;
  differentMoveIndices?: number[];
  sections?: BrowserSection[];
  onPositionUpdate: () => void;
  addedLineState: {
    line: string[];
    addNewLineChoices?: AddNewLineChoice[];
    addNewLineSelectedIndex?: number;
    ecoCode: EcoCode;
    stage: AddedLineStage;
    positionReport: PositionReport;
  };
  // TODO: merge w/ onPositionUpdate
  onEditingPositionUpdate: () => void;
  addPendingLine: (_?: { replace: boolean }) => void;
  pendingResponses?: Record<string, RepertoireMove>;
  isAddingPendingLine: boolean;
  getIncidenceOfCurrentLine: () => number;
  getLineIncidences: (_: GetIncidenceOptions) => number[];
  getShouldShowPastGoalOverlay: () => boolean;
  hasPendingLineToAdd: boolean;
  pendingLineHasConflictingMoves?: boolean;
  fetchNeededPositionReports: () => void;
  updateRepertoireProgress: () => void;
  getCurrentPositionReport: () => PositionReport;
  reviewFromCurrentLine: () => void;
  repertoireProgressState: BySide<RepertoireProgressState>;
  editingState: {
    lastEcoCode?: EcoCode;
    selectedTab: EditingTab;
    etcModalOpen: boolean;
    addConflictingMoveModalOpen: boolean;
  };
}

interface RepertoireProgressState {
  showNewProgressBar?: boolean;
  showPending?: boolean;
  completed: boolean;
  showPopover: boolean;
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
    readOnly: false,
    dismissedPastCoverageGoalNotification: false,
    hasPendingLineToAdd: false,
    selectedTab: BrowsingTab.Responses,
    isAddingPendingLine: false,
    addedLineState: null,
    editingState: {
      selectedTab: EditingTab.Position,
      etcModalOpen: false,
      addConflictingMoveModalOpen: false,
    },
    activeSide: "white",
    tableResponses: [],
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
          let completed = biggestMissIncidence < threshold;
          progressState.completed = completed;
          let expectedNumMoves = rs.expectedNumMoves[side];
          // let magic = 12.7; // Arctan(12.7) = 0.95
          let getProgress = (x: number): number => {
            let k = 0 - (1 / expectedNumMoves) * 3;
            let y = (1 / (1 + Math.exp(k * x)) - 0.5) * 2;
            return y * 100;
            // return (
            //   (Math.atan((x / expectedNumMoves) * magic) / (Math.PI / 2)) * 100
            // );
          };
          let savedProgress = completed ? 100 : getProgress(numMoves);
          let numNew = values(s.pendingResponses).length;
          let numNewAboveThreshold = values(s.pendingResponses).filter(
            (m) => m.incidence > threshold
          ).length;
          progressState.showPopover = numNew > 0 && !completed;
          progressState.pendingMoves = numNew;
          let newProgress =
            getProgress(numMoves + numNewAboveThreshold) - savedProgress;
          console.log({
            side,
            biggestMissIncidence,
            threshold,
            completed,
            numNew,
            numNewAboveThreshold,
            pm: logProxy(s.pendingResponses),
            savedProgress,
            newProgress,
            expectedNumMoves,
            numMoves,
          });
          progressState.showNewProgressBar = newProgress > 0;
          progressState.showPending = some(
            flatten(values(s.pendingResponses)),
            (m) => m.mine
          );
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
          Animated.timing(progressState.newProgressLeftAnim, {
            toValue: savedProgress,
            duration: 1000,
            useNativeDriver: true,
          }).start();
          Animated.timing(progressState.newProgressAnim, {
            toValue: newProgress,
            duration: 1000,
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
          s.tableResponses = [];
          return;
        }
        let threshold = gs.userState.getCurrentThreshold();
        console.log({ threshold });
        let currentSide: Side =
          s.chessboardState.position.turn() === "b" ? "black" : "white";
        let currentEpd = s.chessboardState.getCurrentEpd();
        let positionReport = s.getCurrentPositionReport();
        let _tableResponses: Record<string, TableResponse> = {};
        positionReport?.suggestedMoves.map((sm) => {
          _tableResponses[sm.sanPlus] = {
            suggestedMove: cloneDeep(sm),
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
            _tableResponses[r.sanPlus] = { repertoireMove: r };
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
          if (tr.repertoireMove?.incidence) {
            tr.incidence = tr.repertoireMove?.incidence;
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
          if (tr.suggestedMove?.sanPlus === "Be7") {
            console.log({
              playRate: getPlayRate(tr.suggestedMove, positionReport),
              positionReport,
              suggestedMove: tr.suggestedMove,
              tr,
            });
          }
        });
        let coverage = rs.repertoireGrades[s.activeSide].coverage;
        tableResponses.forEach((tr) => {
          let epd = tr.suggestedMove?.epdAfter;
          if (coverage[epd]) {
            tr.coverage = coverage[epd];
          }
        });
        tableResponses.forEach((tr) => {
          let epdAfter = tr.suggestedMove?.epdAfter;
          if (!ownSide || tr.repertoireMove) {
            // Don't add these tags when it's your own
            return;
          }
          if (
            ownSide &&
            !tr.repertoireMove &&
            rs.epdNodes[s.activeSide][epdAfter]
          ) {
            console.log("has position responses");
            tr.transposes = true;
          }
          if (isTheoryHeavy(tr, currentEpd)) {
            tr.theoryHeavy = true;
          }
        });
        tableResponses.forEach((tr) => {
          let moveRating = getMoveRating(
            positionReport?.stockfish,
            tr.suggestedMove?.stockfish,
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
              tr.bestMove = true;
            }
          });
        }
        if (!ownSide) {
          tableResponses.forEach((tr) => {
            let incidence = tr.incidenceUpperBound ?? tr.incidence;
            tr.needed = incidence > threshold;
          });
        }
        s.tableResponses = tableResponses;
        let noneNeeded = every(tableResponses, (tr) => !tr.needed);
        s.isPastCoverageGoal =
          s.getIncidenceOfCurrentLine() < threshold || (!ownSide && noneNeeded);
        if (!s.isPastCoverageGoal) {
          s.dismissedPastCoverageGoalNotification = false;
        }
      }),
    getShouldShowPastGoalOverlay: () =>
      set(([s, rs]) => {
        return (
          s.isPastCoverageGoal &&
          !s.dismissedPastCoverageGoalNotification &&
          s.hasPendingLineToAdd
        );
      }),
    reviewFromCurrentLine: () =>
      set(([s, rs]) => {
        return rs.positionReports[s.chessboardState.getCurrentEpd()];
      }),
    getCurrentPositionReport: () =>
      get(([s, rs]) => {
        return rs.positionReports[s.chessboardState.getCurrentEpd()];
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
        neededPositions = filter(
          neededPositions,
          (epd) => !rs.positionReports[epd]
        );
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
        if (s.hasPendingLineToAdd) {
          if (s.pendingLineHasConflictingMoves) {
            s.editingState.addConflictingMoveModalOpen = true;
          } else {
            trackEvent("repertoire.add_pending_line");
            s.addPendingLine();
          }
        }
      }),
    onEditingPositionUpdate: () =>
      set(([s, rs]) => {
        let line = s.chessboardState.moveLog;
        s.pendingResponses = {};
        s.differentMoveIndices = [];
        if (rs.ecoCodeLookup && s.editingState) {
          s.editingState.lastEcoCode = last(
            filter(
              map(s.chessboardState.positionHistory, (p) => {
                return rs.ecoCodeLookup[p];
              })
            )
          );
        }
        s.pendingLineHasConflictingMoves = false;
        let incidences = s.getLineIncidences({});
        map(
          zip(s.chessboardState.positionHistory, line, incidences),
          ([position, san, incidence], i) => {
            if (!san) {
              return;
            }
            let mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
            let existingResponses =
              rs.repertoire[s.activeSide].positionResponses[position];
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
                rs.repertoire[s.activeSide].positionResponses[position],
                (m) => {
                  return m.sanPlus === san;
                }
              )
            ) {
              s.differentMoveIndices.push(i);
              s.pendingResponses[position] = {
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

        s.hasAnyPendingResponses = !isEmpty(
          flatten(values(s.pendingResponses))
        );
        s.hasPendingLineToAdd = some(
          flatten(values(s.pendingResponses)),
          (m) => m.mine
        );
        s.fetchNeededPositionReports();
        s.updateRepertoireProgress();
        s.updateTableResponses();
      }, "onEditingPositionUpdate"),
    getLineIncidences: (options: GetIncidenceOptions = {}) =>
      get(([s, rs]) => {
        let startPosition = START_EPD;

        let incidence = 1.0;
        let skip = false;
        return map(
          zip(s.chessboardState.positionHistory, s.chessboardState.moveLog),
          ([position, san], i) => {
            let moveSide = i % 2 === 0 ? "white" : "black";
            let covered = !isEmpty(
              rs.repertoire?.[s.activeSide]?.positionResponses[position]
            );
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
    onPositionUpdate: () =>
      set(([s, repertoireState]) => {
        s.onEditingPositionUpdate();
      }),
    addPendingLine: (cfg) =>
      set(([s, gs]) => {
        let { replace } = cfg ?? { replace: false };
        s.isAddingPendingLine = true;
        client
          .post("/api/v1/openings/add_moves", {
            moves: flatten(cloneDeep(values(s.pendingResponses))),
            side: s.activeSide,
            replace: replace,
          })
          .then(({ data }: { data: FetchRepertoireResponse }) => {
            set(([s, rs]) => {
              // s.backToStartPosition(s);
              rs.repertoire = data.repertoire;
              rs.repertoireGrades = data.grades;
              rs.onRepertoireUpdate();
              s.onEditingPositionUpdate();
              s.editingState.addConflictingMoveModalOpen = false;
            });
          })
          .finally(() => {
            set(([s]) => {
              s.isAddingPendingLine = false;
              s.editingState.addConflictingMoveModalOpen = false;
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
        madeMove: () => {},

        shouldMakeMove: (move: Move) =>
          set(([s]) => {
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
    showPopover: false,
  };
}
