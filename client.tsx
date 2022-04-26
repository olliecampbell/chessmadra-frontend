import axios from "axios";
import applyCaseMiddleware from "axios-case-converter";
import { AppStore } from "./store";

const client = applyCaseMiddleware(
  axios.create({
    baseURL:
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? "http://localhost:8040"
        : undefined,
  })
);

client.interceptors.request.use(function (config) {
  const token = AppStore.getRawState().auth.token;
  config.headers.Authorization = token;
  return config;
});

export default client;
