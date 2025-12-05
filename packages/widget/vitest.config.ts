import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    alias: {
      "@navikt/nav-dekoratoren-moduler": path.resolve(
        __dirname,
        ".storybook/mocks/consentMock.ts"
      ),
    },
  },
});
