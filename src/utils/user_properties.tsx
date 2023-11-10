import {
	Identify as AmplitudeIdentify,
	identify as amplitudeIdentify,
} from "@amplitude/analytics-browser";
import { posthog } from "posthog-js";

// biome-ignore lint: ignore Object type
export const identify = (props: Object) => {
	console.log("Identify: ", props);
	const identifyObj = new AmplitudeIdentify();
	Object.entries(props).forEach(([key, value]) => {
		identifyObj.set(key, value);
	});
	amplitudeIdentify(identifyObj);

	posthog.setPersonProperties(props);
};

// biome-ignore lint: ignore Object type
export const identifyOnce = (props: Object) => {
	console.log("Identify once: ", props);
	const identifyObj = new AmplitudeIdentify();
	Object.entries(props).forEach(([key, value]) => {
		identifyObj.setOnce(key, value);
	});
	amplitudeIdentify(identifyObj);
	posthog.setPersonProperties({}, props);
};
