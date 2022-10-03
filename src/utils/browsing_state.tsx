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
} from "lodash-es";
import {
  lineToPgn,
  pgnToLine,
  RepertoireMove,
  RepertoireMiss,
  Side,
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

export enum BrowsingTab {
  Position = "Position",
  Responses = "Responses",
  Lines = "My lines",
  InstructiveGames = "Instructive games",
  Misses = "Biggest gaps",
}

export interface BrowsingState {
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
  pendingResponses?: Record<string, RepertoireMove[]>;
  isAddingPendingLine: boolean;
  getIncidenceOfCurrentLine: () => number;
  hasPendingLineToAdd: boolean;
  pendingLineHasConflictingMoves?: boolean;
  fetchNeededPositionReports: () => void;
  getCurrentPositionReport: () => PositionReport;
  reviewFromCurrentLine: () => void;
  editingState: {
    lastEcoCode?: EcoCode;
    selectedTab: EditingTab;
    etcModalOpen: boolean;
    addConflictingMoveModalOpen: boolean;
  };
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
              s.fetchNeededPositionReports();
            });
          })
          .finally(() => {
            // set(([s]) => {});
          });
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
        map(
          zip(s.chessboardState.positionHistory, line),
          ([position, san], i) => {
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
    getIncidenceOfCurrentLine: () =>
      get(([s, rs]) => {
        let startPosition = START_EPD;

        let incidence = 1.0;
        map(
          zip(s.chessboardState.positionHistory, s.chessboardState.moveLog),
          ([position, san], i) => {
            let mine = i % 2 === (s.activeSide === "white" ? 0 : 1);
            let cachedIncidence = rs.epdIncidences[s.activeSide]?.[position];
            if (cachedIncidence) {
              incidence = cachedIncidence;
              return;
            }
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
          }
        );
        return incidence;
      }),
    onPositionUpdate: () =>
      set(([s, repertoireState]) => {
        s.onEditingPositionUpdate();
        if (!repertoireState.repertoire) {
          return;
        }
        let ecoCodeLookup = repertoireState.ecoCodeLookup;

        let responses =
          repertoireState.repertoire[s.activeSide].positionResponses;
        let uniqueLines = [] as BrowserLine[];
        let currentLine = pgnToLine(s.chessboardState.position.pgn());
        let startEpd = last(s.chessboardState.positionHistory);
        console.log("Pawn only epd: ", getPawnOnlyEpd(startEpd));
        let recurse = (
          path: string,
          epd: string,
          moveNumber: number,
          seenEpds: Set<string>,
          lastEcoCode: EcoCode,
          lastOnlyMove?: RepertoireMove
        ) => {
          let moves = responses[epd];
          if (isEmpty(moves) && pgnToLine(path).length !== currentLine.length) {
            uniqueLines.push({
              epd: epd,
              pgn: path,
              ecoCode: lastEcoCode,
              line: pgnToLine(path),
              deleteMove: lastOnlyMove,
            });
            return;
          }
          if (moves?.length === 1 && isNil(lastOnlyMove)) {
            console.log(
              "last only move is nil, seting to ",
              logProxy(moves[0])
            );
            lastOnlyMove = moves[0];
          } else if (moves?.length !== 1) {
            lastOnlyMove = null;
          }
          moves?.forEach((m) => {
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
            let ecoCode = ecoCodeLookup[m.epdAfter];
            if (!seenEpds.has(m.epdAfter)) {
              let newSeenEpds = new Set(seenEpds);
              newSeenEpds.add(m.epdAfter);
              // paths.push({ line: newPath, epd: m.epdAfter });
              recurse(
                newPath,
                m.epdAfter,
                moveNumber + 1,
                newSeenEpds,
                ecoCode ?? lastEcoCode,
                lastOnlyMove ?? m
              );
            }
          });
        };
        const lastResponse = find(
          responses[nth(s.chessboardState.positionHistory, -2)],
          (r) => r.sanPlus === last(currentLine)
        );
        console.log("Last response was", lastResponse);
        recurse(
          lineToPgn(currentLine),
          startEpd,
          currentLine.length,
          new Set(),
          repertoireState.ecoCodeLookup[startEpd],
          lastResponse
        );
        uniqueLines = sortBy(uniqueLines, (l) => {
          if (isNil(l.ecoCode) || !l.ecoCode.fullName.includes(":")) {
            return "ZZZ";
          }
          return l.ecoCode?.fullName;
        });
        s.sections = sortBy(
          map(
            groupBy(
              uniqueLines,
              (line) =>
                line.ecoCode && getNameEcoCodeIdentifier(line.ecoCode.fullName)
            ),
            (lines, ecoName) => {
              return {
                lines: lines,
                ecoCode: lines[0].ecoCode,
              } as BrowserSection;
            }
          ),
          (section) => {
            return -section.lines.length;
          }
        );
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

              s.addedLineState = {
                line: s.chessboardState.moveLog,
                stage: AddedLineStage.Initial,
                addNewLineSelectedIndex: 0,
                positionReport:
                  rs.positionReports[s.chessboardState.getCurrentEpd()],
                ecoCode: findLast(
                  map(
                    s.chessboardState.positionHistory,
                    (p) => rs.ecoCodeLookup[p]
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
              let biggestMiss = rs.repertoireGrades[s.activeSide].biggestMiss;
              if (biggestMiss) {
                addMiss(biggestMiss, `Biggest miss overall`);
              }

              let ecoCode = s.addedLineState.ecoCode;
              if (ecoCode) {
                let ecoName = getNameEcoCodeIdentifier(ecoCode.fullName);
                let miss = find(
                  rs.repertoireGrades[s.activeSide].biggestMisses,
                  (m) => m.ecoCodeName == ecoName
                );
                addMiss(miss, `Biggest miss in ${ecoName}`);
                let fullEcoName = ecoCode.fullName;
                miss = find(
                  rs.repertoireGrades[s.activeSide].biggestMisses,
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
