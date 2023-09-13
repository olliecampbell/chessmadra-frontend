import { last, map } from "lodash-es";

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
