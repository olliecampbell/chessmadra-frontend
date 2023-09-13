import { isEmpty } from "lodash-es";
import { Side, sideOfLastmove } from "./repertoire";

export const getLichessLink = (line: string[], _side?: Side) => {
	if (isEmpty(line)) {
		// TODO: figure out a way to open up analysis from black side
		return "https://lichess.org/analysis";
	}
	const side = _side ?? sideOfLastmove(line);
	return `https://lichess.org/analysis/pgn/${line.join("_")}?color=${side}`;
};
