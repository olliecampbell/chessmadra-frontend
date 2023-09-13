import { quick } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { LoginSidebar } from "../LoginSidebar";
import { SidebarTemplate } from "../SidebarTemplate";
import { Spacer } from "../Space";

export const OpeningTrainerRedirect = () => {
	return (
		<SidebarTemplate
			header="The opening builder has moved!"
			bodyPadding={true}
			actions={[
				{
					onPress: () => {
						quick((s) => {
							window.location.href = "https://chessbook.com/";
						});
					},
					style: "focus",
					text: "Take me there",
				},
				{
					onPress: () => {
						quick((s) => {
							s.trainersState.pushView(LoginSidebar, {
								props: { authType: "register" },
							});
						});
					},
					style: "primary",
					text: "Create an account first",
				},
			]}
		>
			<p class={"body-text"}>
				This has moved over to{" "}
				<a href="https://chessbook.com/" class={clsx("underline!")}>
					www.chessbook.com
				</a>
				! If you have a repertoire that you haven't saved to an account yet, you
				should create an account first.
			</p>
			<Spacer height={12} />
		</SidebarTemplate>
	);
};
