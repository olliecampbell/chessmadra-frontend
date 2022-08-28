import { AppStore } from "app/store";

export const useHasBetaAccess = () => {
  const betaAccess = AppStore.useState((s) => s.auth?.user?.betaAccess);
  return betaAccess;
};
