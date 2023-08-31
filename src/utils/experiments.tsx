import { posthog } from "posthog-js";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";
import { isDevelopment } from "./env";

export const [posthogFeaturesLoaded, setPosthogFeaturesLoaded] =
  createSignal(false);

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
  if (!posthogFeaturesLoaded()) {
    return false;
  }

  const val = overrides[feature] || posthog.getFeatureFlag(feature);
  if (val !== "control") {
    return feature;
  }
  return false;
};
