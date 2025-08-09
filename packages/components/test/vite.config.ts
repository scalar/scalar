import { defineConfig } from 'vite'

// Super simple vite config to serve the storybook static files for playwright

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    port: 5100,
    allowedHosts: ['host.docker.internal', '127.0.0.1', 'localhost'],
  },
})
