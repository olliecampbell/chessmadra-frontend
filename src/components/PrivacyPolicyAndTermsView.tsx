import { SidebarTemplate } from "./SidebarTemplate";
import { createSignal } from "solid-js";
import { BASE_FRONTEND_URL } from "~/utils/base_url";

export const PrivacyPolicyAndTermsView = () => {
	return (
		<SidebarTemplate
			actions={[
				{
					onPress: () => {
						window.open(`${BASE_FRONTEND_URL}/privacy-policy.html`, "_blank");
					},
					text: "View Privacy Policy",
					style: "primary",
				},
				{
					onPress: () => {
						window.open(
							`${BASE_FRONTEND_URL}/terms-and-conditions.html`,
							"_blank",
						);
					},
					text: "View Terms of Use",
					style: "primary",
				},
			]}
			header={"Privacy Policy and Terms of Use"}
			bodyPadding={true}
		></SidebarTemplate>
	);
};
