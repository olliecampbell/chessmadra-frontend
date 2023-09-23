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
import { AnalyzeOnLichessButton } from "./AnalyzeOnLichessButton";

export const ChessboardFooter = (props: {}) => {
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
			class={clsx("row max-w-full justify-between <md:padding-sidebar w-full")}
			open={() =>
				!isEmpty(currentLine()) &&
				(sidebarMode() === "browse" ||
					sidebarMode() === "review" ||
					sidebarMode() === "build")
			}
		>
			<Show when={!responsive().isMobile} fallback={<div />}>
				<AnalyzeOnLichessButton />
			</Show>
			<MoveLog />
		</FadeInOut>
	);
};
