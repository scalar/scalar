// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-11',

  devtools: { enabled: false },

  modules: ['@scalar/nuxt'],

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
