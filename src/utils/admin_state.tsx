import Cookies from "js-cookie";
import { flatten } from "lodash-es";
import client from "~/utils/client";
import { MoveAnnotation, MoveAnnotationReview } from "~/utils/models";
import { AppState } from "./app_state";
import { createQuick } from "./quick";
import { StateGetter, StateSetter } from "./state_setters_getters";
import { StorageItem } from "./storageItem";

export interface AdminState {
	moveAnnotationReviewQueue: MoveAnnotationReview[] | null;
	fetchMoveAnnotationReviewQueue: () => void;
	acceptMoveAnnotation: (
		epd: string,
		san: string,
		text: string,
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
	moveAnnotationsDashboard?: MoveAnnotationsDashboard;
	fetchMoveAnnotationDashboard: () => void;
	quick: (fn: (_: AdminState) => void) => void;
	spoofedEmail: StorageItem<string | undefined>;
}

type Stack = [AdminState, AppState];
const selector = (s: AppState): Stack => [s.adminState, s];

export interface MoveAnnotationsDashboard {
	needed: AdminMoveAnnotation[];
	completed: AdminMoveAnnotation[];
}

export interface AdminMoveAnnotation {
	createdAt: string;
	epd: string;
	previousEpd: string;
	sanPlus: string;
	annotation?: MoveAnnotation;
	reviewerEmail?: string;
	games: number;
}

export const getInitialAdminState = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_set: StateSetter<AppState, any>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	_get: StateGetter<AppState, any>,
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
	const initialState = {
		...createQuick<AdminState>(setOnly),
		moveAnnotationReviewQueue: null,
		spoofedEmail: new StorageItem("spoofed-email", undefined),
		fetchMoveAnnotationReviewQueue: () =>
			set(([s]) => {
				console.log("about to fetch");
				client
					.get("/api/v1/admin/move-annotation-review-queue")
					.then(({ data }) => {
						set(([s]) => {
							s.moveAnnotationReviewQueue = flatten(
								data.map(
									(m: {
										epd: string;
										san: string;
										annotations: {
											userId: string;
											userEmail: string;
											text: string;
										}[];
									}) => {
										return m.annotations.map((a) => ({
											epd: m.epd,
											san: m.san,
											userId: a.userId,
											userEmail: a.userEmail,
											text: a.text,
										}));
									},
								),
							);
						});
					});
			}),
		spoofUser: (email: string | undefined) => {
			set(([s, gs]) => {
				s.spoofedEmail.value = email;
				if (!email) {
					gs.userState.logout();
				}
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
							s.moveAnnotationReviewQueue!.forEach((r) => {
								// @ts-ignore
								r.annotations.forEach((ann) => {
									if (
										r.epd === epd &&
										r.san === san &&
										(ann.userId === userId ||
											ann.userId === gs.userState.user?.id)
									) {
										ann.text = text;
										// @ts-ignore
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
					.get("/api/v1/admin/move-annotations")
					.then(({ data }: { data: MoveAnnotationsDashboard }) => {
						set(([s]) => {
							s.moveAnnotationsDashboard = data;
						});
					});
			}),
		acceptMoveAnnotation: (epd: string, san: string, text: string) =>
			set(([s]) => {
				return client
					.post("/api/v1/admin/accept-move-annotation", { epd, san, text })
					.then(({ data }) => {});
			}),
		becomeAdmin: (password: string) =>
			set(([s]) => {
				client
					.post("/api/v1/admin/submit-password", { password })
					.then(({ data }) => {
						set(([s, appState]) => {
							appState.userState.user!.isAdmin = true;
						});
					});
			}),
		rejectMoveAnnotations: (epd: string, san: string) =>
			set(([s]) => {
				client
					.post("/api/v1/admin/reject-move-annotations", { epd, san })
					.then(({ data }) => {});
			}),
	} as AdminState;

	return initialState;
};
