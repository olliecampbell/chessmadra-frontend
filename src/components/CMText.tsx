import clsx from "clsx";
import { c, s } from "~/utils/styles";

export const CMText = (props) => {
  return (
    <p
      class={clsx(
        props.class,
        "white text-14px text-secondary inline whitespace-pre-wrap break-words font-normal "
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
