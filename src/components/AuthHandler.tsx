import { Preferences } from "@capacitor/preferences";
import { JSXElement, createEffect, onMount } from "solid-js";
import { getAppState } from "~/utils/app_state";
import { fetchUser } from "~/utils/auth";
import { JWT_COOKIE_KEY, TEMP_USER_UUID } from "~/utils/cookies";
import { User } from "~/utils/models";
import { AuthStatus } from "~/utils/user_state";

const AuthHandler = ({ children }: { children: JSXElement }) => {
	const userState = getAppState().userState;
	onMount(() => {
		getAppState()
			.userState.loadAuthData()
			.then(() => {
				fetchUser()
					.then((user: User) => {
						console.log("fetched user", user);
						userState.quick((s) => {
							s.token = userState.token;
							s.setUser(user);
							s.authStatus = AuthStatus.Authenticated;
						});
					})
					.catch((e) => {
						console.log("error fetching user", e);
						const status = e?.response?.status || 0;
						if (status === 401) {
							userState.quick((s) => {
								s.logout();
							});
						}
					});
			});
	});

	return children;
};

export default AuthHandler;
