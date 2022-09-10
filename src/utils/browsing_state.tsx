import { Move } from "@lubert/chess.ts/dist/types";
import {
  EcoCode,
} from "app/models";
import {
  isEmpty,
  last,
  map,
  isNil,
  sortBy,
  groupBy,
} from "lodash-es";
import {
  lineToPgn,
  pgnToLine,
  RepertoireMove,
  Side,
} from "./repertoire";
import { ChessboardState, createChessState } from "./chessboard_state";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { RepertoireState } from "./repertoire_state";
import { getPawnOnlyEpd } from "./pawn_structures";

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

export enum BrowsingTab {
  Lines = "Saved lines",
  InstructiveGames = "Instructive games",
  Misses = "Biggest gaps",
}

export interface BrowsingState {
  readOnly: boolean;
  selectedTab: BrowsingTab;
  activeSide?: Side;
  chessboardState?: ChessboardState;
  sections: BrowserSection[];
  onPositionUpdate: () => void;
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
    selectedTab: BrowsingTab.Lines,
    onPositionUpdate: () =>
      set(([s, repertoireState]) => {
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
        recurse(
          lineToPgn(currentLine),
          startEpd,
          currentLine.length,
          new Set(),
          repertoireState.ecoCodeLookup[startEpd]
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
