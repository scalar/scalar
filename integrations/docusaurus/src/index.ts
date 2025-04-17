import path from 'node:path'
import type { LoadContext, Plugin } from '@docusaurus/types'
import type { ReferenceProps } from '@scalar/api-reference-react'

export type ScalarOptions = {
  label: string
  route: string
  showNavLink?: boolean
} & ReferenceProps

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
 * Detect if we're in a CommonJS environment
 */
const isCommonJS = () => {
  try {
    return typeof require === 'function'
  } catch {
    return false
  }
}

/**
 * Scalar's Docusaurus plugin for Api References
 */
const ScalarDocusaurus = (context: LoadContext, options: ScalarOptions): Plugin<ReferenceProps> => {
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
              src: 'http://localhost:3000/browser/standalone.js',
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
        component: path.resolve(__dirname, isCommonJS() ? './ScalarDocusaurusCommonJS' : './ScalarDocusaurus'),
        exact: true,
        ...content,
      })
    },
  }
}

export default ScalarDocusaurus
