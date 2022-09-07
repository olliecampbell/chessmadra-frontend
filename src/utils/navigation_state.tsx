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
import { NavigateFunction } from "react-router-dom";

export interface NavigationState {
  quick: (fn: (_: NavigationState) => void) => void;
  push: (path: string, options?: { removeParams: boolean }) => void;
  _navigate?: NavigateFunction;
  search?: string;
}

type Stack = [NavigationState, AppState];

export const getInitialNavigationState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([s.navigationState, s]));
  };
  const setOnly = <T,>(fn: (stack: NavigationState) => T, id?: string): T => {
    return _set((s) => fn(s.navigationState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([s.navigationState, s]));
  };
  let initialState = {
    ...createQuick<NavigationState>(setOnly),
    navigationUi: false,
    push: (path: string, options) => {
      set(([s]) => {
        if (options?.removeParams) {
          s._navigate(`${path}`);
        } else {
          s._navigate(`${path}${s.search}`);
        }
      });
    },
  } as NavigationState;

  return initialState;
};
