import content from '../../../../../specifications/scalar-galaxy-3.1.json'
import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
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
})
