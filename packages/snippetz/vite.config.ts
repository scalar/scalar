import { alias } from "@scalar/build-tooling/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    alias: alias(import.meta.url),
  },
});
