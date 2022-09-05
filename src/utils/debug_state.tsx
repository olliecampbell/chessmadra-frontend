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

export interface DebugState {
  debugUi: boolean;
  underConstruction?: boolean;
  quick: (fn: (_: DebugState) => void) => void;
}

type Stack = [DebugState, AppState];

export const getInitialDebugState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([s.debugState, s]));
  };
  const setOnly = <T,>(fn: (stack: DebugState) => T, id?: string): T => {
    return _set((s) => fn(s.debugState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([s.debugState, s]));
  };
  let initialState = {
    ...createQuick<DebugState>(setOnly),
    debugUi: false,
    underConstruction: true,
  } as DebugState;

  return initialState;
};
