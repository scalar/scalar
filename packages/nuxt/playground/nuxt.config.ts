// import content from '../../../specifications/scalar-galaxy-3.1.json'

export default defineNuxtConfig({
  modules: ['../src/module'],
  scalarConfig: {
    spec: {
      url: 'https://cdn.scalar.com/spec/openapi_petstore.json',
      // content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
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
  devtools: { enabled: true },
  devServer: {
    port: 5062,
  },
})
