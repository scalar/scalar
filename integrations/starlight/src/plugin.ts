import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

import { scalarRouteIntegration } from './integration'

export type ScalarStarlightOptions = {
  /**
   * The Scalar configuration.
   *
   * This is Scalar's universal configuration object, most importantly the
   * `url` (or `content`) of the OpenAPI document to render. See
   * https://scalar.com/products/api-references/configuration for the full list.
   *
   * The configuration is serialized into the page as JSON, so function-valued
   * options (a custom `fetch`, `onLoaded`, plugins, …) are not carried over.
   */
  configuration: Partial<HtmlRenderingConfiguration>
  /**
   * The path the API reference is served from.
   *
   * @default '/api-reference'
   */
  pathname?: string
  /**
   * The label of the sidebar entry that links to the API reference.
   *
   * @default 'API Reference'
   */
  label?: string
  /**
   * The title of the API reference page.
   *
   * @default the `label`
   */
  title?: string
}

/**
 * Ensure the path starts with a single leading slash and has no trailing slash,
 * so it works both as an Astro route pattern and as a Starlight sidebar link.
 *
 * Splitting on `/` rather than trimming with a regex keeps this linear and
 * sidesteps the backtracking a `/+` pattern can cause on adversarial input. It
 * also collapses empty segments (e.g. from `//`), which Astro route patterns
 * would reject anyway.
 */
const normalizePathname = (pathname: string): string => `/${pathname.split('/').filter(Boolean).join('/')}`

/**
 * A Starlight plugin that renders a Scalar API reference.
 *
 * It injects a route that renders the API reference inside the Starlight layout
 * and adds a sidebar entry that links to it, so you do not have to hand-create a
 * page and embed the component yourself.
 *
 * @example
 * ```js
 * // astro.config.mjs
 * import starlight from '@astrojs/starlight'
 * import { scalarStarlight } from '@scalar/starlight'
 *
 * export default defineConfig({
 *   integrations: [
 *     starlight({
 *       title: 'My Docs',
 *       plugins: [scalarStarlight({ configuration: { url: '/openapi.json' } })],
 *     }),
 *   ],
 * })
 * ```
 */
export const scalarStarlight = (options: ScalarStarlightOptions): StarlightPlugin => {
  const pathname = normalizePathname(options.pathname ?? '/api-reference')
  const label = options.label ?? 'API Reference'
  const title = options.title ?? label

  return {
    name: '@scalar/starlight',
    hooks: {
      'config:setup': ({ config, updateConfig, addIntegration }) => {
        // Inject the route that renders the reference. Starlight plugins cannot
        // inject routes directly, so this goes through an Astro integration.
        addIntegration(scalarRouteIntegration({ pathname, title, configuration: options.configuration }))

        // Add a sidebar entry that links to the injected route.
        updateConfig({
          sidebar: [...(config.sidebar ?? []), { label, link: pathname }],
        })
      },
    },
  }
}

export default scalarStarlight
