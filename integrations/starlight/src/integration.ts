import { fileURLToPath } from 'node:url'

import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'
import type { AstroIntegration } from 'astro'

type ScalarRouteOptions = {
  /** The normalized path the API reference is served from. */
  pathname: string
  /** The title of the API reference page. */
  title: string
  /** The Scalar configuration, passed to the reference. */
  configuration: Partial<HtmlRenderingConfiguration>
}

/** The virtual module the injected route reads its configuration from. */
const VIRTUAL_ID = 'virtual:scalar-starlight'
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`

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
 * A Vite plugin that exposes the plugin options to the injected `.astro` route.
 *
 * The route is a bundled component, so it cannot receive props from the plugin
 * directly. Serializing the options into a virtual module is the standard way
 * to hand data to injected routes.
 */
const virtualConfigurationPlugin = (options: ScalarRouteOptions): VirtualModulePlugin => {
  const contents = [
    `export const configuration = ${JSON.stringify(options.configuration)}`,
    `export const title = ${JSON.stringify(options.title)}`,
  ].join('\n')

  return {
    name: '@scalar/starlight:virtual-configuration',
    resolveId: (id: string): string | undefined => (id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined),
    load: (id: string): string | undefined => (id === RESOLVED_VIRTUAL_ID ? contents : undefined),
  }
}

/**
 * The Astro integration that renders the API reference.
 *
 * It injects a route at `pathname` pointing at the bundled `ScalarReference`
 * component and registers the virtual module that feeds it the configuration.
 */
export const scalarRouteIntegration = (options: ScalarRouteOptions): AstroIntegration => ({
  name: '@scalar/starlight',
  hooks: {
    'astro:config:setup': ({ injectRoute, updateConfig }) => {
      updateConfig({
        vite: {
          plugins: [virtualConfigurationPlugin(options)],
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
})
