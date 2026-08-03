import { type NuxtConfig, defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',

  devtools: { enabled: false },

  modules: ['../src/module'],

  // Two configurations that fetch different documents. This exercises
  // client-side navigation between multiple Scalar routes, which used to reuse
  // the first document for every route (see issue #9718).
  scalar: {
    layout: 'default',
    configurations: [
      {
        pathRouting: { basePath: '/scalar-a' },
        url: '/spec-a.json',
      },
      {
        pathRouting: { basePath: '/scalar-b' },
        url: '/spec-b.json',
      },
    ],
  },

  // The document-reuse bug (#9718) happens during client-side navigation, so
  // render these routes on the client. This also avoids an unrelated SSR issue
  // where the reference reaches for a Node worker shim during server render.
  routeRules: {
    '/scalar-a': { ssr: false },
    '/scalar-a/**': { ssr: false },
    '/scalar-b': { ssr: false },
    '/scalar-b/**': { ssr: false },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  // The `scalar` key is provided by the module, which does not augment the Nuxt
  // config types, so cast to satisfy the type checker (same as examples/nuxt).
} as NuxtConfig)
