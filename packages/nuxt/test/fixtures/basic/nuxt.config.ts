import type { NuxtConfig } from 'nuxt/schema'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  scalar: {
    spec: {
      url: 'https://cdn.scalar.com/spec/openapi_petstore.json',
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
