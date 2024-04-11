import {
  addComponent,
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendPages,
} from '@nuxt/kit'
import { type ReferenceConfiguration } from '@scalar/api-reference'

// Module options TypeScript interface definition
export type ModuleOptions = Omit<
  ReferenceConfiguration,
  'layout' | 'isEditable' | 'onSpecUpdate'
>

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@scalar/nuxt',
    configKey: 'scalarConfig',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    darkMode: true,
    pathRouting: {
      basePath: '/scalar',
    },
    showSidebar: true,
  },
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    let isOpenApiEnabled = false

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
        name: 'API Documentation',
        path: '/scalar:pathMatch(.*)*',
        meta: {
          configuration: _options,
          isOpenApiEnabled,
        },
        file: resolver.resolve('./runtime/pages/Scalar.vue'),
      })
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolver.resolve('./runtime/plugins/hydrateClient'))
  },
})
