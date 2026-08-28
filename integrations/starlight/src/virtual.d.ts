/**
 * The virtual module the injected `ScalarReference.astro` route reads its
 * configuration from. It is generated at build time by `integration.ts`.
 *
 * `references` holds every configured reference keyed by its normalized
 * `pathname`, so the shared route component can pick the one that matches the
 * page being rendered.
 */
declare module 'virtual:scalar-starlight' {
  import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

  export const references: Record<string, { configuration: Partial<HtmlRenderingConfiguration>; title: string }>
}
