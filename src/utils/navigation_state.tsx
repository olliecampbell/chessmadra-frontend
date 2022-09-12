import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { NavigateFunction } from "react-router-dom";
import { isNil } from "lodash-es";

export interface NavigationState {
  quick: (fn: (_: NavigationState) => void) => void;
  push: (path: string, options?: { removeParams: boolean }) => void;
  setNavigate: (n: NavigateFunction) => void;
  _navigate?: NavigateFunction;
  _pendingPush?: () => void;
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
        if (s._pendingPush) {
          s._pendingPush();
        }
      });
    },
    push: (path: string, options) => {
      set(([s]) => {
        console.log(`PUSH - ${path}`);
        if (!s._navigate) {
          s._pendingPush = () => {
            set(([s]) => {
              s.push(path, options);
            });
          };
        } else {
          let p = `${path}${window.location.search}`;
          if (options?.removeParams || isNil(window.location.search)) {
            console.log("Removing params");
            p = `${path}`;
          }
          s._navigate(p);
        }
      });
    },
  } as NavigationState;

  return initialState;
};
