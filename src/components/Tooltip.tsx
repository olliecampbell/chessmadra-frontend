import { Accessor, createSignal, JSX } from "solid-js";
import tippy from "tippy.js";
import { isDevelopment } from "~/utils/env";

export const initTooltip = ({
  content,
  ref,
  maxWidth,
}: {
  content: Accessor<JSX.Element>;
  ref: HTMLElement;
  maxWidth: number;
}) => {
  tippy(ref, {
    content: content() as any,
    placement: "bottom",
    animation: "shift-away",
    touch: false,
    theme: "tooltip",
    // showOnCreate: isDevelopment && true,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
  });
};
