import type { Component, InjectionKey, Ref } from 'vue'

/**
 * Current anchor/scroll target id, expressed as a dot-joined property breadcrumb.
 *
 * The host (e.g. the API reference) provides this so that deep links to a
 * collapsed schema property expand every disclosure on the path to the target.
 * When no host provides it, the schema renders normally without auto-expansion.
 */
export const SCHEMA_SCROLL_TARGET_SYMBOL = Symbol('schema-scroll-target') as InjectionKey<Ref<string>>

/**
 * Optional renderer for specification extensions (`x-*` keys) on a schema property.
 *
 * The host provides a component (for example one backed by the API reference
 * plugin system) that receives the property value via a `value` prop. When no
 * renderer is provided, extensions are simply not rendered, keeping the block
 * free of any plugin-system dependency.
 */
export const SCHEMA_EXTENSIONS_RENDERER_SYMBOL = Symbol('schema-extensions-renderer') as InjectionKey<Component | null>

export type RequestBodyCompositionSelection = Record<string, number>

/**
 * Shares the selected request-body composition variants between the schema
 * dropdowns and the generated request snippet for a single operation layout.
 */
export const REQUEST_BODY_COMPOSITION_INDEX_SYMBOL = Symbol('request-body-composition-index') as InjectionKey<
  Ref<RequestBodyCompositionSelection>
>
