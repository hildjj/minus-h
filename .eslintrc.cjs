module.exports = {
  root: true,
  ignorePatterns: [
    "coverage/",
    "lib/",
  ],
  extends: ["@cto.af/eslint-config/typescript"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
    project: 'tsconfig.json',
  },
};
