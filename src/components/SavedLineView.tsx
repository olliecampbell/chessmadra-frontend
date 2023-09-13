import { filter, isNil } from "lodash-es";
import { Show } from "solid-js";
import { Puff } from "solid-spinner";
import { quick, useRepertoireState, useSidebarState } from "~/utils/app_state";
import { c } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { RepertoireCompletion } from "./RepertoireCompletion";
import { SidebarAction, useBiggestGapAction } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { Spacer } from "./Space";

export const SavedLineView = function SavedLineView() {
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const [addedLineState] = useSidebarState(([s]) => [s.addedLineState]);

	const [mode, currentLine] = useSidebarState(([s]) => [s.mode, s.moveLog]);
	const reviewCurrentLineAction: SidebarAction = {
		onPress: () => {
			trackEvent(`${mode()}.added_line_state.practice_line`);
			quick((s) => {
				s.repertoireState.reviewState.reviewLine(currentLine(), activeSide()!);
			});
		},
		text: "Practice these moves",
		style: "primary",
	};
	return (
		<Show
			when={!addedLineState().loading}
			fallback={
				<div class="row w-full justify-center pt-12">
					<Puff color={c.primaries[65]} />
				</div>
			}
		>
			<SidebarTemplate
				header={"Moves saved!"}
				bodyPadding
				actions={
					filter(
						[useBiggestGapAction(), reviewCurrentLineAction],
						(a) => !isNil(a),
					) as SidebarAction[]
				}
			>
				<RepertoireCompletion side={activeSide()!} />
				<Spacer height={12} />
			</SidebarTemplate>
		</Show>
	);
};
