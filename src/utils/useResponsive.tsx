// import { useWindowDimensions } from "react-native";

import { useWindowSize } from "@solid-primitives/resize-observer";
import { Accessor, createEffect, createMemo, on } from "solid-js";

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
  if (x < 640) {
    return ResponsiveBreakpoint.xsm;
  }
  if (x < 768) {
    return ResponsiveBreakpoint.sm;
  }
  if (x < 1024) {
    return ResponsiveBreakpoint.md;
  }
  if (x < 1280) {
    return ResponsiveBreakpoint.lg;
  }
  if (x < 1536) {
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
  // const [isMobile, setIsMobile] = createSignal(true);
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
    isMobile: breakpoint() <= ResponsiveBreakpoint.sm,
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
export const useResponsiveV2 = (): Accessor<Responsive> => {
  const windowSize = useWindowSize();
  const breakpoint = () => getBreakpoint(windowSize.width);
  const responsive = createMemo(() => {
    return {
      isMobile: breakpoint() <= ResponsiveBreakpoint.sm,
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
  });
  return responsive;
};
