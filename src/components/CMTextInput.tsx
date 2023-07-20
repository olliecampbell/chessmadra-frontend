import { c, s } from "~/utils/styles";
import { Component, createSignal } from "solid-js";
import { clsx } from "~/utils/classes";

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
      class={clsx("text-input placeholder-gray-50")}
      style={s(
        c.bg(c.gray[14]),
        c.py(12),
        c.px(12),
        c.fontSize(14),
        focus()
          ? c.border(`1px solid ${c.gray[30]}`)
          : c.border(`1px solid ${c.gray[26]}`),
        c.br(4),
        c.keyedProp("outline")("none"),
        c.fg(c.colors.text.primary),
        props.style ?? {},
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
