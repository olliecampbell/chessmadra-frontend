import { s, c } from "app/styles";
import { View, Text } from "react-native";

export const SettingsTitle = ({ text }) => {
  return (
    <View
      style={s(c.fullWidth, c.px(12), c.py(12), c.bg(c.grays[20]), c.br(2))}
    >
      <Text style={s(c.fg(c.colors.textPrimary), c.fontSize(18), c.weightBold)}>
        {text}
      </Text>
    </View>
  );
};
