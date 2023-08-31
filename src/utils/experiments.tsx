import { posthog } from "posthog-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";
import { isDevelopment } from "./env";

export const [posthogStore, setPosthogStore] = createStore({
  featuresLoaded: false,
});

type PosthogFeature =
  | "sticky-homepage-cta"
  | "homepage-header-cta"
  | "homepage-cta";
const overrides: Record<PosthogFeature, string> = {};
// overrides
if (isDevelopment && !isServer) {
  // overrides["homepage-cta"] = "2";
  // overrides["homepage-header-cta"] = "2";
}

export const getFeature = (feature: PosthogFeature): false | string => {
  if (!posthogStore.featuresLoaded) {
    return false;
  }

  const val = overrides[feature] || posthog.getFeatureFlag(feature);
  if (val !== "control") {
    return feature;
  }
  return false;
};
