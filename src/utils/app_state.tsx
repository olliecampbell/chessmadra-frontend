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
        toJSON: () => {
          return get((s) => {
            // Redux devtools slows down with big states, undo this for debugging
            return {};
          });
        },
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
            if (props) {
              console.log({ props });
            }
            amplitude.track(name, props);
          });
        },
        ...createQuick<AppState>(set),
      };
      return initialState;
    }),
    { name: "AppState" }
  )
);
const logUnequal = (a, b, path, config: RefObject<EqualityConfig>) => {
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
    (take(config.current?.stackTrace, 5) ?? []).join("\n")
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

interface EqualityConfig {
  debug: boolean;
  stackTrace?: any;
  referenceEquality: boolean;
}

let DEFAULT_EQUALITY_CONFIG = {
  debug: false,
  referenceEquality: false,
} as EqualityConfig;

const customEqualityCheck = (a, b, path, config: RefObject<EqualityConfig>) => {
  if (config.current.referenceEquality) {
    return a === b;
  }
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
      if (config.current.debug) {
        logUnequal(a, b, path, config);
      }
      return false;
    }
    if (a.length > 100 || b.length > 100) {
      logExpensive(a, b, path, Math.max(a.length, b.length), config);
    }
    let arrayEqual = every(
      zip(a, b).map(([a, b], i) => {
        let newPath = path;
        newPath = newPath + `[${i}]`;
        return customEqualityCheck(a, b, newPath, config);
      })
    );
    return arrayEqual;
  }
  if (isObject(a) && isObject(b)) {
    if (Object.keys(a).length !== Object.keys(b).length) {
      if (config.current.debug) {
        logUnequal(a, b, path, config);
      }
      return false;
    }
    let allKeys = new Set([...keysIn(a), ...keysIn(b)]);
    if (allKeys.size > 100) {
      logExpensive(a, b, path, allKeys.size, config);
    }
    return every([...allKeys], (k) => {
      let newPath = path;
      let a1 = a[k];
      let b1 = b[k];
      newPath = newPath + `.${k}`;
      return customEqualityCheck(a1, b1, newPath, config);
    });
  }
  let plainEquality = a == b;
  if (!plainEquality && config.current.debug) {
    logUnequal(a, b, path, config);
  }
  return plainEquality;
};

export function equality(
  a: any,
  b: any,
  config: RefObject<EqualityConfig>
): boolean {
  return customEqualityCheck(a, b, "", config);
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

export const useStateSlice = <Y, T>(
  selector: (_: Y) => T,
  sliceSelector: (_: AppState) => Y,
  _config?: Partial<EqualityConfig>
) => {
  let config = useRef({ ...DEFAULT_EQUALITY_CONFIG, ...(_config ?? {}) });
  if (isDevelopment && config.current.stackTrace === null) {
    config.current.stackTrace = getStackTrace();
  }
  return useAppStateInternal(
    (s) => selector(sliceSelector(s)),
    (a, b) => equality(a, b, config)
  );
};

export const useRepertoireState = <T,>(
  fn: (_: RepertoireState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.repertoireState, config);
};

export const useBrowsingState = <T,>(
  fn: (_: [BrowsingState, RepertoireState]) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(
    fn,
    (s) => [s.repertoireState.browsingState, s.repertoireState],
    config
  );
};

export const useVisualizationState = <T,>(
  fn: (_: VisualizationState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.visualizationState, config);
};

export const useClimbState = <T,>(
  fn: (_: VisualizationState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.climbState, config);
};

export const useBlunderRecognitionState = <T,>(
  fn: (_: BlunderRecognitionState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.blunderState, config);
};

export const useBlindfoldState = <T,>(
  fn: (_: BlindfoldTrainingState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.blindfoldState, config);
};

export const useColorTrainingState = <T,>(
  fn: (_: ColorTrainingState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.colorTrainingState, config);
};

export const useGameMemorizationState = <T,>(
  fn: (_: GameMemorizationState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.gameMemorizationState, config);
};

export const useGameSearchState = <T,>(
  fn: (_: GameSearchState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.gameSearchState, config);
};

export const useDebugState = <T,>(
  fn: (_: DebugState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.debugState, config);
};

export const useUserState = <T,>(
  fn: (_: UserState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.userState, config);
};

export const useAdminState = <T,>(
  fn: (_: AdminState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s.adminState, config);
};

export const useAppState = <T,>(
  fn: (_: AppState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSlice(fn, (s) => s, config);
};

export const getAppState = () => {
  return useAppStateInternal.getState();
};

export const quick = (fn: (_: AppState) => any) => {
  getAppState().quick(fn);
};
