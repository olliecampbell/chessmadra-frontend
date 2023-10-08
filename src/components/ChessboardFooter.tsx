import { isEmpty, isNil, last } from "lodash-es";
import { Show } from "solid-js";
import { getAppState, useMode, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";
import { FadeInOut } from "./FadeInOut";
import { MoveLog } from "./MoveLog";
import { destructure } from "@solid-primitives/destructure";
import { getAppropriateEcoName } from "~/utils/eco_codes";

export const ChessboardFooter = () => {
	const mode = useMode();
	const [currentLine, ecoName] = destructure(() => {
		let currentLine = null;
		let currentEcoCode = null;
		if (mode() === "review") {
			currentLine = getAppState().repertoireState.reviewState.moveLog;
			currentEcoCode = getAppState().repertoireState.reviewState.lastEcoCode;
		} else {
			currentLine =
				getAppState().repertoireState.browsingState.chessboard.getMoveLog();
			currentEcoCode = getAppState().repertoireState.browsingState.lastEcoCode;
		}
		return [
			currentLine,
			currentEcoCode ? getAppropriateEcoName(currentEcoCode.fullName)[0] : null,
		];
	});
	return (
		<FadeInOut
			style={stylex(c.row)}
			class={clsx(
				"row max-w-full  items-center <md:padding-sidebar w-full <md:min-h-6",
			)}
			open={
				!isEmpty(currentLine()) &&
				(mode() === "browse" || mode() === "review" || mode() === "build")
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
