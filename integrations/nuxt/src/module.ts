import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { addComponent, addVitePlugin, createResolver, defineNuxtModule, extendPages } from '@nuxt/kit'

import { isWrappableCjsModule, wrapCjsModuleAsEsm } from './cjs-interop'
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

    // The `debug` package is CJS-only and ships no ESM build, so it cannot be
    // wrapped like the modules below (its internal require() calls would not
    // resolve in the browser). We redirect it to a no-op ESM shim instead, but
    // only for imports that originate from another dependency (for example
    // micromark, which @scalar/api-reference pulls in for Markdown). A user's own
    // `import 'debug'` is left untouched so DEBUG=* logging in their app code keeps
    // working.
    const debugShim = resolver.resolve('./shims/debug.js')

    addVitePlugin({
      name: 'scalar-cjs-shims',
      enforce: 'pre',
      resolveId(source: string, importer: string | undefined) {
        // Only intercept `debug` when it is imported by another dependency, never
        // when imported from the user's own application code.
        if (source === 'debug' && importer?.includes('/node_modules/')) {
          return debugShim
        }
        return null
      },
      transform(code: string, id: string) {
        if (!isWrappableCjsModule(id)) {
          return null
        }

        return {
          code: wrapCjsModuleAsEsm(code),
          map: null,
        }
      },
    })

    // `@vercel/oidc` is pulled in transitively by the AI assistant (via
    // @ai-sdk/gateway). Its CommonJS browser build exposes its exports through
    // getters and uses internal require() calls, so the wrapper above cannot
    // handle it, but Vite's dependency optimizer (esbuild) can. We only ask Vite
    // to pre-bundle it when it is hoisted into the project's top-level
    // node_modules — the layout where it is both resolvable by Vite and actually
    // broken (e.g. pnpm with shamefully-hoist). This avoids a "failed to resolve"
    // warning in setups where it is not hoisted (such as this repo's playground).
    if (existsSync(join(_nuxt.options.rootDir, 'node_modules', '@vercel', 'oidc'))) {
      _nuxt.options.vite.optimizeDeps ||= {}
      _nuxt.options.vite.optimizeDeps.include ||= []
      if (!_nuxt.options.vite.optimizeDeps.include.includes('@vercel/oidc')) {
        _nuxt.options.vite.optimizeDeps.include.push('@vercel/oidc')
      }
    }

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
