import { User } from "app/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { identify, Identify, setUserId } from "@amplitude/analytics-browser";
import { DEFAULT_ELO_RANGE } from "./repertoire_state";
import { formatEloRange } from "./elo_range";
import client from "app/client";
import { Side } from "./repertoire";
import { trackEvent } from "app/hooks/useTrackEvent";

export interface UserState {
  quick: (fn: (_: UserState) => void) => void;
  token?: string;
  user?: User;
  profileModalOpen?: boolean;
  setUser: (user: User) => void;
  setRatingSystem: (system: string) => void;
  setRatingRange: (range: string) => void;
  setTargetDepth: (t: number) => void;
  getUserRatingDescription: () => string;
  getCurrentThreshold: () => number;
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
    getCurrentThreshold: () => {
      return get(([s, appState]) => {
        // let biggestMissIncidence =
        //   (appState.repertoireState.repertoireGrades[side]?.biggestMiss
        //     ?.incidence ?? 1.0) * 100;
        return s.user.missThreshold ?? DEFAULT_THRESHOLD;
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
            missThreshold: s.user.missThreshold,
          })
          .then(({ data }: { data: User }) => {
            set(([s, appState]) => {
              s.setUser(data);
              appState.repertoireState.positionReports = {};
              appState.repertoireState.browsingState.fetchNeededPositionReports();
              appState.repertoireState.fetchRepertoire();

              const identifyObj = new Identify();
              identifyObj.set("rating_range", s.user.ratingRange);
              identifyObj.set("rating_system", s.user.ratingSystem);
              identifyObj.set("computed_rating", s.user.eloRange);
              identifyObj.set("target_depth", s.user.missThreshold);
              identify(identifyObj);
            });
          })
          .finally(() => {
            set(([s, appState]) => {
              s.isUpdatingEloRange = false;
            });
          });
      }),
    setTargetDepth: (t: number) => {
      set(([s]) => {
        s.user.missThreshold = t;
        trackEvent(`user.update_miss_threshold`, { miss_threshold: t });
        s.updateUserRatingSettings();
      });
    },
    setRatingSystem: (system: string) => {
      set(([s]) => {
        trackEvent(`user.update_rating_system`, { rating_system: system });
        s.user.ratingSystem = system;
        s.updateUserRatingSettings();
      });
    },
    setRatingRange: (range: string) => {
      set(([s]) => {
        trackEvent(`user.update_rating_range`, { rating_range: range });
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

export const getRecommendedMissThreshold = (range: string) => {
  if (range == "0-1100") {
    return 4.0;
  }
  if (range == "1100-1300") {
    return 2;
  }
  if (range == "1300-1500") {
    return 2;
  }
  if (range == "1500-1700") {
    return 1;
  }
  if (range == "1700-1900") {
    return 1;
  }
  if (range == "1900-2800") {
    return 0.8;
  }
};

export const DEFAULT_THRESHOLD = 4.0;
