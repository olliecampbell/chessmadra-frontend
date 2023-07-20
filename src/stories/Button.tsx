import { Component, createSignal, mergeProps, splitProps } from "solid-js";
import "./button.css";
import { createPrevious } from "../utils/signals/createPrevious";

export interface ButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean;
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: "small" | "medium" | "large";
  /**
   * Button contents
   */
  label: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

/**
 * Primary UI component for user interaction
 */
export const Button: Component<ButtonProps> = (props) => {
  props = mergeProps({ size: "small" as ButtonProps["size"] }, props);
  const [local, rest] = splitProps(props, [
    "primary",
    "size",
    "backgroundColor",
    "label",
  ]);
  const [count, setCount] = createSignal(0);
  const previousCount = createPrevious(count);

  return (
    <div>
      <p>{count()}</p>
      <p>{previousCount()}</p>
      <button
        {...rest}
        type="button"
        classList={{
          "storybook-button--small": local.size === "small",
          "storybook-button--medium": local.size === "medium",
          "storybook-button--large": local.size === "large",
          "storybook-button": true,
          "storybook-button--primary": local.primary === true,
          "storybook-button--secondary": local.primary === false,
        }}
        style={{ "background-color": local.backgroundColor }}
        onClick={() => {
          if (Math.random() > 0.5) {
            setCount(count() + 1);
          } else {
            setCount(count());
          }
        }}
      >
        {local.label}
      </button>
    </div>
  );
};
