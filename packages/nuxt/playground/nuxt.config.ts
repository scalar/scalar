export default defineNuxtConfig({
  modules: ['../src/module'],
  scalarConfig: {},
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
