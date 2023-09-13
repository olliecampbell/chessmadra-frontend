import {
	Identify as AmplitudeIdentify,
	identify as amplitudeIdentify,
} from "@amplitude/analytics-browser";
import { posthog } from "posthog-js";

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
