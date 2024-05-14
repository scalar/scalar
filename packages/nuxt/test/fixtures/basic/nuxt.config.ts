import type { NuxtConfig } from 'nuxt/schema'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  scalar: {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },

    pathRouting: {
      basePath: '/scalar',
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
} as NuxtConfig)
