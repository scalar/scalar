/**
 * The virtual module the injected `ScalarReference.astro` route reads its
 * configuration from. It is generated at build time by `integration.ts`.
 */
declare module 'virtual:scalar-starlight' {
  import type { HtmlRenderingConfiguration } from '@scalar/client-side-rendering'

  export const configuration: Partial<HtmlRenderingConfiguration>
  export const title: string
}
