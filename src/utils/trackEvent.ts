import { getAppState } from "./app_state";

export const trackEvent = (
  name: string,
  props?: object,
  options?: { posthogOnly?: boolean },
) => {
  getAppState().trackEvent(name, props, options);
};
