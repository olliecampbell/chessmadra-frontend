import { SidebarTemplate } from "./SidebarTemplate";

export const AccountDeletionView = () => {
	return (
		<SidebarTemplate actions={[]} header={"Account deletion"} bodyPadding>
			<p>
				To request deletion of your account, please email us at
				support@chessbook.com , and specify the email address you used to create
				your account. We will delete your account within 5 business days.
			</p>
		</SidebarTemplate>
	);
};
