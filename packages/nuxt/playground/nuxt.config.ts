// import content from '../../../specifications/scalar-galaxy-3.1.json'
import content from '../../../examples/web/src/specifications/openapi-3.1.json'

export default defineNuxtConfig({
  modules: ['../src/module'],
  scalarConfig: {
    spec: { url: 'https://cdn.scalar.com/spec/openapi_petstore.json' },
    pathRouting: {
      basePath: '/scalar',
    },
  },
  // nitro: {
  //   experimental: {
  //     openAPI: true,
  //   },
  // },
  devtools: { enabled: true },
  devServer: {
    port: 5062,
  },
})
