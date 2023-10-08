import { quick, useSidebarState } from "~/utils/app_state";
import { trackEvent } from "~/utils/trackEvent";
import { CMText } from "./CMText";
import { SidebarTemplate } from "./SidebarTemplate";

export const ConfirmDeleteRepertoire = function DeleteLineView() {
	const [side] = useSidebarState(([s]) => [s.activeSide]);
	return (
		<SidebarTemplate
			bodyPadding={true}
			header="Are you sure?"
			actions={[
				{
					text: `Yes, delete my ${side()} repertoire`,
					style: "primary",
					onPress: () => {
						quick((s) => {
							s.repertoireState.deleteRepertoire(side()!);
							s.repertoireState.ui.popView();
							trackEvent("repertoire.delete_side");
						});
					},
				},
			]}
		>
			<CMText>
				This will permanently delete your {side} repertoire. This cannot be
				undone.
			</CMText>
		</SidebarTemplate>
	);
};
