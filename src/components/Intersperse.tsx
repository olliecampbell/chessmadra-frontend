import {
  Accessor,
  createEffect,
  createMemo,
  For,
  Index,
  JSXElement,
  Show,
} from "solid-js";

// Use the For component, but if the index isn't the last one, insert another element at the end
export const Intersperse = <T,>(props: {
  each: Accessor<T[]>;
  separator: () => JSXElement;
  children: (item: Accessor<T>, index: number) => JSXElement;
}): JSXElement => {
  const length = () => props.each().length;
  return (
    <Index each={props.each()}>
      {(item, index) => (
        <>
          {props.children(item, index)}
          <Show when={index !== length() - 1}>{props.separator()}</Show>
        </>
      )}
    </Index>
  );
};
