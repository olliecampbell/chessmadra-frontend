// import { useWindowDimensions } from "react-native";

import { useWindowSize } from "@solid-primitives/resize-observer";
import { createEffect, on } from "solid-js";

export enum ResponsiveBreakpoint {
  xsm = 0,
  sm = 1,
  md = 2,
  lg = 3,
  xl = 4,
  xxl = 5,
}

export { ResponsiveBreakpoint as BP };

const BREAKPOINTS = [
  ResponsiveBreakpoint.xsm,
  ResponsiveBreakpoint.sm,
  ResponsiveBreakpoint.md,
  ResponsiveBreakpoint.lg,
  ResponsiveBreakpoint.xl,
  ResponsiveBreakpoint.xxl,
];

const getBreakpoint = (x: number): ResponsiveBreakpoint => {
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
  const windowSize = useWindowSize();
  // const [isMobile, setIsMobile] = useState(true);
  // useEffect(() => {
  //   setIsMobile(windowWidth < 1000);
  // }, []);
  // console.log({ windowWidth });
  const breakpoint = () => getBreakpoint(windowSize.width);
  createEffect(
    on(
      () => breakpoint(),
      () => {
        // todo: solid
        window.location.reload();
      },
      {
        defer: true,
      }
    )
  );
  return {
    isMobile: breakpoint() <= ResponsiveBreakpoint.md,
    bp: breakpoint(),
    switch: <T,>(def: T, ...xs: [ResponsiveBreakpoint, T][]): T => {
      let result = def;
      xs.forEach(([bp, val]) => {
        if (breakpoint() >= bp) {
          result = val;
        }
      });
      return result;
    },
  };
};
