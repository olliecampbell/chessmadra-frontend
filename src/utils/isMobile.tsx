import { createMemo } from "solid-js";
import { useResponsiveV2 } from "./useResponsive";

export const useIsMobile = () => {
	const responsive = useResponsiveV2();
	return responsive().isMobile;
};

export const useIsMobileV2 = () => {
	const responsive = useResponsiveV2();
	const isMobile = createMemo(() => responsive().isMobile);
	return isMobile;
};
