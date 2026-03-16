import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    projects: ["integrations/*", "packages/*", "projects/*"],
  },
});
