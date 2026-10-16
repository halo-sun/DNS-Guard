module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "no-unused-vars": "off",
    "no-undef": "off",
    "no-redeclare": "off",
    "react-refresh/only-export-components": "off",
  },
};
