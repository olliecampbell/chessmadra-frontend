import { posthog } from "posthog-js";
import { createStore } from "solid-js/store";
import { isServer } from "solid-js/web";
import { isDevelopment } from "./env";

export const [posthogStore, setPosthogStore] = createStore({
  featuresLoaded: false,
});

type PosthogFeature = "sticky-homepage-cta" | "homepage-header-cta";
const overrides: Record<PosthogFeature, string> = {};
// overrides
if (isDevelopment && !isServer) {
  overrides["homepage-header-cta"] = "2";
}

export const getFeatureLoaded = (feature: PosthogFeature) =>
  posthogStore.featuresLoaded &&
  (overrides[feature] ?? posthog.getFeatureFlag(feature));
