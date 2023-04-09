import { useResponsive } from "./useResponsive";

export const useIsMobile = () => {
  // solid TODO
  // const { width: windowWidth } = useWindowDimensions();
  const responsive = useResponsive();
  return responsive.isMobile;
};
