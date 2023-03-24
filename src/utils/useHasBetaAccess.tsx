import { useAppState } from "./app_state";

export const useHasBetaAccess = () => {
  const betaAccess = useAppState((s) => s.userState.user?.betaAccess);
  return betaAccess;
};
