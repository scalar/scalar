import type { NuxtConfig } from 'nuxt/schema'

export default defineNuxtConfig({
  modules: ['../src/module'],

  scalar: {
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

  imports: {
    transform: {
      exclude: [/scalar/],
    },
  },

  devtools: { enabled: true },

  devServer: {
    port: 5062,
  },

  compatibilityDate: '2024-08-20',
} as NuxtConfig)
