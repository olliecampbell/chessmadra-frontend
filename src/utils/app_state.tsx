import create from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { VisualizationState } from "app/types/VisualizationState";
import { OpDraft } from "./op_draft";
import { getInitialRepertoireState, RepertoireState } from "./repertoire_state";
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
import {
  clone,
  cloneDeep,
  every,
  isObject,
  keysIn,
  take,
  zip,
} from "lodash-es";
import { Chess } from "@lubert/chess.ts";
import { immerable } from "immer";
import { Animated } from "react-native";
import { DebugState, getInitialDebugState } from "./debug_state";
import { getInitialNavigationState, NavigationState } from "./navigation_state";
import { AdminState, getInitialAdminState } from "./admin_state";
import { getInitialUserState, UserState } from "./user_state";
import * as amplitude from "@amplitude/analytics-browser";
import { c } from "app/styles";
import { isDevelopment } from "./env";
import { Ref, RefObject, useEffect, useRef } from "react";
import { enableMapSet } from "immer";
import { BrowsingState } from "./browsing_state";

enableMapSet();

Chess[immerable] = true;

export interface AppState {
  quick: (fn: (_: AppState) => void) => void;
  adminState: AdminState;
  visualizationState: VisualizationState;
  climbState: VisualizationState;
  repertoireState: RepertoireState;
  blunderState: BlunderRecognitionState;
  blindfoldState: BlindfoldTrainingState;
  colorTrainingState: ColorTrainingState;
  gameSearchState: GameSearchState;
  gameMemorizationState: GameMemorizationState;
  debugState: DebugState;
  navigationState: NavigationState;
  userState: UserState;
  trackEvent: (name: string, props?: Object) => void;
}

let pendingState: OpDraft<AppState> = null;

export const useAppStateInternal = create<AppState>()(
  devtools(
    // @ts-ignore for the set stuff
    immer((_set, _get): AppState => {
      const set = <T,>(fn: (state: AppState) => T) => {
        if (pendingState) {
          // @ts-ignore
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
        // toJSON: () => {
        //   return get((s) => {
        //     // Redux devtools slows down with big states, undo this for debugging
        //     return {};
        //   });
        // },
        repertoireState: getInitialRepertoireState(set, get),
        adminState: getInitialAdminState(set, get),
        visualizationState: getInitialVisualizationState(set, get, false),
        climbState: getInitialVisualizationState(set, get, true),
        blunderState: getInitialBlundersState(set, get),
        blindfoldState: getInitialBlindfoldState(set, get),
        colorTrainingState: getInitialColorState(set, get),
        gameSearchState: getInitialGameSearchState(set, get),
        gameMemorizationState: getInitialGameMemorizationState(set, get),
        debugState: getInitialDebugState(set, get),
        navigationState: getInitialNavigationState(set, get),
        userState: getInitialUserState(set, get),
        trackEvent: (name: string, props?: Object) => {
          get((s) => {
            console.log(`---- ${name} ----`);
            amplitude.track(name);
          });
        },
        ...createQuick<AppState>(set),
      };
      return initialState;
    }),
    { name: "AppState" }
  )
);
const logUnequal = (a, b, path, stackTrace: RefObject<any>) => {
  console.log(
    `%c \n  Re-rendering, %c${path}%c used to be`,
    `padding: 12px; padding-top: 24px; padding-right: 6px; background-color: ${c.grays[80]}; color: ${c.grays[20]}`,
    `padding: 4px; padding-top: 24px; padding-bottom: 12px; background-color: ${c.grays[80]}; color: ${c.purples[55]}; font-weight: 600;`,
    `padding: 12px; padding-top: 24px; padding-left: 6px; background-color: ${c.grays[80]}; color: ${c.grays[20]}; margin-bottom: 8px;`,
    "\n\n\n",
    a,
    "\n\nBut is now:\n\n",
    b,
    "\n\nStack trace:\n\n",
    (take(stackTrace?.current, 5) ?? []).join("\n")
  );
};

const logExpensive = (
  a,
  b,
  path,
  keys: number,
  stackTrace?: RefObject<any>
) => {
  console.log(
    `%c ${path}%c is expensive, ${keys} keys`,
    `padding: 4px; padding-top: 24px; padding-bottom: 12px; background-color: ${c.grays[80]}; color: ${c.purples[55]}; font-weight: 600;`,
    `padding: 12px; padding-top: 24px; padding-left: 6px; background-color: ${c.grays[80]}; color: ${c.grays[20]}; margin-bottom: 8px;`,
    "\n\n\n",
    a,
    "\n\nBut is now:\n\n",
    b,
    stackTrace?.current
  );
};

const customEqualityCheck = (
  a,
  b,
  path,
  debug,
  stackTrace?: RefObject<any>
) => {
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
        logUnequal(a, b, path, stackTrace);
      }
      return false;
    }
    if (a.length > 100 || b.length > 100) {
      logExpensive(a, b, path, Math.max(a.length, b.length), stackTrace);
    }
    let arrayEqual = every(
      zip(a, b).map(([a, b], i) => {
        let newPath = path;
        newPath = newPath + `[${i}]`;
        return customEqualityCheck(a, b, newPath, debug, stackTrace);
      })
    );
    return arrayEqual;
  }
  if (isObject(a) && isObject(b)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      if (debug) {
        logUnequal(a, b, path, stackTrace);
      }
      return false;
    }
    let allKeys = new Set([...keysIn(a), ...keysIn(b)]);
    if (allKeys.size > 100) {
      logExpensive(a, b, path, allKeys.size, stackTrace);
    }
    return every([...allKeys], (k) => {
      let newPath = path;
      let a1 = a[k];
      let b1 = b[k];
      newPath = newPath + `.${k}`;
      return customEqualityCheck(a1, b1, newPath, debug, stackTrace);
    });
  }
  let plainEquality = a == b;
  if (!plainEquality && debug) {
    logUnequal(a, b, path, stackTrace);
  }
  return plainEquality;
};

export function equality(
  a: any,
  b: any,
  debug?: boolean,
  stackTrace?: RefObject<any>
): boolean {
  return customEqualityCheck(a, b, "", debug, stackTrace);
}

// Hooks for slices
function getStackTrace() {
  var stack;
  try {
    throw new Error("");
  } catch (error) {
    stack = error.stack || "";
  }

  stack = stack.split("\n").map(function (line) {
    return line.trim();
  });
  return stack.splice(stack[0] == "Error" ? 2 : 1);
}

export const useRepertoireState = <T,>(
  fn: (_: RepertoireState) => T,
  debug?: boolean
) => {
  let stackTrace = useRef(null);
  if (isDevelopment && stackTrace.current === null) {
    stackTrace.current = getStackTrace();
  }
  return useAppStateInternal(
    (s) => fn(s.repertoireState),
    (a, b) => equality(a, b, debug, stackTrace)
  );
};

export const useBrowsingState = <T,>(
  fn: (_: BrowsingState, _2: RepertoireState) => T,
  debug?: boolean
) => {
  let stackTrace = useRef(null);
  if (isDevelopment && stackTrace.current === null) {
    stackTrace.current = getStackTrace();
  }
  return useAppStateInternal(
    (s) => fn(s.repertoireState.browsingState, s.repertoireState),
    (a, b) => equality(a, b, debug, stackTrace)
  );
};

export const useVisualizationState = <T,>(
  fn: (_: VisualizationState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.visualizationState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useClimbState = <T,>(
  fn: (_: VisualizationState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.climbState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useBlunderRecognitionState = <T,>(
  fn: (_: BlunderRecognitionState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.blunderState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useBlindfoldState = <T,>(
  fn: (_: BlindfoldTrainingState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.blindfoldState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useColorTrainingState = <T,>(
  fn: (_: ColorTrainingState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.colorTrainingState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useGameMemorizationState = <T,>(
  fn: (_: GameMemorizationState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.gameMemorizationState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useGameSearchState = <T,>(
  fn: (_: GameSearchState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.gameSearchState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useDebugState = <T,>(
  fn: (_: DebugState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.debugState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useUserState = <T,>(fn: (_: UserState) => T, user?: boolean) => {
  return useAppStateInternal(
    (s) => fn(s.userState),
    user ? (a, b) => equality(a, b, true) : equality
  );
};

export const useAdminState = <T,>(
  fn: (_: AdminState) => T,
  debug?: boolean
) => {
  return useAppStateInternal(
    (s) => fn(s.adminState),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const useAppState = <T,>(fn: (_: AppState) => T, debug?: boolean) => {
  return useAppStateInternal(
    (s) => fn(s),
    debug ? (a, b) => equality(a, b, true) : equality
  );
};

export const getAppState = () => {
  return useAppStateInternal.getState();
};

export const quick = (fn: (_: AppState) => any) => {
  getAppState().quick(fn);
};
