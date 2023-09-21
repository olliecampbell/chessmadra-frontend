import { Capacitor } from "@capacitor/core";
import { isNil } from "lodash-es";

let baseApiUrl = undefined;
let baseFrontendUrl = undefined;
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
	baseApiUrl = "http://localhost:8040";
	if (Capacitor.getPlatform() === "ios") {
		baseFrontendUrl = "http://localhost:3000";
	} else {
		if (typeof window !== "undefined") {
			baseFrontendUrl = window.location.origin;
		}
	}
}

if (typeof window !== "undefined" && isNil(baseFrontendUrl)) {
	baseFrontendUrl = window.location.origin;
}

if (
	process.env.NODE_ENV === "production" &&
	Capacitor.getPlatform() === "ios"
) {
	baseApiUrl = "https://chessbook.com";
	baseFrontendUrl = "https://chessbook.com";
}

export const BASE_API_URL = baseApiUrl;
export const BASE_FRONTEND_URL = baseFrontendUrl;
