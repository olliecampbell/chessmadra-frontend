import { posthog } from "posthog-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";
import { isDevelopment } from "./env";

export const [posthogStore, setPosthogStore] = createStore({
  featuresLoaded: false,
});
type PosthogFeature = "sticky-homepage-cta";

export const getFeatureLoaded = (feature: PosthogFeature) =>
  posthogStore.featuresLoaded && posthog.getFeatureFlag(feature);

// overrides
if (isDevelopment && !isServer) {
  // posthog.featureFlags.override({ "sticky-homepage-cta": "enabled" });
}
