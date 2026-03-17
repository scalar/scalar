import type { InjectionKey, Ref } from 'vue'

/**
 * Shares the selected root request-body composition variant between the schema
 * dropdown and the generated request snippet for a single operation layout.
 */
export const REQUEST_BODY_COMPOSITION_INDEX_SYMBOL = Symbol() as InjectionKey<Ref<number>>
