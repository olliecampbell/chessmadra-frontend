import { SpacedRepetitionStatus } from "./utils/repertoire";

export namespace SpacedRepetition {
	export const isReviewDue = (
		srs: SpacedRepetitionStatus,
		_now?: string,
	): boolean => {
		const now = _now ?? new Date().toISOString();
		if (srs.dueAt && srs.dueAt < now) {
			return true;
		}
		return false;
	};
}
