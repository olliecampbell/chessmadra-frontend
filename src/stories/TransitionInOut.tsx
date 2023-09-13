import {
	Component,
	Show,
	createSignal,
	mergeProps,
	splitProps,
} from "solid-js";
import { TransitionIn as OG } from "../components/FadeInOut";
import { createPrevious } from "../utils/signals/createPrevious";
import "./button.css";

export type ButtonProps = {};

/**
 * Primary UI component for user interaction
 */
export const TransitionInOut: Component<ButtonProps> = (props) => {
	const [show, setShow] = createSignal(false);

	return (
		<div>
			<button
				type="button"
				onClick={() => {
					setShow(!show());
				}}
			>
				toggle
			</button>
			<Show when={show()}>
				<OG open={() => true}>test</OG>
			</Show>
		</div>
	);
};
