import { createMemo } from "solid-js";
import { useResponsive, useResponsiveV2 } from "./useResponsive";

export const useIsMobile = () => {
  // solid TODO
  // const { width: windowWidth } = useWindowDimensions();
  const responsive = useResponsive();
  return responsive.isMobile;
};

export const useIsMobileV2 = () => {
  const responsive = useResponsiveV2();
  return createMemo(() => responsive().isMobile);
};
