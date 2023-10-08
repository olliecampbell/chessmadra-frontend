import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { camelCase } from "camel-case";
import { getAppState,  } from "./app_state";
import { BASE_API_URL } from "./base_url";

const EPD_REGEX = /.*\/.*\/.*\/.*\/.*\/.*\/.*\/.*/;

const client = applyCaseMiddleware(
	axios.create({
		baseURL: BASE_API_URL,
	}),
	{
		preservedKeys: (input) => {
			return /^\d/.test(input);
		},
		caseFunctions: {
			camel: (s) => {
				if (/^\d/.test(s)) {
					return s;
				}
				if (s.startsWith("GAME_ID_")) {
					return s.replace("GAME_ID_", "");
				}
				if (s.startsWith("EPD_")) {
					return s.replace("EPD_", "");
				}
				if (EPD_REGEX.test(s)) {
					return s;
				}
				return camelCase(s);
			},
		},
	},
);

client.interceptors.request.use(function (config) {
	// console.log({ url: config.url });
	if (config.url?.includes("lichess.org") && !config.url?.includes("oauth")) {
		return config;
	}
	const { token, tempUserUuid } = getAppState().userState;
	const { spoofedEmail } = getAppState().adminState;
	const spoofKey = import.meta.env.VITE_SPOOF_KEY;
  // @ts-ignore
  const headers = config.headers as any;
	if (spoofedEmail.value) {
		headers["spoof-user-email"] = spoofedEmail.value;
		headers["spoof-key"] = spoofKey;
	}
	if (token.value) {
		headers.Authorization = token.value;
	} else if (tempUserUuid.value) {
		headers["temp-user-uuid"] = tempUserUuid.value;
	}
	return config;
});

client.interceptors.response.use(
	function (response) {
		return response;
	},
	function (error) {
		console.log({ error });
		if (error?.response?.status === 401) {
			// quick((s) => {
			// 	s.userState.token = undefined;
			// 	s.userState.logout();
			// 	window.location.href = `${window.location.origin}/login`;
			// 	// window.location = "/login";
			// });
		}
		return Promise.reject(error);
	},
);

export default client;
