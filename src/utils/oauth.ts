import { isServer } from "solid-js/web";
import { BASE_FRONTEND_URL } from "./base_url";
import { isDevelopment, isIos } from "./env";

export const LICHESS_CLIENT_ID = "chessbook.com";
export const LICHESS_REDIRECT_URI =
	isDevelopment && isIos
		? "com.chessbook.app:/oauth/lichess"
		: `${BASE_FRONTEND_URL}/oauth/lichess`;
