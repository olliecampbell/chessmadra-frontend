import { clsx } from "~/utils/classes";
import { c, s } from "~/utils/styles";

export const CMText = (props) => {
  return (
    <p
      class={clsx(
        props.class,
        "inline whitespace-pre-wrap break-words font-normal "
      )}
      {...{
        props,
        style: props.style,
      }}
    >
      {props.children}
    </p>
  );
};
