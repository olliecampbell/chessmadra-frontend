import * as amplitude from "@amplitude/analytics-browser";
import { destructure } from "@solid-primitives/destructure";
import { posthog } from "posthog-js";
import { Accessor } from "solid-js";
import { createStore, produce } from "solid-js/store";
import { AdminState, getInitialAdminState } from "./admin_state";
import { BrowsingState } from "./browsing_state";
import { DebugState, getInitialDebugState } from "./debug_state";
import { NavigationState, getInitialNavigationState } from "./navigation_state";
import { RepertoireState, getInitialRepertoireState } from "./repertoire_state";
import { TrainersState, getInitialTrainersState } from "./trainers_state";
import { UserState, getInitialUserState } from "./user_state";
import { InAppProductId } from "./in_app_purchases";
import { VisualizationState } from "./visualization_state";
import { VisionState } from "./vision_state";

export interface InAppPurchaseState {
	products: Record<InAppProductId, CdvPurchase.Product>;
}

export interface AppState {
	quick: (fn: (_: AppState) => void) => void;
	adminState: AdminState;
	repertoireState: RepertoireState;
	debugState: DebugState;
	navigationState: NavigationState;
	userState: UserState;
	trainersState: TrainersState;
	inAppPurchaseState: InAppPurchaseState;
	trackEvent: (
		name: string,
		props?: any,
		options?: { posthogOnly?: boolean },
	) => void;
}

let pendingState: AppState | null = null;
const set = (fn: (state: AppState) => AppState) => {
	if (pendingState) {
		// @ts-ignore
		return fn(pendingState);
	} else {
		let res = null;
		if (pendingState) {
			// @ts-ignore
			return fn(pendingState);
		} else {
			setAppState(
				produce((state: AppState) => {
					pendingState = state;
					try {
						res = fn(state as AppState);
					} finally {
						pendingState = null;
					}
				}),
			);
			return res;
		}
	}
};
const get = <T,>(s: (_: AppState) => T): T => {
	return s(appState);
};
const initialState = {
	repertoireState: getInitialRepertoireState(set, get),
	trainersState: getInitialTrainersState(set, get),
	inAppPurchaseState: {
		products: {},
	},
	adminState: getInitialAdminState(set, get),
	debugState: getInitialDebugState(set, get),
	navigationState: getInitialNavigationState(set, get),
	userState: getInitialUserState(set, get),
	trackEvent: (
		name: string,
		props?: any,
		options?: { posthogOnly?: boolean },
	) => {
		get((s: AppState) => {
			console.log(
				`[EVENT] %c${name} %c ${Object.entries(props ?? {})
					.map(([k, v]) => `${k}=${v}`)
					.join(" | ")}`,
				"color: salmon; font-weight: bold;",
				"color: hsl(217, 92%, 76%); font-weight: bold;",
			);
			if (!options?.posthogOnly) {
				amplitude.track(name, props);
			}
			posthog.capture(name, props);
		});
	},
	quick: set,
};

// @ts-ignore
const [appState, setAppState] = createStore<AppState>(initialState);

export const useAppStateInternal = <T,>(selector: (state: AppState) => T) => {
	return get((s) => selector(s));
};

export const useStateSlice = <Y, T>(
	selector: (_: Y) => T,
	sliceSelector: (_: AppState) => Y,
) => {
	return useAppStateInternal((s) => selector(sliceSelector(s)));
};

export const useStateSliceDestructure = <Y, T extends any[]>(
	selector: (_: Y) => T,
	sliceSelector: (_: AppState) => Y,
): AccessorArray<T> => {
	const stateSlice = () =>
		useAppStateInternal((s) => selector(sliceSelector(s)));
	return destructure(stateSlice, { memo: true });
};

export const useRepertoireState = <T extends any[]>(
	fn: (_: RepertoireState) => T,
) => {
	return useStateSliceDestructure(fn, (s) => s.repertoireState);
};

export const useTrainersState = <T extends any[]>(
	fn: (_: TrainersState) => T,
) => {
	return useStateSliceDestructure(fn, (s) => s.trainersState);
};

export const useBrowsingState = <T extends any[]>(
	fn: (_: [BrowsingState, RepertoireState]) => T,
) => {
	return useStateSliceDestructure(
		fn,
		(s) =>
			[s.repertoireState.browsingState, s.repertoireState] as [
				BrowsingState,
				RepertoireState,
			],
	);
};

type AccessorArray<T extends any[]> = {
	[K in keyof T]: Accessor<T[K]>;
};

export const useSidebarState = <T extends any[]>(
	f: (s: [BrowsingState, BrowsingState, RepertoireState]) => T,
): AccessorArray<T> => {
	return destructure(
		() =>
			f([
				getAppState().repertoireState.browsingState,
				getAppState().repertoireState.browsingState,
				getAppState().repertoireState,
			]),
		{ memo: true },
	);
};

export const useVisualizationState = <T extends any[]>(
	fn: (_: VisualizationState) => T,
) => {
	return useStateSliceDestructure(
		fn,
		(s) => s.trainersState.visualizationState,
	);
};

export const useVisionState = <T extends any[]>(
	fn: (_: VisionState) => T,
) => {
	return useStateSliceDestructure(
		fn,
		(s) => s.trainersState.visionState,
	);
};

export const useDebugState = <T,>(fn: (_: DebugState) => T) => {
	// @ts-ignore
	return useStateSliceDestructure(fn, (s) => s.debugState);
};

export const useUserState = <T extends any[]>(fn: (_: UserState) => T) => {
	return useStateSliceDestructure(fn, (s) => s.userState);
};

export const useAdminState = <T extends any[],>(fn: (_: AdminState) => T) => {
	return useStateSliceDestructure(fn, (s) => s.adminState);
};

export const useAppState = <T,>(fn: (_: AppState) => T) => {
	// @ts-ignore
	return useStateSliceDestructure(fn, (s) => s);
};

export const getAppState = () => {
	return appState;
};

export const getAdminState = () => {
	return appState.adminState;
};

// @ts-ignore
if (typeof window !== "undefined") {
	// @ts-ignore
	window.getAppState = getAppState;
}

export const quick = (fn: (_: AppState) => any) => {
	getAppState().quick(fn);
};

export const s = () => {
	return appState;
};

export const useMode = () => {
	return () => s().repertoireState.ui.mode;
};
