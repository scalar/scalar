import { type NuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',

  devtools: { enabled: false },

  modules: ['../src/module'],

  scalar: {
    spec: {
      url: 'https://cdn.jsdelivr.net/npm/@scalar/galaxy/dist/latest.yaml',
    },
    pathRouting: {
      basePath: '/_scalar',
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
} as NuxtConfig)
