import path from 'node:path'

import type { LoadContext, Plugin } from '@docusaurus/types'
import { normalizeUrl } from '@docusaurus/utils'
import { serializeConfigToJs } from '@scalar/client-side-rendering'
import type { AnyApiReferenceConfiguration } from '@scalar/types'

export type ScalarOptions = {
  label?: string
  route?: string
  /**
   * If you wish to pin a specific CDN version instead of the latest (default)
   * @example https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.28.11
   */
  cdn?: string
  showNavLink?: boolean
  configuration?: AnyApiReferenceConfiguration
}

/**
 * Used to set default options from the user-provided options
 * This is also useful to ensure backwards compatibility with older configs that don't have the new options
 */
const createDefaultScalarOptions = (options: ScalarOptions): ScalarOptions => ({
  showNavLink: true,
  ...options,
  configuration: {
    _integration: 'docusaurus',
    ...(options.configuration ?? {}),
  },
})

/**
 * Scalar's Docusaurus plugin for Api References
 */
const ScalarDocusaurus = (
  context: LoadContext,
  options: ScalarOptions,
): Plugin<{ configuration?: AnyApiReferenceConfiguration }> => {
  const defaultOptions = createDefaultScalarOptions(options)
  const { baseUrl } = context.siteConfig

  return {
    name: '@scalar/docusaurus',

    /**
     * Load the Standalone API Reference script
     * This is loaded into the dom once for every plugin thats loaded BUT it only downloads the script once
     */
    injectHtmlTags() {
      return {
        preBodyTags: [
          {
            tagName: 'script',
            attributes: {
              src: options.cdn ?? 'https://cdn.jsdelivr.net/npm/@scalar/api-reference',
            },
          },
        ],
      }
    },

    loadContent() {
      return defaultOptions
    },

    contentLoaded({ content, actions }) {
      const { addRoute } = actions

      // If showNavLink is true, add a link to the navbar
      if (defaultOptions.showNavLink) {
        ;(
          context.siteConfig.themeConfig.navbar as {
            items: Record<string, string>[]
          }
        ).items.push({
          to: normalizeUrl([baseUrl, defaultOptions.route ?? '/scalar']),
          label: defaultOptions.label ?? 'Scalar',
          position: 'left',
        })
      }

      // Serialize the configuration to a JavaScript object literal here, in Node, while the config
      // functions (onBeforeRequest, request hooks, sorters, …) are still live. Docusaurus JSON-serializes
      // route props when it generates its routes module, which would otherwise silently drop every
      // function-valued option. See https://github.com/scalar/scalar/issues/6933.
      const givenConfiguration = content.configuration ?? {}
      const configuration = Array.isArray(givenConfiguration) ? (givenConfiguration[0] ?? {}) : givenConfiguration

      // Add the appropriate route based on the module system
      addRoute({
        path: normalizeUrl([baseUrl, defaultOptions.route ?? '/scalar']),
        component: path.resolve(__dirname, './ScalarDocusaurus'),
        exact: true,
        configuration: serializeConfigToJs({ ...configuration, hideDarkModeToggle: true } as Record<string, unknown>),
      })
    },
  }
}

export default ScalarDocusaurus
