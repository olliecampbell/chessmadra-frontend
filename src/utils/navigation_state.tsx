
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
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
