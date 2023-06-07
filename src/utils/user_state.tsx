/* eslint-disable */
import { AuthResponse, User } from "~/utils/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
// solid TODO
import { identify, Identify, setUserId } from "@amplitude/analytics-browser";
import { DEFAULT_ELO_RANGE } from "./repertoire_state";
import client from "~/utils/client";
import { BoardThemeId, PieceSetId } from "./theming";
import { trackEvent } from "~/utils/trackEvent";

export interface UserState {
  quick: (fn: (_: UserState) => void) => void;
  token?: string;
  user?: User;
  profileModalOpen?: boolean;
  setUser: (user: User) => void;
  handleAuthResponse: (response: AuthResponse) => void;
  setRatingSystem: (system: string) => Promise<void>;
  setRatingRange: (range: string) => Promise<void>;
  setTargetDepth: (t: number) => void;
  getUserRatingDescription: () => string;
  getCurrentThreshold: () => number;
  authStatus: AuthStatus;
  tempUserUuid?: string;
  updateUserRatingSettings: (
    params: Partial<{
      ratingSystem: string;
      ratingRange: string;
      missThreshold: number;
    }>
  ) => Promise<void>;
  updateUserSettings: (_: {
    theme?: BoardThemeId;
    pieceSet?: PieceSetId;
  }) => void;
  isUpdatingEloRange: boolean;
  pastLandingPage?: boolean;
  isSubscribed: () => boolean;
  getCheckoutLink: (annual: boolean) => Promise<string>;
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
  const initialState = {
    isUpdatingEloRange: false,
    handleAuthResponse: (response: AuthResponse) => {
      set(([s, appState]) => {
        const { token, user, firstAuthentication } = response;
        if (firstAuthentication) {
          trackEvent("login.first_login");
        }
        s.token = token;
        s.setUser(user);
        s.authStatus = AuthStatus.Authenticated;
        appState.repertoireState.fetchRepertoire(false);
      });
    },
    setUser: (user: User) => {
      set(([s, appState]) => {
        s.user = user;
        s.tempUserUuid = user.id;
        // because could be diff goal
        appState.repertoireState.updateRepertoireStructures();

        if (user.email) {
          setUserId(user.email);
        }
      });
    },
    getCurrentThreshold: () => {
      return get(([s, appState]) => {
        return (s.user?.missThreshold ?? DEFAULT_THRESHOLD * 100) / 100;
      });
    },
    isSubscribed: () => {
      return get(([s]) => {
        return s.user?.subscribed ?? false;
      });
    },
    getUserRatingDescription: () => {
      return get(([s]) => {
        return `${s.user?.ratingRange || DEFAULT_ELO_RANGE.join("-")} ${
          s.user?.ratingSystem || DEFAULT_RATING_SYSTEM
        }`;
      });
    },
    updateUserSettings: ({ theme, pieceSet }) =>
      set(([s]) => {
        if (pieceSet) {
          s.user.pieceSet = pieceSet;
        }
        if (theme) {
          s.user.theme = theme;
        }
        client
          .post("/api/v1/user/settings", {
            theme,
            pieceSet,
          })
          .then(({ data }: { data: User }) => {
            set(([s, appState]) => {
              s.setUser(data);
              const identifyObj = new Identify();
              identifyObj.set("theme", s.user.theme);
              identifyObj.set("piece_set", s.user.pieceSet);
              identify(identifyObj);
            });
          })
          .finally(() => {
            // set(([s, appState]) => {
            // });
          });
      }),
    updateUserRatingSettings: (params) =>
      set(([s]) => {
        s.isUpdatingEloRange = true;
        return client
          .post("/api/v1/user/elo_range", params)
          .then(({ data }: { data: User }) => {
            set(([s, appState]) => {
              s.setUser(data);
              appState.repertoireState.positionReports = {
                white: {},
                black: {},
              };
              appState.repertoireState.browsingState.fetchNeededPositionReports();
              appState.repertoireState.fetchRepertoire();

              const identifyObj = new Identify();
              identifyObj.set("rating_range", s.user.ratingRange);
              identifyObj.set("rating_system", s.user.ratingSystem);
              identifyObj.set("computed_rating", s.user.eloRange);
              identifyObj.set(
                "coverage_target",
                `1 in ${Math.round(1 / s.user.missThreshold)} games`
              );
              identify(identifyObj);
            });
          })
          .finally(() => {
            set(([s, appState]) => {
              s.isUpdatingEloRange = false;
            });
          });
      }),
    getCheckoutLink: (annual: boolean) => {
      return get(([s]) => {
        return client
          .post("/api/stripe/create-checkout-session", {
            annual,
          })
          .then(({ data }: { data: { url: string } }) => {
            return data.url;
          })
          .finally(() => {});
      });
    },
    setTargetDepth: (t: number) => {
      set(([s]) => {
        s.user.missThreshold = t * 100;
        trackEvent(`user.update_coverage_target`, {
          target: `1 in ${Math.round(1 / t)} games`,
        });
        s.updateUserRatingSettings({ missThreshold: s.user.missThreshold });
      });
    },
    setRatingSystem: (system: string) => {
      set(([s]) => {
        trackEvent(`user.update_rating_system`, { rating_system: system });
        s.user.ratingSystem = system;
        return s.updateUserRatingSettings({ ratingSystem: system });
      });
    },
    setRatingRange: (range: string) => {
      set(([s]) => {
        trackEvent(`user.update_rating_range`, { rating_range: range });
        s.user.ratingRange = range;
        return s.updateUserRatingSettings({ ratingRange: range });
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
    return 1 / 75;
  }
  if (range == "1100-1300") {
    return 1 / 75;
  }
  if (range == "1300-1500") {
    return 1 / 100;
  }
  if (range == "1500-1700") {
    return 1 / 100;
  }
  if (range == "1700-1900") {
    return 1 / 150;
  }
  if (range == "1900-2100") {
    return 1 / 200;
  }
  if (range == "2100-2800") {
    return 1 / 200;
  }
  if (range == "1900-2800") {
    return 1 / 200;
  }
  return 1 / 50;
};

export const DEFAULT_THRESHOLD = 1 / 50;
export const trackModule = (module: string) => {
  const identifyObj = new Identify();
  identifyObj.set("last_module", module);
  identify(identifyObj);
};
