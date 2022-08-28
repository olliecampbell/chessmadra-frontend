import { Move, Square } from "@lubert/chess.ts/dist/types";
import client from "app/client";
import {
  LichessGame,
  PlayerTemplate,
  RepertoireTemplate,
  User,
  PositionReport,
  EcoCode,
  PawnStructureDetails,
} from "app/models";
import { RepertoireMiss } from "./repertoire";
import create from "zustand";
import { devtools } from "zustand/middleware";

import { immer } from "zustand/middleware/immer";
import {
  cloneDeep,
  dropRight,
  dropWhile,
  groupBy,
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
  keys,
  findIndex,
  isNil,
  nth,
  zip,
  drop,
  forIn,
  sum,
  sortBy,
  findLast,
} from "lodash";
import {
  BySide,
  getAllRepertoireMoves,
  lineToPgn,
  otherSide,
  PendingLine,
  pgnToLine,
  Repertoire,
  RepertoireGrade,
  RepertoireMove,
  RepertoireSide,
  Side,
  sideOfLastmove,
  SIDES,
} from "./repertoire";
import { StorageItem } from "./storageItem";
import {
  ChessboardState,
  ChessboardDelegate,
  createChessState,
} from "./chessboard_state";
import { Chess } from "@lubert/chess.ts";
import {
  PlaybackSpeed,
  VisualizationState,
} from "app/types/VisualizationState";
import _ from "lodash";
import { WritableDraft } from "immer/dist/internal";
import { failOnTrue } from "./test_settings";
import { genEpd } from "./chess";
import { ChessColor } from "app/types/Chess";
import { formatEloRange } from "./elo_range";
import { getNameEcoCodeIdentifier } from "./eco_codes";
import { OpDraft } from "./op_draft";
import { getInitialRepertoireState, RepertoireState } from "./repertoire_state";
import shallow from "zustand/shallow";
import { getInitialVisualizationState } from "./visualization_state";
import {
  BlunderRecognitionState,
  getInitialBlundersState,
} from "./blunders_state";
import {
  BlindfoldTrainingState,
  getInitialBlindfoldState,
} from "./blindfold_state";
import { createQuick } from "./quick";
import {
  ColorTrainingState,
  getInitialColorState,
} from "./color_training_state";
import {
  GameMemorizationState,
  getInitialGameMemorizationState,
} from "./game_memorization_state";
import {
  GameSearchState,
  getInitialGameSearchState,
} from "./game_search_state";

export interface AppState {
  quick: (fn: (_: AppState) => void) => void;
  visualizationState: VisualizationState;
  climbState: VisualizationState;
  repertoireState: RepertoireState;
  blunderState: BlunderRecognitionState;
  blindfoldState: BlindfoldTrainingState;
  colorTrainingState: ColorTrainingState;
  gameSearchState: GameSearchState;
  gameMemorizationState: GameMemorizationState;
  // authState: AuthState
}

let pendingState: OpDraft<AppState> = null;

export const useAppState = create<AppState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer((_set, _get): AppState => {
      const set = <T,>(fn: (state: AppState) => T, identifier?: string) => {
        console.log(`--- ${identifier} ---`);
        if (pendingState) {
          // debugger;
          // console.log("Using pending state!");
          // @ts-ignore
          // pendingState.bogus = Math.random();
          return fn(pendingState);
        } else {
          let res = null;
          _set((state) => {
            pendingState = state;
            // console.log("Setting pending state!", state);
            // To force re-render when changing just a class or something
            // @ts-ignore
            res = fn(state);
            // console.log("Done w/ function, unsetting pending state");
            pendingState = null;
          });
          return res;
        }
      };
      const get = <T,>(fn: (state: AppState) => T) => {
        if (pendingState) {
          // @ts-ignore
          // pendingState.bogus = Math.random();
          return fn(pendingState);
        } else {
          let s = _get();
          return fn(s);
        }
      };
      let initialState = {
        repertoireState: getInitialRepertoireState(set, get),
        visualizationState: getInitialVisualizationState(set, get, false),
        climbState: getInitialVisualizationState(set, get, true),
        blunderState: getInitialBlundersState(set, get),
        blindfoldState: getInitialBlindfoldState(set, get),
        colorTrainingState: getInitialColorState(set, get),
        gameSearchState: getInitialGameSearchState(set, get),
        gameMemorizationState: getInitialGameMemorizationState(set, get),
        ...createQuick<AppState>(set),
      };
      return initialState;
    }),
    { name: "AppState" }
  )
);

export const useRepertoireState = <T,>(
  fn: (_: RepertoireState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.repertoireState), equality ?? shallow);
};

export const useVisualizationState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.visualizationState), equality ?? shallow);
};

export const useClimbState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.climbState), equality ?? shallow);
};

export const useBlunderRecognitionState = <T,>(
  fn: (_: BlunderRecognitionState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.blunderState), equality ?? shallow);
};

export const useBlindfoldState = <T,>(
  fn: (_: BlindfoldTrainingState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.blindfoldState), equality ?? shallow);
};

export const useColorTrainingState = <T,>(
  fn: (_: ColorTrainingState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.colorTrainingState), equality ?? shallow);
};

export const useGameMemorizationState = <T,>(
  fn: (_: GameMemorizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.gameMemorizationState), equality ?? shallow);
};

export const useGameSearchState = <T,>(
  fn: (_: GameSearchState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.gameSearchState), equality ?? shallow);
};
