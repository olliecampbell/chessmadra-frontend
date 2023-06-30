import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";

export interface DebugState {
  debugUi: boolean;
  underConstruction?: boolean;
  quick: (fn: (_: DebugState) => void) => void;
}

type Stack = [DebugState, AppState];

export const getInitialDebugState = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _set: StateSetter<AppState, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const initialState = {
    ...createQuick<DebugState>(setOnly),
    debugUi: false,
    underConstruction: false,
  } as DebugState;

  return initialState;
};
