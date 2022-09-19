import { User } from "app/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { setUserId } from "@amplitude/analytics-browser";
import { DEFAULT_ELO_RANGE } from "./repertoire_state";
import { formatEloRange } from "./elo_range";
import client from "app/client";

export interface UserState {
  quick: (fn: (_: UserState) => void) => void;
  token?: string;
  user?: User;
  setUser: (user: User) => void;
  setRatingSystem: (system: string) => void;
  setRatingRange: (range: string) => void;
  getUserRatingDescription: () => string;
  authStatus: AuthStatus;
  tempUserUuid?: string;
  updateUserRatingSettings: () => void;
  isUpdatingEloRange: boolean;
}

export enum AuthStatus {
  Authenticated = "Authenticated",
  Unauthenticated = "Unauthenticated",
  Initial = "Initial",
  Authenticating = "Authenticating",
}

type Stack = [UserState, AppState];
const selector = (s: AppState): Stack => [s.userState, s];
const DEFAULT_RATING_SYSTEM = "Lichess";

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
    isUpdatingEloRange: false,
    setUser: (user: User) => {
      set(([s]) => {
        s.user = user;
        s.tempUserUuid = user.id;
        if (user.email) {
          setUserId(user.email);
        }
      });
    },
    getUserRatingDescription: () => {
      return get(([s]) => {
        return `${s.user?.ratingRange || DEFAULT_ELO_RANGE.join("-")} ${
          s.user?.ratingSystem || DEFAULT_RATING_SYSTEM
        }`;
      });
    },
    updateUserRatingSettings: () =>
      set(([s]) => {
        s.isUpdatingEloRange = true;
        client
          .post("/api/v1/user/elo_range", {
            ratingSystem: s.user.ratingSystem,
            ratingRange: s.user.ratingRange,
          })
          .then(({ data }: { data: any }) => {
            set(([s, appState]) => {
              appState.repertoireState.positionReports = {};
              appState.repertoireState.fetchNeededPositionReports();
              appState.repertoireState.fetchRepertoire();
            });
          })
          .finally(() => {
            set(([s, appState]) => {
              s.isUpdatingEloRange = false;
            });
          });
      }),
    setRatingSystem: (system: string) => {
      set(([s]) => {
        console.log("Setting rating system to ", system);
        s.user.ratingSystem = system;
        s.updateUserRatingSettings();
      });
    },
    setRatingRange: (range: string) => {
      set(([s]) => {
        s.user.ratingRange = range;
        s.updateUserRatingSettings();
      });
    },
    token: undefined,
    user: undefined,
    authStatus: AuthStatus.Initial,
    ...createQuick<UserState>(setOnly),
  } as UserState;

  return initialState;
};
