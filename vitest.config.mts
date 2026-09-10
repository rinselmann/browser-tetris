import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolves the `@/*` alias from tsconfig.json (native in Vite 8+).
  resolve: { tsconfigPaths: true },
  test: {
    // Logic-only by design: the game rules are pure functions over plain data.
    // There is no jsdom here, so component/UI tests are not supported yet.
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
