import { A } from "@solidjs/router";
import { isNil } from "lodash-es";
import { JSXElement, createSignal } from "solid-js";
import { Puff } from "solid-spinner";
import { Button } from "~/components/Button";
import { Spacer } from "~/components/Space";
import { quick, useAppState } from "~/utils/app_state";
import { useIsMobileV2 } from "~/utils/isMobile";
import { c, stylex } from "~/utils/styles";
import { AuthStatus } from "~/utils/user_state";
import { CMText } from "./CMText";
import { CMTextInput } from "./CMTextInput";

export const AdminPageLayout = (props: { children: JSXElement }) => {
	const isMobile = useIsMobileV2();
	const [password, setPassword] = createSignal("");
	const [authStatus, user] = useAppState((s) => [
		s.userState.authStatus,
		s.userState.user,
	]);
	const _inner = () => {
		let inner = props.children;
		if (
			authStatus() === AuthStatus.Initial ||
			authStatus() === AuthStatus.Authenticating
		) {
			inner = <Puff color={c.gray[100]} />;
		}
		console.log("user email", user);
		if (user && isNil(user()?.email)) {
			inner = (
				<div style={stylex()}>
					<CMText style={stylex()}>
						Looks like you're not logged in, go
						<CMText style={stylex(c.fg(c.blue[55]), c.weightSemiBold, c.px(4))}>
							<A href="/login">log in</A>
						</CMText>
						first and then come back here:{" "}
					</CMText>
				</div>
			);
		} else if (user && !user()?.isAdmin) {
			inner = (
				<div style={stylex(c.oldContainerStyles(isMobile()))}>
					<CMText style={stylex()}>
						You don't seem to be an admin. Do you have the password?
					</CMText>
					<Spacer height={12} />
					<CMTextInput
						value={password()}
						setValue={setPassword}
						style={stylex()}
						placeholder="Password"
					/>
					<Spacer height={12} />
					<Button
						style={stylex()}
						onPress={() => {
							quick((s) => {
								s.adminState.becomeAdmin(password());
							});
						}}
					>
						Become admin
					</Button>
				</div>
			);
		}
		return inner;
	};
	return (
		<div style={stylex(c.oldContainerStyles(isMobile()), c.pt(48), c.px(24))}>
			{_inner()}
		</div>
	);
};
