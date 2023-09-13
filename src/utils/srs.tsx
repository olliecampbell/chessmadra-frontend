import { RepertoireMove } from "./repertoire";

export const isMoveDifficult = (m: RepertoireMove) => {
	return m.srs?.difficulty ? m.srs.difficulty > 0.5 : false;
};
