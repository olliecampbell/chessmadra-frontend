import Cookies from "js-cookie";
import { fetchUser, JWT_COOKIE_KEY, TEMP_USER_UUID } from "app/utils/auth";
import { User } from "app/models";
import { uuid4 } from "@sentry/utils";
import { useEffect } from "react";
import { useAppState } from "app/utils/app_state";
import { AuthStatus } from "app/utils/user_state";

const AuthHandler = ({ children }) => {
  let [user, authStatus, token, tempUserUuid, quick] = useAppState((s) => [
    s.userState.user,
    s.userState.authStatus,
    s.userState.token,
    s.userState.tempUserUuid,
    s.userState.quick,
  ]);
  // let subscribeAfterSignup = AppStore.useState((s) => s.subscribeAfterSignup);
  useEffect(() => {
    if (token) {
      Cookies.set(JWT_COOKIE_KEY, token, { expires: 5000 });
    }
  }, [token]);
  useEffect(() => {
    if (tempUserUuid) {
      Cookies.set(TEMP_USER_UUID, tempUserUuid, { expires: 5000 });
    }
  }, [tempUserUuid]);
  useEffect(() => {
    quick((s) => {
      let cookieToken = Cookies.get(JWT_COOKIE_KEY);
      if (cookieToken) {
        s.token = cookieToken;
      } else {
        s.authStatus = AuthStatus.Unauthenticated;
      }
    });
  }, []);
  useEffect(() => {
    quick((s) => {
      let tempUserUuid = Cookies.get(TEMP_USER_UUID);
      if (tempUserUuid) {
        s.tempUserUuid = tempUserUuid;
      } else {
        s.tempUserUuid = uuid4();
      }
    });
  }, []);
  useEffect(() => {
    (async () => {
      if (authStatus === AuthStatus.Initial) {
        fetchUser()
          .then((user: User) => {
            quick((s) => {
              s.token = token;
              s.setUser(user);
              s.authStatus = AuthStatus.Authenticated;
            });
          })
          .catch((e) => {
            let status = e?.response?.status || 0;
            if (status === 401) {
              quick((s) => {
                s.token = undefined;
                s.user = undefined;
                s.authStatus = AuthStatus.Unauthenticated;
                Cookies.remove(JWT_COOKIE_KEY);
              });
            }
          });
      }
    })();
  }, [authStatus, token]);
  return children;
};

export default AuthHandler;
