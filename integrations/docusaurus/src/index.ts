import path from 'node:path'
import type { LoadContext, Plugin } from '@docusaurus/types'
import type { AnyApiReferenceConfiguration } from '@scalar/types'

export type ScalarOptions = {
  label: string
  route: string
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
  configuration: {
    _integration: 'docusaurus',
    ...(options.configuration ?? {}),
  },
  ...options,
})

/**
 * Scalar's Docusaurus plugin for Api References
 */
const ScalarDocusaurus = (
  context: LoadContext,
  options: ScalarOptions,
): Plugin<{ configuration?: AnyApiReferenceConfiguration }> => {
  const defaultOptions = createDefaultScalarOptions(options)

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

    async loadContent() {
      return defaultOptions
    },

    async contentLoaded({ content, actions }) {
      const { addRoute } = actions

      // If showNavLink is true, add a link to the navbar
      if (defaultOptions.showNavLink) {
        ;(
          context.siteConfig.themeConfig.navbar as {
            items: Record<string, string>[]
          }
        ).items.push({
          to: defaultOptions.route ?? '/scalar',
          label: defaultOptions.label ?? 'Scalar',
          position: 'left',
        })
      }

      // Add the appropriate route based on the module system
      addRoute({
        path: defaultOptions.route,
        component: path.resolve(__dirname, './ScalarDocusaurus'),
        exact: true,
        ...content,
      })
    },
  }
}

export default ScalarDocusaurus
