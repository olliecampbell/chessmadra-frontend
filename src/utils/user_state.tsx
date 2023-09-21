import Base64 from "crypto-js/enc-base64";
import sha256 from "crypto-js/sha256";
/* eslint-disable */
import { AuthResponse, User, UserFlag } from "~/utils/models";

import { Browser } from "@capacitor/browser";

import { setUserId } from "@amplitude/analytics-browser";
import { uuid4 } from "@sentry/utils";
import cryptoRandomString from "crypto-random-string";
import Cookies from "js-cookie";
import { noop } from "lodash-es";
import posthog from "posthog-js";
import client from "~/utils/client";
import { trackEvent } from "~/utils/trackEvent";
import { AppState } from "./app_state";
import { JWT_COOKIE_KEY, TEMP_USER_UUID } from "./cookies";
import { isDevelopment, isIos } from "./env";
import {
	FrontendSetting,
	FrontendSettingOption,
	FrontendSettings,
	SETTINGS,
} from "./frontend_settings";
import { LICHESS_CLIENT_ID, LICHESS_REDIRECT_URI } from "./oauth";
import { createQuick } from "./quick";
// solid TODO
import { DEFAULT_ELO_RANGE } from "./repertoire_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { BoardThemeId, PieceSetId } from "./theming";
import { renderThreshold } from "./threshold";
import { identify } from "./user_properties";
import { StorageItem } from "./storageItem";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { AppLauncher } from "@capacitor/app-launcher";

export interface UserState {
	quick: (fn: (_: UserState) => void) => void;
	token: StorageItem<string | undefined>;
	tempUserUuid: StorageItem<string | undefined>;
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
	updateUserRatingSettings: (
		params: Partial<{
			ratingSystem: string;
			ratingRange: string;
			missThreshold: number;
		}>,
	) => Promise<void>;
	updateUserSettings: (_: {
		theme?: BoardThemeId;
		pieceSet?: PieceSetId;
		chesscomUsername?: string | null;
		flags?: UserFlag[];
		frontendSettings?: FrontendSettings;
	}) => void;
	isUpdatingEloRange: boolean;
	pastLandingPage?: boolean;
	isSubscribed: () => boolean;
	getCheckoutLink: (annual: boolean) => Promise<string>;
	flagEnabled: (flag: UserFlag) => boolean;
	getEnabledFlags: () => UserFlag[];
	setFlag(flag: UserFlag, enabled: boolean): void;
	authWithLichess: () => void;
	setChesscomUsername: (username: string | null) => void;
	isConnectedToExternal: () => boolean;
	setLichessToken: (
		token: string | null,
		username: string | null,
	) => Promise<void>;
	loadAuthData: () => Promise<void>;
	getFrontendSetting: (
		settingKey: keyof FrontendSettings,
	) => FrontendSettingOption<unknown>;
	logout: () => void;
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
const DEVELOPMENT_FLAGS: UserFlag[] = [];
const ADMIN_FLAGS: UserFlag[] = [];
const GENERAL_FLAGS: UserFlag[] = [];

export const getInitialUserState = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_set: StateSetter<AppState, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_get: StateGetter<AppState, any>,
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
		tempUserUuid: new StorageItem(TEMP_USER_UUID, undefined),
		token: new StorageItem(JWT_COOKIE_KEY, undefined),
		isUpdatingEloRange: false,
		handleAuthResponse: (response: AuthResponse) => {
			set(([s, appState]) => {
				const { token, user, firstAuthentication } = response;
				if (firstAuthentication) {
					trackEvent("login.first_login");
				}
				s.token.value = token;
				s.tempUserUuid.value = user?.id;
				s.setUser(user);
				s.authStatus = AuthStatus.Authenticated;
				appState.repertoireState.fetchRepertoire(false);
			});
		},
		loadAuthData: () => {
			return set(([s]) => {
				return Promise.all([s.token.load(), s.tempUserUuid.load()]).then(
					([cookieToken, tempUserUuid]) => {
						set(([s]) => {
							console.log("cookieToken", cookieToken, tempUserUuid);
							if (!cookieToken) {
								s.authStatus = AuthStatus.Unauthenticated;
							}
							if (!tempUserUuid) {
								const uuid = uuid4();
								s.tempUserUuid.value = uuid;
							}
						});
					},
				);
			});
		},
		logout: () => {
			set(([s, appState]) => {
				posthog.reset();
				s.token.value = undefined;
				s.tempUserUuid.value = uuid4();
				s.authStatus = AuthStatus.Unauthenticated;
				appState.repertoireState.fetchRepertoire(false);
			});
		},
		setUser: (user: User) => {
			set(([s, appState]) => {
				s.user = user;
				// because could be diff goal
				appState.repertoireState.updateRepertoireStructures();

				if (user.email) {
					setUserId(user.email);
					posthog.identify(user.id, {}, {});
					identify({
						email: user.email,
						subscribed: user.subscribed,
						admin: user.isAdmin,
						rating_range: user.ratingRange,
						rating_system: user.ratingSystem,
						computed_rating: user.eloRange,
						theme: user.theme,
						piece_set: user.pieceSet,
						...(user.missThreshold
							? {
									coverage_target: `${renderThreshold(
										user.missThreshold / 100,
									)}`,
							  }
							: {}),
					});
				}
			});
		},
		getEnabledFlags: () => {
			return get(([s]) => {
				return [
					...new Set([
						...(s.user?.flags ?? []),
						...(isDevelopment ? DEVELOPMENT_FLAGS : []),
						...(s.user?.isAdmin ? ADMIN_FLAGS : []),
						...GENERAL_FLAGS,
					]),
				];
			});
		},
		flagEnabled: (flag: UserFlag) => {
			return get(([s]) => {
				return s.getEnabledFlags().includes(flag);
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
				return `${
					s.user?.ratingRange || DEFAULT_ELO_RANGE.join("-")
				} ${s.user?.ratingSystem || DEFAULT_RATING_SYSTEM}`;
			});
		},
		getFrontendSetting: (
			settingKey: keyof FrontendSettings,
		): FrontendSettingOption<string> => {
			return get(([s]) => {
				const value =
					s.user?.frontendSettings?.[settingKey] ??
					SETTINGS[settingKey].default;
				const option = SETTINGS[settingKey].options.find(
					(option) => option.value === value,
				);
				if (option) {
					return option;
				} else {
					return SETTINGS[settingKey].options[0];
				}
			});
		},
		updateUserSettings: ({
			theme,
			pieceSet,
			flags,
			frontendSettings,
			chesscomUsername,
		}) =>
			set(([s]) => {
				if (pieceSet) {
					s.user!.pieceSet = pieceSet;
				}
				if (theme) {
					s.user!.theme = theme;
				}
				client
					.post("/api/v1/user/settings", {
						theme,
						pieceSet,
						flags,
						chesscomUsername,
						frontendSettings,
					})
					.then(({ data }: { data: User }) => {
						set(([s, appState]) => {
							s.setUser(data);
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
					.finally(noop);
			});
		},
		setTargetDepth: (t: number) => {
			set(([s]) => {
				s.user!.missThreshold = t * 100;
				trackEvent("user.update_coverage_target", {
					target: `1 in ${Math.round(1 / t)} games`,
				});
				s.updateUserRatingSettings({ missThreshold: s.user!.missThreshold });
			});
		},
		setRatingSystem: (system: string) => {
			return set(([s]) => {
				trackEvent("user.update_rating_system", { rating_system: system });
				s.user!.ratingSystem = system;
				return s.updateUserRatingSettings({ ratingSystem: system });
			});
		},
		setRatingRange: (range: string) => {
			return set(([s]) => {
				trackEvent("user.update_rating_range", { rating_range: range });
				s.user!.ratingRange = range;
				return s.updateUserRatingSettings({ ratingRange: range });
			});
		},
		isConnectedToExternal: () => {
			return get(([s]) => {
				return !!(s.user?.lichessUsername || s.user?.chesscomUsername);
			});
		},
		setChesscomUsername: (username) => {
			set(([s]) => {
				return s.updateUserSettings({ chesscomUsername: username });
			});
		},
		setLichessToken: (token, username) => {
			return client
				.post("/api/set_lichess_token", { token, username })
				.then(({ data }: { data: User }) => {
					console.log("Set lichess token and username", username);
					set(([s, appState]) => {
						s.setUser(data);
						appState.repertoireState.fetchLichessMistakes();
					});
				})
				.finally(noop);
		},
		authWithLichess: () => {
			set(([s]) => {
				console.log("authing");
				const codeVerifier = cryptoRandomString({ length: 64, type: "base64" });
				const state = cryptoRandomString({ length: 64, type: "base64" });
				Promise.all([
					Preferences.set({
						key: "lichess.code_verifier",
						value: codeVerifier,
					}),
					Preferences.set({ key: "lichess.state", value: state }),
				]).then(() => {
					console.log("Code verifier is:", codeVerifier);
					const params = new URLSearchParams({
						client_id: LICHESS_CLIENT_ID,
						redirect_uri: LICHESS_REDIRECT_URI,
						code_challenge: Base64.stringify(sha256(codeVerifier))
							.replace(/\+/g, "-")
							.replace(/\//g, "_")
							.replace(/=/g, ""),
						response_type: "code",
						scope: "",
						state,
						code_challenge_method: "S256",
					}).toString();
					const url = `https://lichess.org/oauth?${params}`;
					if (isIos) {
						AppLauncher.openUrl({ url });
						// Browser.open({ url });
						// Browser.addListener("browserPageLoaded", (info: any) => {
						// 	console.log("info");
						// });
					} else {
						window.location.href = url;
					}
				});
			});
		},
		setFlag: (flag: UserFlag, enabled: boolean) => {
			set(([s]) => {
				s.user!.flags = s.user!.flags.includes(flag)
					? s.user!.flags.filter((f) => f !== flag)
					: [...s.user!.flags, flag];
				return s.updateUserSettings({ flags: s.user!.flags });
			});
		},
		user: undefined,
		authStatus: AuthStatus.Initial,
		...createQuick<UserState>(setOnly),
	} as UserState;

	return initialState;
};

export const getRecommendedMissThreshold = (range: string) => {
	if (range === "0-1100") {
		return 1 / 75;
	}
	if (range === "1100-1300") {
		return 1 / 75;
	}
	if (range === "1300-1500") {
		return 1 / 100;
	}
	if (range === "1500-1700") {
		return 1 / 100;
	}
	if (range === "1700-1900") {
		return 1 / 150;
	}
	if (range === "1900-2100") {
		return 1 / 200;
	}
	if (range === "2100-2800") {
		return 1 / 200;
	}
	if (range === "1900-2800") {
		return 1 / 200;
	}
	return 1 / 50;
};

export const DEFAULT_THRESHOLD = 1 / 50;

export const trackModule = (module: string) => {
	identify({ last_module: module });
};
