import type { InjectionKey, Ref } from 'vue'

/**
 * Shares the selected response content type (per status code) between the
 * response parameter list on the left and the example response panel on the right.
 *
 * Key: status code string (e.g. "200")
 * Value: selected MIME type (e.g. "text/csv")
 */
export const RESPONSE_CONTENT_TYPE_SYMBOL = Symbol() as InjectionKey<Ref<Record<string, string>>>
