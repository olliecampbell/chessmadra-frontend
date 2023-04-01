import React, { useRef } from "react";
// import { ExchangeRates } from "~/ExchangeRate";
import { s } from "~/utils/styles";
import { useOnScreen } from "~/utils/useIntersectionObserver";

export const LazyLoad = ({
  children,
  style,
}: {
  children: any;
  maxOpacity?: number;
  style: any;
}) => {
  const ref = useRef(null);
  const onScreen = useOnScreen(ref, "300px");

  return (
    <div ref={ref} style={s(style)}>
      {onScreen && children}
    </div>
  );
};
