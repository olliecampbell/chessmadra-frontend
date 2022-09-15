import { User } from "app/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { setUserId } from "@amplitude/analytics-browser";

export interface UserState {
  quick: (fn: (_: UserState) => void) => void;
  token?: string;
  user?: User;
  setUser: (user: User) => void;
  authStatus: AuthStatus;
  tempUserUuid?: string;
}

export enum AuthStatus {
  Authenticated = "Authenticated",
  Unauthenticated = "Unauthenticated",
  Initial = "Initial",
  Authenticating = "Authenticating",
}

type Stack = [UserState, AppState];
const selector = (s: AppState): Stack => [s.userState, s];

export const getInitialUserState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn(selector(s)));
  };
  const setOnly = <T,>(fn: (stack: UserState) => T, id?: string): T => {
    return _set((s) => fn(s.userState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn(selector(s)));
  };
  let initialState = {
    setUser: (user: User) => {
      set(([s]) => {
        s.user = user;
        s.tempUserUuid = user.id;
        if (user.email) {
          setUserId(user.email);
        }
      });
    },
    token: undefined,
    user: undefined,
    authStatus: AuthStatus.Initial,
    ...createQuick<UserState>(setOnly),
  } as UserState;

  return initialState;
};
