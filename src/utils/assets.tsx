import { BASE_FRONTEND_URL } from "./base_url";

export const getStatic = (path: string) => {
	return `${BASE_FRONTEND_URL}${path}`;
	// evenually
	// return `${path}?ver=${process.env.FRONTEND_VERSION}`;
};
