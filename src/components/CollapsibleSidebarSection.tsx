// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { BP, useResponsive } from "~/utils/useResponsive";
import { createSignal } from "solid-js";
import { View } from "./View";
import { Pressable } from "./Pressable";
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
    <View style={s()}>
      <Pressable
        style={s(
          c.row,
          c.justifyBetween,
          c.py(8),
          c.alignCenter,
          c.px(c.getSidebarPadding(responsive)),
          c.clickable
        )}
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
        <View style={s()}>
          <i
            class={!collapsed() ? "fa fa-chevron-down" : "fa fa-chevron-right"}
            style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
          ></i>
        </View>
      </Pressable>
      <View style={s()}>{collapsed() ? null : children}</View>
    </View>
  );
};
