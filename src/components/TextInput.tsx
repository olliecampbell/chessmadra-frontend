import { c, s } from "app/styles";
import React, { useState } from "react";
import { TextInput, TextInputProps } from "react-native";

export const CMTextInput = ({
  value,
  placeholder,
  setValue,
  onKeyDown,
  textInputProps,
  style,
}: {
  value: string;
  style?: any;
  onKeyDown?: any;
  textInputProps?: Partial<TextInputProps>;
  placeholder: string;
  setValue: (x: string) => void;
}) => {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      {...textInputProps}
      // @ts-ignore
      onKeyDown={onKeyDown}
      // @ts-ignore
      className="text-input"
      style={s(
        c.bg(c.grays[10]),
        c.py(12),
        c.px(12),
        c.fontSize(14),
        focus
          ? c.border(`1px solid ${c.grays[30]}`)
          : c.border(`1px solid transparent`),
        c.br(4),
        c.keyedProp("outline")("none"),
        c.fg(c.colors.textPrimary),
        style ?? {}
      )}
      placeholder={placeholder}
      placeholderTextColor={c.grays[60]}
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
