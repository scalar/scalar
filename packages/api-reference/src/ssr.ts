/* biome-ignore-all lint/performance/noBarrelFile: SSR subpath entry point for package exports */
/**
 * SSR entry point for @scalar/api-reference.
 *
 * Re-exports the same components as the main entry. The ApiReference component
 * is SSR-compatible and works with createSSRApp and renderToString from
 * @vue/server-renderer.
 *
 * @example
 * ```ts
 * import { createSSRApp } from 'vue'
 * import { renderToString } from '@vue/server-renderer'
 * import { ApiReference } from '@scalar/api-reference/ssr'
 *
 * const app = createSSRApp({
 *   render: () => h(ApiReference, { configuration: { url: '/openapi.json' } }),
 * })
 * const html = await renderToString(app)
 * ```
 */

export type { ApiReferenceConfiguration, ReferenceProps } from './index'
export {
  ApiReference,
  GettingStarted,
  SearchButton,
  SearchModal,
  createApiReference,
  createEmptySpecification,
} from './index'
