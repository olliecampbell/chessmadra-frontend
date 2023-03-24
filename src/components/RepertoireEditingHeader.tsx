import { s, c } from "~/utils/styles";
import { BP, useResponsive } from "~/utils/useResponsive";
import { CMText } from "./CMText";

export const RepertoireEditingHeader = ({ children }: { children: any }) => {
  const responsive = useResponsive();
  return (
    <CMText
      style={s(
        c.px(c.getSidebarPadding(responsive)),
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
