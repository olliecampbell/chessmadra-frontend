import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { VisualizationState } from "~/types/VisualizationState";
import { getInitialVisualizationState } from "./visualization_state";

type TrainerTool = "visualization";

export interface TrainersState {
  activeTool: TrainerTool;
  quick: (fn: (_: TrainersState) => void) => void;
  visualizationState: VisualizationState;
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
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
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
    visualizationState: getInitialVisualizationState(_get, _set, false),
    activeTool: "visualization",
  } as TrainersState;

  return initialState;
};
