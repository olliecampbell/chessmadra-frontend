import { SpacedRepetitionStatus } from "./utils/repertoire";

export namespace SpacedRepetition {
	export const isReviewDue = (
		srs: SpacedRepetitionStatus,
		_now?: string,
	): boolean => {
		const now = _now ?? new Date().toISOString();
		// dueAt is set and it's due, or dueAt is not set, meaning never reviewed
		if ((srs?.dueAt && srs.dueAt < now) || (srs && !srs.dueAt)) {
			return true;
		}
		return false;
	};
}
