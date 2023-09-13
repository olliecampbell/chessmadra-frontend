export const logProxy = (p: object) => {
	if (p) {
		return JSON.parse(JSON.stringify(p));
	} else {
		return p;
	}
};
