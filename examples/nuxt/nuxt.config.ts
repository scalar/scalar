import { type NuxtConfig, defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@scalar/nuxt'],
  telemetry: false,
  scalar: {
    configurations: [
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=yaml',
        pathRouting: {
          basePath: '/yaml',
        },
      },
      {
        url: 'https://registry.scalar.com/@scalar/apis/galaxy/latest?format=json',
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
