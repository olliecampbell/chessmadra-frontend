// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Accessor, createSignal, onMount } from "solid-js";
import { clsx } from "~/utils/classes";

export const FadeInOut = (props: {
  children: any;
  open: Accessor<boolean>;
  maxOpacity?: number;
  style?: any;
  className?: string;
  class?: string;
  id?: string;
}) => {
  const maxOpacity = props.maxOpacity ?? 100;
  const opacity = () => (props.open() ? maxOpacity : 0);
  // createEffect(() => {
  //   console.log(`opacity is ${opacity()}, open is ${props.open()}`);
  // });
  return (
    <div
      id={props.id}
      style={s(!props.open() && c.noPointerEvents, props.style)}
      class={clsx(
        "transition-opacity",
        props.open() ? "opacity-100" : "opacity-0",
        !props.open() && "pointer-events-none",
        props.className,
        props.class
      )}
    >
      {props.children}
    </div>
  );
};

export const TransitionIn = (props: {
  children: any;
  open: Accessor<boolean>;
  maxOpacity?: number;
  style?: any;
  className?: string;
  class?: string;
  id?: string;
}) => {
  const maxOpacity = props.maxOpacity ?? 100;
  const [entered, setEntered] = createSignal(false);
  const opacity = () => (props.open() ? maxOpacity : 0);
  // createEffect(() => {
  //   console.log(`opacity is ${opacity()}, open is ${props.open()}`);
  // });
  // onMount(() => {
  //   setEntered(true);
  // });
  return (
    <div
      ref={(x) => {
        setTimeout(() => {
          setEntered(true);
        });
      }}
      id={props.id}
      style={s(!props.open() && c.noPointerEvents, props.style)}
      class={clsx(
        "transition-opacity duration-[600ms]",
        props.open() && entered() ? "opacity-100" : "opacity-0",
        !props.open() && "pointer-events-none",
        props.className,
        props.class
      )}
    >
      {props.children}
    </div>
  );
};
