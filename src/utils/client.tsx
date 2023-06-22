import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { camelCase } from "camel-case";
import { getAppState, quick } from "./app_state";
import { clearCookies } from "./auth";

const EPD_REGEX = /.*\/.*\/.*\/.*\/.*\/.*\/.*\/.*/;

let baseURL = undefined;
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  baseURL = "http://localhost:8040";
}
if (import.meta.env.VITE_API_ENV == "production") {
  baseURL = "https://chessbook.com";
}
const client = applyCaseMiddleware(
  axios.create({
    baseURL,
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
        if (EPD_REGEX.test(s)) {
          return s;
        }
        return camelCase(s);
      },
    },
  }
);

client.interceptors.request.use(function (config) {
  // console.log({ url: config.url });
  if (config.url?.includes("lichess") && !config.url?.includes("oauth")) {
    return config;
  }
  const { token, tempUserUuid } = getAppState().userState;
  const { spoofedEmail } = getAppState().adminState;
  const spoofKey = import.meta.env.VITE_SPOOF_KEY;
  if (spoofedEmail.value) {
    config.headers["spoof-user-email"] = spoofedEmail.value;
    config.headers["spoof-key"] = spoofKey;
  }
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
      quick((s) => {
        s.userState.token = undefined;
        clearCookies();
        window.location.href = `${window.location.origin}/login`;
        // window.location = "/login";
      });
    }
    return Promise.reject(error);
  }
);

export default client;
