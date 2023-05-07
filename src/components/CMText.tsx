import { clsx } from "~/utils/classes";
import { c, s } from "~/utils/styles";

export const CMText = (props) => {
  return (
    <p
      class={clsx("inline break-words ", props.class)}
      {...{
        props,
        style: props.style,
      }}
    >
      {props.children}
    </p>
  );
};
