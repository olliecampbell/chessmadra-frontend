import { Capacitor } from "@capacitor/core";
import { isNil } from "lodash-es";
import { isServer } from "solid-js/web";
import { isDevelopment, isNative } from "./env";

let baseApiUrl = undefined;
let baseFrontendUrl = undefined;
if (isDevelopment) {
	baseApiUrl = `${
		isServer ? "http://localhost" : window.location.origin.split(":3000")[0]
	}:8040`;
	if (isNative) {
		baseApiUrl = "http://localhost:8040";
	}
	if (
		Capacitor.getPlatform() === "ios" ||
		Capacitor.getPlatform() === "android"
	) {
		baseFrontendUrl = "http://localhost:3000";
		baseApiUrl = "https://chessbook.ngrok.io";
	}
}

if (typeof window !== "undefined" && isNil(baseFrontendUrl)) {
	baseFrontendUrl = window.location.origin;
}

if (process.env.NODE_ENV === "production" && isNative) {
	baseApiUrl = "https://chessbook.com";
	baseFrontendUrl = "https://chessbook.com";
}

if (import.meta.env.VITE_API_ENV === "production") {
	baseApiUrl = "https://chessbook.com";
}

export const BASE_API_URL = baseApiUrl;
export const BASE_FRONTEND_URL = baseFrontendUrl;
