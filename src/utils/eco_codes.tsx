import { map, last } from "lodash-es";

export const getAppropriateEcoName = (fullName: string): [string, string[]] => {
  if (!fullName) {
    return null;
  }
  const name = fullName.split(":")[0];
  const isFirstTimeSeeing = true;

  const variations = map(fullName.split(":")?.[1]?.split(","), (s) => s.trim());
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
