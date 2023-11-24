// vite.config.ts
import vue from "file:///Users/hanspagel/Documents/Projects/scalar/node_modules/.pnpm/@vitejs+plugin-vue@4.4.0_vite@4.4.11_vue@3.3.4/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { URL, fileURLToPath } from "node:url";
import * as path from "path";
import { defineConfig } from "file:///Users/hanspagel/Documents/Projects/scalar/node_modules/.pnpm/vite@4.4.11_@types+node@20.6.3/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/hanspagel/Documents/Projects/scalar/node_modules/.pnpm/vite-plugin-dts@3.6.3_@types+node@20.6.3_typescript@5.2.2_vite@4.4.11/node_modules/vite-plugin-dts/dist/index.mjs";

// package.json
var package_default = {
  name: "@scalar/components",
  description: "Scalars component library",
  version: "0.0.1",
  dependencies: {
    "@headlessui/vue": "^1.7.16",
    "@vueuse/core": "^10.4.1",
    "@xmldom/xmldom": "^0.8.4",
    cva: "1.0.0-beta.1",
    nanoid: "^5.0.1",
    "tailwind-merge": "^2.0.0",
    vue: "^3.3.4"
  },
  devDependencies: {
    "@etchteam/storybook-addon-css-variables-theme": "^1.5.1",
    "@scalar/themes": "workspace:^",
    "@storybook/addon-essentials": "^7.5.2",
    "@storybook/addon-interactions": "^7.5.2",
    "@storybook/addon-links": "^7.5.2",
    "@storybook/blocks": "^7.5.2",
    "@storybook/testing-library": "^0.2.2",
    "@storybook/vue3": "^7.5.2",
    "@storybook/vue3-vite": "^7.5.2",
    "@tsconfig/node18": "^18.2.2",
    "@types/jsdom": "^21.1.3",
    "@types/node": "^20.6.3",
    "@vitejs/plugin-vue": "^4.4.0",
    "@vue/test-utils": "^2.4.1",
    "@vue/tsconfig": "^0.4.0",
    autoprefixer: "^10.4.16",
    jsdom: "^22.1.0",
    "npm-run-all2": "^6.1.1",
    plugins: "^0.4.2",
    postcss: "^8.4.31",
    react: "^18.2.0",
    "react-dom": "^18.2.0",
    storybook: "^7.5.2",
    "storybook-dark-mode": "^3.0.1",
    tailwindcss: "^3.3.3",
    "ts-node": "^10.9.1",
    typescript: "^5.2.2",
    vite: "^4.4.11",
    "vite-plugin-dts": "^3.6.3",
    "vite-plugin-scope-tailwind": "^1.1.6",
    vitest: "^0.34.4",
    "vue-tsc": "^1.8.19"
  },
  exports: {
    ".": {
      import: "./dist/index.js",
      require: "./dist/index.umd.cjs"
    },
    "./style.css": {
      import: "./dist/style.css",
      require: "./dist/style.css"
    }
  },
  files: [
    "dist"
  ],
  license: "MIT",
  main: "./dist/index.umd.cjs",
  module: "./dist/index.js",
  private: false,
  scripts: {
    build: 'run-p types:check "build-only {@}" --',
    "build-only": "vite build",
    "build:storybook": "storybook build",
    dev: "storybook dev -p 6006",
    format: "pnpm prettier --write .",
    "format:check": "pnpm prettier --check .",
    "lint:check": "eslint .",
    "lint:fix": "eslint .  --fix",
    storybook: "storybook dev -p 6006",
    test: "vitest",
    "typegen:icons": "ts-node ./src/scripts/typegen.ts",
    "types:check": "vue-tsc --noEmit  --composite false"
  },
  type: "module",
  types: "./dist/index.d.ts"
};

// vite.config.ts
var __vite_injected_original_dirname = "/Users/hanspagel/Documents/Projects/scalar/packages/components";
var __vite_injected_original_import_meta_url = "file:///Users/hanspagel/Documents/Projects/scalar/packages/components/vite.config.ts";
var vite_config_default = defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: "./src/index.ts",
      name: "@scalar/components",
      formats: ["es", "cjs", "umd"],
      fileName: "index"
      // the proper extensions will be added
      // fileName: 'my-lib',
    },
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "src/index.ts")
      },
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue", ...Object.keys(package_default.dependencies || {})],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        exports: "named",
        globals: {
          vue: "Vue"
        }
      }
    }
  },
  plugins: [
    vue(),
    // scopeTailwind(),
    dts({ insertTypesEntry: true, tsconfigPath: "tsconfig.build.json" })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2hhbnNwYWdlbC9Eb2N1bWVudHMvUHJvamVjdHMvc2NhbGFyL3BhY2thZ2VzL2NvbXBvbmVudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9oYW5zcGFnZWwvRG9jdW1lbnRzL1Byb2plY3RzL3NjYWxhci9wYWNrYWdlcy9jb21wb25lbnRzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9oYW5zcGFnZWwvRG9jdW1lbnRzL1Byb2plY3RzL3NjYWxhci9wYWNrYWdlcy9jb21wb25lbnRzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyBVUkwsIGZpbGVVUkxUb1BhdGggfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcblxuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbidcblxuLy8gaW1wb3J0IHNjb3BlVGFpbHdpbmQgZnJvbSAndml0ZS1wbHVnaW4tc2NvcGUtdGFpbHdpbmQnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgLy8gQ291bGQgYWxzbyBiZSBhIGRpY3Rpb25hcnkgb3IgYXJyYXkgb2YgbXVsdGlwbGUgZW50cnkgcG9pbnRzXG4gICAgICBlbnRyeTogJy4vc3JjL2luZGV4LnRzJyxcbiAgICAgIG5hbWU6ICdAc2NhbGFyL2NvbXBvbmVudHMnLFxuICAgICAgZm9ybWF0czogWydlcycsICdjanMnLCAndW1kJ10sXG4gICAgICBmaWxlTmFtZTogJ2luZGV4JyxcbiAgICAgIC8vIHRoZSBwcm9wZXIgZXh0ZW5zaW9ucyB3aWxsIGJlIGFkZGVkXG4gICAgICAvLyBmaWxlTmFtZTogJ215LWxpYicsXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXG4gICAgICB9LFxuICAgICAgLy8gbWFrZSBzdXJlIHRvIGV4dGVybmFsaXplIGRlcHMgdGhhdCBzaG91bGRuJ3QgYmUgYnVuZGxlZFxuICAgICAgLy8gaW50byB5b3VyIGxpYnJhcnlcbiAgICAgIGV4dGVybmFsOiBbJ3Z1ZScsIC4uLk9iamVjdC5rZXlzKHBrZy5kZXBlbmRlbmNpZXMgfHwge30pXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBQcm92aWRlIGdsb2JhbCB2YXJpYWJsZXMgdG8gdXNlIGluIHRoZSBVTUQgYnVpbGRcbiAgICAgICAgLy8gZm9yIGV4dGVybmFsaXplZCBkZXBzXG4gICAgICAgIGV4cG9ydHM6ICduYW1lZCcsXG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICB2dWU6ICdWdWUnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgLy8gc2NvcGVUYWlsd2luZCgpLFxuICAgIGR0cyh7IGluc2VydFR5cGVzRW50cnk6IHRydWUsIHRzY29uZmlnUGF0aDogJ3RzY29uZmlnLmJ1aWxkLmpzb24nIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL3NyYycsIGltcG9ydC5tZXRhLnVybCkpLFxuICAgIH0sXG4gIH0sXG59KVxuIiwgIntcbiAgXCJuYW1lXCI6IFwiQHNjYWxhci9jb21wb25lbnRzXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJTY2FsYXJzIGNvbXBvbmVudCBsaWJyYXJ5XCIsXG4gIFwidmVyc2lvblwiOiBcIjAuMC4xXCIsXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBoZWFkbGVzc3VpL3Z1ZVwiOiBcIl4xLjcuMTZcIixcbiAgICBcIkB2dWV1c2UvY29yZVwiOiBcIl4xMC40LjFcIixcbiAgICBcIkB4bWxkb20veG1sZG9tXCI6IFwiXjAuOC40XCIsXG4gICAgXCJjdmFcIjogXCIxLjAuMC1iZXRhLjFcIixcbiAgICBcIm5hbm9pZFwiOiBcIl41LjAuMVwiLFxuICAgIFwidGFpbHdpbmQtbWVyZ2VcIjogXCJeMi4wLjBcIixcbiAgICBcInZ1ZVwiOiBcIl4zLjMuNFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBldGNodGVhbS9zdG9yeWJvb2stYWRkb24tY3NzLXZhcmlhYmxlcy10aGVtZVwiOiBcIl4xLjUuMVwiLFxuICAgIFwiQHNjYWxhci90aGVtZXNcIjogXCJ3b3Jrc3BhY2U6XlwiLFxuICAgIFwiQHN0b3J5Ym9vay9hZGRvbi1lc3NlbnRpYWxzXCI6IFwiXjcuNS4yXCIsXG4gICAgXCJAc3Rvcnlib29rL2FkZG9uLWludGVyYWN0aW9uc1wiOiBcIl43LjUuMlwiLFxuICAgIFwiQHN0b3J5Ym9vay9hZGRvbi1saW5rc1wiOiBcIl43LjUuMlwiLFxuICAgIFwiQHN0b3J5Ym9vay9ibG9ja3NcIjogXCJeNy41LjJcIixcbiAgICBcIkBzdG9yeWJvb2svdGVzdGluZy1saWJyYXJ5XCI6IFwiXjAuMi4yXCIsXG4gICAgXCJAc3Rvcnlib29rL3Z1ZTNcIjogXCJeNy41LjJcIixcbiAgICBcIkBzdG9yeWJvb2svdnVlMy12aXRlXCI6IFwiXjcuNS4yXCIsXG4gICAgXCJAdHNjb25maWcvbm9kZTE4XCI6IFwiXjE4LjIuMlwiLFxuICAgIFwiQHR5cGVzL2pzZG9tXCI6IFwiXjIxLjEuM1wiLFxuICAgIFwiQHR5cGVzL25vZGVcIjogXCJeMjAuNi4zXCIsXG4gICAgXCJAdml0ZWpzL3BsdWdpbi12dWVcIjogXCJeNC40LjBcIixcbiAgICBcIkB2dWUvdGVzdC11dGlsc1wiOiBcIl4yLjQuMVwiLFxuICAgIFwiQHZ1ZS90c2NvbmZpZ1wiOiBcIl4wLjQuMFwiLFxuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMTZcIixcbiAgICBcImpzZG9tXCI6IFwiXjIyLjEuMFwiLFxuICAgIFwibnBtLXJ1bi1hbGwyXCI6IFwiXjYuMS4xXCIsXG4gICAgXCJwbHVnaW5zXCI6IFwiXjAuNC4yXCIsXG4gICAgXCJwb3N0Y3NzXCI6IFwiXjguNC4zMVwiLFxuICAgIFwicmVhY3RcIjogXCJeMTguMi4wXCIsXG4gICAgXCJyZWFjdC1kb21cIjogXCJeMTguMi4wXCIsXG4gICAgXCJzdG9yeWJvb2tcIjogXCJeNy41LjJcIixcbiAgICBcInN0b3J5Ym9vay1kYXJrLW1vZGVcIjogXCJeMy4wLjFcIixcbiAgICBcInRhaWx3aW5kY3NzXCI6IFwiXjMuMy4zXCIsXG4gICAgXCJ0cy1ub2RlXCI6IFwiXjEwLjkuMVwiLFxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjIuMlwiLFxuICAgIFwidml0ZVwiOiBcIl40LjQuMTFcIixcbiAgICBcInZpdGUtcGx1Z2luLWR0c1wiOiBcIl4zLjYuM1wiLFxuICAgIFwidml0ZS1wbHVnaW4tc2NvcGUtdGFpbHdpbmRcIjogXCJeMS4xLjZcIixcbiAgICBcInZpdGVzdFwiOiBcIl4wLjM0LjRcIixcbiAgICBcInZ1ZS10c2NcIjogXCJeMS44LjE5XCJcbiAgfSxcbiAgXCJleHBvcnRzXCI6IHtcbiAgICBcIi5cIjoge1xuICAgICAgXCJpbXBvcnRcIjogXCIuL2Rpc3QvaW5kZXguanNcIixcbiAgICAgIFwicmVxdWlyZVwiOiBcIi4vZGlzdC9pbmRleC51bWQuY2pzXCJcbiAgICB9LFxuICAgIFwiLi9zdHlsZS5jc3NcIjoge1xuICAgICAgXCJpbXBvcnRcIjogXCIuL2Rpc3Qvc3R5bGUuY3NzXCIsXG4gICAgICBcInJlcXVpcmVcIjogXCIuL2Rpc3Qvc3R5bGUuY3NzXCJcbiAgICB9XG4gIH0sXG4gIFwiZmlsZXNcIjogW1xuICAgIFwiZGlzdFwiXG4gIF0sXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcIm1haW5cIjogXCIuL2Rpc3QvaW5kZXgudW1kLmNqc1wiLFxuICBcIm1vZHVsZVwiOiBcIi4vZGlzdC9pbmRleC5qc1wiLFxuICBcInByaXZhdGVcIjogZmFsc2UsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJidWlsZFwiOiBcInJ1bi1wIHR5cGVzOmNoZWNrIFxcXCJidWlsZC1vbmx5IHtAfVxcXCIgLS1cIixcbiAgICBcImJ1aWxkLW9ubHlcIjogXCJ2aXRlIGJ1aWxkXCIsXG4gICAgXCJidWlsZDpzdG9yeWJvb2tcIjogXCJzdG9yeWJvb2sgYnVpbGRcIixcbiAgICBcImRldlwiOiBcInN0b3J5Ym9vayBkZXYgLXAgNjAwNlwiLFxuICAgIFwiZm9ybWF0XCI6IFwicG5wbSBwcmV0dGllciAtLXdyaXRlIC5cIixcbiAgICBcImZvcm1hdDpjaGVja1wiOiBcInBucG0gcHJldHRpZXIgLS1jaGVjayAuXCIsXG4gICAgXCJsaW50OmNoZWNrXCI6IFwiZXNsaW50IC5cIixcbiAgICBcImxpbnQ6Zml4XCI6IFwiZXNsaW50IC4gIC0tZml4XCIsXG4gICAgXCJzdG9yeWJvb2tcIjogXCJzdG9yeWJvb2sgZGV2IC1wIDYwMDZcIixcbiAgICBcInRlc3RcIjogXCJ2aXRlc3RcIixcbiAgICBcInR5cGVnZW46aWNvbnNcIjogXCJ0cy1ub2RlIC4vc3JjL3NjcmlwdHMvdHlwZWdlbi50c1wiLFxuICAgIFwidHlwZXM6Y2hlY2tcIjogXCJ2dWUtdHNjIC0tbm9FbWl0ICAtLWNvbXBvc2l0ZSBmYWxzZVwiXG4gIH0sXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcInR5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
