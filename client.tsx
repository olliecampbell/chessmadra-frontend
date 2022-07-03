import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { AppStore } from "./store";
import { camelCase } from "camel-case";

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
        return camelCase(s);
      },
    },
  }
);

client.interceptors.request.use(function (config) {
  const { token, tempUserUuid } = AppStore.getRawState().auth;
  if (token) {
    config.headers.Authorization = token;
  } else {
    config.headers["temp-user-uuid"] = tempUserUuid;
  }
  return config;
});

export default client;
