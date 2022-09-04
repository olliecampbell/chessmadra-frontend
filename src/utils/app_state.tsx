import create from "zustand";
import { devtools } from "zustand/middleware";

import { NavigateFunction } from "react-router-dom";
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
import { every, isEqualWith, isObject, keysIn, map, zip } from "lodash-es";
import { Chess } from "@lubert/chess.ts";
import { immerable } from "immer";
import { Animated } from "react-native";

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
  navigate?: NavigateFunction;
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

const useAppStateInternal = create<AppState>()(
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
            try {
              res = fn(state as AppState);
            } finally {
              pendingState = null;
            }
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
const logUnequal = (a, b, path) => {
  console.log(`This wasn't equal! Path is ${path}`, a, b);
};

const customEqualityCheck = (a, b, path, debug) => {
  // if (debug) {
  //   console.log("What about this path?", path);
  // }
  // if (a === b) {
  //   if (debug) {
  //     console.log("Reference equality checks out");
  //   }
  //   return true;
  // }
  if (a instanceof Chess && b instanceof Chess) {
    return a.fen() === b.fen();
  }
  if (a instanceof Animated.Value || b instanceof Animated.Value) {
    return a === b;
  }
  if (a instanceof Animated.ValueXY || b instanceof Animated.ValueXY) {
    return a === b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      if (debug) {
        logUnequal(a, b, path);
      }
      return false;
    }
    let arrayEqual = every(
      zip(a, b).map(([a, b], i) => {
        let newPath = path;
        if (debug) {
          newPath = newPath + `[${i}]`;
        }
        return customEqualityCheck(a, b, newPath, debug);
      })
    );
    return arrayEqual;
  }
  if (isObject(a) && isObject(b)) {
    let allKeys = new Set([...keysIn(a), ...keysIn(b)]);
    // console.log({ allKeys: allKeys.keys() });
    return every([...allKeys], (k) => {
      let newPath = path;
      let a1 = a[k];
      let b1 = b[k];
      if (debug) {
        newPath = newPath + `.${k}`;
      }
      // console.log(`Recursing w/ key ${k}`);
      return customEqualityCheck(a1, b1, newPath, debug);
    });
  }
  let plainEquality = a == b;
  if (!plainEquality && debug) {
    logUnequal(a, b, path);
  }
  return plainEquality;
};

export function equality(a: any, b: any, debug?: boolean): boolean {
  return customEqualityCheck(a, b, "", debug);
  // let isEqual = isEqualWith(a, b, customEqualityCheck);
  // if (debug) {
  //   console.log("Not equal!", a, b);
  // }
  // return isEqual;
}

export const useRepertoireState = <T,>(
  fn: (_: RepertoireState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.repertoireState),
    (a, b) => equality(a, b, debug)
  );
};

export const useVisualizationState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.visualizationState), equality);
};

export const useClimbState = <T,>(
  fn: (_: VisualizationState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.climbState), equality);
};

export const useBlunderRecognitionState = <T,>(
  fn: (_: BlunderRecognitionState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.blunderState), equality);
};

export const useBlindfoldState = <T,>(
  fn: (_: BlindfoldTrainingState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.blindfoldState), equality);
};

export const useColorTrainingState = <T,>(
  fn: (_: ColorTrainingState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.colorTrainingState), equality);
};

export const useGameMemorizationState = <T,>(
  fn: (_: GameMemorizationState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.gameMemorizationState), equality);
};

export const useGameSearchState = <T,>(
  fn: (_: GameSearchState) => T,
  equality?: any
) => {
  return useAppStateInternal((s) => fn(s.gameSearchState), equality);
};

export const useAppState = <T,>(fn: (_: AppState) => T, equality?: any) => {
  return useAppStateInternal((s) => fn(s), equality);
};
