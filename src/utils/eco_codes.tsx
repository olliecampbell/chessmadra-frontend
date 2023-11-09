import { first, last, map, findLast } from "lodash-es";
import { EcoCode } from "./models";
import { pgnToLine } from "./repertoire";
import { lineToPositions } from "./chess";
import { useRepertoireState } from "~/utils/app_state";
import { Accessor, createMemo, createSignal } from "solid-js";

export const getAppropriateEcoName = (fullName: string): [string, string[]] => {
	if (!fullName) {
		// @ts-ignore
		return null;
	}
	const name = fullName.split(":")[0];
	const isFirstTimeSeeing = true;

	const variations = map(fullName.split(":")?.[1]?.split(","), (s) => s.trim());
	if (isFirstTimeSeeing) {
		return [name, variations];
	} else {
		// @ts-ignore
		return [last(variations) ?? name, null];
	}
};

export const getNameEcoCodeIdentifier = (fullName: string): string => {
	return getAppropriateEcoName(fullName)[0];
};

export const getVariationEcoCodeIdentifier = (fullName: string): string => {
	return getAppropriateEcoName(fullName)[1]?.[1];
};

export const useLineEcoCode = (
	line: string[],
): Accessor<{ ecoCode: EcoCode; name: string } | null> => {
	const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup]);
	return createMemo(() => {
		const positions = lineToPositions(line);
		const ecoCodePosition = findLast(positions, (p) => !!ecoCodeLookup()[p]);
		if (ecoCodePosition) {
			const ecoCode = ecoCodeLookup()[ecoCodePosition];
			return { ecoCode, name: getAppropriateEcoName(ecoCode.fullName)[0] };
		}
		return null;
	});
};
