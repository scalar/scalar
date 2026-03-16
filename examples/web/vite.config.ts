import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5050,
    open: true,
  },
});
