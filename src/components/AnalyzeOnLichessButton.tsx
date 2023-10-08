import { isEmpty } from "lodash-es";
import { getAppState, useMode, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { getLichessLink } from "~/utils/lichess";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { FadeInOut } from "./FadeInOut";

export const AnalyzeOnLichessButton = (props: { short?: boolean }) => {
	const mode = useMode();
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const currentLine = () => {
		if (mode() === "review") {
			return getAppState().repertoireState.reviewState.moveLog;
		} else {
			return getAppState().repertoireState.browsingState.chessboard.getMoveLog();
		}
	};
	return (
		<FadeInOut
			style={stylex(c.row)}
			class={clsx("shrink-0 ")}
			open={
				!isEmpty(currentLine()) &&
				(mode() === "browse" || mode() === "review" || mode() === "build")
			}
		>
			<a
				style={stylex()}
				class={clsx(
					"text-sm text-tertiary &hover:text-primary  -my-2 shrink-0 py-2 font-medium transition-colors",
				)}
				href={getLichessLink(currentLine(), activeSide())}
				target="_blank"
				rel="noreferrer"
				onClick={() => {
					trackEvent("chessboard.analyze_on_lichess", {
						side: activeSide(),
						mode: mode(),
					});
				}}
			>
				<p>
					{props.short ? "Analyze" : "Analyze on Lichess"}
					<i class="fa fa-up-right-from-square pl-2 " />
				</p>
			</a>
		</FadeInOut>
	);
};
