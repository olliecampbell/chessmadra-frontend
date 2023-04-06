import { getAppState } from "./app_state";

export const trackEvent = (name: string, props?: Object) => {
  getAppState().trackEvent(name, props);
};
