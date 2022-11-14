import { s, c } from "app/styles";
import { BP, useResponsive } from "app/utils/useResponsive";
import React from "react";
import { CMText } from "./CMText";
import { getSidebarPadding } from "./RepertoireBrowsingView";

export const RepertoireEditingHeader = ({ children }: { children: any }) => {
  const responsive = useResponsive();
  return (
    <CMText
      style={s(
        c.px(getSidebarPadding(responsive)),
        c.fg(c.colors.textPrimary),
        c.fontSize(responsive.switch(18, [BP.lg, 24])),
        c.mt(responsive.switch(0, [BP.lg, -6])),
        c.weightBold
      )}
    >
      {children}
    </CMText>
  );
};
