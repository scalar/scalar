import type { LoadContext, Plugin } from '@docusaurus/types'
import type { ReferenceProps } from '@scalar/api-reference-react'
import path from 'path'

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
 * Scalar's Docusaurus plugin for Api References
 */
const ScalarDocusaurus = (
  context: LoadContext,
  options: ScalarOptions,
): Plugin<ReferenceProps> => {
  const defaultOptions = createDefaultScalarOptions(options)

  return {
    name: '@scalar/docusaurus',

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

      if (typeof require === 'function') {
        addRoute({
          path: defaultOptions.route,
          component: path.resolve(__dirname, './ScalarDocusaurusCommonJS'),
          // Provide the path to the loaded spec as a prop to your component
          exact: true,
          ...content,
        })
      } else {
        addRoute({
          path: defaultOptions.route,
          component: path.resolve(__dirname, './ScalarDocusaurus'),
          // Provide the path to the loaded spec as a prop to your component
          exact: true,
          ...content,
        })
      }
    },
  }
}

export default ScalarDocusaurus
