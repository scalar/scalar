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
          const basePath = configuration.pathRouting?.basePath?.replace(/\/$/, '') ?? '/docs'

          pages.push({
            name: 'scalar-' + index,
            path: basePath + '/:pathMatch(.*)*',
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
        const basePath = _options.pathRouting?.basePath?.replace(/\/$/, '') ?? '/docs'
        pages.push({
          name: 'scalar',
          path: basePath + '/:pathMatch(.*)*',
          meta: {
            layout: _options.layout,
            configuration: _options,
            isOpenApiEnabled,
          },
          file: resolver.resolve('./runtime/pages/ScalarPage.vue'),
        })
      }
    })

    // Shim CJS-only packages and fix highlight.js's use of require() in ESM builds.
    // The resolveId hook is intentionally scoped to @scalar/* importers so that the
    // debug/extend shims do not shadow the real packages for user code or unrelated
    // third-party libraries (e.g. DEBUG=* env-var logging would silently stop working
    // if we replaced debug globally with a no-op shim).
    _nuxt.hook('vite:extendConfig', (config) => {
      const debugShim = resolver.resolve('./shims/debug.js')
      const extendShim = resolver.resolve('./shims/extend.js')

      config.plugins.push({
        name: 'scalar-cjs-shims',
        enforce: 'pre',
        resolveId(source: string, importer: string | undefined) {
          // Only intercept imports that originate from within @scalar packages
          if (!importer?.includes('/node_modules/@scalar/')) {
            return null
          }
          if (source === 'debug') {
            return debugShim
          }
          if (source === 'extend') {
            return extendShim
          }
          return null
        },
        transform(code: string, id: string) {
          if (!id.includes('/highlight.js/lib/core.js')) {
            return null
          }
          return {
            code: [
              'const module = { exports: {} };',
              'const exports = module.exports;',
              '(function(module, exports) {',
              code,
              '})(module, exports);',
              'export default module.exports;',
            ].join('\n'),
            map: null,
          }
        },
      })
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
