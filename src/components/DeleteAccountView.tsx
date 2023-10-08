import { SidebarTemplate } from "./SidebarTemplate";
import { createSignal } from "solid-js";
import { quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { Dialog } from "@capacitor/dialog";
import { animateSidebar } from "./SidebarContainer";

export const DeleteAccountView = (props: { pastLimit: boolean }) => {
	const [loading, setLoading] = createSignal(false);
	return (
		<SidebarTemplate
			actions={[
				{
					onPress: () => {
						quick((s) => {
							s.userState.deleteAccount().then(() => {
								Dialog.alert({
									title: "Account deleted!",
									message:
										"Your account has been deleted and you have been logged out.",
								}).then(() => {
									quick((s) => {
										s.repertoireState.ui.popView();
										animateSidebar("left");
									});
								});
							});
						});
					},
					text: "Delete my account",
					style: "primary",
				},
			]}
			header={"Delete your account?"}
			bodyPadding={true}
			loading={loading()}
		>
			<p class={clsx("text-secondary leading-5 pb-2")}>
				You will lose access to your repertoire, and will not be able to recover
				your account.
			</p>
		</SidebarTemplate>
	);
};
