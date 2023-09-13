import { createScrollPosition } from "@solid-primitives/scroll";
import { clsx } from "~/utils/classes";
import { getFeature } from "~/utils/experiments";

export const HomePageStickyNav = (props: { onClick: () => void }) => {
	// const visible = true;
	const scroll = createScrollPosition();
	const featureEnabled = () => getFeature("sticky-homepage-cta");
	console.log("featureEnabled", featureEnabled());
	const visible = () => scroll.y > 800 && featureEnabled();
	return (
		<div
			class={clsx(
				"w-screen fixed bg-gray-10 top-0 left-0 right-0 z-50 flex row justify-center  border-b-2 border-gray-20 border-b-solid transition-opacity max-w-screen",
				visible() ? "opacity-100" : "pointer-events-none opacity-0",
			)}
		>
			<div class="max-w-[1000px] mx-8 py-2 lg:py-4 flex justify-between w-full row items-center">
				<img
					src="/homepage_imgs/chessbook.svg?v=2023-04-11T09:44:19.974Z"
					class="h-4 lg:h-6"
				/>
				<div
					class="bg-orange-45 hover:bg-orange-50 px-4 lg:px-4 py-2 lg:py-3 rounded cursor-pointer text-md lg:text-lg font-semibold"
					onClick={() => {
						props.onClick();
					}}
				>
					Try it for free
				</div>
			</div>
		</div>
	);
};
