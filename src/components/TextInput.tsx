import { c, s } from "~/utils/styles";
import { Component, createSignal } from "solid-js";

export const CMTextInput: Component<{
  value: string;
  style?: any;
  onKeyDown?: any;
  textInputProps?: Partial<any>;
  placeholder: string;
  setValue: (x: string) => void;
}> = (props) => {
  const [focus, setFocus] = createSignal(false);
  return (
    <input
      class="text-input"
      style={s(
        c.bg(c.grays[14]),
        c.py(12),
        c.px(12),
        c.fontSize(14),
        focus()
          ? c.border(`1px solid ${c.grays[30]}`)
          : c.border(`1px solid ${c.grays[26]}`),
        c.br(4),
        c.keyedProp("outline")("none"),
        c.fg(c.colors.textPrimary),
        props.style ?? {}
      )}
      placeholder={props.placeholder}
      onInput={(e) => {
        props.setValue(e.currentTarget.value);
      }}
      onFocus={() => {
        setFocus(true);
      }}
      onBlur={() => {
        setFocus(false);
      }}
      value={props.value}
    />
  );
};
