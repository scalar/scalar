import { fileURLToPath } from 'node:url'

import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'
import type { AstroIntegration } from 'astro'

type ScalarReference = {
  /** The title of the API reference page. */
  title: string
  /** The Scalar configuration, passed to the reference. */
  configuration: Partial<HtmlRenderingConfiguration>
}

type ScalarRouteOptions = ScalarReference & {
  /** The normalized path the API reference is served from. */
  pathname: string
}

/** The virtual module the injected route reads its configuration from. */
const VIRTUAL_ID = 'virtual:scalar-starlight'
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`

/**
 * Every reference on the site, keyed by its normalized `pathname`.
 *
 * A single bundled `.astro` component renders all of them, and a bundled
 * component cannot receive per-instance props. So instead of one virtual module
 * per reference (they would all resolve the same id and only the first would
 * win), we collect every reference here and let the component pick its own by
 * matching the request path at render time. This is what lets one site expose
 * several references at once.
 *
 * The registry lives at module scope so it is shared across every
 * `scalarStarlight()` instance in a single Astro config.
 */
const references = new Map<string, ScalarReference>()

/**
 * The subset of a Vite plugin this integration uses.
 *
 * Astro bundles its own Vite (currently v6), while the workspace catalog pins a
 * newer Vite whose `Plugin` type is not structurally identical. Describing just
 * the hooks used here keeps the plugin assignable to whichever Vite Astro ships,
 * without importing (and thereby version-locking) Vite's `Plugin` type.
 */
type VirtualModulePlugin = {
  name: string
  resolveId: (id: string) => string | undefined
  load: (id: string) => string | undefined
}

/**
 * A Vite plugin that exposes every reference to the injected `.astro` route.
 *
 * The route is a bundled component, so it cannot receive props from the plugin
 * directly. Serializing the registry into a virtual module is the standard way
 * to hand data to injected routes. `load` reads the registry lazily — it runs at
 * build time, after every instance has registered, so it sees them all.
 */
const virtualConfigurationPlugin = (): VirtualModulePlugin => ({
  name: '@scalar/starlight:virtual-configuration',
  resolveId: (id: string): string | undefined => (id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined),
  load: (id: string): string | undefined =>
    id === RESOLVED_VIRTUAL_ID
      ? `export const references = ${JSON.stringify(Object.fromEntries(references))}`
      : undefined,
})

/**
 * The Astro integration that renders the API reference.
 *
 * It registers the reference, injects a route at `pathname` pointing at the
 * bundled `ScalarReference` component, and exposes the registry through a
 * virtual module that feeds every reference its configuration.
 */
export const scalarRouteIntegration = (options: ScalarRouteOptions): AstroIntegration => {
  const reference = { title: options.title, configuration: options.configuration }

  // Two references sharing a `pathname` would inject the same route twice and
  // surface only as an opaque Astro duplicate-route error, so fail early with a
  // message that points at the cause. Registering the *same* reference again is
  // fine (a dev-server config reload re-runs this), so only reject a genuine
  // collision — a different reference on a pathname already taken.
  const existing = references.get(options.pathname)
  if (existing && JSON.stringify(existing) !== JSON.stringify(reference)) {
    throw new Error(
      `[@scalar/starlight] Two different API references are configured for "${options.pathname}". ` +
        'Give each reference a distinct `pathname`.',
    )
  }

  references.set(options.pathname, reference)

  return {
    // Unique per `pathname` so Astro treats multiple references as distinct
    // integrations. A shared name risks Astro skipping all but the first, which
    // would drop every reference except one.
    name: `@scalar/starlight:${options.pathname}`,
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        updateConfig({
          vite: {
            plugins: [virtualConfigurationPlugin()],
          },
        })

        injectRoute({
          pattern: options.pathname,
          // The package ships its source, so this resolves to the `.astro` file
          // inside `node_modules`.
          entrypoint: fileURLToPath(new URL('./ScalarReference.astro', import.meta.url)),
        })
      },
    },
  }
}
