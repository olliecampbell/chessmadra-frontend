import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import React, { useState } from "react";
import { BP, useResponsive } from "app/utils/useResponsive";
import { getSidebarPadding } from "./RepertoireBrowsingView";
// import { StockfishEvalCircle } from "./StockfishEvalCircle";

export const CollapsibleSidebarSection = ({
  header,
  children,
}: {
  children: JSX.Element | JSX.Element[];
  header: string;
}) => {
  const responsive = useResponsive();
  const [collapsed, setCollapsed] = useState(true);
  return (
    <View style={s()}>
      <Pressable
        style={s(
          c.row,
          c.justifyBetween,
          c.py(8),
          c.alignCenter,
          c.px(getSidebarPadding(responsive)),
          c.clickable
        )}
        onPress={() => {
          setCollapsed(!collapsed);
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
            className={
              !collapsed ? "fa fa-chevron-down" : "fa fa-chevron-right"
            }
            style={s(c.fg(c.colors.textPrimary), c.fontSize(14))}
          ></i>
        </View>
      </Pressable>
      <View style={s()}>{collapsed ? null : children}</View>
    </View>
  );
};
