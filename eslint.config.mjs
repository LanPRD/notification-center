// @ts-check
import NodeConfig from "@prdev-solutions/eslint-config/node.mjs";
import globals from "globals";

export default [
  ...NodeConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    rules: {
      "no-magic-numbers": ["off"],
      complexity: ["error", 10],
      camelcase: "off"
    }
  },
  {
    files: ["**/*-repository.ts"],
    rules: {
      camelcase: "off"
    }
  }
];
