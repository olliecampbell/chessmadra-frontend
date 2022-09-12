import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { NavigateFunction } from "react-router-dom";

export interface NavigationState {
  quick: (fn: (_: NavigationState) => void) => void;
  push: (path: string, options?: { removeParams: boolean }) => void;
  setNavigate: (n: NavigateFunction) => void;
  _navigate?: NavigateFunction;
  _pendingPath?: string;
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
    setNavigate: (navigate: NavigateFunction) => {
      set(([s]) => {
        s._navigate = navigate;
        if (s._pendingPath) {
          s._navigate(s._pendingPath);
        }
      });
    },
    push: (path: string, options) => {
      set(([s]) => {
        let p = `${path}`;
        if (!options?.removeParams && s.search) {
          p = `${path}${s.search}`;
        }
        console.log(`PUSH - ${path}`);
        if (!s._navigate) {
          s._pendingPath = p;
        } else {
          s._navigate(p);
        }
      });
    },
  } as NavigationState;

  return initialState;
};
