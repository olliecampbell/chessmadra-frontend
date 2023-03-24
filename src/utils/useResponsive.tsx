// import { useWindowDimensions } from "react-native";

export enum ResponsiveBreakpoint {
  xsm = 0,
  sm = 1,
  md = 2,
  lg = 3,
  xl = 4,
  xxl = 5,
}

export { ResponsiveBreakpoint as BP };

let BREAKPOINTS = [
  ResponsiveBreakpoint.xsm,
  ResponsiveBreakpoint.sm,
  ResponsiveBreakpoint.md,
  ResponsiveBreakpoint.lg,
  ResponsiveBreakpoint.xl,
  ResponsiveBreakpoint.xxl,
];

let getBreakpoint = (x: number): ResponsiveBreakpoint => {
  if (x < 576) {
    return ResponsiveBreakpoint.xsm;
  }
  if (x < 768) {
    return ResponsiveBreakpoint.sm;
  }
  if (x < 1000) {
    return ResponsiveBreakpoint.md;
  }
  if (x < 1200) {
    return ResponsiveBreakpoint.lg;
  }
  if (x < 1400) {
    return ResponsiveBreakpoint.xl;
  }
  return ResponsiveBreakpoint.xxl;
};

// const RESPONSIVE_BREAKPOINTS = {
//
//   }

export interface Responsive {
  isMobile: boolean;
  bp: ResponsiveBreakpoint;
  switch: <T>(def: T, ...xs: [ResponsiveBreakpoint, T][]) => T;
  //     => {
  //     let result = def;
  //     xs.forEach(([bp, val]) => {
  //       if (breakpoint >= bp) {
  //         result = val;
  //       }
  //     });
  //     return result;
  //   },
  // }
}

export const useResponsive = (): Responsive => {
  // solid TODO
  // const { width: windowWidth } = useWindowDimensions();
  // const [isMobile, setIsMobile] = useState(true);
  // useEffect(() => {
  //   setIsMobile(windowWidth < 1000);
  // }, []);
  // console.log({ windowWidth });
  const breakpoint = getBreakpoint(1200);
  return {
    isMobile: breakpoint <= ResponsiveBreakpoint.md,
    bp: breakpoint,
    switch: <T,>(def: T, ...xs: [ResponsiveBreakpoint, T][]): T => {
      let result = def;
      xs.forEach(([bp, val]) => {
        if (breakpoint >= bp) {
          result = val;
        }
      });
      return result;
    },
  };
};
