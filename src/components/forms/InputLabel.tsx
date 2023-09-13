import { Show } from "solid-js";
import { clsx } from "~/utils/classes";

type InputLabelProps = {
	name: string;
	label?: string;
	required?: boolean;
	margin?: "none";
};

/**
 * Input label for a form field.
 */
export function InputLabel(props: InputLabelProps) {
	return (
		<Show when={props.label}>
			<label
				class={clsx(
					"text-md inline-block font-medium",
					!props.margin && "mb-2",
				)}
				for={props.name}
			>
				{props.label}{" "}
				{props.required && (
					<span class="ml-1 text-red-600 dark:text-red-400">*</span>
				)}
			</label>
		</Show>
	);
}
