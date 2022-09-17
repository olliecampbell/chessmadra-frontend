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
