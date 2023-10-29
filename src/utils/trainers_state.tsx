import { last } from "lodash-es";
import { Component } from "solid-js";
import { VisualizationTraining } from "~/components/VisualizationTraining";
import { View } from "~/types/View";
import { AppState } from "./app_state";
import { createQuick } from "./quick";
import { StateGetter, StateSetter } from "./state_setters_getters";
import {
	VisualizationState,
	getInitialVisualizationState,
} from "./visualization_state";
import { animateSidebar } from "~/components/SidebarContainer";
import { VisionState, getInitialVisionState } from "./vision_state";
import { VisionTraining } from "~/components/VisionTraining";

type TrainerTool = "visualization" | "board-vision";

export interface TrainersState {
	quick: (fn: (_: TrainersState) => void) => void;
	getActiveTool: () => TrainerTool;
	visualizationState: VisualizationState;
	visionState: VisionState;
	viewStack: View[];
	currentView: () => View;
	clearViews: () => void;
	pushView: (
		view: Component,
		opts?: { direction?: "left" | "right"; props?: object; replace?: boolean },
	) => void;
	popView: () => void;
}

export enum AuthStatus {
	Authenticated = "Authenticated",
	Unauthenticated = "Unauthenticated",
	Initial = "Initial",
	Authenticating = "Authenticating",
}

type Stack = [TrainersState, AppState];
const selector = (s: AppState): Stack => [s.trainersState, s];

export const getInitialTrainersState = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_set: StateSetter<AppState, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_get: StateGetter<AppState, any>,
) => {
	const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _set((s) => fn(selector(s)));
	};
	const setOnly = <T,>(fn: (stack: TrainersState) => T, id?: string): T => {
		return _set((s) => fn(s.trainersState));
	};
	const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
		return _get((s) => fn(selector(s)));
	};
	const initialState = {
		...createQuick<TrainersState>(setOnly),
		visualizationState: getInitialVisualizationState(_set, _get, false),
		visionState: getInitialVisionState(_set, _get, false),
		viewStack: [],
		getActiveTool: () => {
			return get(([s]) => {
				for (const view of s.viewStack) {
					if (view.component === VisualizationTraining) {
						return "visualization";
					}
					if (view.component === VisionTraining) {
						return "board-vision";
					}
				}
				return null;
			});
		},
		clearViews: () =>
			set(([s, gs]) => {
				s.viewStack = [];
			}),
		currentView: () =>
			get(([s, gs]) => {
				return last(s.viewStack);
			}),
		pushView: (view, { direction, props, replace } = {}) =>
			set(([s, gs]) => {
				animateSidebar("right");
				if (replace) {
					s.viewStack.pop();
				}
				s.viewStack.push({ component: view, props: props ?? {} });
			}),
		popView: () =>
			set(([s, gs]) => {
				s.viewStack.pop();
				console.log("view stack", s.viewStack);
			}),
	} as TrainersState;

	return initialState;
};
