// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Motion } from "@motionone/solid";
import { Accessor } from "solid-js";

export const FadeInOut = ({
  children,
  id,
  open,
  maxOpacity: _maxOpacity,
  style,
}: {
  children: any;
  open: Accessor<boolean>;
  maxOpacity?: number;
  style?: any;
  id?: string;
}) => {
  const maxOpacity = _maxOpacity ?? 100;
  const opacity = () => (open() ? maxOpacity : 0);
  return (
    <Motion
      id={id}
      initial={{ opacity: opacity() }}
      animate={{ opacity: opacity() }}
      style={s(!open && c.noPointerEvents, style)}
    >
      {children}
    </Motion>
  );
};
