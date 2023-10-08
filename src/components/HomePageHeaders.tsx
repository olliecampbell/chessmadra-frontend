import { getFeature } from "~/utils/experiments";

export const HomePageHeader = () => {
	const ctas = () => {
		return getHomepageHeadersCopy(getFeature("homepage-header-cta"));
	};
	return <span> {ctas().header}</span>;
};
export const HomePageSubheader = () => {
	const ctas = () => {
		return getHomepageHeadersCopy(getFeature("homepage-header-cta"));
	};
	return <span> {ctas().subheader}</span>;
};

const getHomepageHeadersCopy = (feature?: string | boolean) => {
	return {
		header: "Your personal opening book",
		subheader:
			"Chessbook is the fastest way to build a bulletproof opening repertoire. ",
	};
};
