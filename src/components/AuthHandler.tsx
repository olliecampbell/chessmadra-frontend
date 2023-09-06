import Cookies from "js-cookie";
import { JWT_COOKIE_KEY, TEMP_USER_UUID } from "~/utils/cookies";
import { User } from "~/utils/models";
import { uuid4 } from "@sentry/utils";
import { getAppState } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { createEffect, JSXElement, onMount } from "solid-js";
import { fetchUser } from "~/utils/auth";

const AuthHandler = ({ children }: { children: JSXElement }) => {
  const userState = getAppState().userState;
  createEffect(() => {
    if (userState.token) {
      Cookies.set(JWT_COOKIE_KEY, userState.token, { expires: 5000 });
    }
    if (userState.tempUserUuid) {
      Cookies.set(TEMP_USER_UUID, userState.tempUserUuid, { expires: 5000 });
    }
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
            if (status === 401) {
              userState.quick((s) => {
                s.logout();
              });
            }
          });
      }
    })();
  });
  return children;
};

export default AuthHandler;
