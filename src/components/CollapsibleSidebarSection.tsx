// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { BP,  useResponsiveV2 } from "~/utils/useResponsive";
import { createSignal, JSXElement } from "solid-js";
import { Pressable } from "./Pressable";
import { clsx } from "~/utils/classes";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

export const CollapsibleSidebarSection = (props: {
  children: JSXElement | JSXElement[];
  header: string;
}) => {
  const responsive = useResponsiveV2();
  const [collapsed, setCollapsed] = createSignal(true);
  return (
    <div style={s()}>
      <Pressable
        style={s(
          c.row,
          c.justifyBetween,
          c.py(8),
          c.alignCenter,
          c.px(c.getSidebarPadding(responsive())),
          c.clickable
        )}
        class={clsx("&hover:bg-gray-18 h-sidebar-button")}
        onPress={() => {
          setCollapsed(!collapsed());
        }}
      >
        <CMText
          style={s(
            c.fontSize(responsive().switch(14, [BP.lg, 14])),
            c.fg(c.colors.text.primary)
          )}
        >
          {props.header}
        </CMText>
        <div style={s()}>
          <i
            class={clsx(
              "fa fa-chevron-right rotate-0 transition-transform",
              !collapsed() && "rotate-90"
            )}
            style={s(c.fg(c.colors.text.primary), c.fontSize(14))}
          />
        </div>
      </Pressable>
      <div style={s()}>{collapsed() ? null : props.children}</div>
    </div>
  );
};
