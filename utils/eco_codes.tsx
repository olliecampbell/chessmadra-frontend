import { some, map, last } from "lodash";
import { BrowserState } from "app/utils/repertoire_state";

export const getAppropriateEcoName = (
  fullName: string,
  browserStates?: BrowserState[]
): [string, string[]] => {
  if (!fullName) {
    return null;
  }
  console.log(`Getting getAppropriateEcoName for ${fullName}`);
  let name = fullName.split(":")[0];
  let isFirstTimeSeeing =
    !browserStates ||
    !some(browserStates, (s) => {
      return s.ecoCode?.fullName.includes(`${name}:`);
    });
  console.log({ isFirstTimeSeeing });

  let variations = map(fullName.split(":")?.[1]?.split(","), (s) => s.trim());
  if (isFirstTimeSeeing) {
    return [name, variations];
  } else {
    return [last(variations) ?? name, null];
  }
};
