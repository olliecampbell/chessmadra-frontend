import { s, c } from "~/utils/styles";
import { View } from "react-native";
import { CMText } from "./CMText";

export const SettingsTitle = ({ text }) => {
  return (
    <div
      style={s(
        c.fullWidth,
        c.pr(12),
        c.py(12),
    c.borderBottom(`1px solid ${c.colors.border}`),
        c.br(2)
      )}
    >
      <CMText
        style={s(c.fg(c.colors.textPrimary), c.fontSize(18), c.weightBold)}
      >
        {text}
      </CMText>
    </div>
  );
};
