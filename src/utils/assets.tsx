import { BASE_FRONTEND_URL } from "./base_url";

export const getStatic = (path: string) => {
	if (BASE_FRONTEND_URL) {
		return `${BASE_FRONTEND_URL}${path}`;
	} else {
		return path;
	}
	// evenually
	// return `${path}?ver=${process.env.FRONTEND_VERSION}`;
};
