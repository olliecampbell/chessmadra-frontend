import { isNil } from "lodash-es";
import { AppState } from "./app_state";
import { createQuick } from "./quick";
import { StateGetter, StateSetter } from "./state_setters_getters";

export interface NavigationState {
	quick: (fn: (_: NavigationState) => void) => void;
	push: (path: string, options?: { removeParams: boolean }) => void;
	setNavigate: (n: any) => void;
	_navigate?: () => void;
	_pendingPush?: () => void;
}

type Stack = [NavigationState, AppState];

export const getInitialNavigationState = (
	_set: StateSetter<AppState, any>,
	_get: StateGetter<AppState, any>,
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
	const initialState = {
		...createQuick<NavigationState>(setOnly),
		navigationUi: false,
		setNavigate: (navigate: any) => {
			set(([s]) => {
				s._navigate = navigate;
			});
		},
		push: (path: string, options) => {
			set(([s]) => {
				// console.log(`PUSH - ${path}`);
				let p = `${path}${window.location.search}`;
				if (options?.removeParams || isNil(window.location.search)) {
					p = `${path}`;
				}
				// @ts-ignore
				s._navigate(p);
			});
		},
	} as NavigationState;

	return initialState;
};
