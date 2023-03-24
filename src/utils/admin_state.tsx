import client from "~/utils/client";
import { MoveAnnotation, MoveAnnotationReview } from "~/utils/models";
import { AppState } from "./app_state";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { createQuick } from "./quick";
import { Repertoire } from "./repertoire";
import { StorageItem } from "./storageItem";

export interface AdminState {
  moveAnnotationReviewQueue: MoveAnnotationReview[];
  fetchAudit: () => void;
  fetchMoveAnnotationReviewQueue: () => void;
  acceptMoveAnnotation: (
    epd: string,
    san: string,
    text: string
  ) => Promise<void>;
  spoofUser: (email: string) => void;
  editMoveAnnotation: (_: {
    epd: string;
    san: string;
    userId: string;
    text: string;
  }) => void;
  rejectMoveAnnotations: (epd: string, san: string) => void;
  becomeAdmin: (password: string) => void;
  auditResponse?: AuditResponse;
  moveAnnotationsDashboard?: MoveAnnotationsDashboard;
  fetchMoveAnnotationDashboard: () => void;
  quick: (fn: (_: AdminState) => void) => void;
  spoofedEmail?: StorageItem<string>;
}

type Stack = [AdminState, AppState];
const selector = (s: AppState): Stack => [s.adminState, s];

export interface AuditResponse {
  eloAudits: RepertoireAudit[];
  repertoire: Repertoire;
}

export interface MoveAnnotationsDashboard {
  needed: AdminMoveAnnotation[];
  completed: AdminMoveAnnotation[];
}

export interface AdminMoveAnnotation {
  epd: string;
  previousEpd: string;
  sanPlus: string;
  annotation?: MoveAnnotation;
  reviewerEmail?: string;
  games: number;
}

export interface RepertoireAudit {
  eloRange: string;
  missedLines: AuditMissedLine[];
  excessiveLines: AuditExcessiveLine[];
}

export interface AuditMissedLine {
  lines: string[];
  incidence: number;
  epd: string;
}

export interface AuditExcessiveLine {
  lines: string[];
  incidence: number;
  epd: string;
}

export const getInitialAdminState = (
  _set: StateSetter<AppState, any>,
  _get: StateGetter<AppState, any>
) => {
  const set = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _set((s) => fn(selector(s)));
  };
  const setOnly = <T,>(fn: (stack: AdminState) => T, id?: string): T => {
    return _set((s) => fn(s.adminState));
  };
  const get = <T,>(fn: (stack: Stack) => T, id?: string): T => {
    return _get((s) => fn(selector(s)));
  };
  let initialState = {
    ...createQuick<AdminState>(setOnly),
    moveAnnotationReviewQueue: null,
    spoofedEmail: new StorageItem("spoofed-email", undefined),
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
    spoofUser: (email: string) => {
      set(([s]) => {
        s.spoofedEmail.value = email;
      });
    },
    editMoveAnnotation: ({
      epd,
      san,
      userId,
      text,
    }: {
      epd: string;
      san: string;
      userId: string;
      text: string;
    }) =>
      get(([s, gs]) => {
        client
          .post("/api/v1/admin/edit-move-annotation", {
            text: text,
            epd: epd,
            userId: userId,
            san,
          })
          .then(({ data }: { data: MoveAnnotation }) => {
            set(([s, gs]) => {
              s.moveAnnotationReviewQueue.forEach((r) => {
                r.annotations.forEach((ann) => {
                  if (
                    r.epd === epd &&
                    r.san === san &&
                    (ann.userId === userId ||
                      ann.userId === gs.userState.user?.id)
                  ) {
                    ann.text = text;
                    ann.userId = gs.userState.user?.id;
                  }
                });
              });
            });
          });
      }),
    fetchMoveAnnotationDashboard: () =>
      set(([s]) => {
        client
          .get(`/api/v1/admin/move-annotations`)
          .then(({ data }: { data: MoveAnnotationsDashboard }) => {
            set(([s]) => {
              s.moveAnnotationsDashboard = data;
            });
          });
      }),
    fetchAudit: () =>
      set(([s]) => {
        client
          .get(`/api/v1/audit`)
          .then(({ data }: { data: AuditResponse }) => {
            set(([s]) => {
              s.auditResponse = data;
            });
          });
      }),
    acceptMoveAnnotation: (epd: string, san: string, text: string) =>
      set(([s]) => {
        return client
          .post(`/api/v1/admin/accept-move-annotation`, { epd, san, text })
          .then(({ data }) => {});
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
      }),
  } as AdminState;

  return initialState;
};
