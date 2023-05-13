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
        class={`text-red-60 pt-2 text-sm ${props.class}`}
        id={`${props.name}-error`}
      >
        {props.error}
      </div>
    </Show>
  );
}
