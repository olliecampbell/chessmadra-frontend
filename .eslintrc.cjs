module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ["solid"],
  extends: ["eslint:recommended", "plugin:solid/typescript"],

  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {},
};
