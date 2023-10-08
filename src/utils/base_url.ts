import { Capacitor } from "@capacitor/core";
import { isNil } from "lodash-es";
import { isServer } from "solid-js/web";

let baseApiUrl = undefined;
let baseFrontendUrl = undefined;
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
	baseApiUrl = `${
		isServer ? "http://localhost" : window.location.origin.split(":3000")[0]
	}:8040`;
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

if (import.meta.env.VITE_API_ENV === "production") {
	baseApiUrl = "https://chessbook.com";
}

export const BASE_API_URL = baseApiUrl;
export const BASE_FRONTEND_URL = baseFrontendUrl;
