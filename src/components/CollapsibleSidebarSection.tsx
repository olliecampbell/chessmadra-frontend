// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { BP, useResponsive } from "~/utils/useResponsive";
import { createSignal } from "solid-js";
import { Pressable } from "./Pressable";
import { clsx } from "~/utils/classes";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

export const CollapsibleSidebarSection = ({
  header,
  children,
}: {
  children: JSX.Element | JSX.Element[];
  header: string;
}) => {
  const responsive = useResponsive();
  const [collapsed, setCollapsed] = createSignal(true);
  return (
    <div style={s()}>
      <Pressable
        style={s(
          c.row,
          c.justifyBetween,
          c.py(8),
          c.alignCenter,
          c.px(c.getSidebarPadding(responsive)),
          c.clickable
        )}
        class={clsx("&hover:bg-gray-18 h-sidebar-button")}
        onPress={() => {
          setCollapsed(!collapsed());
        }}
      >
        <CMText
          style={s(
            c.fontSize(responsive.switch(14, [BP.lg, 14])),
            c.fg(c.colors.textPrimary)
          )}
        >
          {header}
        </CMText>
        <div style={s()}>
          <i
            class={clsx(
              "fa fa-chevron-right rotate-0 transition-transform",
              !collapsed() && "rotate-90"
            )}
            style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
          ></i>
        </div>
      </Pressable>
      <div style={s()}>{collapsed() ? null : children}</div>
    </div>
  );
};
