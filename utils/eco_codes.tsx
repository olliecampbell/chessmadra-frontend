import { some, map, last } from "lodash";
import { BrowserState } from "app/utils/repertoire_state";

export const getAppropriateEcoName = (
  fullName: string,
  browserStates?: BrowserState[]
): [string, string[]] => {
  if (!fullName) {
    return null;
  }
  let name = fullName.split(":")[0];
  let isFirstTimeSeeing =
    !browserStates ||
    !some(browserStates, (s) => {
      return s.ecoCode?.fullName.includes(`${name}:`);
    });

  let variations = map(fullName.split(":")?.[1]?.split(","), (s) => s.trim());
  if (isFirstTimeSeeing) {
    return [name, variations];
  } else {
    return [last(variations) ?? name, null];
  }
};

export const getNameEcoCodeIdentifier = (fullName: string): string => {
  return getAppropriateEcoName(fullName)[0];
};

export const getVariationEcoCodeIdentifier = (fullName: string): string => {
  return getAppropriateEcoName(fullName)[1]?.[1];
};
