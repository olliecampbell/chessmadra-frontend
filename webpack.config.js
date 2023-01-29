const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const webpack = require("webpack");
let envs = require("dotenv").config({ path: "./.env" }).parsed ?? {};

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Optionally you can enable the bundle size report.
  // It's best to do this only with production builds because it will add noticeably more time to your builds and reloads.
  // if (env.mode === "production") {
  //   config.plugins.push(
  //     new BundleAnalyzerPlugin({
  //       path: "web-report",
  //     })
  //   );
  // }

  // Use the React refresh plugin in development mode
  if (env.mode === "development") {
    config.plugins.push(new ReactRefreshWebpackPlugin({}));
    console.log("using the dotenv thing", process.env);
    let keys = {};
    let env_keys = ["SPOOF_KEY", "API_ENV"];
    for (let key of env_keys) {
      keys[`process.env.${key}`] = JSON.stringify(process.env[key]);
    }
    console.log("keys", keys);
    config.plugins.push(new webpack.DefinePlugin(keys));
  }

  return config;
};
