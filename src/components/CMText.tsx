import { clsx } from "~/utils/classes";

export const CMText = (props: any) => {
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
