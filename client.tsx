import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { AppStore } from "./store";
import { camelCase } from "camel-case";
import { clearCookies } from "./utils/auth";

const client = applyCaseMiddleware(
  axios.create({
    baseURL:
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? "http://localhost:8040"
        : undefined,
  }),
  {
    preservedKeys: (input) => {
      return /^\d/.test(input);
    },
    caseFunctions: {
      camel: (s) => {
        if (/^\d/.test(s)) {
          return s;
        }
        if (s.startsWith("GAME_ID_")) {
          return s.replace("GAME_ID_", "");
        }
        if (s.startsWith("EPD_")) {
          return s.replace("EPD_", "");
        }
        return camelCase(s);
      },
    },
  }
);

client.interceptors.request.use(function (config) {
  // console.log({ url: config.url });
  if (config.url?.includes("lichess")) {
    return config;
  }
  const { token, tempUserUuid } = AppStore.getRawState().auth;
  if (token) {
    config.headers.Authorization = token;
  } else {
    config.headers["temp-user-uuid"] = tempUserUuid;
  }
  return config;
});

client.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    console.log({ error });
    if (error?.response?.status === 401) {
      AppStore.update((s) => {
        s.auth.token = undefined;
        clearCookies();
        window.location.href = `${window.location.origin}/login`;
        // window.location = "/login";
      });
    }
    return Promise.reject(error);
  }
);

export default client;
