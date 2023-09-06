import { posthog } from "posthog-js";
import {
  identify as amplitudeIdentify,
  Identify as AmplitudeIdentify,
} from "@amplitude/analytics-browser";

export const identify = (props: Object) => {
  console.log("Identify: ", props);
  const identifyObj = new AmplitudeIdentify();
  Object.entries(props).forEach(([key, value]) => {
    identifyObj.set(key, value);
  });
  amplitudeIdentify(identifyObj);

  posthog.setPersonProperties(props);
};

export const identifyOnce = (props: Object) => {
  console.log("Identify once: ", props);
  const identifyObj = new AmplitudeIdentify();
  Object.entries(props).forEach(([key, value]) => {
    identifyObj.setOnce(key, value);
  });
  amplitudeIdentify(identifyObj);
  posthog.setPersonProperties({}, props);
};
