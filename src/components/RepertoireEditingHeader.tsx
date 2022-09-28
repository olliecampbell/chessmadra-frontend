import { s, c } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import React from "react";
import { View } from "react-native";
import { CMText } from "./CMText";

export const RepertoireEditingHeader = ({ children }: { children: any }) => {
  return (
    <CMText
      style={s(
        c.fg(c.colors.textInverse),
        c.fontSize(18),
        c.weightBold,
        c.mb(-18)
      )}
    >
      {children}
    </CMText>
  );
};
