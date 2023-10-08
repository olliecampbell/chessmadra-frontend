import { Match, Show, Switch } from "solid-js";
import { Spacer } from "~/components/Space";
import { useHovering } from "~/mocks";
import {
	quick,
	useAppState,
	useMode,
	useRepertoireState,
} from "~/utils/app_state";
import { c, stylex } from "~/utils/styles";
import { trackEvent } from "~/utils/trackEvent";
import { BP, useResponsiveV2 } from "~/utils/useResponsive";
import { AuthStatus } from "~/utils/user_state";
import { CMText } from "./CMText";
import { LoginSidebar } from "./LoginSidebar";
import { Pressable } from "./Pressable";

export const SettingsButtons = () => {
	const [view] = useRepertoireState((s) => [s.ui.currentView()]);
	const [user, authStatus] = useAppState((s) => [
		s.userState.user,
		s.userState.authStatus,
	]);
	const mode = useMode();
	const needsLogin = () =>
		authStatus() === AuthStatus.Unauthenticated ||
		(authStatus() === AuthStatus.Authenticated && user()?.temporary);
	const responsive = useResponsiveV2();
	return (
		<div style={stylex(c.row, c.gap(responsive().switch(12, [BP.md, 16])))}>
			<Show when={mode() === "home" && false}>
				<SettingButton
					title={"Other tools"}
					icon={"fa-sharp fa-bars"}
					onPress={() => {
						quick((s) => {
							trackEvent("top_buttons.other_tools.clicked");
							s.navigationState.push("/directory");
						});
					}}
				/>
			</Show>
			<Switch>
				<Match when={needsLogin() && view()?.component !== LoginSidebar}>
					<SettingButton
						title={"Log in / Sign up"}
						icon={"fa-sharp fa-user"}
						onPress={() => {
							quick((s) => {
								trackEvent("top_buttons.log_in.clicked");
								s.repertoireState.ui.pushView(LoginSidebar);
							});
						}}
					/>
				</Match>
				<Match when={!needsLogin()}>
					<SettingButton
						title={"Log out"}
						icon={"fa-sharp fa-sign-out-alt"}
						onPress={() => {
							quick((s) => {
								trackEvent("top_buttons.log_out.clicked");
								s.userState.logout();
							});
						}}
					/>
				</Match>
			</Switch>
		</div>
	);
};

export const SettingButton = (props: {
	title: string;
	icon: string;
	onPress: () => void;
}) => {
	const { hovering, hoveringProps } = useHovering();
	const responsive = useResponsiveV2();
	const color = () => {
		if (hovering()) {
			return c.colors.text.secondary;
		}
		return c.colors.text.tertiary;
	};
	return (
		<Pressable
			onPress={props.onPress}
			style={stylex(
				c.row,
				c.alignCenter,
				c.px(responsive().switch(0, [BP.md, 8])),
				c.mx(responsive().switch(0, [BP.md, -8])),
				c.py(8),
				// c.bg(hovering ? c.gray[14] : c.gray[6])
			)}
			{...hoveringProps}
		>
			<i style={stylex(c.fg(color()), c.fontSize(12))} class={props.icon} />
			<Spacer width={responsive().switch(4, [BP.md, 8])} />
			<CMText style={stylex(c.fg(color()), c.weightSemiBold)}>{props.title}</CMText>
		</Pressable>
	);
};
