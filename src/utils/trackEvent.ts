import { getAppState } from "./app_state";

export const trackEvent = (name: string, props?: object) => {
  getAppState().trackEvent(name, props);
};
