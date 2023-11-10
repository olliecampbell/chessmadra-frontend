import { BASE_FRONTEND_URL } from "./base_url";
import { isAndroid, isDevelopment, isIos } from "./env";

export const LICHESS_CLIENT_ID = "chessbook.com";
export const LICHESS_REDIRECT_URI =
	isDevelopment && isIos
		? "com.chessbook.app:/oauth/lichess"
		: isAndroid
		? "https://chessbook.com/oauth/lichess"
		: `${BASE_FRONTEND_URL}/oauth/lichess`;
