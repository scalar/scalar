import type { InjectionKey, Ref } from 'vue'

export type RequestBodyCompositionSelection = Record<string, number>

/**
 * Shares the selected request-body composition variants between the schema
 * dropdowns and the generated request snippet for a single operation layout.
 */
export const REQUEST_BODY_COMPOSITION_INDEX_SYMBOL = Symbol() as InjectionKey<Ref<RequestBodyCompositionSelection>>
