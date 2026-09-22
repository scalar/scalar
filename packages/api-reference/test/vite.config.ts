import { defineConfig } from 'vite'

// Super simple vite config to serve the built Storybook files for Playwright.
// See the `preview:storybook` script, which points `vite preview` at `storybook-static`.

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    port: 6006,
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
})
