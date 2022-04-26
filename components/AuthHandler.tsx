import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { AppStore, AuthStatus } from "app/store";
import { fetchUser, JWT_COOKIE_KEY } from "app/utils/auth";
import client from "app/client";
import { User } from "app/models";

const AuthHandler = ({ children }) => {
  let { user, authStatus, token } = AppStore.useState((s) => s.auth);
  // let subscribeAfterSignup = AppStore.useState((s) => s.subscribeAfterSignup);
  console.log("token:", token);
  console.log("authStatus:", authStatus);
  useEffect(() => {
    if (token) {
      Cookies.set(JWT_COOKIE_KEY, token);
    }
  }, [token]);
  useEffect(() => {
    AppStore.update((s) => {
      let cookieToken = Cookies.get(JWT_COOKIE_KEY);
      if (cookieToken) {
        s.auth.token = cookieToken;
      } else {
        s.auth.authStatus = AuthStatus.Unauthenticated;
      }
    });
  });
  useEffect(() => {
    (async () => {
      if (authStatus === AuthStatus.Initial && token) {
        console.log("FETCHING");
        console.log("token:", token);
        fetchUser(token)
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
