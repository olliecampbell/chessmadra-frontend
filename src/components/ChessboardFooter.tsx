import { isEmpty, last } from "lodash-es";
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
import { destructure } from "@solid-primitives/destructure";
import { getAppropriateEcoName } from "~/utils/eco_codes";

export const ChessboardFooter = (props: {}) => {
	const responsive = useResponsiveV2();
	const iconStyles = s(c.fontSize(responsive().switch(12, [BP.md, 14])));
	const padding = 8;
	const [sidebarMode] = useSidebarState(([s]) => [s.mode]);
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const [currentLine, ecoName, ecoVariation] = destructure(() => {
		let currentLine = null;
		let currentEcoCode = null;
		if (sidebarMode() === "review") {
			currentLine = getAppState().repertoireState.reviewState.moveLog;
			currentEcoCode = getAppState().repertoireState.reviewState.lastEcoCode;
		} else {
			currentLine =
				getAppState().repertoireState.browsingState.sidebarState.moveLog;
			currentEcoCode =
				getAppState().repertoireState.browsingState.sidebarState.lastEcoCode;
		}
		return [
			currentLine,
			currentEcoCode ? getAppropriateEcoName(currentEcoCode.fullName)[0] : null,
			currentEcoCode
				? last(getAppropriateEcoName(currentEcoCode.fullName))
				: null,
		];
	});
	return (
		<FadeInOut
			style={s(c.row)}
			class={clsx(
				"row max-w-full justify-between <lg:items-center <md:padding-sidebar w-full",
			)}
			open={
				!isEmpty(currentLine()) &&
				(sidebarMode() === "browse" ||
					sidebarMode() === "review" ||
					sidebarMode() === "build")
			}
		>
			<Show when={ecoName()} fallback={<div />}>
				{(ecoName) => {
					return (
						<div class="col shrink-0 justify-start">
							<p class="text-sm lg:text-base text-tertiary lg:text-secondary font-semibold">
								{ecoName()}
							</p>
							<Show when={responsive().bp >= BP.lg}>
								<FadeInOut open={!isEmpty(ecoVariation())}>
									<p class="text-tertiary pt-2 text-sm">{ecoVariation()}</p>
								</FadeInOut>
							</Show>
						</div>
					);
				}}
			</Show>
			<MoveLog />
		</FadeInOut>
	);
};
