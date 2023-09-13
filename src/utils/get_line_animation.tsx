import { drop, zip } from "lodash-es";

export const getLineAnimation = (
	currentLine: string[],
	nextLine: string[],
): { reset: boolean; animateLine: string[] } => {
	let subsetOfNextLine = true;
	zip(currentLine, nextLine).forEach(([c, n]) => {
		if (!c) {
			return;
		}
		if (c !== n) {
			subsetOfNextLine = false;
		}
	});
	if (subsetOfNextLine) {
		return {
			reset: false,
			animateLine: drop(nextLine, currentLine.length),
		};
	}
	return {
		reset: true,
		animateLine: nextLine,
	};
};
