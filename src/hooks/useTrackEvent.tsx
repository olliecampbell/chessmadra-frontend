import { useAppState, useAppStateInternal } from "app/utils/app_state";

export const useTrack = () => {
  const track = useAppState((s) => s.trackEvent);
  return track;
};

export const trackEvent = (name: string, props?: Object) => {
  useAppStateInternal.getState().trackEvent(name, props);
};
