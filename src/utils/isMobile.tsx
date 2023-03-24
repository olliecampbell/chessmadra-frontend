export const useIsMobile = (cutoff?: number) => {
  // solid TODO
  // const { width: windowWidth } = useWindowDimensions();
  const windowWidth = 1600;
  // const [isMobile, setIsMobile] = useState(true);
  // useEffect(() => {
  //   setIsMobile(windowWidth < 1000);
  // }, []);
  // console.log({ windowWidth });
  const isMobile = windowWidth < (cutoff ?? 1000);
  return isMobile;
};
