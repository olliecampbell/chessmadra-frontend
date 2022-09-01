import create from "zustand";
import { devtools } from "zustand/middleware";

import { immer } from "zustand/middleware/immer";
import { VisualizationState } from "app/types/VisualizationState";
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
import { every, isEqualWith, isObject, map, zip } from "lodash";
import { Chess } from "@lubert/chess.ts";
import { immerable } from "immer";

Chess[immerable] = true;

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

function isRevokedProxy(value) {
  try {
    new Proxy(value, value);
    return false;
  } catch (err) {
    return Object(value) === value;
  }
}

export const useAppState = create<AppState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer((_set, _get): AppState => {
      const set = <T,>(fn: (state: AppState) => T) => {
        if (pendingState) {
          if (isRevokedProxy(pendingState)) {
            console.log("Somehow this is revoked, the pending state we have?");
          }
          // debugger;
          // console.log("Using pending state!");
          // @ts-ignore
          // pendingState.bogus = Math.random();
          return fn(pendingState);
        } else {
          let res = null;
          _set((state) => {
            pendingState = state;
            if (isRevokedProxy(state)) {
              console.log(
                "The state directly from zustand is a revoked proxy???"
              );
            }
            res = fn(state as AppState);
            pendingState = null;
          });
          return res;
        }
      };
      const get = <T,>(fn: (state: AppState) => T) => {
        if (pendingState) {
          return fn(pendingState as AppState);
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

const customEqualityCheck = (a, b) => {
  if (a instanceof Chess && b instanceof Chess) {
    return a.fen() === b.fen();
  }
  return undefined;
};

export function equality(a: any[], b: any[]): boolean {
  return isEqualWith(a, b, customEqualityCheck);
}

export const useRepertoireState = <T,>(
  fn: (_: RepertoireState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.repertoireState), equality);
};

export const useVisualizationState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.visualizationState), equality);
};

export const useClimbState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.climbState), equality);
};

export const useBlunderRecognitionState = <T,>(
  fn: (_: BlunderRecognitionState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.blunderState), equality);
};

export const useBlindfoldState = <T,>(
  fn: (_: BlindfoldTrainingState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.blindfoldState), equality);
};

export const useColorTrainingState = <T,>(
  fn: (_: ColorTrainingState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.colorTrainingState), equality);
};

export const useGameMemorizationState = <T,>(
  fn: (_: GameMemorizationState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.gameMemorizationState), equality);
};

export const useGameSearchState = <T,>(
  fn: (_: GameSearchState) => T,
  equality?: any
) => {
  return useAppState((s) => fn(s.gameSearchState), equality);
};
