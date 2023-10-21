import { useRepertoireState } from "~/utils/app_state";
import { Side } from "~/utils/repertoire";
import { c, stylex } from "~/utils/styles";
import { CoverageBar } from "./CoverageBar";
import { Spacer } from "./Space";

export const RepertoireCompletion = (props: { side: Side }) => {
	const [progressState] = useRepertoireState((s) => [
		s.browsingState.repertoireProgressState[props.side],
	]);
	return (
		<div>
			<p class="body-text">
				Your {props.side} repertoire is{" "}
				<b style={stylex(c.fg(c.gray[80]), c.weightSemiBold)}>
					{Math.round(progressState().percentComplete * 100)}%
				</b>{" "}
				complete.
			</p>
			<Spacer height={16} />
			<div class="h-2 rounded-full overflow-hidden">
				<CoverageBar side={props.side} large />
			</div>
		</div>
	);
};
