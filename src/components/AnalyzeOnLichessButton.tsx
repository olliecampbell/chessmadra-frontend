import { isEmpty } from "lodash-es";
import { Show } from "solid-js";
import { getAppState, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { getLichessLink } from "~/utils/lichess";
import { c, s } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { FadeInOut } from "./FadeInOut";
import { MoveLog } from "./MoveLog";

export const AnalyzeOnLichessButton = (props: {}) => {
	const responsive = useResponsiveV2();
	const iconStyles = s(c.fontSize(responsive().switch(12, [BP.md, 14])));
	const padding = 8;
	const [sidebarMode] = useSidebarState(([s]) => [s.mode]);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const currentLine = () => {
		if (sidebarMode() === "review") {
			return getAppState().repertoireState.reviewState.moveLog;
		} else {
			return getAppState().repertoireState.browsingState.sidebarState.moveLog;
		}
	};
	return (
		<FadeInOut
			style={s(c.row)}
			class={clsx("shrink-0")}
			open={() =>
				!isEmpty(currentLine()) &&
				(sidebarMode() === "browse" ||
					sidebarMode() === "review" ||
					sidebarMode() === "build")
			}
		>
			<a
				style={s()}
				class={clsx(
					"text-tertiary &hover:text-primary text-md -my-2 shrink-0 py-2 font-semibold transition-colors",
				)}
				href={getLichessLink(currentLine(), activeSide())}
				target="_blank"
				rel="noreferrer"
				onClick={() => {
					trackEvent("chessboard.analyze_on_lichess", {
						side: activeSide(),
						mode: sidebarMode(),
					});
				}}
			>
				<p>
					Analyze on Lichess
					<i class="fa fa-up-right-from-square pl-2" style={s(iconStyles)} />
				</p>
			</a>
		</FadeInOut>
	);
};
