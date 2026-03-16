import { defineConfig } from "vite-plus";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {},
  test: {
    environment: "jsdom",
  },
});
