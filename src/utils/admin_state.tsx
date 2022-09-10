
import client from "app/client";
import {
  MoveAnnotationReview,
} from "app/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";

export interface AdminState {
  moveAnnotationReviewQueue: MoveAnnotationReview[];
  fetchMoveAnnotationReviewQueue: () => void;
  acceptMoveAnnotation: (epd: string, san: string, userId: string) => void;
  rejectMoveAnnotations: (epd: string, san: string) => void;
  becomeAdmin: (password: string) => void;
  quick: (fn: (_: AdminState) => void) => void;
}

type Stack = [AdminState, AppState];

export const getInitialAdminState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn([s.adminState, s]));
  };
  const setOnly = <T,>(fn: (stack: AdminState) => T, id?: string): T => {
    return _set((s) => fn(s.adminState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn([s.adminState, s]));
  };
  let initialState = {
    ...createQuick<AdminState>(setOnly),
    moveAnnotationReviewQueue: null,
    fetchMoveAnnotationReviewQueue: () =>
      set(([s]) => {
        client
          .get(`/api/v1/admin/move-annotation-review-queue`)
          .then(({ data }) => {
            set(([s]) => {
              s.moveAnnotationReviewQueue = data;
            });
          });
      }),
    acceptMoveAnnotation: (epd: string, san: string, userId: string) =>
      set(([s]) => {
        client
          .post(`/api/v1/admin/accept-move-annotation`, { epd, san, userId })
          .then(({ data }) => {});
        s.moveAnnotationReviewQueue.shift();
      }),
    becomeAdmin: (password: string) =>
      set(([s]) => {
        client
          .post(`/api/v1/admin/submit-password`, { password })
          .then(({ data }) => {
            set(([s, appState]) => {
              appState.userState.user.isAdmin = true;
            });
          });
      }),
    rejectMoveAnnotations: (epd: string, san: string) =>
      set(([s]) => {
        client
          .post(`/api/v1/admin/reject-move-annotations`, { epd, san })
          .then(({ data }) => {});
        s.moveAnnotationReviewQueue.shift();
      }),
  } as AdminState;

  return initialState;
};
