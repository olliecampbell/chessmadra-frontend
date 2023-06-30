import Cookies from "js-cookie";
import { fetchUser, JWT_COOKIE_KEY, TEMP_USER_UUID } from "~/utils/auth";
import { User } from "~/utils/models";
import { uuid4 } from "@sentry/utils";
import { getAppState } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { createEffect, JSXElement, onMount } from "solid-js";

const AuthHandler = ({ children }: { children: JSXElement }) => {
  // let [user, authStatus, token, tempUserUuid, quick] = useAppState((s) => [
  //   s.userState.user,
  //   s.userState.authStatus,
  //   s.userState.token,
  //   s.userState.tempUserUuid,
  //   s.userState.quick,
  // ]);
  const userState = getAppState().userState;
  // let subscribeAfterSignup = AppStore.createSignal((s) => s.subscribeAfterSignup);
  createEffect(() => {
    if (userState.token) {
      Cookies.set(JWT_COOKIE_KEY, userState.token, { expires: 5000 });
    }
    if (userState.tempUserUuid) {
      Cookies.set(TEMP_USER_UUID, userState.tempUserUuid, { expires: 5000 });
    }
  });
  onMount(() => {
    userState.quick((s) => {
      const cookieToken = Cookies.get(JWT_COOKIE_KEY);
      if (cookieToken) {
        s.token = cookieToken;
      } else {
        s.authStatus = AuthStatus.Unauthenticated;
      }
      const tempUserUuid = Cookies.get(TEMP_USER_UUID);
      if (tempUserUuid) {
        s.tempUserUuid = tempUserUuid;
      } else {
        s.tempUserUuid = uuid4();
      }
    });
  });
  createEffect(() => {
    (async () => {
      if (
        userState.authStatus === AuthStatus.Initial ||
        userState.authStatus === AuthStatus.Unauthenticated
      ) {
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
            if (status === 401 || status === 500) {
              userState.quick((s) => {
                s.token = undefined;
                s.user = undefined;
                s.authStatus = AuthStatus.Unauthenticated;
                Cookies.remove(JWT_COOKIE_KEY);
                Cookies.remove(TEMP_USER_UUID);
              });
            }
          });
      }
    })();
  });
  return children;
};

export default AuthHandler;
