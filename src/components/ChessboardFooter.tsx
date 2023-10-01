import { isEmpty, isNil, last } from "lodash-es";
import { Show, createEffect } from "solid-js";
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

export const ChessboardFooter = () => {
	const responsive = useResponsiveV2();
	const [sidebarMode] = useSidebarState(([s]) => [s.mode]);
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
				? last(getAppropriateEcoName(currentEcoCode.fullName)[1])
				: null,
		];
	});
	return (
		<FadeInOut
			style={s(c.row)}
			class={clsx(
				"row max-w-full  items-center <md:padding-sidebar w-full <md:min-h-6",
			)}
			open={
				!isEmpty(currentLine()) &&
				(sidebarMode() === "browse" ||
					sidebarMode() === "review" ||
					sidebarMode() === "build")
			}
		>
			<Show when={ecoName()}>
				{(ecoName) => {
					return (
						<>
							<p class="text-xs lg:text-sm text-tertiary lg:text-secondary font-semibold shrink-0">
								{ecoName()}
							</p>
						</>
					);
				}}
			</Show>
			<MoveLog hideLeftDivider={isNil(ecoName())} />
		</FadeInOut>
	);
};
