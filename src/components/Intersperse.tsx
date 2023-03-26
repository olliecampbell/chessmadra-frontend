import { Accessor, Component, For, JSXElement } from "solid-js";

// Use the For component, but if the index isn't the last one, insert another element at the end
export const Intersperse = <T,>({
  each,
  separator,
  children,
}: {
  each: Accessor<T[]>;
  separator: () => JSXElement;
  children: (item: T, index: Accessor<number>) => JSXElement;
}): JSXElement => {
  return (
    <For each={each()}>
      {(item, index) =>
        index() !== each().length - 1 ? (
          <>
            {children(item, index)}
            {separator()}
          </>
        ) : (
          children(item, index)
        )
      }
    </For>
  );
};
