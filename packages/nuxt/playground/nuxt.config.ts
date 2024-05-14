import type { NuxtConfig } from 'nuxt/schema'

export default defineNuxtConfig({
  modules: ['../src/module'],
  scalar: {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
    pathRouting: {
      basePath: '/galaxy',
    },
    configurations: [
      {
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
        },
        pathRouting: {
          basePath: '/yaml',
        },
      },
      {
        spec: {
          url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.json',
        },
        pathRouting: {
          basePath: '/json',
        },
      },
    ],
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  devtools: { enabled: true },
  devServer: {
    port: 5062,
  },
} as NuxtConfig)
