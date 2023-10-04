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
import { BASE_FRONTEND_URL } from "~/utils/base_url";

export const PrivacyPolicyAndTermsView = (props: { pastLimit: boolean }) => {
	const [loading, setLoading] = createSignal(false);
	return (
		<SidebarTemplate
			actions={[
				{
					onPress: () => {
						window.open(
  						`${BASE_FRONTEND_URL}/privacy-policy.html`,
              "_blank",
						)
					},
					text: "View Privacy Policy",
					style: "primary",
				},
				{
					onPress: () => {
						window.open(
  						`${BASE_FRONTEND_URL}/terms-and-conditions.html`,
              "_blank",
						)
					},
					text: "View Terms of Use",
					style: "primary",
				},
			]}
			header={"Privacy Policy and Terms of Use"}
			bodyPadding={true}
			loading={loading()}
		>
		</SidebarTemplate>
	);
};
