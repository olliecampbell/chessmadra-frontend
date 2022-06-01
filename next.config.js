// @generated: @expo/next-adapter@3.1.21
// Learn more: https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/guides/using-nextjs.md#withexpo

const { withExpo } = require("@expo/next-adapter");
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  withExpo(
    {
      projectRoot: __dirname,
    },
    {}
  )
);
