import { clsx } from "~/utils/classes";
import { createRequire } from "module";
import { createEffect, JSX, splitProps } from "solid-js";
import { InputError } from "./forms/InputError";
import { InputLabel } from "./forms/InputLabel";

type TextInputProps = {
  type?: "text" | "email" | "tel" | "password" | "url" | "number" | "date";
  name: string;
  placeholder?: string;
  required?: boolean;
  class?: string;
  inputClass?: string;
  label?: string;
  error?: string;
  padding?: "none";
  errors?: Record<string, string[] | null>;
};

type TextAreaProps = {
  ref?: (element: HTMLTextAreaElement) => void;
  name?: string;
  onBlur?: JSX.EventHandler<HTMLTextAreaElement, FocusEvent>;
  placeholder?: string;
  required?: boolean;
  class?: string;
  inputClass?: string;
  label?: string;
  error?: string;
  padding?: "none";
} & Partial<JSX.HTMLAttributes<HTMLTextAreaElement>>;

/**
 * Text input field that users can type into. Various decorations can be
 * displayed in or around the field to communicate the entry requirements.
 */
export function TextInput(props: TextInputProps) {
  const error = () => {
    return props.errors?.[props.name]?.[0];
  };
  return (
    <div class={clsx(!props.padding && "", props.class)}>
      <InputLabel
        name={props.name}
        label={props.label}
        required={props.required}
      />
      <input
        name={props.name}
        autocapitalize={props.type === "email" ? "off" : undefined}
        class={clsx(
          "bg-gray-4 md:text-md w-full rounded border-2 p-4 placeholder:text-gray-50",
          props.error
            ? "border-red-600/50 dark:border-red-400/50"
            : "&hover:border-slate-300 dark:&hover:border-slate-700 border-slate-200 focus:border-sky-600/50 dark:border-slate-800 dark:focus:border-sky-400/50",
          props.inputClass
        )}
        placeholder={props.placeholder}
        id={props.name}
        type={props.type}
        aria-invalid={!!props.error}
        aria-errormessage={`${props.name}-error`}
      />
      <InputError name={props.name} error={error()} class={"inline-block"} />
    </div>
  );
}

export function TextArea(props: TextAreaProps) {
  const [, inputProps] = splitProps(props, [
    "class",
    "inputClass",
    "label",
    "error",
    "padding",
  ]);
  createEffect(() => {
    console.log(`errors, ${props.name}`, props.error);
  });
  return (
    <div class={clsx(!props.padding && "", props.class)}>
      <InputLabel
        name={props.name ?? ""}
        label={props.label}
        required={props.required}
      />
      <textarea
        {...inputProps}
        name={props.name}
        class={clsx(
          "bg-gray-4 md:text-md w-full rounded border-2 p-4 placeholder:text-gray-50",
          props.error
            ? "border-red-600/50 dark:border-red-400/50"
            : "&hover:border-slate-300 dark:&hover:border-slate-700 border-slate-200 focus:border-sky-600/50 dark:border-slate-800 dark:focus:border-sky-400/50",
          props.inputClass
        )}
        id={props.name}
        aria-invalid={!!props.error}
        aria-errormessage={`${props.name}-error`}
      />
      <InputError name={props.name ?? ""} error={props.error} />
    </div>
  );
}
