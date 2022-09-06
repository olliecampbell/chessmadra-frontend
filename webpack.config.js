const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

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
  }

  return config;
};
