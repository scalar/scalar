import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'

/**
 * Preloads the code generators for a list of `target/client` ids, such as `['shell/curl']`.
 * Await it before hydrating server-rendered markup so code examples render on the first paint.
 */
export { preloadClients } from '@scalar/blocks/code-example'
/**
 * `preloadGrammars` preloads the syntax highlighting grammars for a list of languages, such as
 * `['json', 'python']`, and `getRenderedLanguages` reads that list from server-rendered markup.
 * Await `preloadGrammars(getRenderedLanguages(root))` before hydrating so code blocks stay
 * highlighted on the first paint.
 */
export { getRenderedLanguages, preloadGrammars } from '@scalar/components/code-block'
/**
 * Preloads a built-in locale for the API Reference, the API Client and the schema blocks at once.
 * Await it before mounting or hydrating to render a non-English locale on the first paint.
 */
export { loadLocale } from '@scalar/localization'
export type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

export { default as ApiReference } from '@/components/ApiReference.vue'
export { default as GettingStarted } from '@/components/GettingStarted.vue'
export { SearchButton, SearchModal } from '@/features/Search'
// TODO: Ideally, we'd remove those exports or at least not export them through the root index.
export { createEmptySpecification } from '@/helpers/openapi'
export { createApiReference } from '@/standalone/lib/html-api'

export type ReferenceProps = {
  configuration?: AnyApiReferenceConfiguration
}
