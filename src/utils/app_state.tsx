import { VisualizationState } from "~/types/VisualizationState";
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
import { every, isObject, keysIn, take, zip } from "lodash-es";
import { Chess } from "@lubert/chess.ts";
import { DebugState, getInitialDebugState } from "./debug_state";
import { getInitialNavigationState, NavigationState } from "./navigation_state";
import { AdminState, getInitialAdminState } from "./admin_state";
import { getInitialUserState, UserState } from "./user_state";
// TODO: solid
import * as amplitude from "@amplitude/analytics-browser";
import { c } from "~/utils/styles";
import { isDevelopment } from "./env";
import {
  BrowsingState,
  SidebarState,
  SidebarStateContext,
} from "./browsing_state";
import { Accessor, useContext } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { destructure } from "@solid-primitives/destructure";

const DEBUG_STATE = true;

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

let pendingState: AppState | null = null;
const set = (fn: (state: AppState) => AppState) => {
  if (pendingState) {
    // @ts-ignore
    return fn(pendingState);
  } else {
    let res = null;
    if (pendingState) {
      // @ts-ignore
      return fn(pendingState);
    } else {
      setAppState(
        produce((state: AppState) => {
          pendingState = state;
          try {
            res = fn(state as AppState);
          } finally {
            pendingState = null;
          }
        })
      );
      return res;
    }
  }
};
const get = <T,>(s: (_: AppState) => T): T => {
  return s(appState);
};
const initialState = {
  // toJSON:
  //   isDevelopment && DEBUG_STATE
  //     ? undefined
  //     : () => {
  //         return get((s: AppState) => {
  //           if (isDevelopment && DEBUG_STATE) {
  //             return JSON.stringify(s);
  //           }
  //           // Redux devtools slows down with big states, undo this for debugging
  //           return {};
  //         });
  //       },
  repertoireState: getInitialRepertoireState(set, get),
  adminState: getInitialAdminState(set, get),
  // visualizationState: getInitialVisualizationState(set, get, false),
  // climbState: getInitialVisualizationState(set, get, true),
  // blunderState: getInitialBlundersState(set, get),
  // blindfoldState: getInitialBlindfoldState(set, get),
  // colorTrainingState: getInitialColorState(set, get),
  // gameSearchState: getInitialGameSearchState(set, get),
  // gameMemorizationState: getInitialGameMemorizationState(set, get),
  debugState: getInitialDebugState(set, get),
  navigationState: getInitialNavigationState(set, get),
  userState: getInitialUserState(set, get),
  trackEvent: (name: string, props?: Object) => {
    get((s: AppState) => {
      console.log(
        `%c${name} %c ${Object.entries(props ?? {})
          .map(([k, v]) => `${k}=${v}`)
          .join(" | ")}`,
        "color: salmon; font-weight: bold;",
        "color: hsl(217, 92%, 76%); font-weight: bold;"
      );
      amplitude.track(name, props);
    });
  },
  quick: set,
};
const [appState, setAppState] = createStore<AppState>(initialState);

export const useAppStateInternal = <T,>(selector: (state: AppState) => T) => {
  return get((s) => selector(s));
};
const logUnequal = (a, b, path, config: EqualityConfig) => {
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
    (take(config?.stackTrace, 5) ?? []).join("\n")
  );
};

const logExpensive = (a, b, path, keys: number, config?: EqualityConfig) => {
  if (isDevelopment) {
    console.log(
      `%c ${path}%c is expensive, ${keys} keys`,
      `padding: 4px; padding-top: 24px; padding-bottom: 12px; background-color: ${c.grays[80]}; color: ${c.purples[55]}; font-weight: 600;`,
      `padding: 12px; padding-top: 24px; padding-left: 6px; background-color: ${c.grays[80]}; color: ${c.grays[20]}; margin-bottom: 8px;`,
      "\n\n\n",
      a,
      "\n\nBut is now:\n\n",
      b,
      config,
      (take(config?.stackTrace, 5) ?? []).join("\n")
    );
  }
};

interface EqualityConfig {
  debug: boolean;
  stackTrace?: any;
  referenceEquality: boolean;
}

const DEFAULT_EQUALITY_CONFIG = {
  debug: false,
  referenceEquality: false,
} as EqualityConfig;

const EXPENSIVE_CUTOFF = 100;

const customEqualityCheck = (a, b, path, config: EqualityConfig) => {
  const debug = config.debug;
  if (config.referenceEquality) {
    const equal = a === b;
    if (!equal && debug) {
      logUnequal(a, b, path, config);
    }
    return equal;
  }
  if (a instanceof Chess && b instanceof Chess) {
    const equal = a.fen() === b.fen();
    if (!equal && debug) {
      logUnequal(a, b, path, config);
    }
    return equal;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      if (config.debug) {
        logUnequal(a, b, path, config);
      }
      return false;
    }
    if (a.length > EXPENSIVE_CUTOFF || b.length > EXPENSIVE_CUTOFF) {
      logExpensive(a, b, path, Math.max(a.length, b.length), config);
    }
    const arrayEqual = every(
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
      if (config.debug) {
        logUnequal(a, b, path, config);
      }
      return false;
    }
    const allKeys = new Set([...keysIn(a), ...keysIn(b)]);
    if (allKeys.size > EXPENSIVE_CUTOFF) {
      logExpensive(a, b, path, allKeys.size, config);
    }
    return every([...allKeys], (k) => {
      let newPath = path;
      const a1 = a[k];
      const b1 = b[k];
      newPath = newPath + `.${k}`;
      return customEqualityCheck(a1, b1, newPath, config);
    });
  }
  const plainEquality = a == b;
  if (!plainEquality && config.debug) {
    logUnequal(a, b, path, config);
  }
  return plainEquality;
};

export function equality(a: any, b: any, config: EqualityConfig): boolean {
  const t = performance.now();
  const eq = customEqualityCheck(a, b, "", config);
  const t2 = performance.now();
  const duration = t2 - t;
  if (duration > 0.5 && false) {
    console.log(
      "slow equality",
      t2 - t,
      (take(config?.stackTrace, 5) ?? []).join("\n")
    );
  }
  return eq;
}

// Hooks for slices
function getStackTrace() {
  let stack;
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
  const config = { ...DEFAULT_EQUALITY_CONFIG, ...(_config ?? {}) };
  config.stackTrace = getStackTrace();
  return useAppStateInternal((s) => selector(sliceSelector(s)));
};

export const useStateSliceDestructure = <Y, T extends any[]>(
  selector: (_: Y) => T,
  sliceSelector: (_: AppState) => Y,
  _config?: Partial<EqualityConfig>
): AccessorArray<T> => {
  const config = { ...DEFAULT_EQUALITY_CONFIG, ...(_config ?? {}) };
  config.stackTrace = getStackTrace();
  const stateSlice = () =>
    useAppStateInternal((s) => selector(sliceSelector(s)));
  return destructure(stateSlice, { memo: true });
};

export const useRepertoireState = <T extends any[]>(
  fn: (_: RepertoireState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(fn, (s) => s.repertoireState, config);
};

export const useBrowsingState = <T extends any[]>(
  fn: (_: [BrowsingState, RepertoireState]) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(
    fn,
    (s) =>
      [s.repertoireState.browsingState, s.repertoireState] as [
        BrowsingState,
        RepertoireState
      ],
    config
  );
};

// type ReactiveSource = [] | any[] | Object;
// type DeepDestructure<T extends ReactiveSource> = {
//   readonly [K in keyof T]-?: T[K] extends ReactiveSource
//     ? T[K] extends AnyFunction
//       ? Accessor<T[K]>
//       : DeepDestructure<T[K]>
//     : Accessor<T[K]>;
// };
type AccessorArray<T extends any[]> = {
  [K in keyof T]: Accessor<T[K]>;
};

export const useSidebarState = <T extends any[]>(
  f: (s: [SidebarState, BrowsingState, RepertoireState]) => T
): AccessorArray<T> => {
  const usePrevious = useContext(SidebarStateContext);
  const sidebarState = () => {
    if (usePrevious) {
      return (
        getAppState().repertoireState.browsingState.previousSidebarState ||
        getAppState().repertoireState.browsingState.sidebarState
      );
    } else {
      return getAppState().repertoireState.browsingState.sidebarState;
    }
  };
  return destructure(
    () =>
      f([
        sidebarState(),
        getAppState().repertoireState.browsingState,
        getAppState().repertoireState,
      ]),
    { memo: true }
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
  return useStateSliceDestructure(fn, (s) => s.gameSearchState, config);
};

export const useDebugState = <T,>(
  fn: (_: DebugState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(fn, (s) => s.debugState, config);
};

export const useUserState = <T,>(
  fn: (_: UserState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(fn, (s) => s.userState, config);
};

export const useAdminState = <T,>(
  fn: (_: AdminState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(fn, (s) => s.adminState, config);
};

export const useAppState = <T,>(
  fn: (_: AppState) => T,
  config?: Partial<EqualityConfig>
) => {
  return useStateSliceDestructure(fn, (s) => s, config);
};

export const getAppState = () => {
  return appState;
};

// @ts-ignore
if (typeof window !== "undefined") {
  // @ts-ignore
  window.getAppState = getAppState;
}

export const quick = (fn: (_: AppState) => any) => {
  getAppState().quick(fn);
};
