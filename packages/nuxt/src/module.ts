import {
  addComponent,
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
} from '@nuxt/kit'

import type { Configuration } from './types'

// Module options TypeScript interface definition
export type ModuleOptions = Configuration

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@scalar/nuxt',
    configKey: 'scalarConfig',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    darkMode: true,
    metaData: {
      title: 'API Documentation by Scalar',
    },
    pathRouting: {
      basePath: '/scalar',
    },
    showSidebar: true,
  },
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    let isOpenApiEnabled = false

    // Ensure we transpile api-reference css
    _nuxt.options.build.transpile.push('@scalar/api-reference')

    // Also check for Nitro OpenAPI auto generation
    _nuxt.hook('nitro:config', (config) => {
      if (config.experimental?.openAPI) isOpenApiEnabled = true
    })

    // Load the component so it can be used directly
    addComponent({
      name: 'ScalarApiReference',
      export: 'default',
      filePath: resolver.resolve('./runtime/components/ScalarApiReference.vue'),
    })

    // Add the route for the docs
    extendPages((pages) => {
      pages.push({
        name: 'scalar',
        path: _options.pathRouting?.basePath + ':pathMatch(.*)*',
        meta: {
          configuration: _options,
          isOpenApiEnabled,
        },
        file: resolver.resolve('./runtime/pages/ScalarPage.vue'),
      })
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugins/hydrateClient'))
  },
})
