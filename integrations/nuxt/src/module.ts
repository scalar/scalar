import { addComponent, createResolver, defineNuxtModule, extendPages } from '@nuxt/kit'

import type { Configuration } from './types'

// Module options TypeScript interface definition
export type ModuleOptions = {
  /**
   * For multiple references, pass an array of config objects into
   * configurations. These configurations will extend over the base config
   */
  configurations: Omit<Configuration, 'devtools'>[]
  layout: string | false
} & Configuration

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@scalar/nuxt',
    configKey: 'scalar',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    darkMode: true,
    metaData: {
      title: 'API Documentation by Scalar',
    },
    pathRouting: {
      basePath: '/docs',
    },
    showSidebar: true,
    devtools: true,
    configurations: [],
    layout: false,
  },
  setup(_options, _nuxt) {
    const resolver = createResolver(import.meta.url)
    let isOpenApiEnabled = false

    /**
     * Ensure we transpile yaml
     * @see https://github.com/eemeli/yaml/issues/394#issuecomment-1151577111
     */
    _nuxt.options.build.transpile.push('yaml')

    /**
     * Disable transforming references to fix
     * redeclaration of import h
     */
    _nuxt.options.imports.transform ||= {}
    _nuxt.options.imports.transform.exclude ||= []
    _nuxt.options.imports.transform.exclude.push(/scalar/)

    /**
     * Ensure we transform these cjs dependencies, remove as they get converted to ejs
     * Last time this was fixed on the nuxt side so we removed this and it started working
     * however its back so we add this back in
     *
     * error:
     * doesn't provide an export named: 'default'
     */
    _nuxt.options.vite ||= {}
    _nuxt.options.vite.optimizeDeps ||= {}
    _nuxt.options.vite.optimizeDeps.include ||= []
    _nuxt.options.vite.optimizeDeps.include.push(
      '@scalar/nuxt > @scalar/api-reference',
      '@scalar/nuxt > jsonpointer',
      '@scalar/nuxt > ajv-draft-04',
      '@scalar/nuxt > ajv-formats',
      '@scalar/nuxt > ajv',
      '@scalar/nuxt > ajv-draft-04 > ajv',
      '@scalar/nuxt > ajv-formats > ajv',
      '@scalar/nuxt > whatwg-mimetype',
      '@scalar/nuxt > @scalar/openapi-parser',
      '@scalar/nuxt > debug',
      '@scalar/nuxt > extend',
      '@scalar/nuxt > highlightjs-curl',
      '@scalar/nuxt > highlight.js/lib/core',
    )

    // Ensure proper handling of CommonJS modules
    _nuxt.options.vite.ssr ||= {}
    if (Array.isArray(_nuxt.options.vite.ssr.noExternal)) {
      _nuxt.options.vite.ssr.noExternal.push('ajv-draft-04', 'ajv-formats', 'ajv', 'jsonpointer', 'whatwg-mimetype')
    } else {
      _nuxt.options.vite.ssr.noExternal = [
        ...(Array.isArray(_nuxt.options.vite.ssr.noExternal) ? _nuxt.options.vite.ssr.noExternal : []),
        'ajv-draft-04',
        'ajv-formats',
        'ajv',
        'jsonpointer',
        'whatwg-mimetype',
      ]
    }

    // Also check for Nitro OpenAPI auto generation
    _nuxt.hook('nitro:config', (config) => {
      if (config.experimental?.openAPI) {
        isOpenApiEnabled = true
        config.openAPI ||= {}
        config.openAPI.production ||= 'prerender'
      }
    })

    // Load the component so it can be used directly
    addComponent({
      name: 'ScalarApiReference',
      export: 'default',
      filePath: resolver.resolve('./runtime/components/ScalarApiReference.vue'),
    })

    // Add the route for the docs
    extendPages((pages) => {
      // Overriding config
      if (_options.configurations.length) {
        const { configurations, ...baseConfig } = _options
        configurations.forEach((_config, index) => {
          const configuration = { ...baseConfig, ..._config }

          pages.push({
            name: 'scalar-' + index,
            path: configuration.pathRouting?.basePath + ':pathMatch(.*)*',
            meta: {
              layout: _options.layout,
              configuration,
              isOpenApiEnabled,
            },
            file: resolver.resolve('./runtime/pages/ScalarPage.vue'),
          })
        })
      }
      // Single config
      else {
        pages.push({
          name: 'scalar',
          path: _options.pathRouting?.basePath + ':pathMatch(.*)*',
          meta: {
            layout: _options.layout,
            configuration: _options,
            isOpenApiEnabled,
          },
          file: resolver.resolve('./runtime/pages/ScalarPage.vue'),
        })
      }
    })

    // add scalar tab to DevTools
    if (_nuxt.options.dev && _options.devtools) {
      _nuxt.hook('devtools:customTabs', (tabs) => {
        tabs.push({
          name: 'scalar',
          title: 'Scalar',
          icon: 'https://gist.githubusercontent.com/cameronrohani/0fa020f6dcf957266bff49e7b6b7c05e/raw/17fce1ef37bbb036dca36b778c8b422056ad6fdf/scalar-logo-nuxt-color.svg',
          category: 'server',
          view: {
            type: 'iframe',
            src: _options.pathRouting?.basePath ?? '/docs',
          },
        })
      })
    }
  },
})
