// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  devtools: { enabled: true },
  devServer: {
    port: 5062,
  },
})
