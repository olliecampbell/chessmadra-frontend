import { Capacitor } from "@capacitor/core";

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

if (typeof window !== "undefined") {
	baseFrontendUrl = window.location.origin;
}

if (import.meta.env.VITE_API_ENV === "production") {
	baseApiUrl = "https://chessbook.com";
}

export const BASE_API_URL = baseApiUrl;
export const BASE_FRONTEND_URL = baseFrontendUrl;
