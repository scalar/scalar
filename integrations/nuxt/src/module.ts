import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { addComponent, createResolver, defineNuxtModule, extendPages, extendViteConfig } from '@nuxt/kit'

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

    // `@vercel/oidc` is pulled in transitively by the AI assistant (via
    // @ai-sdk/gateway). Its CommonJS browser build exposes its exports through
    // getters and uses internal require() calls, which breaks Vite under pnpm's
    // strict node_modules layout. Vite's dependency optimizer (esbuild) handles
    // it, so we ask Vite to pre-bundle it — but only when it is hoisted into the
    // project's top-level node_modules, the layout where it is both resolvable by
    // Vite and actually broken (e.g. pnpm with shamefully-hoist). This avoids a
    // "failed to resolve" warning in setups where it is not hoisted (such as this
    // repo's playground).
    //
    // The other CommonJS offenders (cookie, extend, debug, highlight.js) are
    // handled at the source packages — `cookie` was dropped from @scalar/api-client
    // and the Markdown/highlight stack is bundled into @scalar/code-highlight — so
    // no shims are needed here for those.
    if (existsSync(join(_nuxt.options.rootDir, 'node_modules', '@vercel', 'oidc'))) {
      extendViteConfig((config) => {
        config.optimizeDeps ||= {}
        config.optimizeDeps.include ||= []
        if (!config.optimizeDeps.include.includes('@vercel/oidc')) {
          config.optimizeDeps.include.push('@vercel/oidc')
        }
      })
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
