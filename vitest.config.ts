import swc from "unplugin-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["**/*.ts"],
      exclude: [
        "**/__tests__/**",
        "**/*.spec.ts",
        "/dist/**",
        "*.config.*ts",
        "/scripts/**",
        "/node_modules/**",
        "**/dtos/**",
        "**/infra/http/**",
        "**/infra/database/**"
      ]
    }
  },
  plugins: [
    tsconfigPaths(),
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: "es6" }
    })
  ]
});
