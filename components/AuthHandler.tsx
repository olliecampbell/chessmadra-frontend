import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { AppStore, AuthStatus } from "app/store";
import { fetchUser, JWT_COOKIE_KEY, TEMP_USER_UUID } from "app/utils/auth";
import client from "app/client";
import { User } from "app/models";
import { uuid4 } from "@sentry/utils";

const AuthHandler = ({ children }) => {
  let { user, authStatus, token, tempUserUuid } = AppStore.useState(
    (s) => s.auth
  );
  // let subscribeAfterSignup = AppStore.useState((s) => s.subscribeAfterSignup);
  console.log("token:", token);
  console.log("authStatus:", authStatus);
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
    AppStore.update((s) => {
      let cookieToken = Cookies.get(JWT_COOKIE_KEY);
      if (cookieToken) {
        s.auth.token = cookieToken;
      } else {
        s.auth.authStatus = AuthStatus.Unauthenticated;
      }
    });
  }, []);
  useEffect(() => {
    AppStore.update((s) => {
      let tempUserUuid = Cookies.get(TEMP_USER_UUID);
      if (tempUserUuid) {
        s.auth.tempUserUuid = tempUserUuid;
      } else {
        s.auth.tempUserUuid = uuid4();
      }
    });
  }, []);
  useEffect(() => {
    (async () => {
      if (authStatus === AuthStatus.Initial) {
        fetchUser()
          .then((user: User) => {
            console.log("user:", user);
            AppStore.update((s) => {
              s.auth.token = token;
              s.auth.user = user;
              s.auth.authStatus = AuthStatus.Authenticated;
            });
          })
          .catch((e) => {
            let status = e?.response?.status || 0;
            if (status < 500 && status > 400) {
              AppStore.update((s) => {
                s.auth.token = undefined;
                s.auth.user = undefined;
                s.auth.authStatus = AuthStatus.Unauthenticated;
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
