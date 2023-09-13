import { isEmpty } from "lodash-es";
import { Show } from "solid-js";
import { Spacer } from "~/components/Space";
import { quick, useSidebarState } from "~/utils/app_state";
import { SidebarTemplate } from "./SidebarTemplate";
import { PlayFromHere } from "./TargetCoverageReachedView";

export const TransposedView = () => {
	const [planSections] = useSidebarState(([s]) => [s.planSections]);
	console.log({ planSections });

	return (
		<SidebarTemplate
			header={"You've transposed into an existing line"}
			actions={[
				{
					onPress: () => {
						quick((s) => {
							s.repertoireState.browsingState.addPendingLine();
						});
					},
					style: "primary",
					text: "Save this move order to my repertoire",
				},
			]}
			bodyPadding={true}
		>
			<>
				<p class={"body-text"}>
					You don't need to add anything else. All of your moves from this
					position will still apply
				</p>
				<Show when={!isEmpty(planSections)}>
					<>
						<Spacer height={24} />
						<PlayFromHere isolated />
					</>
				</Show>
			</>
		</SidebarTemplate>
	);
};
