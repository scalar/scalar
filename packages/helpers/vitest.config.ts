import { alias } from "@scalar/build-tooling/vite";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [],
  resolve: {
    alias: alias(import.meta.url),
  },
  server: {
    port: 9000,
  },
  test: {
    environment: "jsdom",
  },
});
