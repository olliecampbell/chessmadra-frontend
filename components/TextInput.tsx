import { c, s } from "app/styles";
import React, { useState } from "react";
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
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      className="text-input"
      style={s(
        c.bg(c.grays[20]),
        c.py(12),
        c.px(12),
        c.fontSize(14),
        focus
          ? c.border(`1px solid ${c.grays[60]}`)
          : c.border(`1px solid ${c.grays[35]}`),
        c.br(4),
        c.keyedProp("outline")("none"),
        c.fg(c.colors.textPrimary)
      )}
      placeholder={placeholder}
      onFocus={() => {
        setFocus(true);
      }}
      onBlur={() => {
        setFocus(false);
      }}
      value={value}
      onChangeText={setValue}
    />
  );
};
