import { s, c } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import React from "react";
import { View } from "react-native";
import { CMText } from "./CMText";

export const RepertoireEditingHeader = ({ children }: { children: any }) => {
  const isMobile = useIsMobile();
  return (
    <CMText
      style={s(
        c.fg(c.colors.textPrimary),
        c.fontSize(isMobile ? 14 : 22),
        c.weightBold
      )}
    >
      {children}
    </CMText>
  );
};
