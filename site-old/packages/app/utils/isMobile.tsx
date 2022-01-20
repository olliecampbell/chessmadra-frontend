import { useWindowDimensions } from 'react-native'
export const useIsMobile = () => {
  const { width: windowWidth } = useWindowDimensions()
  const isMobile = windowWidth < 1000
  return isMobile
}
