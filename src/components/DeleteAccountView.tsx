import { Bullet } from "./Bullet";
import { SidebarTemplate } from "./SidebarTemplate";
import { For, createSignal, onMount } from "solid-js";
import { getAppState, quick, useSidebarState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { isIos } from "~/utils/env";
import {
	PRODUCT_CHESSBOOK_PRO_ANNUAL,
	PRODUCT_CHESSBOOK_PRO_MONTHLY,
} from "~/utils/in_app_purchases";
import { MAX_MOVES_FREE_TIER } from "~/utils/payment";
import { trackEvent } from "~/utils/trackEvent";
import { Dialog } from "@capacitor/dialog";

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
										s.repertoireState.browsingState.popView();
										s.repertoireState.browsingState.moveSidebarState("left");
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
