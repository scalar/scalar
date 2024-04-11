import content from '../../../specifications/scalar-galaxy-3.1.json'

export default defineNuxtConfig({
  modules: ['../src/module'],
  scalarConfig: {
    spec: { content },
    pathRouting: {
      basePath: '/scalar',
    },
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
})
