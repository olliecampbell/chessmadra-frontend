import { Capacitor } from "@capacitor/core";
export const isDevelopment = import.meta.env.DEV;
export const isChessmadra =
	import.meta.env.VITE_SITE === "chessmadra" ||
	(!import.meta.env.SSR && window.location.hostname === "chessmadra.com");

export const isNative = Capacitor.getPlatform() !== "web";
export const isIos = Capacitor.getPlatform() === "ios";
export const isAndroid = Capacitor.getPlatform() === "android";
