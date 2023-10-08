import { isNil } from "lodash-es";
import { quick, useRepertoireState, useSidebarState } from "~/utils/app_state";
import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { SidebarAction } from "./SidebarActions";
import { SidebarTemplate } from "./SidebarTemplate";
import { animateSidebar } from "./SidebarContainer";

export const DeleteLineView = function DeleteLineView() {
	const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
	const [responses, deleting] = useRepertoireState((s) => [
		s.repertoire?.[activeSide()!].positionResponses[
			s.browsingState.chessboard.getCurrentEpd()
		],
		s.deleteMoveState.isDeletingMove,
	]);
	if (isNil(responses)) {
		return null;
	}

	const multiple = responses.length > 1;
	return (
		<SidebarTemplate
			bodyPadding={true}
			header={multiple ? "Which line do you want to delete?" : "Are you sure?"}
			actions={[
				...(responses() ?? []).map((response) => ({
					onPress: () => {
						if (deleting()) {
							return;
						}
						quick((s) => {
							s.repertoireState.deleteMove(response).then(() => {
								quick((s) => {
									animateSidebar("left");
									s.repertoireState.browsingState.sidebarState.deleteLineState.visible = false;
								});
							});
						});
					},
					style: "primary" as SidebarAction["style"],
					text: multiple
						? `Delete ${response.sanPlus} and subsequent moves`
						: `Yes I'm sure, delete ${response.sanPlus}`,
				})),
				{
					onPress: () => {
						quick((s) => {
							animateSidebar("left");
							s.repertoireState.browsingState.sidebarState.deleteLineState.visible = false;
						});
					},
					style: "primary",
					text: multiple ? "Nevermind, go back" : `No, I've changed my mind`,
				},
			]}
		>
			<div>
				<CMText style={s()}>
					{multiple
						? "Select the line you want to delete. This cannot be undone."
						: "This will also delete any moves past this one. This cannot be undone."}
				</CMText>
			</div>
		</SidebarTemplate>
	);
};
