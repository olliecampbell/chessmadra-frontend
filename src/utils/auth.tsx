import client from "~/utils/client";
import axios from "axios";
import Cookies from "js-cookie";

export const JWT_COOKIE_KEY = "jwt-token";
export const TEMP_USER_UUID = "temp-user-uuid";

export async function signupUser(email: string, password: string) {
  // @ts-ignore
  let application = Store.getRawState().meta.applicationMeta?.application;
  let {
    // @ts-ignore
    data: { token, user },
  } = await axios.post("/api/signup", {
    email,
    password,
    application,
  });
  // @ts-ignore
  Store.update((s) => {
    s.auth.token = token;
    s.auth.user = user;
    // @ts-ignore
    s.auth.authStatus = AuthStatus.Authenticated;
  });
}

export async function fetchUser() {
  let { data: user } = await client.get("/api/user");
  return user;
}

export function clearCookies() {
  Cookies.remove(JWT_COOKIE_KEY);
}
