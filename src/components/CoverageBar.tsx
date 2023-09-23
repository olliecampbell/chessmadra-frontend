import { Show } from "solid-js";
import { useBrowsingState } from "~/utils/app_state";
import { Side } from "~/utils/repertoire";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { View } from "./View";
import { clsx } from "~/utils/classes";

export const CoverageBar = (props: {
	side: Side;
	rounded?: boolean;
	isInSidebar?: boolean;
	large?: boolean;
}) => {
	const [progressState] = useBrowsingState(([s]) => {
		const progressState = s.repertoireProgressState[props.side];
		return [progressState];
	});
	const [inProgressColor, completedColor] = [
		c.colors.success,
		c.colors.success,
	];
	const overlap = 8;
	return (
		<Show when={progressState()}>
			<div
				class="bg-gray-30"
				style={s(
					c.relative,
					c.fullHeight,
					c.fullWidth,
					c.br(props.rounded ? 999 : 2),
					c.relative,
				)}
			>
				<div
					class={clsx(
						"rounded-full",
						props.large
							? "bg-gradient-to-r from-green-35 to-green-45 "
							: "bg-green-40",
					)}
					style={s(
						c.absolute,
						c.top(0),
						c.bottom(0),
						c.left(0),
						c.width(`${progressState().percentComplete}%`),
						c.fullHeight,
					)}
				/>
			</div>
		</Show>
	);
};
