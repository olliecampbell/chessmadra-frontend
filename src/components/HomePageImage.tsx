import { getFeature } from "~/utils/experiments";

export const HomePageImage = () => {
	const src = () => {
		if (getFeature("homepage-image")) {
			return "/homepage_imgs/hero_overview_overview.png";
		}
		return "/homepage_imgs/desktop-hero.png?v=2023-04-24T11:44:36.906Z";
	};
	return <img src={src()} class="mt-[50px]" />;
};
