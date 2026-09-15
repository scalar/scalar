import type { StarlightPlugin } from '@astrojs/starlight/types'
import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

import { scalarRouteIntegration } from './integration'
import { normalizePathname } from './normalize-pathname'

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

  // A `pathname` that normalizes to the site root would collide with the
  // homepage and only surface as an opaque Astro duplicate-route error, so fail
  // early with a message that points at the actual cause.
  if (pathname === '/') {
    throw new Error(
      '[@scalar/starlight] `pathname` must not resolve to "/", which would collide with your homepage. ' +
        'Use a subpath like "/api-reference".',
    )
  }

  const label = options.label ?? 'API Reference'
  const title = options.title ?? label

  return {
    name: '@scalar/starlight',
    hooks: {
      'config:setup': ({ config, updateConfig, addIntegration, logger }) => {
        // Inject the route that renders the reference. Starlight plugins cannot
        // inject routes directly, so this goes through an Astro integration.
        addIntegration(scalarRouteIntegration({ pathname, title, configuration: options.configuration }))

        // Only touch the sidebar when the user already defines one. If it is
        // left undefined, Starlight auto-generates the sidebar from the docs
        // directory — replacing it with a single entry would hide every other
        // page, so we leave it alone and tell the user how to add the link.
        if (config.sidebar) {
          updateConfig({
            sidebar: [...config.sidebar, { label, link: pathname }],
          })
        } else {
          logger.warn(
            `No \`sidebar\` is configured, so Starlight auto-generates it from your docs and the "${label}" ` +
              'entry was not added (adding it would hide your other pages). Add it yourself, e.g. ' +
              `\`sidebar: [{ label: '${label}', link: '${pathname}' }]\`, or link to ${pathname} from your content.`,
          )
        }
      },
    },
  }
}
