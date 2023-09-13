import { StateSetter } from "./state_setters_getters";

export interface QuickUpdate<T> {
	quick: (fn: (s: T) => void) => void;
}

export function createQuick<T>(set: StateSetter<T, void>) {
	return {
		quick: (fn: (_: T) => void) => {
			return set((state: T) => {
				return fn(state);
			});
		},
	};
}
