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
} from "lodash";
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
import _ from "lodash";
import { genEpd } from "./chess";
import { formatEloRange } from "./elo_range";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { logProxy } from "./state";
import { RepertoireState } from "./repertoire_state";
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

export interface BrowsingState {
  readOnly: boolean;
  activeSide?: Side;
  chessboardState?: ChessboardState;
  drilldownState?: BrowserDrilldownState;
  previousDrilldownStates?: BrowserDrilldownState[];
  selectDrilldownState: (drilldownState: BrowserDrilldownState) => void;
  updateDrilldownStateAndSections: (epd: string, line: string[]) => void;
  selectBrowserSection: (
    section: BrowserSection,
    includeInPreviousStates: boolean
  ) => void;
}

export interface BrowserDrilldownState {
  epd: string;
  line: string[];
  sections: BrowserSection[];
  lines: BrowserLine[];
  ecoCode: EcoCode;
}

export interface BrowserSection {
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
  // const setOnly = <T,>(fn: (stack: BrowsingState) => T, id?: string): T => {
  //   return _set((s) => fn(s.repertoireState.browsingState));
  // };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) =>
      fn([s.repertoireState.browsingState, s.repertoireState, s])
    );
  };
  let initialState = {
    readOnly: false,
    selectDrilldownState: (browserState: BrowserDrilldownState) =>
      set(([s]) => {
        while (true) {
          let lastState = s.previousDrilldownStates.pop();
          console.log("Previous states", logProxy(s.previousDrilldownStates));
          if (lastState.ecoCode?.fullName === browserState.ecoCode?.fullName) {
            console.log(`Pushing`, logProxy(lastState));
            s.previousDrilldownStates.push(lastState);
            s.drilldownState = browserState;
            break;
          }
        }
      }),
    updateDrilldownStateAndSections: (epd: string, line: string[]) =>
      set(([s, repertoireState]) => {
        if (!repertoireState.repertoire) {
          return;
        }
        let ecoCodeLookup = repertoireState.ecoCodeLookup;
        s.drilldownState = {
          epd: epd,
          sections: [],
          line: line,
          lines: [],
          ecoCode: ecoCodeLookup[epd],
        };

        let sections: BrowserSection[] = [];
        let responses =
          repertoireState.repertoire[s.activeSide].positionResponses;
        let paths = [];
        if (!isEmpty(line)) {
          paths.push({ line: lineToPgn(line), epd: epd });
        }
        let seenEpds = new Set(
          s.drilldownState?.sections?.map((s) => s.epd) ?? []
        );
        let historyEcoFullNames = new Set();
        [...s.previousDrilldownStates, s.drilldownState].forEach((p) => {
          if (p.ecoCode) {
            historyEcoFullNames.add(p.ecoCode.fullName);
          }
        });
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
            let ecoCode = ecoCodeLookup[m.epdAfter];
            let myResponse = responses[m.epdAfter]?.[0];
            const nextEcoCode = ecoCodeLookup[myResponse?.epdAfter];
            if (
              ecoCode &&
              !historyEcoFullNames.has(ecoCode.fullName) &&
              (m.mine || (!m.mine && !nextEcoCode))
            ) {
              sections.push({
                epd: m.epdAfter,
                eco_code: ecoCode,
                line: pgnToLine(newPath),
                pgn: newPath,
                numMoves:
                  repertoireState.repertoireNumMoves[s.activeSide][m.epdAfter],
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
            if (s.drilldownState.sections.length === 1) {
              s.updateDrilldownStateAndSections(
                s.drilldownState.sections[0].epd,
                s.drilldownState.sections[0].line
              );
            }
          });
        };
        recurse(
          lineToPgn(s.drilldownState.line),
          s.drilldownState.epd,
          s.drilldownState.line.length ?? 0
        );
        // TODO: can optimize this probably
        paths = paths.filter(({ line }) => {
          if (
            some(paths, (p2) => p2.line.startsWith(line) && line !== p2.line) ||
            some(sections, (s) => s.pgn.startsWith(line) && line !== s.pgn)
          ) {
            return false;
          } else {
            return true;
          }
        });
        s.drilldownState.lines = paths.map((p) => {
          return {
            line: p.line,
            epd: p.epd,
          };
        });
        s.drilldownState.sections = sortBy(
          sections,
          (s) => -s.numMoves.withTranspositions
        );
      }),
    selectBrowserSection: (
      browserSection: BrowserSection,
      includeInPreviousStates: boolean
    ) =>
      set(([s]) => {
        s.updateDrilldownStateAndSections(
          browserSection.epd,
          browserSection.line
        );
        if (includeInPreviousStates) {
          s.previousDrilldownStates.push(s.drilldownState);
        }
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
      c.frozen = true;
      c.delegate = {
        completedMoveAnimation: () => {},
        madeMove: () => set(([s]) => {}),

        shouldMakeMove: (move: Move) =>
          set(([s]) => {
            return true;
          }),
      };
    }
  );
  return initialState;
};
