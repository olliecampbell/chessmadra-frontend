// import { Expandable } from "./Expandable";

import { Show } from "solid-js";

type InputErrorProps = {
  name: string;
  error?: string;
  class?: string;
};

/**
 * Input error that tells the user what to do to fix the problem.
 */
export function InputError(props: InputErrorProps) {
  return (
    <Show when={!!props.error}>
      <div
        class={`pt-4 text-sm text-red-60 ${props.class}`}
        id={`${props.name}-error`}
      >
        {props.error}
      </div>
    </Show>
  );
}
