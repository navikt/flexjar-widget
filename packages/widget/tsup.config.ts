import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["@navikt/nav-dekoratoren-moduler"],
  loader: {
    ".module.css": "local-css",
    ".css": "css",
  },
});
