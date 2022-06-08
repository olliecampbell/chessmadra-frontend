import { c, s } from "app/styles";
import React from "react";
import { TextInput } from "react-native";

export const CMTextInput = ({
  value,
  placeholder,
  setValue,
}: {
  value: string;
  placeholder: string;
  setValue: (x: string) => void;
}) => {
  return (
    <TextInput
      style={s(
        c.bg(c.grays[20]),
        c.py(12),
        c.px(12),
        c.fontSize(14),
        c.fg(c.colors.textPrimary)
      )}
      placeholder={placeholder}
      value={value}
      onChangeText={setValue}
    />
  );
};
